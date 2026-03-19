import { useEffect, useState } from "react";
import useRootStack from "../../../navigation/useRootStack";
import { normalizeItem } from "../../../common/helpers";
import {
  useCreateMovie,
  useDeleteMovie,
  useGetAllMovies,
  useUpdateMovie,
} from "../../../services/media";

interface MoviesData {
  movies: Movie[];
  selectedMovie: Movie | null;
  isEditModalOpen: boolean;
}
interface MoviesActions {
  editMovie: (movie: Movie) => void;
  saveMovie: (movie: Movie) => void;
  onRemove: (movie: Movie) => void;
  addMovies: () => void;
}

export interface MoviesViewModel extends MoviesData, MoviesActions {}

const useMoviesViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): MoviesViewModel => {
  const $getMovies = useGetAllMovies();
  const $createMovie = useCreateMovie();
  const $deleteMovie = useDeleteMovie();
  const $updateMovie = useUpdateMovie();

  const [savedMovies, setSavedMovies] = useState<Movie[]>([]);

  const [newMovies, setNewMovies] = useState<Movie[]>([]);

  const [movies, setMovies] = useState<Movie[]>([]);
  const [isEditModalOpen, setEditModalState] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const calculateSize = (obj: any): string => {
    const bytes = new TextEncoder().encode(JSON.stringify(obj)).length;
    const kB = bytes / 1024;
    const mB = kB / 1024;
    const gB = mB / 1024;

    return `${bytes.toFixed(2)} bytes / ${kB.toFixed(2)} KB / ${mB.toFixed(
      2,
    )} MB / ${gB.toFixed(2)} GB`;
  };

  useEffect(() => {
    console.log("Current movie list size:", calculateSize(movies));
  }, [movies]);

  useEffect(() => {
    if ($getMovies.data) {
      setSavedMovies($getMovies.data);
    }
  }, [$getMovies.data]);

  useEffect(() => {
    let currentMovies: Movie[] = [];
    currentMovies = [...newMovies, ...savedMovies];
    setMovies(currentMovies);
  }, [newMovies, savedMovies]);

  const addMovies = async () => {
    const filePaths = await window.electron.openFileDialogHandler();
    if (filePaths.length > 0) {
      const newMoviesList: Movie[] = filePaths.map((moviePath: string) => ({
        mediaItemId: normalizeItem(moviePath),
        title: "",
        path: moviePath,
        duration: 0,
        durationLimit: 0,
        isHolidayExclusive: false,
        type: MediaType.Movie,
        tags: [] as Tag[],
      }));

      setNewMovies((prev) => [...prev, ...newMoviesList]);
    }
  };

  const editMovie = (movie: Movie) => {
    if (isEditModalOpen) {
      setEditModalState(false);
      return;
    }

    const movieToEdit = movies.find((m) => m.mediaItemId === movie.mediaItemId);
    if (!movieToEdit) {
      console.error("Movie not found:", movie);
      return;
    }
    setSelectedMovie(movieToEdit);
    setEditModalState(true);
  };

  const saveMovie = (movie: Movie) => {
    const deepCopiedMovie = JSON.parse(JSON.stringify(movie));
    console.log("Saving movie:", deepCopiedMovie);
    const existingMovie = savedMovies.find(
      (m) => m.mediaItemId === deepCopiedMovie.mediaItemId,
    );

    console.log("Existing movie:", existingMovie);

    if (existingMovie) {
      $updateMovie.mutate(deepCopiedMovie);
      setSelectedMovie(null);
      setEditModalState(false);
      setNewMovies((prev) =>
        prev.filter((m) => m.mediaItemId !== deepCopiedMovie.mediaItemId),
      );
      return;
    }
    setSelectedMovie(null);
    setEditModalState(false);
    setNewMovies((prev) =>
      prev.filter((m) => m.mediaItemId !== deepCopiedMovie.mediaItemId),
    );
    $createMovie.mutate(deepCopiedMovie);
  };

  const onRemove = (item: Movie) => {
    setEditModalState(false);
    if (item.mediaItemId === selectedMovie?.mediaItemId) {
      setSelectedMovie(null);
    }

    if (newMovies.includes(item)) {
      setNewMovies((prev) =>
        prev.filter((m) => m.mediaItemId !== item.mediaItemId),
      );
      return;
    } else {
      setSavedMovies((prev) =>
        prev.filter((m) => m.mediaItemId !== item.mediaItemId),
      );
      $deleteMovie.mutate(item);
    }
  };

  return {
    movies,
    selectedMovie,
    isEditModalOpen,
    editMovie,
    saveMovie,
    onRemove,
    addMovies,
  };
};

export default useMoviesViewModel;
