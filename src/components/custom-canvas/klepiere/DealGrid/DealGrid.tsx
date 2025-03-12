import { FC } from 'react';
import { ComponentProps, UniformSlot, UniformText } from '@uniformdev/canvas-next-rsc/component';

// Here, you can add parameters to be used on the canvas side.
export type DealGridParameters = {
  displayName?: string;
  showWarning?: {
    value?: boolean;
  };
};
// Here, you can add slots names to be used on the canvas side.
enum DealGridSlots {
  deals = 'deals',
}

type DealGridProps = ComponentProps<DealGridParameters, DealGridSlots>;

const DealGrid: FC<DealGridProps> = ({ component, context, slots }) => {
  const showWarning = component?.parameters?.showWarning?.value !== false; // Default to true if not specified

  return (
    <div className="mx-auto max-w-7xl">
      {showWarning && (
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
              content:
            </p>
          </div>
        </div>
      )}

      <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
        <UniformText
          placeholder="Featured Deals"
          parameterId="displayName"
          as="span"
          component={component}
          context={context}
          defaultValue="Featured Deals"
        />
      </h2>

      <div className="flex flex-wrap justify-center gap-6">
        <UniformSlot data={component} context={context} slot={slots.deals} />
      </div>
    </div>
  );
};

export default DealGrid;
