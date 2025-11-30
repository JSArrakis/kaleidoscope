import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetAllEraTags = () => {
  return useQuery({
    queryKey: ["eraTags"],
    queryFn: async () => {
      return await window.electron.getEraTagsHandler();
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    retry: 3,
  });
};

export const useCreateEraTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Tag
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.createEraTagHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["eraTags"] });
    },
  });
};

export const useDeleteEraTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Tag
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.deleteEraTagHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["eraTags"] });
    },
  });
};
