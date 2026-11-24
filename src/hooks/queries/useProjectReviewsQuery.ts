import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { apiClient } from "../../api/apiClient";
import { MentorReview, Profile } from "../../types";

export function useProjectReviewsQuery(enabled: boolean = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.projects.reviews(),
    queryFn: async () => {
      const response = await apiClient.get<Record<string, MentorReview>>("/projects/reviews");
      return response || {};
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
  });

  const submitProjectMutation = useMutation({
    mutationFn: async (payload: {
      courseId: string;
      projectUrl: string;
      studentCodeNotes?: string;
    }) => {
      return apiClient.post<{
        review: MentorReview;
        profile: Profile;
      }>("/projects/submit", payload);
    },
    onSuccess: (data, variables) => {
      if (data?.review) {
        queryClient.setQueryData<Record<string, MentorReview>>(
          queryKeys.projects.reviews(),
          (prev) => ({
            ...prev,
            [variables.courseId]: data.review,
          })
        );
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.reviews() });
      }
      if (data?.profile) {
        queryClient.setQueryData(queryKeys.user.profile(), data.profile);
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
      }
    },
  });

  return {
    reviews: query.data ?? {},
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    submitProject: submitProjectMutation.mutateAsync,
  };
}
