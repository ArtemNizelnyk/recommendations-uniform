import { PageParameters, UniformComposition } from '@uniformdev/canvas-next-rsc';
import { emptyPlaceholderResolver } from '@uniformdev/csk-components/components/canvas/emptyPlaceholders';
import { DesignExtensionsProvider } from '@uniformdev/design-extensions-tools/components/providers/server';
import { componentResolver } from '@/components';
import locales from '@/i18n/locales.json';
import retrieveRoute from '@/utils/retrieveRoute';
import { transformRecommendationsInComposition } from '@/utils/transformRecommendations';

export default async function Home(props: PageParameters) {
  const route = await retrieveRoute(props, locales.defaultLocale);

  // Transform the composition data to wrap deals in a personalization component
  if (route && route.type === 'composition') {
    // Check if the route has a composition property
    const composition = route.compositionApiResponse.composition;
    if (composition) {
      // Transform the composition
      //console.log('route', route.compositionApiResponse.composition.slots.pageContent[0].slots);
      route.compositionApiResponse.composition = await transformRecommendationsInComposition(composition);
    }
  }

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

export { generateMetadata } from '@/utils/metadata';
