import useRootStack from '../../navigation/useRootStack';
import MusicView, { useMusicVideosViewModel } from './View';

function Music() {
  const navigate = useRootStack();
  const viewModel = useMusicVideosViewModel(navigate);
  return <MusicView viewModel={viewModel} />;
}

export default Music;
