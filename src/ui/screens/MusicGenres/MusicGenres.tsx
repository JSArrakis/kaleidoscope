import useRootStack from "../../navigation/useRootStack";
import MusicGenresView, { useMusicGenresViewModel } from "./View";

function MusicGenres() {
  const navigate = useRootStack();
  const viewModel = useMusicGenresViewModel(navigate);
  return <MusicGenresView viewModel={viewModel} />;
}

export default MusicGenres;
