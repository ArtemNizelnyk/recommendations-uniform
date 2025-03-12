import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ContentClient } from '@uniformdev/canvas';

// Define the schema for request body validation
const requestSchema = z.object({
  brandIds: z.array(z.string()),
});

// Define the Brand interface
interface Brand {
  id: string;
  name: string;
  logo: string;
  description?: string;
}

// Cache for brand data to avoid duplicate requests
const brandCache = new Map<string, Brand>();

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

    const { brandIds } = validationResult.data;

    if (!process.env.UNIFORM_PROJECT_ID || !process.env.UNIFORM_API_KEY) {
      console.error('Missing required environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // If no brand IDs are provided, return an empty array
    if (brandIds.length === 0) {
      return NextResponse.json([]);
    }

    // Filter out IDs that are already in the cache
    const uncachedIds = brandIds.filter(id => !brandCache.has(id));
    
    // Only make API call if there are uncached IDs
    if (uncachedIds.length > 0) {
      const contentClient = new ContentClient({
        projectId: process.env.UNIFORM_PROJECT_ID,
        apiKey: process.env.UNIFORM_API_KEY,
      });

      // Fetch brand entries by IDs
      const { entries } = await contentClient.getEntries({
        entryIDs: uncachedIds,
      });

      // Format and cache the newly fetched brands
      entries.forEach(entry => {
        const brand = formatBrand(entry);
        brandCache.set(brand.id, brand);
      });
    }

    // Combine cached brands for all requested IDs
    const allRequestedBrands = brandIds.map(id => {
      // Return cached brand if available, otherwise return a placeholder
      return brandCache.get(id) || {
        id,
        name: `Unknown Brand (${id})`,
        logo: '',
        description: '',
      };
    });

    return NextResponse.json(allRequestedBrands);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function formatBrand(entry: any): Brand {
  const fields = entry.entry.fields || {};
  
  return {
    id: entry.entry._id || '',
    name: fields.displayname?.value || 'Unknown Brand',
    logo: fields.brandLogo?.value?.[0]?.fields?.url?.value || '',
    description: fields.description?.value || '',
  };
} 