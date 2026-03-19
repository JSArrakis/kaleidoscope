import useRootStack from "../../navigation/useRootStack";
import SplashView, { useSplashViewModel } from './View';

function Splash() {
  const navigate = useRootStack();
  const viewModel = useSplashViewModel(navigate);
  return <SplashView viewModel={viewModel} />;
}

export default Splash;
