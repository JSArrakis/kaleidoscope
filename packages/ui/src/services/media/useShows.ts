import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetAllShows = () => {
  return useQuery({
    queryKey: ["shows"],
    queryFn: async () => {
      return await window.electron.getShowsHandler();
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    retry: 3,
  });
};

export const useCreateShow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.createShowHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
    },
  });
};

export const useUpdateShow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.updateShowHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
    },
  });
}

export const useDeleteShow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.deleteShowHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
    },
  });
};