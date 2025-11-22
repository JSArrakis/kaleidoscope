import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetAllBumpers = () => {
  return useQuery({
    queryKey: ["bumpers"],
    queryFn: async () => {
      return await window.electron.getBumpersHandler();
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    retry: 3,
  });
};

export const useCreateBumper = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.createBumperHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bumpers"] });
    },
  });
};

export const useUpdateBumper = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.updateBumperHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bumpers"] });
    },
  });
};

export const useDeleteBumper = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.deleteBumperHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bumpers"] });
    },
  });
};
