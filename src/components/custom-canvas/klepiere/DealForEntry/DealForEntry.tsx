'use client';

import { FC } from 'react';
import Image from 'next/image';
import { ComponentProps, UniformText } from '@uniformdev/canvas-next-rsc/component';

// Here, you can add parameters to be used on the canvas side.
export type DealForEntryParameters = {
  displayName?: string;
  image?: {
    value?: Array<{
      fields?: {
        url?: { value?: string };
      };
    }>;
  };
  compositionData?: Array<{
    projectId?: string;
    state?: number;
    created?: string;
    modified?: string;
    uiStatus?: string;
    pattern?: boolean;
    entry?: {
      type?: string;
      _id?: string;
      _name?: string;
      _slug?: string;
      _thumbnail?: string;
      fields?: {
        brandLogo?: {
          type?: string;
          value?: Array<{
            _id?: string;
            type?: string;
            fields?: {
              url?: { value?: string };
            };
            _source?: string;
          }>;
        };
        displayname?: {
          type?: string;
          value?: string;
        };
      };
      _locales?: string[];
    };
  }>;
};

// Brand data interface
interface BrandData {
  id: string;
  name: string;
  logo: string;
}

type DealForEntryProps = ComponentProps<DealForEntryParameters>;

const DealForEntry: FC<DealForEntryProps> = ({ component, context, displayName, compositionData, image }) => {
  // Extract image URL
  let imageUrl = '';
  const imageValue = image;
  if (Array.isArray(imageValue) && imageValue.length > 0 && imageValue[0]?.fields?.url?.value) {
    imageUrl = imageValue[0].fields.url.value;
  }

  // Extract brands directly from compositionData
  const brandsData = Array.isArray(compositionData) ? compositionData : [];

  const brands: BrandData[] = brandsData.map((brandData: any) => {
    // Extract brand logo URL
    let logoUrl = '';
    const brandLogo = brandData.entry?.fields?.brandLogo?.value;
    if (Array.isArray(brandLogo) && brandLogo.length > 0 && brandLogo[0]?.fields?.url?.value) {
      logoUrl = brandLogo[0].fields.url.value;
    } else if (brandData.entry?._thumbnail) {
      // Fallback to thumbnail if available
      logoUrl = brandData.entry._thumbnail;
    }

    return {
      id: brandData.entry?._id || '',
      name: brandData.entry?.fields?.displayname?.value || brandData.entry?._name || 'Unknown Brand',
      logo: logoUrl,
    };
  });

  return (
    <div className="flex h-full w-full max-w-sm flex-col overflow-hidden rounded-lg bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
      {/* Colored top bar */}
      <div className="h-2 bg-indigo-600"></div>

      <div className="flex grow flex-col p-6">
        {/* Deal image */}
        <div className="mb-4 h-40 overflow-hidden rounded-md bg-gray-100">
          {imageUrl ? (
            <div className="relative size-full">
              <Image src={imageUrl} alt={displayName || 'Deal'} fill className="object-cover" />
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
          {brands.length > 0 ? (
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

export default DealForEntry;
