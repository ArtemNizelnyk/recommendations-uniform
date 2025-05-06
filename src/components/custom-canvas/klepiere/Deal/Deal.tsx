'use client';

import { FC, useEffect, useState } from 'react';
import Image from 'next/image';
import { ComponentProps, UniformText } from '@uniformdev/canvas-next-rsc/component';
import { formatBrandIdForLookup } from '@/utils/brandCriteria';

// Here, you can add parameters to be used on the canvas side.
export type DealParameters = {
  displayName?: string;
  image?: {
    value?: Array<{
      fields?: {
        url?: { value?: string };
      };
    }>;
  };
  compositionData?: {
    value?: Record<string, unknown>;
  };
  brands?: {
    value?: Array<{
      entry?: {
        _id?: string;
        _name?: string;
        fields?: {
          displayname?: { value?: string };
          brandLogo?: {
            value?: Array<{
              fields?: {
                url?: { value?: string };
              };
            }>;
          };
        };
      };
    }>;
  };
};

// Brand data interface
interface BrandData {
  id: string;
  name: string;
  logo: string;
  description?: string;
}

// Here, you can add slots names to be used on the canvas side.
enum DealSlots {
  DealContent = 'dealContent',
}

type DealProps = ComponentProps<DealParameters, DealSlots>;

// Global brand cache to reduce API calls
const globalBrandCache = new Map<string, BrandData>();

const Deal: FC<DealProps> = ({ component, context }) => {
  const displayName = component?.parameters?.displayName?.value || 'Deal';

  // Fix the type error by safely accessing the image URL
  let imageUrl = '';
  const imageValue = component?.parameters?.image?.value;
  if (Array.isArray(imageValue) && imageValue.length > 0 && imageValue[0]?.fields?.url?.value) {
    imageUrl = imageValue[0].fields.url.value;
  }

  const compositionData = component?.parameters?.compositionData?.value;
  const directBrands = component?.parameters?.brands?.value;
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Process direct brand references if available
  useEffect(() => {
    if (directBrands && Array.isArray(directBrands) && directBrands.length > 0) {
      // Extract brand data directly from the component parameters
      const extractedBrands: BrandData[] = directBrands.map(brand => {
        // Safely access the logo URL
        let logoUrl = '';
        const brandLogo = brand.entry?.fields?.brandLogo?.value;
        if (Array.isArray(brandLogo) && brandLogo.length > 0 && brandLogo[0]?.fields?.url?.value) {
          logoUrl = brandLogo[0].fields.url.value;
        }

        return {
          id: brand.entry?._id || '',
          name: brand.entry?.fields?.displayname?.value || 'Unknown Brand',
          logo: logoUrl,
          description: '',
        };
      });

      setBrands(extractedBrands);
      return; // Skip the API call if we have direct brand references
    }

    // Otherwise, proceed with fetching brands from the API
    const fetchBrandData = async () => {
      if (!compositionData) return;

      setIsLoading(true);
      try {
        // Extract brand IDs using the new criteria format
        const brandIds = extractBrandIdsFromCompositionData(compositionData as Record<string, unknown>);
        if (brandIds.length === 0) {
          setBrands([]);
          return;
        }

        // Check if we already have these brands in the cache
        const cachedBrands: BrandData[] = [];
        const uncachedIds: string[] = [];

        brandIds.forEach(id => {
          const cachedBrand = globalBrandCache.get(id);
          if (cachedBrand) {
            cachedBrands.push(cachedBrand);
          } else {
            uncachedIds.push(id);
          }
        });

        // If all brands are cached, use them directly
        if (uncachedIds.length === 0) {
          setBrands(cachedBrands);
          setIsLoading(false);
          return;
        }

        // Fetch only the uncached brands
        const response = await fetch('/api/brands', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            brandIds: uncachedIds,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch brand data');
        }

        const data = await response.json();

        // Check if the response has the expected structure
        if (!data.brands || !Array.isArray(data.brands)) {
          throw new Error('Invalid response format from brands API');
        }

        // Update the cache with the new brands
        data.brands.forEach((brand: BrandData) => {
          globalBrandCache.set(brand.id, brand);
        });

        // Combine cached and newly fetched brands
        setBrands([...cachedBrands, ...data.brands]);
      } catch (error) {
        console.error('Error fetching brand data:', error);
        // Fallback to simplified brand data
        const brandIds = extractBrandIdsFromCompositionData(compositionData as Record<string, unknown>);
        const simplifiedBrands = brandIds.map(id => ({
          id,
          name: formatBrandId(id),
          logo: '',
          description: '',
        }));
        setBrands(simplifiedBrands);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrandData();
  }, [compositionData, directBrands]);

  return (
    <div className="flex size-full max-w-sm flex-col overflow-hidden rounded-lg bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
      {/* Colored top bar */}
      <div className="h-2 bg-indigo-600"></div>

      <div className="flex grow flex-col p-6">
        {/* Deal image */}
        <div className="mb-4 h-40 overflow-hidden rounded-md bg-gray-100">
          {imageUrl ? (
            <div className="relative size-full">
              <Image src={imageUrl} alt={displayName as string} fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
        </div>

        {/* Deal name */}
        <div className="mb-4">
          <div className="mb-1 text-sm font-semibold uppercase tracking-wide text-indigo-600">Special Offer</div>
          <h2 className="text-xl font-bold text-gray-900">
            <UniformText
              placeholder="Deal name"
              parameterId="displayName"
              as="span"
              component={component}
              context={context}
            />
          </h2>
        </div>

        {/* Brands section */}
        <div className="mt-auto">
          <h3 className="mb-2 font-medium text-gray-700">Featured Brands:</h3>
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading brands...</p>
          ) : brands.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {brands.map(brand => (
                <div key={brand.id} className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
                  {brand.logo && (
                    <div className="relative size-6 overflow-hidden rounded-full">
                      <Image src={brand.logo} alt={brand.name} fill className="object-cover" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-800">{brand.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No brands associated with this deal</p>
          )}
        </div>

        {/* Call to action */}
        <button className="mt-4 w-full rounded-md bg-indigo-600 py-2 text-white transition-colors hover:bg-indigo-700">
          View Deal
        </button>
      </div>
    </div>
  );
};

// Helper function to extract brand IDs from composition data with the new criteria format
function extractBrandIdsFromCompositionData(compositionData: Record<string, unknown>): string[] {
  try {
    // Check if we have the criteria directly in the composition data
    if (
      compositionData &&
      '$pzCrit' in compositionData &&
      typeof compositionData.$pzCrit === 'object' &&
      compositionData.$pzCrit &&
      'type' in compositionData.$pzCrit &&
      compositionData.$pzCrit.type === '$pzCrit'
    ) {
      // Use a more generic approach to extract brand IDs from criteria
      const pzCrit = compositionData.$pzCrit as Record<string, unknown>;
      if (pzCrit.value && typeof pzCrit.value === 'object') {
        const value = pzCrit.value as Record<string, unknown>;
        if (value.crit && Array.isArray(value.crit)) {
          return value.crit
            .filter(
              criterion =>
                typeof criterion === 'object' &&
                criterion !== null &&
                'l' in criterion &&
                typeof criterion.l === 'string' &&
                criterion.l.startsWith('brand_')
            )
            .map(criterion => {
              const brandName = (criterion as { l: string }).l.replace('brand_', '');
              return formatBrandIdForLookup(brandName);
            });
        }
      }
    }

    // Check if criteria is in a different format or location
    if (compositionData && 'criteria' in compositionData && Array.isArray(compositionData.criteria)) {
      // Try to find brand criteria in the criteria array
      const brandCriteria = compositionData.criteria.find(
        (crit: unknown) =>
          typeof crit === 'object' &&
          crit !== null &&
          'l' in crit &&
          typeof crit.l === 'string' &&
          (crit.l.startsWith('brand:') || crit.l.startsWith('brand_'))
      );

      if (
        brandCriteria &&
        typeof brandCriteria === 'object' &&
        'l' in brandCriteria &&
        typeof brandCriteria.l === 'string'
      ) {
        // Extract brand name from the criterion
        const brandName = (brandCriteria as { l: string }).l.replace(/^brand[_:]/, '');
        const formattedName = brandName.charAt(0).toUpperCase() + brandName.slice(1);
        return [formatBrandIdForLookup(formattedName)];
      }
    }

    // If not, look for brand references in _dataResources
    if (
      compositionData &&
      '_dataResources' in compositionData &&
      typeof compositionData._dataResources === 'object' &&
      compositionData._dataResources
    ) {
      const dataResources = compositionData._dataResources as Record<string, unknown>;
      const brandsRef = Object.entries(dataResources).find(([key]) => key.includes('-brands'));

      if (!brandsRef || !brandsRef[1] || typeof brandsRef[1] !== 'object') return [];

      // Extract entryIds from the reference
      const brandsRefObj = brandsRef[1] as Record<string, unknown>;
      if (!('variables' in brandsRefObj) || typeof brandsRefObj.variables !== 'object') return [];

      const variables = brandsRefObj.variables as Record<string, unknown>;
      if (!('entryIds' in variables) || typeof variables.entryIds !== 'string') return [];

      // Split the comma-separated IDs into an array
      return variables.entryIds.split(',');
    }

    return [];
  } catch (error) {
    console.error('Error extracting brand IDs:', error);
    return [];
  }
}

// Helper function to format brand ID for display
function formatBrandId(id: string): string {
  // Extract a simplified name from the ID
  const shortId = id.split('-')[0];
  return `Brand-${shortId}`;
}

export default Deal;
