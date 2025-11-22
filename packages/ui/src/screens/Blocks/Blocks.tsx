import useRootStack from "../../navigation/useRootStack";
import BlocksView, { useBlocksViewModel } from './View';

function Blocks() {
  const navigate = useRootStack();
  const viewModel = useBlocksViewModel(navigate);
  return <BlocksView viewModel={viewModel} />;
}

export default Blocks;
