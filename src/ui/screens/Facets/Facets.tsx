import useRootStack from "../../navigation/useRootStack";
import FacetsView, { useFacetsViewModel } from './View';

function Facets() {
  const navigate = useRootStack();
  const viewModel = useFacetsViewModel(navigate);
  return <FacetsView viewModel={viewModel} />;
}

export default Facets;