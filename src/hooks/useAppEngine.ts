import { useProfileQuery } from "./queries/useProfileQuery";
import { useCoursesQuery } from "./queries/useCoursesQuery";
import { useNotificationsQuery } from "./queries/useNotificationsQuery";
import { useJobsQuery } from "./queries/useJobsQuery";
import { useForumQuery } from "./queries/useForumQuery";
import { useCollaborationQuery } from "./queries/useCollaborationQuery";
import { useProjectReviewsQuery } from "./queries/useProjectReviewsQuery";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { Profile, Course, CollabRoom, JobVacancy, SystemNotification, MentorReview } from "../types";
import type { ForumPost } from "../components/ForumView";

/**
 * Domain-orchestrated App Data Flow Hook
 * Backed by TanStack Query cache with zero localStorage state duplication or aggressive polling.
 */
export function useAppEngine(isLoggedIn: boolean, pathname: string = "/belajar") {
  const queryClient = useQueryClient();

  const shouldLoadJobs =
    isLoggedIn && (pathname.startsWith("/karier") || pathname.startsWith("/karir") || pathname.startsWith("/bursa-kerja"));
  const shouldLoadForum =
    isLoggedIn && (pathname === "/komunitas" || pathname.startsWith("/forum"));
  const shouldLoadCollab =
    isLoggedIn && (pathname.startsWith("/komunitas/kolaborasi") || pathname.startsWith("/kolaborasi"));
  const shouldLoadReviews =
    isLoggedIn &&
    (pathname === "/" ||
      pathname.startsWith("/belajar") ||
      pathname.startsWith("/sertifikasi") ||
      pathname.startsWith("/profil"));

  const profileQuery = useProfileQuery(isLoggedIn);
  const coursesQuery = useCoursesQuery(isLoggedIn);
  const notificationsQuery = useNotificationsQuery(isLoggedIn);
  const jobsQuery = useJobsQuery(shouldLoadJobs);
  const forumQuery = useForumQuery(shouldLoadForum);
  const collabQuery = useCollaborationQuery(shouldLoadCollab);
  const reviewsQuery = useProjectReviewsQuery(shouldLoadReviews);

  // Overall initial loading state
  const loading = isLoggedIn && profileQuery.isLoading && !profileQuery.profile;

  // Granular cache setters for direct updates
  const setProfile = (newProfile: Profile | null | ((prev: Profile | null) => Profile | null)) => {
    if (typeof newProfile === "function") {
      queryClient.setQueryData<Profile | null>(queryKeys.user.profile(), (old) => newProfile(old ?? null));
    } else {
      queryClient.setQueryData(queryKeys.user.profile(), newProfile);
    }
  };

  const setCourses = (newCourses: Course[] | ((prev: Course[]) => Course[])) => {
    if (typeof newCourses === "function") {
      queryClient.setQueryData<Course[]>(queryKeys.courses.list(), (old) => newCourses(old ?? []));
    } else {
      queryClient.setQueryData(queryKeys.courses.list(), newCourses);
    }
  };

  const setNotifications = (newNotifications: SystemNotification[] | ((prev: SystemNotification[]) => SystemNotification[])) => {
    if (typeof newNotifications === "function") {
      queryClient.setQueryData<SystemNotification[]>(queryKeys.notifications.list(), (old) => newNotifications(old ?? []));
    } else {
      queryClient.setQueryData(queryKeys.notifications.list(), newNotifications);
    }
  };

  const setJobs = (newJobs: JobVacancy[] | ((prev: JobVacancy[]) => JobVacancy[])) => {
    if (typeof newJobs === "function") {
      queryClient.setQueryData<JobVacancy[]>(queryKeys.jobs.list(), (old) => newJobs(old ?? []));
    } else {
      queryClient.setQueryData(queryKeys.jobs.list(), newJobs);
    }
  };

  const setRooms = (newRooms: CollabRoom[] | ((prev: CollabRoom[]) => CollabRoom[])) => {
    if (typeof newRooms === "function") {
      queryClient.setQueryData<CollabRoom[]>(queryKeys.collaboration.rooms(), (old) => newRooms(old ?? []));
    } else {
      queryClient.setQueryData(queryKeys.collaboration.rooms(), newRooms);
    }
  };

  const setForumPosts = (newPosts: ForumPost[] | ((prev: ForumPost[]) => ForumPost[])) => {
    if (typeof newPosts === "function") {
      queryClient.setQueryData<ForumPost[]>(queryKeys.forum.posts(), (old) => newPosts(old ?? []));
    } else {
      queryClient.setQueryData(queryKeys.forum.posts(), newPosts);
    }
  };

  const setReviews = (newReviews: Record<string, MentorReview> | ((prev: Record<string, MentorReview>) => Record<string, MentorReview>)) => {
    if (typeof newReviews === "function") {
      queryClient.setQueryData<Record<string, MentorReview>>(queryKeys.projects.reviews(), (old) => newReviews(old ?? {}));
    } else {
      queryClient.setQueryData(queryKeys.projects.reviews(), newReviews);
    }
  };

  const loadData = async () => {
    await queryClient.invalidateQueries({ refetchType: "active" });
  };

  return {
    profile: profileQuery.profile,
    setProfile,
    courses: coursesQuery.courses,
    setCourses,
    notifications: notificationsQuery.notifications,
    setNotifications,
    unreadNotificationsCount: notificationsQuery.unreadCount,
    jobs: jobsQuery.jobs,
    setJobs,
    rooms: collabQuery.rooms,
    setRooms,
    forumPosts: forumQuery.forumPosts,
    setForumPosts,
    reviews: reviewsQuery.reviews,
    setReviews,
    loading,
    setLoading: () => {},
    loadData,
    // Direct domain hooks & mutations
    profileQuery,
    coursesQuery,
    notificationsQuery,
    jobsQuery,
    forumQuery,
    collabQuery,
    reviewsQuery,
  };
}
