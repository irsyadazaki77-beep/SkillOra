import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { apiClient } from "../../api/apiClient";
import { Course, Profile } from "../../types";

export function useCoursesQuery(enabled: boolean = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.courses.list(),
    queryFn: async () => {
      const response = await apiClient.get<any>("/courses");
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.courses)) return response.courses;
      return [];
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
  });

  const completeLessonMutation = useMutation({
    mutationFn: async (payload: {
      courseId: string;
      lessonId: string;
      xpEarned: number;
      maxScore?: number;
      wrongAnswers?: any[];
      hintUsed?: boolean;
      difficulty?: string;
    }) => {
      return apiClient.post<{
        profile: Profile;
        courses: Course[];
        leveledUp: boolean;
        course?: any;
      }>("/courses/complete-lesson", payload);
    },
    onSuccess: (data) => {
      if (data?.courses) {
        queryClient.setQueryData(queryKeys.courses.list(), data.courses);
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.list() });
      }
      if (data?.profile) {
        queryClient.setQueryData(queryKeys.user.profile(), data.profile);
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
      }
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (courseData: Partial<Course>) => {
      return apiClient.post<Course>("/courses", courseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.list() });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Course> }) => {
      return apiClient.put<Course>(`/courses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.list() });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete<any>(`/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.list() });
    },
  });

  return {
    courses: Array.isArray(query.data) ? query.data : [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    completeLesson: completeLessonMutation.mutateAsync,
    createCourse: createCourseMutation.mutateAsync,
    updateCourse: updateCourseMutation.mutateAsync,
    deleteCourse: deleteCourseMutation.mutateAsync,
  };
}
