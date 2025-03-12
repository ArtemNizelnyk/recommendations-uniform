/**
 * Utility functions for handling brand criteria
 */

// Interface for a single criterion
export interface Criterion {
  l: string; // left operand (e.g., "brand_wayfair")
  op: string; // operator (e.g., ">")
  r: string; // right operand (e.g., "10")
}

// Interface for a criteria group
export interface CriteriaGroup {
  crit: Criterion[];
  name: string;
  op: string; // Operator between criteria (e.g., "|" for OR, "&" for AND)
}

// Interface for the personalization criteria
export interface PersonalizationCriteria {
  type: string;
  value: CriteriaGroup;
}

/**
 * Extracts brand IDs from personalization criteria
 * @param criteria The personalization criteria object
 * @returns Array of brand IDs
 */
export function extractBrandIdsFromCriteria(criteria: PersonalizationCriteria | undefined): string[] {
  if (!criteria || !criteria.value || !criteria.value.crit) {
    return [];
  }

  return criteria.value.crit
    .filter(criterion => criterion.l.startsWith('brand_'))
    .map(criterion => {
      // Extract the brand name from the criterion (e.g., "brand_wayfair" -> "wayfair")
      const brandName = criterion.l.replace('brand_', '');
      
      // Convert to proper case for display (e.g., "wayfair" -> "Wayfair")
      return brandName.charAt(0).toUpperCase() + brandName.slice(1);
    });
}

/**
 * Formats a brand ID for API lookup
 * @param brandName The brand name extracted from criteria
 * @returns The formatted brand ID
 */
export function formatBrandIdForLookup(brandName: string): string {
  // This function would map the brand name to the actual ID in your system
  // For now, we'll use a simple mapping for the known brands
  const brandMap: Record<string, string> = {
    'Wayfair': '06b03cc3-d108-4504-a578-825190ea17ff',
    'Bowflex': 'ab57d7f9-2284-4dd0-ba4b-f200579b9117',
    'WholeFoods': '53aef820-3193-47b5-87a6-25cc3555c368'
  };
  
  return brandMap[brandName] || brandName;
}

/**
 * Creates a personalization criteria object for brands
 * @param brandNames Array of brand names
 * @returns A personalization criteria object
 */
export function createBrandCriteria(brandNames: string[]): PersonalizationCriteria {
  const criteria: PersonalizationCriteria = {
    type: '$pzCrit',
    value: {
      crit: brandNames.map(name => ({
        l: `brand_${name.toLowerCase()}`,
        op: '>',
        r: '10'
      })),
      name: '',
      op: '|' // OR operator
    }
  };
  
  return criteria;
} 