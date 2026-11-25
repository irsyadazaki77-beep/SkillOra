import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../api/apiClient";
import { queryKeys } from "../../../lib/queryKeys";

export function useCareerActions() {
  const queryClient = useQueryClient();

  const applyJob = async (jobId: string) => {
    const data = await apiClient.post("/jobs/apply", { jobId });
    // Invalidate jobs to update hasApplied status
    queryClient.invalidateQueries({ queryKey: queryKeys.jobs.list() });
    return data;
  };

  
  const bookmarkJob = async (jobId: string) => {
    const data = await apiClient.post("/jobs/bookmark", { jobId });
    queryClient.invalidateQueries({ queryKey: queryKeys.jobs.list() });
    return data;
  };

  return { applyJob, bookmarkJob };
    
}
