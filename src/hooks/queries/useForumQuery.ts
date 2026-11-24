import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { apiClient } from "../../api/apiClient";
import type { ForumPost } from "../../components/ForumView";

export function useForumQuery(enabled: boolean = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.forum.posts(),
    queryFn: async () => {
      const response = await apiClient.get<any>("/forum");
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.posts)) return response.posts;
      return [];
    },
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes stale time
  });

  const createPostMutation = useMutation({
    mutationFn: async (payload: { title: string; content: string; tags: string[] }) => {
      return apiClient.post<ForumPost[]>("/forum", payload);
    },
    onSuccess: (data) => {
      if (Array.isArray(data)) {
        queryClient.setQueryData(queryKeys.forum.posts(), data);
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.forum.posts() });
      }
    },
  });

  // Optimistic upvote mutation with rollback
  const upvotePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiClient.post<ForumPost[]>(`/forum/${postId}/upvote`);
    },
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.forum.posts() });
      const previousPosts = queryClient.getQueryData<ForumPost[]>(queryKeys.forum.posts());

      if (previousPosts) {
        queryClient.setQueryData<ForumPost[]>(
          queryKeys.forum.posts(),
          previousPosts.map((post) =>
            post.id === postId ? { ...post, upvotes: (post.upvotes || 0) + 1 } : post
          )
        );
      }

      return { previousPosts };
    },
    onError: (_err, _postId, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(queryKeys.forum.posts(), context.previousPosts);
      }
    },
    onSettled: (data) => {
      if (Array.isArray(data)) {
        queryClient.setQueryData(queryKeys.forum.posts(), data);
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.forum.posts() });
      }
    },
  });

  return {
    forumPosts: Array.isArray(query.data) ? query.data : [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createPost: createPostMutation.mutateAsync,
    upvotePost: upvotePostMutation.mutateAsync,
  };
}
