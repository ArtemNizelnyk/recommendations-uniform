import { LinkParamValue } from '@uniformdev/canvas';
import { BRAND_ENRICHMENT_CATEGORY } from '@/constants';

export const formatUniformLink = (uniformLink?: LinkParamValue) => {
  if (!uniformLink) return '';

  if (uniformLink.type === 'email') {
    return `mailto:${uniformLink.path}`;
  }

  return uniformLink.path;
};

export interface BrandEnrichment {
  enrichmentCategory: string;
  enrichmentValue: string;
  enrichmentScore: number;
}

export const getBrandEnrichments = (scores: Record<string, number> = {}): BrandEnrichment[] => {
  const brandEnrichmentCategoryKey = BRAND_ENRICHMENT_CATEGORY + '_';
  return Object.entries(scores)
    .filter(([key]) => key.startsWith(brandEnrichmentCategoryKey))
    .map(([key, score]) => ({
      enrichmentCategory: BRAND_ENRICHMENT_CATEGORY,
      enrichmentValue: key.replace(brandEnrichmentCategoryKey, ''),
      enrichmentScore: score,
    }));
};
