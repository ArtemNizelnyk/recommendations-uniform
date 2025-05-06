import { FC } from 'react';
import { ComponentProps, UniformSlot, UniformText } from '@uniformdev/canvas-next-rsc/component';

// Here, you can add parameters to be used on the canvas side.
export type RecommendationCompositionEntryParameters = {
  displayName?: string;
};
// Here, you can add slots names to be used on the canvas side.
enum RecommendationCompositionEntrySlots {
  deals = 'deals',
}

type RecommendationCompositionEntryProps = ComponentProps<
  RecommendationCompositionEntryParameters,
  RecommendationCompositionEntrySlots
>;

const RecommendationCompositionEntry: FC<RecommendationCompositionEntryProps> = ({ component, context, slots }) => {
  // Check if we have deals to display
  const hasDeals =
    slots.deals &&
    (Array.isArray(slots.deals)
      ? slots.deals.length > 0
      : typeof slots.deals === 'object' &&
        slots.deals.items &&
        Array.isArray(slots.deals.items) &&
        slots.deals.items.length > 0);

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            <UniformText
              placeholder="Recommended Deals"
              parameterId="displayName"
              as="span"
              component={component}
              context={context}
            />
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Personalized deals based on your preferences and browsing history.
          </p>
        </div>

        {hasDeals ? (
          <div className="grid grid-cols-1 justify-items-center gap-6 md:grid-cols-2 lg:grid-cols-3">
            <UniformSlot data={component} context={context} slot={slots.deals} />
          </div>
        ) : (
          <div className="mb-6 rounded-md border-l-4 border-amber-400 bg-amber-50 p-4">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-5 text-amber-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="ml-3 text-sm font-medium text-amber-700">
                Not enough browsing history or visited brands are not part of the campaign so we are showing default
                content.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default RecommendationCompositionEntry;
