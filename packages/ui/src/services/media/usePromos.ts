import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetAllPromos = () => {
  return useQuery({
    queryKey: ["promos"],
    queryFn: async () => {
      return await window.electron.getPromosHandler();
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    retry: 3,
  });
};

export const useCreatePromo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.createPromoHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["promos"] });
    },
  });
};

export const useUpdatePromo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.updatePromoHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["promos"] });
    },
  });
};

export const useDeletePromo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.deletePromoHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["promos"] });
    },
  });
};
