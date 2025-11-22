import useRootStack from "../../navigation/useRootStack";
import ShowsView, { useShowsViewModel } from './View';

function Shows() {
  const navigate = useRootStack();
  const viewModel = useShowsViewModel(navigate);
  return <ShowsView viewModel={viewModel} />;
}

export default Shows;
