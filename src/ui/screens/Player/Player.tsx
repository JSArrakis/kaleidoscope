import useRootStack from "../../navigation/useRootStack";
import PlayerView, { usePlayerViewModel } from "./View";

function Player() {
  const navigate = useRootStack();
  const viewModel = usePlayerViewModel(navigate);
  return <PlayerView viewModel={viewModel} />;
}

export default Player;
