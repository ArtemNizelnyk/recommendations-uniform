/**
 * Utility to transform the RecommendationsList component by wrapping deals in a personalization component
 */
import { ContentClient } from '@uniformdev/canvas';

// Extract brand IDs from composition data
function extractBrandIdsFromCompositionData(compositionData: any): string[] {
  try {
    // Find the brands reference in _dataResources
    const brandsRef = Object.entries(compositionData?._dataResources || {}).find(([key]) => key.includes('-brands'));

    if (!brandsRef || !brandsRef[1]) return [];

    // Extract entryIds from the reference
    const entryIds = (brandsRef[1] as any)?.variables?.entryIds;
    if (!entryIds) return [];

    // Split the comma-separated IDs into an array
    return entryIds.split(',');
  } catch (error) {
    console.error('Error extracting brand IDs:', error);
    return [];
  }
}

// Create personalization criteria for brands with OR operator
function createBrandPersonalizationCriteria(brandNames: string[]): any {
  if (!brandNames.length) return null;

  // Create criteria for each brand where enrichment score > 10
  const criteria = brandNames.map(brandName => ({
    l: `brand_${brandName}`,
    r: '10',
    op: '>',
  }));

  return {
    crit: criteria,
    name: `Personalized Deal for ${brandNames.join(', ')} fans`,
    op: '|', // This is the OR operator between criteria
  };
}

// Extended type for brand data
export interface BrandData {
  id: string;
  displayName: string;
  logoUrl?: string;
  description?: string;
  // Add any other fields you want to extract
}

// Get brand data from brand IDs by fetching actual data
async function getBrandDataFromIds(brandIds: string[]): Promise<BrandData[]> {
  if (!brandIds.length || !process.env.UNIFORM_PROJECT_ID || !process.env.UNIFORM_API_KEY) {
    return [];
  }

  try {
    const contentClient = new ContentClient({
      projectId: process.env.UNIFORM_PROJECT_ID,
      apiKey: process.env.UNIFORM_API_KEY,
    });

    // Fetch all brand entries in a single request
    const response = await contentClient.getEntries({
      entryIDs: brandIds,
    });

    // Extract all relevant brand data from the response
    const result: BrandData[] = response.entries.map(entry => {
      const fields = entry.entry.fields || {};
      const brandLogo = fields.brandLogo?.value;
      let logoUrl = '';

      // Safely access the logo URL with proper type checking
      if (Array.isArray(brandLogo) && brandLogo.length > 0 && brandLogo[0]?.fields?.url?.value) {
        logoUrl = brandLogo[0].fields.url.value;
      }

      return {
        id: entry.entry._id || '',
        displayName: (fields.displayname?.value as string) || 'Unknown Brand',
        logoUrl: logoUrl,
        description: (fields.description?.value as string) || '',
        // Add any other fields you want to extract
      };
    });

    return result;
  } catch (error) {
    console.error('Error fetching brand data:', error);

    // Fallback to using simplified data from IDs
    return brandIds.map(id => {
      const shortId = id.split('-')[0];
      return {
        id,
        displayName: `Brand-${shortId}`,
        logoUrl: '',
        description: '',
      };
    });
  }
}

// Get just the brand names from the full brand data
async function getBrandNamesFromIds(brandIds: string[]): Promise<string[]> {
  const brandData = await getBrandDataFromIds(brandIds);
  return brandData.map(brand => brand.displayName);
}

/**
 * Transform the composition data to wrap deals in a personalization component
 */
export async function transformRecommendationsInComposition(composition: any): Promise<any> {
  if (!composition) return composition;

  // Create a deep copy of the composition to avoid mutating the original
  const transformedComposition = JSON.parse(JSON.stringify(composition));

  // Find the recommendationsList component in pageContent
  const pageContent = transformedComposition.slots?.pageContent || [];
  const recommendationsIndex = pageContent.findIndex((component: any) => component.type === 'recommendationsList');

  if (recommendationsIndex === -1) return transformedComposition;

  const recommendationsList = pageContent[recommendationsIndex];
  const deals = recommendationsList.slots?.deals || [];

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
      pz: [] as any[],
    },
  };

  // Process each deal
  for (const deal of deals) {
    const compositionData = deal.parameters?.compositionData?.value;
    if (!compositionData) continue;

    // Extract brand IDs from the composition data
    const brandIds = extractBrandIdsFromCompositionData(compositionData);

    // Get brand names by fetching actual data
    const brandNames = await getBrandNamesFromIds(brandIds);

    // Create personalization criteria
    const pzCrit = createBrandPersonalizationCriteria(brandNames);

    // Skip if no criteria could be created
    if (!pzCrit) continue;

    // Create a copy of the deal with personalization criteria
    const personalizedDeal = {
      ...deal,
      parameters: {
        ...deal.parameters,
        $pzCrit: {
          type: '$pzCrit',
          value: pzCrit,
        },
      },
    };

    // Add to personalization slots
    personalizationComponent.slots.pz.push(personalizedDeal);
  }

  // Add a default variation with all original deals
  // Create a DealGrid component that contains all the original deals
  const dealGridComponent = {
    type: 'dealGrid',
    parameters: {
      displayName: {
        type: 'text',
        value: 'Featured Deals',
      },
      showWarning: {
        type: 'boolean',
        value: true,
      },
    },
    slots: {
      deals: deals,
    },
  };

  // Add the DealGrid as the last variation (fallback)
  personalizationComponent.slots.pz.push(dealGridComponent);

  // Replace the deals slot with the personalization component
  recommendationsList.slots.deals = [personalizationComponent];

  return transformedComposition;
}
