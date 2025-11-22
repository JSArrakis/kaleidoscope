import useRootStack from "../../navigation/useRootStack";
import MosaicView, { useMosaicViewModel } from './View';

function Mosaic() {
  const navigate = useRootStack();
  const viewModel = useMosaicViewModel(navigate);
  return <MosaicView viewModel={viewModel} />;
}

export default Mosaic;
