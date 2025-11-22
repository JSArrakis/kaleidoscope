import useRootStack from "../../navigation/useRootStack";
import MusicView, { useMusicViewModel } from './View';

function Music() {
  const navigate = useRootStack();
  const viewModel = useMusicViewModel(navigate);
  return <MusicView viewModel={viewModel} />;
}

export default Music;
