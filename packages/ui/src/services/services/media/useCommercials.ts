import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetAllCommercials = () => {
  return useQuery({
    queryKey: ["commercials"],
    queryFn: async () => {
      return await window.electron.getCommercialsHandler();
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    retry: 3,
  });
};

export const useCreateCommercial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.createCommercialHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["commercials"] });
    },
  });
};

export const useUpdateCommercial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.updateCommercialHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["commercials"] });
    },
  });
};

export const useDeleteCommercial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.deleteCommercialHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["commercials"] });
    },
  });
};
