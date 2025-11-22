import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetAllMusicGenres = () => {
  return useQuery({
    queryKey: ["musicGenres"],
    queryFn: async () => {
      return await window.electron.getMusicGenresHandler();
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    retry: 3,
  });
};

export const useCreateMusicGenre = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Tag
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.createMusicGenreHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["musicGenres"] });
    },
  });
};

export const useDeleteMusicGenre = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Tag
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.deleteMusicGenreHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["musicGenres"] });
    },
  });
};
