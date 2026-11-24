import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { apiClient } from "../../api/apiClient";
import { SystemNotification } from "../../types";

export function useNotificationsQuery(enabled: boolean = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: async () => {
      const response = await apiClient.get<any>("/notifications");
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.notifications)) return response.notifications;
      return [];
    },
    enabled,
    staleTime: 1000 * 30, // 30 seconds stale time
    refetchOnWindowFocus: true,
    // Intelligent light polling: poll every 60s only if document is visible and user is active
    refetchInterval: () => (typeof document !== "undefined" && document.visibilityState === "visible" ? 60000 : false),
  });

  // Derived unread count
  const unreadCount = useMemo(() => {
    const list = Array.isArray(query.data) ? query.data : [];
    return list.filter((n) => !n.read).length;
  }, [query.data]);

  // Optimistic Clear Notifications Mutation with Rollback
  const clearNotificationsMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post<any>("/notifications/clear");
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.list() });
      const previousNotifications = queryClient.getQueryData<SystemNotification[]>(queryKeys.notifications.list());

      // Optimistically clear notifications
      queryClient.setQueryData<SystemNotification[]>(queryKeys.notifications.list(), []);

      return { previousNotifications };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKeys.notifications.list(), context.previousNotifications);
      }
    },
    onSettled: (data) => {
      if (Array.isArray(data)) {
        queryClient.setQueryData(queryKeys.notifications.list(), data);
      } else if (data && Array.isArray((data as any).notifications)) {
        queryClient.setQueryData(queryKeys.notifications.list(), (data as any).notifications);
      } else {
        queryClient.setQueryData(queryKeys.notifications.list(), []);
      }
    },
  });

  return {
    notifications: Array.isArray(query.data) ? query.data : [],
    unreadCount,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    clearNotifications: clearNotificationsMutation.mutateAsync,
  };
}
