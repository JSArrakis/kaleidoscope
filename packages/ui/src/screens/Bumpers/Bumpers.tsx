import useRootStack from "../../navigation/useRootStack";
import BumpersView, { useBumpersViewModel } from "./View";

function Bumpers() {
  const navigate = useRootStack();
  const viewModel = useBumpersViewModel(navigate);
  return <BumpersView viewModel={viewModel} />;
}

export default Bumpers;
