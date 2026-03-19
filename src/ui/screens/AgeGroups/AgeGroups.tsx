import useRootStack from "../../navigation/useRootStack";
import AgeGroupsView, { useAgeGroupsViewModel } from "./View";

function AgeGroups() {
  const navigate = useRootStack();
  const viewModel = useAgeGroupsViewModel(navigate);
  return <AgeGroupsView viewModel={viewModel} />;
}

export default AgeGroups;
