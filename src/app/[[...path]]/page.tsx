import { PageParameters, UniformComposition } from '@uniformdev/canvas-next-rsc';
import { emptyPlaceholderResolver } from '@uniformdev/csk-components/components/canvas/emptyPlaceholders';
import { DesignExtensionsProvider } from '@uniformdev/design-extensions-tools/components/providers/server';
import { componentResolver } from '@/components';
import locales from '@/i18n/locales.json';
import retrieveRoute from '@/utils/retrieveRoute';
import { transformRecommendationsInComposition } from '@/utils/transformRecommendations';
import { transformRecommendationsForEntry } from '@/utils/transformRecommendationsForEntry';

export default async function Home(props: PageParameters) {
  const route = await retrieveRoute(props, locales.defaultLocale);

  // Transform the composition data based on the component type
  if (route && route.type === 'composition' && route.compositionApiResponse.composition) {
    const composition = route.compositionApiResponse.composition;

    // Check if the composition contains a recommendationsList component
    const hasRecommendationsList = checkForComponentType(composition, 'recommendationsList');

    // Check if the composition contains a recommendationsListWithEntry component
    const hasRecommendationsListWithEntry = checkForComponentType(composition, 'recommendationsListWithEntry');

    // Apply the appropriate transformation
    if (hasRecommendationsList) {
      const transformedComposition = await transformRecommendationsInComposition(composition);
      if (transformedComposition) {
        route.compositionApiResponse.composition = transformedComposition as typeof composition;
      }
    } else if (hasRecommendationsListWithEntry) {
      const transformedComposition = await transformRecommendationsForEntry(composition);
      if (transformedComposition) {
        route.compositionApiResponse.composition = transformedComposition as typeof composition;
      }
    }
  }

  //console.log('route', route.compositionApiResponse.composition.slots.pageContent[0].slots.deals[0].slots.pz[11]);
  const searchParams = await props.searchParams;
  const isPreviewMode = searchParams?.is_incontext_editing_mode === 'true';
  return (
    <DesignExtensionsProvider isPreviewMode={isPreviewMode}>
      <UniformComposition
        {...props}
        route={route}
        resolveComponent={componentResolver}
        mode="server"
        resolveEmptyPlaceholder={emptyPlaceholderResolver}
      />
    </DesignExtensionsProvider>
  );
}

// Helper function to check if a composition contains a component of a specific type
function checkForComponentType(composition: Record<string, unknown>, componentType: string): boolean {
  if (!composition.slots || typeof composition.slots !== 'object') {
    return false;
  }

  const slots = composition.slots as Record<string, unknown>;
  if (!slots.pageContent || !Array.isArray(slots.pageContent)) {
    return false;
  }

  return slots.pageContent.some(
    (component: unknown) =>
      typeof component === 'object' && component !== null && 'type' in component && component.type === componentType
  );
}

export { generateMetadata } from '@/utils/metadata';
