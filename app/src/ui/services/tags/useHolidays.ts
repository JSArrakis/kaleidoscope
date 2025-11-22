import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetAllHolidays = () => {
  return useQuery({
    queryKey: ["holidays"],
    queryFn: async () => {
      return await window.electron.getHolidaysHandler();
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    retry: 3,
  });
};

export const useCreateHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Tag
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.createHolidayHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
    },
  });
};

export const useUpdateHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Tag
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.updateHolidayHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
    },
  });
};

export const useDeleteHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Tag
    ): Promise<{ message: string; status: number }> => {
      return await window.electron.deleteHolidayHandler(body);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
    },
  });
};
