import useRootStack from "../../navigation/useRootStack";
import ErasView, { useErasViewModel } from './View';

function Eras() {
  const navigate = useRootStack();
  const viewModel = useErasViewModel(navigate);
  return <ErasView viewModel={viewModel} />;
}

export default Eras;
