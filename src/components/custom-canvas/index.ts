import { ComponentMapping } from '@uniformdev/csk-components/utils/createComponentResolver';
import CustomComponent from './CustomComponent';
import Deal from './klepiere/Deal/Deal';
import DealGrid from './klepiere/DealGrid/DealGrid';
import EnrichmentScoreComponent from './klepiere/EnrichmentScore/EnrichmentScoreComponent';
import Recommendations from './klepiere/Recommendations/Recommendations';
import RecommendationsList from './klepiere/RecommendationsList/RecommendationsList';
import RecommendationCompositionEntry from './klepiere/RecomendationCompositionEntry/RecommendationCompositionEntry';
import DealForEntry from './klepiere/DealForEntry/DealForEntry';
// Here, you can add your own component or customize an existing CSK component with your logic or styles.
export const customComponentsMapping: ComponentMapping = {
  // This is a simple example of how you can add your own components.
  customComponent: { component: CustomComponent },
  recommendationsComponent: { component: Recommendations },
  enrichmentScoreComponent: { component: EnrichmentScoreComponent },
  recommendationsList: { component: RecommendationsList },
  recommendationsListWithEntry: { component: RecommendationCompositionEntry },
  dealforentry: { component: DealForEntry },
  // This is an overridden CSK Container component.
  deal: { component: Deal },
  dealGrid: { component: DealGrid },
};
