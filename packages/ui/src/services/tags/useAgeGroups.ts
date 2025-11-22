import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetAllAgeGroups = () => {
  return useQuery({
    queryKey: ["ageGroups"],
    queryFn: async () => {
      return await window.electron.getAgeGroupsHandler();
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    retry: 3,
  });
};

export const useCreateAgeGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Tag
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.createAgeGroupHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ageGroups"] });
    },
  });
};

export const useUpdateAgeGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Tag
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.updateAgeGroupHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ageGroups"] });
    },
  });
};

export const useDeleteAgeGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Tag
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.deleteAgeGroupHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ageGroups"] });
    },
  });
};
