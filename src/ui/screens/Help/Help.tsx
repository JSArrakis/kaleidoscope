import useRootStack from "../../navigation/useRootStack";
import HelpView, { useHelpViewModel } from './View';

function Help() {
  const navigate = useRootStack();
  const viewModel = useHelpViewModel(navigate);
  return <HelpView viewModel={viewModel} />;
}

export default Help;
