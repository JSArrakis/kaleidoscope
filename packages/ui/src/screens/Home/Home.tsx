import useRootStack from "../../navigation/useRootStack";
import HomeView, { useHomeViewModel } from './View';

function Home() {
  const navigate = useRootStack();
  const viewModel = useHomeViewModel(navigate);
  return <HomeView viewModel={viewModel} />;
}

export default Home;
