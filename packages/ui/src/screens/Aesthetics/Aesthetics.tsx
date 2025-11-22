import useRootStack from "../../navigation/useRootStack";
import AestheticsView, { useAestheticsViewModel } from "./View";

function Aesthetics() {
  const navigate = useRootStack();
  const viewModel = useAestheticsViewModel(navigate);
  return <AestheticsView viewModel={viewModel} />;
}

export default Aesthetics;
