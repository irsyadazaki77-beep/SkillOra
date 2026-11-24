import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { apiClient } from "../../api/apiClient";
import { JobVacancy, Profile } from "../../types";

export function useJobsQuery(enabled: boolean = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.jobs.list(),
    queryFn: async () => {
      const response = await apiClient.get<any>("/jobs");
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.jobs)) return response.jobs;
      return [];
    },
    enabled,
    staleTime: 1000 * 60 * 3, // 3 minutes stale time
  });

  const applyJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiClient.post<{ job: JobVacancy; profile: Profile }>("/jobs/apply", { jobId });
    },
    onSuccess: (data) => {
      if (data?.profile) {
        queryClient.setQueryData(queryKeys.user.profile(), data.profile);
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.list() });
    },
  });

  return {
    jobs: Array.isArray(query.data) ? query.data : [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    applyJob: applyJobMutation.mutateAsync,
  };
}
