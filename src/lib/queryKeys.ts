/**
 * Standardized Query Key Factory for Skillora
 * Ensures consistent cache keys and granular invalidation across all feature domains.
 */

export const queryKeys = {
  // User & Profile
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    stats: () => [...queryKeys.user.all, 'stats'] as const,
  },

  // Learning & Courses
  courses: {
    all: ['courses'] as const,
    list: () => [...queryKeys.courses.all, 'list'] as const,
    detail: (courseId: string) => [...queryKeys.courses.all, 'detail', courseId] as const,
    lesson: (courseId: string, lessonId: string) => [...queryKeys.courses.detail(courseId), 'lesson', lessonId] as const,
    flashChallenge: () => [...queryKeys.courses.all, 'flash-challenge'] as const,
  },

  // Career & Jobs
  jobs: {
    all: ['jobs'] as const,
    list: (filters?: { search?: string; location?: string; type?: string }) =>
      [...queryKeys.jobs.all, 'list', filters || {}] as const,
    detail: (jobId: string) => [...queryKeys.jobs.all, 'detail', jobId] as const,
  },

  // System Notifications
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
  },

  // Community & Forum
  forum: {
    all: ['forum'] as const,
    posts: (category?: string) => [...queryKeys.forum.all, 'posts', category || 'all'] as const,
    post: (postId: string) => [...queryKeys.forum.all, 'post', postId] as const,
  },

  // Collaboration Rooms
  collaboration: {
    all: ['collaboration'] as const,
    rooms: () => [...queryKeys.collaboration.all, 'rooms'] as const,
    room: (roomId: string) => [...queryKeys.collaboration.all, 'room', roomId] as const,
  },

  // Mentor & Project Reviews
  projects: {
    all: ['projects'] as const,
    reviews: () => [...queryKeys.projects.all, 'reviews'] as const,
  }
} as const;
