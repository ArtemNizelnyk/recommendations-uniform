/**
 * Utility to transform the RecommendationCompositionEntry component by wrapping deals in a personalization component
 * This version uses pre-provided brand data instead of making API calls
 */

// Create personalization criteria for brands with OR operator
function createBrandPersonalizationCriteria(brandNames: string[]): Record<string, unknown> | null {
  if (!brandNames.length) return null;

  // Create criteria for each brand where enrichment score > 3
  const criteria = brandNames.map(brandName => ({
    l: `brand_${brandName}`,
    r: '3',
    op: '>',
  }));

  return {
    crit: criteria,
    name: `Personalized Deal for ${brandNames.join(', ')} fans`,
    op: '|', // This is the OR operator between criteria
  };
}

/**
 * Transform the composition data to wrap deals in a personalization component
 * This version uses pre-provided brand data instead of making API calls
 */
export async function transformRecommendationsForEntry(
  composition: Record<string, unknown> | null
): Promise<typeof composition> {
  if (!composition) return composition;

  // Create a deep copy of the composition to avoid mutating the original
  const transformedComposition = JSON.parse(JSON.stringify(composition));

  // Find the recommendationsListWithEntry component in pageContent
  if (!transformedComposition.slots || typeof transformedComposition.slots !== 'object') {
    return transformedComposition;
  }

  const slots = transformedComposition.slots as Record<string, unknown>;
  if (!slots.pageContent || !Array.isArray(slots.pageContent)) {
    return transformedComposition;
  }

  const pageContent = slots.pageContent;
  const recommendationsIndex = pageContent.findIndex(
    (component: unknown) =>
      typeof component === 'object' &&
      component !== null &&
      'type' in component &&
      component.type === 'recommendationsListWithEntry'
  );

  if (recommendationsIndex === -1) return transformedComposition;

  const recommendationsList = pageContent[recommendationsIndex] as Record<string, unknown>;
  if (!recommendationsList.slots || typeof recommendationsList.slots !== 'object') {
    return transformedComposition;
  }

  const recommendationsSlots = recommendationsList.slots as Record<string, unknown>;
  if (!recommendationsSlots.deals || !Array.isArray(recommendationsSlots.deals)) {
    return transformedComposition;
  }

  const deals = recommendationsSlots.deals;

  if (deals.length === 0) return transformedComposition;

  // Create a personalization component
  const personalizationComponent = {
    type: '$personalization',
    parameters: {
      trackingEventName: {
        type: 'text',
        value: 'Personalized Deals',
      },
      count: {
        type: 'number',
        value: '3',
      },
    },
    slots: {
      pz: [] as unknown[],
    },
  };

  // Process each deal
  for (const deal of deals) {
    if (typeof deal !== 'object' || !deal || !('parameters' in deal)) continue;

    const dealParams = deal.parameters as Record<string, unknown>;
    if (!dealParams.compositionData || typeof dealParams.compositionData !== 'object') continue;

    const compositionDataParam = dealParams.compositionData as Record<string, unknown>;
    if (!('value' in compositionDataParam)) continue;

    const compositionData = compositionDataParam.value as unknown;
    if (!compositionData || !Array.isArray(compositionData) || compositionData.length === 0) continue;

    // Extract brand names directly from the composition data
    const brandNames = compositionData
      .filter(item => 
        item && 
        typeof item === 'object' && 
        item.entry && 
        typeof item.entry === 'object' && 
        (
          (item.entry.fields && 
           typeof item.entry.fields === 'object' && 
           item.entry.fields.displayname && 
           typeof item.entry.fields.displayname === 'object' && 
           typeof item.entry.fields.displayname.value === 'string') ||
          typeof item.entry._name === 'string'
        )
      )
      .map(item => {
        const entry = item.entry as Record<string, unknown>;
        const fields = entry.fields as Record<string, unknown> | undefined;
        const displayname = fields?.displayname as Record<string, unknown> | undefined;
        
        // Use displayname.value if available, otherwise fall back to _name
        return (displayname?.value as string) || (entry._name as string);
      });

    // Create personalization criteria
    const pzCrit = createBrandPersonalizationCriteria(brandNames);

    // Skip if no criteria could be created
    if (!pzCrit) continue;

    // Create a copy of the deal with personalization criteria
    const personalizedDeal = {
      ...deal,
      parameters: {
        ...dealParams,
        $pzCrit: {
          type: '$pzCrit',
          value: pzCrit,
        },
      },
    };

    // Add to personalization slots
    personalizationComponent.slots.pz.push(personalizedDeal);
  }

  // Replace the deals slot with the personalization component
  recommendationsSlots.deals = [personalizationComponent];

  return transformedComposition;
} 