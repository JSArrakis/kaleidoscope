import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetAllCollections = () => {
  return useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      return await window.electron.getCollectionsHandler();
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    retry: 3,
  });
};

export const useCreateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismCurationObj
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.createCollectionHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["movies"] });
    },
  });
};

export const useDeleteCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismCurationObj
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.deleteCollectionHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["movies"] });
    },
  });
};

export const useUpdateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismCurationObj
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.updateCollectionHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["movies"] });
    },
  });
};
