import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetAllShorts = () => {
  return useQuery({
    queryKey: ["shorts"],
    queryFn: async () => {
      return await window.electron.getShortsHandler();
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    retry: 3,
  });
};

export const useCreateShort = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.createShortHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["shorts"] });
    },
  });
};

export const useUpdateShort = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.updateShortHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["shorts"] });
    },
  });
};

export const useDeleteShort = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.deleteShortHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["shorts"] });
    },
  });
};
