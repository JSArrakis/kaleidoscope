import useRootStack from "../../navigation/useRootStack";
import ShortsView, { useShortsViewModel } from './View';

function Shorts() {
  const navigate = useRootStack();
  const viewModel = useShortsViewModel(navigate);
  return <ShortsView viewModel={viewModel} />;
}

export default Shorts;
