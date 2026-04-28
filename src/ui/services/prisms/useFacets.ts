import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetAllFacets = () => {
  return useQuery({
    queryKey: ["facets"],
    queryFn: async () => {
      return await window.electron.getFacetsHandler();
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
};

export const useCreateFacet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { genre: Tag | null; aesthetic: Tag | null }) => {
      return await window.electron.createFacetHandler(
        body.genre,
        body.aesthetic,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["facets"] });
    },
  });
};

export const useDeleteFacet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (facetId: string) => {
      return await window.electron.deleteFacetHandler(facetId);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["facets"] });
      queryClient.invalidateQueries({ queryKey: ["mosaics"] });
    },
  });
};

export const useAddFacetRelationship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: FacetRelationshipRequest) => {
      return await window.electron.addFacetRelationshipHandler(request);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["facets"] });
    },
  });
};

export const useDeleteFacetRelationship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: FacetRelationshipDeleteRequest) => {
      return await window.electron.deleteFacetRelationshipHandler(request);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["facets"] });
    },
  });
};
