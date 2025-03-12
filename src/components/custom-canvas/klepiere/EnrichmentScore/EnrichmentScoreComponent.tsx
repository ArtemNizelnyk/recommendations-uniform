'use client';

import { useEffect } from 'react';
import { ComponentProps, useUniformContext } from '@uniformdev/canvas-next-rsc/component';

type Props = ComponentProps<{
  enrichmentCategory?: string;
  enrichmentValue?: string;
}>;

const EnrichmentScoreComponent = ({ enrichmentCategory, enrichmentValue, context: componentContext }: Props) => {
  const { context } = useUniformContext();

  useEffect(() => {
    if (componentContext.isContextualEditing && componentContext.isDraftMode) {
      return;
    }

    if (!context || !enrichmentCategory || !enrichmentValue) {
      return;
    }

    context.update({
      enrichments: [
        {
          str: 1,
          cat: enrichmentCategory,
          key: enrichmentValue,
        },
      ],
    });
  }, [componentContext, context, enrichmentCategory, enrichmentValue]);

  // If in editor mode
  if (componentContext.isContextualEditing && componentContext.previewMode === 'editor') {
    // Check if we have a category and value
    if (enrichmentCategory && enrichmentValue) {
      return <EnrichmentDisplay category={enrichmentCategory} value={enrichmentValue} />;
    } else {
      // Show a message when no category and value are present in editor mode
      return <EditorModeNoConfigMessage />;
    }
  }

  // If not in editor mode
  return null;
};

function EnrichmentDisplay({ category, value }: { category?: string; value?: string }) {
  if (!category || !value) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
      <h3 className="mb-2 text-sm font-semibold text-gray-700">Programmatic Enrichment Scoring</h3>
      <div className="text-xs text-gray-600">
        <p>
          <span className="font-medium">Category:</span> {category}
        </p>
        <p>
          <span className="font-medium">Value:</span> {value}
        </p>
      </div>
    </div>
  );
}

function EditorModeNoConfigMessage() {
  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
      <h3 className="mb-2 text-sm font-semibold text-gray-700">Programmatic Enrichment Scoring</h3>
      <p className="text-xs text-gray-600">No enrichment category and/or value have been selected</p>
    </div>
  );
}

export default EnrichmentScoreComponent;
