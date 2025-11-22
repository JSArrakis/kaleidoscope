import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetAllMovies = () => {
  return useQuery({
    queryKey: ["movies"],
    queryFn: async () => {
      return await window.electron.getMoviesHandler();
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    retry: 3,
  });
};

export const useCreateMovie = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.createMovieHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
    },
  });
};

export const useDeleteMovie = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.deleteMovieHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
};

export const useUpdateMovie = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.updateMovieHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
};
