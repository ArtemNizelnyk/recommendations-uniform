import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ContentClient } from '@uniformdev/canvas';

// Define schema for request validation
const requestSchema = z.object({
  brandIds: z.array(z.string()).default([]),
});

// Define the Brand interface
interface Brand {
  id: string;
  name: string;
  logo?: string;
  description?: string;
}

// Format a brand entry from Uniform CMS
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatBrand(entry: any): Brand {
  const fields = entry.entry.fields || {};
  const brandLogo = fields.brandLogo?.value;
  let logoUrl = '';

  // Safely access the logo URL with proper type checking
  if (Array.isArray(brandLogo) && brandLogo.length > 0 && brandLogo[0]?.fields?.url?.value) {
    logoUrl = brandLogo[0].fields.url.value;
  }

  return {
    id: entry.entry._id || '',
    name: (fields.displayname?.value as string) || 'Unknown Brand',
    logo: logoUrl,
    description: (fields.description?.value as string) || '',
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const { brandIds } = requestSchema.parse(body);

    // If no brand IDs are provided, return an empty array
    if (brandIds.length === 0) {
      return NextResponse.json({ brands: [] });
    }

    // Check for required environment variables
    if (!process.env.UNIFORM_PROJECT_ID || !process.env.UNIFORM_API_KEY) {
      console.error('Missing required environment variables for Uniform CMS');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Initialize the Uniform Content Client
    const contentClient = new ContentClient({
      projectId: process.env.UNIFORM_PROJECT_ID,
      apiKey: process.env.UNIFORM_API_KEY,
    });

    // Fetch brand entries from Uniform CMS
    const response = await contentClient.getEntries({
      entryIDs: brandIds,
    });

    // Format the brand entries
    const brands = response.entries.map(formatBrand);

    // Return the formatted brands in the expected structure
    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Error in brands API route:', error);

    // Return an appropriate error response
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request format', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to fetch brand data' }, { status: 500 });
  }
}
