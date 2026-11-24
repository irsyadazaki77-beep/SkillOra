import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../api/apiClient";
import { queryKeys } from "../../../lib/queryKeys";

export function useForumActions() {
  const queryClient = useQueryClient();

  const createPost = async (title: string, content: string, tags: string[]) => {
    const data = await apiClient.post("/forum", { title, content, tags });
    queryClient.setQueryData(queryKeys.forum.posts(), data);
    return data;
  };

  const upvotePost = async (postId: string) => {
    const data = await apiClient.post(`/forum/${postId}/upvote`);
    queryClient.setQueryData(queryKeys.forum.posts(), data);
    return data;
  };

  return { createPost, upvotePost };
}
