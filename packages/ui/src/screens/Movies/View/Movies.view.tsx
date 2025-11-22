import { FC } from "react";
import { MoviesViewModel } from "./Movies.viewmodel";
import styles from "./Movies.module.css";
import MediaItemList from "../../../components/MediaItemList/MediaItemList";

interface MoviesViewProps {
  viewModel: MoviesViewModel;
}

const MoviesView: FC<MoviesViewProps> = ({ viewModel }) => {

  const selectedMovie = viewModel.selectedMovie
    ? viewModel.selectedMovie
    : { mediaItemId: "", title: "", path: "", tags: [] };

  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Movies</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}>
            <MediaItemList
              isEditModalOpen={viewModel.isEditModalOpen}
              mediaList={viewModel.movies}
              type="movie"
              selectedItem={selectedMovie}
              onEdit={viewModel.editMovie}
              onSave={viewModel.saveMovie}
              onRemove={viewModel.onRemove}
              onAddItem={viewModel.addMovies}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoviesView;
