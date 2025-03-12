import { FC } from 'react';
import { ComponentProps, UniformSlot, UniformText } from '@uniformdev/canvas-next-rsc/component';

// Here, you can add parameters to be used on the canvas side.
export type RecommendationsListParameters = {
  displayName?: string;
};
// Here, you can add slots names to be used on the canvas side.
enum RecommendationsListSlots {
  deals = 'deals',
}

type RecommendationsListProps = ComponentProps<RecommendationsListParameters, RecommendationsListSlots>;

const RecommendationsList: FC<RecommendationsListProps> = ({ component, context, slots }) => {
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

        <div className="flex flex-wrap justify-center gap-6">
          <UniformSlot data={component} context={context} slot={slots.deals} />
        </div>
      </div>
    </section>
  );
};

export default RecommendationsList;
