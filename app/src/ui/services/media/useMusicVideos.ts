import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetAllMusicVideos = () => {
  return useQuery({
    queryKey: ["music"],
    queryFn: async () => {
      return await window.electron.getMusicHandler();
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    retry: 3,
  });
};

export const useCreateMusicVideo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.createMusicHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["music"] });
    },
  });
};

export const useUpdateMusicVideo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.updateMusicHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["music"] });
    },
  });
};

export const useDeleteMusicVideo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: PrismMediaItem
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.deleteMusicHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["music"] });
    },
  });
};
