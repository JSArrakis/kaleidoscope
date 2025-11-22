import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetAllSpecialtyTags = () => {
  return useQuery({
    queryKey: ["specialtyTags"],
    queryFn: async () => {
      return await window.electron.getSpecialtyTagsHandler();
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    retry: 3,
  });
};

export const useCreateSpecialtyTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Tag
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.createSpecialtyTagHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["specialtyTags"] });
    },
  });
};

export const useDeleteSpecialtyTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Tag
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.deleteSpecialtyTagHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["specialtyTags"] });
    },
  });
};
