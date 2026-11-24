import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { apiClient } from "../../api/apiClient";
import { Profile } from "../../types";

export function useProfileQuery(enabled: boolean = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: async () => {
      const response = await apiClient.get<Profile>("/user/profile");
      return response;
    },
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes stale time
  });

  // Direct profile setter helper (e.g. after login/sync)
  const setProfileData = (newProfile: Profile | null) => {
    queryClient.setQueryData(queryKeys.user.profile(), newProfile);
  };

  // Optimistic Bookmark Course Mutation with Rollback
  const bookmarkCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return apiClient.post<{ profile: Profile }>("/user/bookmark-course", { courseId });
    },
    onMutate: async (courseId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.user.profile() });
      const previousProfile = queryClient.getQueryData<Profile>(queryKeys.user.profile());

      if (previousProfile) {
        const bookmarks = previousProfile.bookmarkedCourses || [];
        const isBookmarked = bookmarks.includes(courseId);
        const updated = isBookmarked
          ? bookmarks.filter((id) => id !== courseId)
          : [...bookmarks, courseId];

        queryClient.setQueryData<Profile>(queryKeys.user.profile(), {
          ...previousProfile,
          bookmarkedCourses: updated,
        });
      }

      return { previousProfile };
    },
    onError: (_err, _courseId, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(queryKeys.user.profile(), context.previousProfile);
      }
    },
    onSettled: (data) => {
      if (data?.profile) {
        queryClient.setQueryData(queryKeys.user.profile(), data.profile);
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
      }
    },
  });

  // Optimistic Bookmark Job Mutation with Rollback
  const bookmarkJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiClient.post<{ profile: Profile }>("/jobs/bookmark", { jobId });
    },
    onMutate: async (jobId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.user.profile() });
      const previousProfile = queryClient.getQueryData<Profile>(queryKeys.user.profile());

      if (previousProfile) {
        const bookmarks = previousProfile.bookmarkedJobs || [];
        const isBookmarked = bookmarks.includes(jobId);
        const updated = isBookmarked
          ? bookmarks.filter((id) => id !== jobId)
          : [...bookmarks, jobId];

        queryClient.setQueryData<Profile>(queryKeys.user.profile(), {
          ...previousProfile,
          bookmarkedJobs: updated,
        });
      }

      return { previousProfile };
    },
    onError: (_err, _jobId, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(queryKeys.user.profile(), context.previousProfile);
      }
    },
    onSettled: (data) => {
      if (data?.profile) {
        queryClient.setQueryData(queryKeys.user.profile(), data.profile);
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
      }
    },
  });

  // Authoritative Gamification & Economy Mutations (wait for server response)
  const claimDailyMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post<{ profile: Profile; levelUp: boolean }>("/user/claim-daily");
    },
    onSuccess: (data) => {
      if (data?.profile) {
        queryClient.setQueryData(queryKeys.user.profile(), data.profile);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    },
  });

  const buyFreezeMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post<{ profile: Profile }>("/user/buy-freeze");
    },
    onSuccess: (data) => {
      if (data?.profile) {
        queryClient.setQueryData(queryKeys.user.profile(), data.profile);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    },
  });

  const buyItemMutation = useMutation({
    mutationFn: async (payload: { itemId: string; cost?: number; itemType?: string }) => {
      return apiClient.post<{ profile: Profile }>("/user/buy-item", payload);
    },
    onSuccess: (data) => {
      if (data?.profile) {
        queryClient.setQueryData(queryKeys.user.profile(), data.profile);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    },
  });

  const setAvatarMutation = useMutation({
    mutationFn: async (avatar: string) => {
      return apiClient.post<{ profile: Profile }>("/user/set-avatar", { avatar });
    },
    onSuccess: (data) => {
      if (data?.profile) {
        queryClient.setQueryData(queryKeys.user.profile(), data.profile);
      }
    },
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    setProfileData,
    bookmarkCourse: bookmarkCourseMutation.mutateAsync,
    bookmarkJob: bookmarkJobMutation.mutateAsync,
    claimDaily: claimDailyMutation.mutateAsync,
    buyFreeze: buyFreezeMutation.mutateAsync,
    buyItem: buyItemMutation.mutateAsync,
    setAvatar: setAvatarMutation.mutateAsync,
  };
}
