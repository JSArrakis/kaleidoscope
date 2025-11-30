import useRootStack from '../../navigation/useRootStack';
import CollectionsView, { useCollectionsViewModel } from './View';

function Collections() {
  const navigate = useRootStack();
  const viewModel = useCollectionsViewModel(navigate);
  return <CollectionsView viewModel={viewModel} />;
}

export default Collections;
