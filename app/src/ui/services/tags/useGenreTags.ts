import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetAllGenreTags = () => {
  return useQuery({
    queryKey: ["genreTags"],
    queryFn: async () => {
      return await window.electron.getGenreTagsHandler();
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    retry: 3,
  });
};

export const useCreateGenreTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Tag
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.createGenreTagHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["genreTags"] });
    },
  });
};

export const useDeleteGenreTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Tag
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.deleteGenreTagHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["genreTags"] });
    },
  });
};
