import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AssetParamValue, ContentClient, LinkParamValue } from '@uniformdev/canvas';
import { audiences, AudienceType, DEFAULT_AUDIENCE, ORDER_BY_CLAUSES, BRANDS_ENTRY_FIELD } from '@/constants/index';
import { Brand, Deal } from '@/types/index';

// Define the schema for request body validation
const requestSchema = z.object({
  userType: z.enum(audiences),
  enrichments: z.array(
    z.object({
      enrichmentCategory: z.string(),
      enrichmentValue: z.string(),
      enrichmentScore: z.number(),
    })
  ),
});

function getOrderByClause(
  userType: AudienceType,
  enrichments: Array<{ enrichmentCategory: string; enrichmentValue: string; enrichmentScore: number }> = []
): string {
  // Get the base audience boost
  const audienceBoost = ORDER_BY_CLAUSES[userType];

  // Filter and format brand enrichments
  const brandEnrichments = enrichments
    .filter(e => e.enrichmentCategory === 'brand')
    .map(e => `fields.${BRANDS_ENTRY_FIELD}:${e.enrichmentValue}:${e.enrichmentScore}`);

  // If there are no brand enrichments, return just the audience boost
  if (brandEnrichments.length === 0) {
    return audienceBoost;
  }

  // Combine audience boost with brand enrichments
  // Remove '_DSC' from audience boost since we'll add it at the end
  const baseAudienceBoost = audienceBoost.replace('_DSC', '');

  // Combine all boosts and add descending order
  return `${baseAudienceBoost}|${brandEnrichments.join('|')}_DSC`;
}

type RawBrand = {
  entry: {
    fields?: {
      displayname?: { value?: string };
      brandLogo?: { value?: AssetParamValue };
    };
  };
};

type RawDealEntry = {
  entry: {
    _slug?: string;
    fields?: {
      displayName?: { value?: string };
      responsiveImage?: { value?: AssetParamValue };
      url?: { value?: LinkParamValue };
      brands?: { value?: RawBrand[] };
      audience?: { value?: { entry?: { fields?: { name?: { value?: string } } } } };
      programmaticPersonalizationAudience?: { value?: string };
    };
  };
};

function formatDeal(entry: RawDealEntry): Deal {
  const name = entry.entry.fields?.displayName?.value ?? 'Unknown Name';

  const url = entry.entry.fields?.url?.value?.path ?? '#';
  const logo = entry.entry.fields?.responsiveImage?.value?.[0]?.fields?.url?.value ?? '#';

  const rawBrands = entry.entry.fields?.brands?.value ?? [];

  const brands: Brand[] = Array.isArray(rawBrands)
    ? rawBrands.map(brand => ({
        name: brand.entry.fields?.displayname?.value ?? 'Unknown Brand',
        logo: brand.entry.fields?.brandLogo?.value?.[0]?.fields?.url?.value ?? '#',
      }))
    : [];

  const audience = entry.entry.fields?.audience?.value?.entry?.fields?.name?.value;
  const audienceType =
    (entry.entry.fields?.programmaticPersonalizationAudience?.value as AudienceType) || DEFAULT_AUDIENCE;

  return { name, brands, audience, audienceType, url, logo };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { userType, enrichments } = validationResult.data;

    if (!process.env.UNIFORM_PROJECT_ID || !process.env.UNIFORM_API_KEY) {
      console.error('Missing required environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const contentClient = new ContentClient({
      projectId: process.env.UNIFORM_PROJECT_ID,
      apiKey: process.env.UNIFORM_API_KEY,
    });

    const orderBy = getOrderByClause(userType, enrichments);

    const { entries } = await contentClient.getEntries({
      filters: { type: { eq: 'deal' } },
      limit: 30,
      orderBy: [orderBy],
      locale: 'en',
    });

    const formattedEntries = entries.map(formatDeal);

    return NextResponse.json(formattedEntries);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
