import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { apiClient } from "../../api/apiClient";
import { CollabRoom } from "../../types";

export function useCollaborationQuery(enabled: boolean = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.collaboration.rooms(),
    queryFn: async () => {
      const response = await apiClient.get<any>("/collaboration/rooms");
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.rooms)) return response.rooms;
      return [];
    },
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes stale time
  });

  const sendChatMutation = useMutation({
    mutationFn: async ({ roomId, text }: { roomId: string; text: string }) => {
      return apiClient.post<{ messages: any[] }>("/collaboration/chat", { roomId, text });
    },
    onSuccess: (data, variables) => {
      if (data?.messages) {
        queryClient.setQueryData<CollabRoom[]>(queryKeys.collaboration.rooms(), (prev) => {
          if (!prev) return [];
          return prev.map((room) =>
            room.id === variables.roomId ? { ...room, messages: data.messages } : room
          );
        });
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.collaboration.rooms() });
      }
    },
  });

  return {
    rooms: Array.isArray(query.data) ? query.data : [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    sendChat: sendChatMutation.mutateAsync,
  };
}
