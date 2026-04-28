import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetAllMosaics = () => {
  return useQuery({
    queryKey: ["mosaics"],
    queryFn: async () => {
      return await window.electron.getMosaicsHandler();
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
};

export const useCreateMosaic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      mosaic: Omit<Mosaic, "mosaicId" | "createdAt" | "updatedAt">,
    ) => {
      return await window.electron.createMosaicHandler(mosaic);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["mosaics"] });
    },
  });
};

export const useUpdateMosaic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mosaic: Mosaic) => {
      return await window.electron.updateMosaicHandler(mosaic);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["mosaics"] });
    },
  });
};

export const useDeleteMosaic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mosaicId: string) => {
      return await window.electron.deleteMosaicHandler(mosaicId);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["mosaics"] });
    },
  });
};
