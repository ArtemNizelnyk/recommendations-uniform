const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const AMERICAN = 'americansignal';
export const SPANISH = 'spanishsignal';
export const EVERYONE = 'everyone';

export const audiences = [SPANISH, AMERICAN, EVERYONE] as const;

export type AudienceType = (typeof audiences)[number];

export const BRAND_ENRICHMENT_CATEGORY = 'brand' as const;

export const AUDIENCE_ICONS: Record<AudienceType, string> = {
  americansignal: '🇺🇸',
  spanishsignal: '🇪🇸',
  everyone: '🌐',
};

export const AUDIENCE_LABELS: Record<AudienceType, string> = {
  americansignal: capitalize(AMERICAN),
  spanishsignal: capitalize(SPANISH),
  everyone: capitalize(EVERYONE),
};

export const DEFAULT_AUDIENCE: AudienceType = audiences[2];

export const AUDIENCE_ENRICHMENT_CATEGORY = 'audience' as const;
export const AUDIENCE_ENTRY_FIELD = 'programmaticPersonalizationAudience' as const;

export const ORDER_BY_CLAUSES: Record<AudienceType, string> = {
  americansignal: `boost|fields.${AUDIENCE_ENTRY_FIELD}:${AMERICAN}:3|fields.${AUDIENCE_ENTRY_FIELD}:${EVERYONE}:2_DSC`,
  spanishsignal: `boost|fields.${AUDIENCE_ENTRY_FIELD}:${SPANISH}:3|fields.${AUDIENCE_ENTRY_FIELD}:${EVERYONE}:2_DSC`,
  everyone: `boost|fields.${AUDIENCE_ENTRY_FIELD}:${EVERYONE}:3_DSC`,
};

export const BRANDS_ENTRY_FIELD = 'programmaticPersonalizationEnrichmentScore' as const;
