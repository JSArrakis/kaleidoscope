import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetAllAestheticTags = () => {
  return useQuery({
    queryKey: ["aestheticTags"],
    queryFn: async () => {
      return await window.electron.getAestheticTagsHandler();
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    retry: 3,
  });
};

export const useCreateAestheticTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Tag
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.createAestheticTagHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["aestheticTags"] });
    },
  });
};

export const useDeleteAestheticTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Tag
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.deleteAestheticTagHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["aestheticTags"] });
    },
  });
};
