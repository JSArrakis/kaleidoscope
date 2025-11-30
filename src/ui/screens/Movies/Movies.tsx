import useRootStack from '../../navigation/useRootStack';
import MoviesView, { useMoviesViewModel } from './View';

function Movies() {
  const navigate = useRootStack();
  const viewModel = useMoviesViewModel(navigate);
  return <MoviesView viewModel={viewModel} />;
}

export default Movies;
