import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../api/apiClient";
import { queryKeys } from "../../../lib/queryKeys";
import { triggerConfetti } from "../../../utils/confetti";
import { CollabRoom } from "../../../types";

export function useCollabActions() {
  const queryClient = useQueryClient();

  const updateRoomsCache = (newRooms: CollabRoom[]) => {
    queryClient.setQueryData(queryKeys.collaboration.rooms(), newRooms);
  };

  const createRoom = async (name: string, description: string, tags: string[], maxMembers: number) => {
    const data = await apiClient.post("/collaboration/rooms", { name, description, tags, maxMembers });
    updateRoomsCache(data.rooms);
    return data;
  };

  const submitProject = async (roomId: string, url: string) => {
    const data = await apiClient.post("/collaboration/submit-project", { roomId, projectUrl: url });
    updateRoomsCache(data.rooms);
    if (data.profile) {
      queryClient.setQueryData(queryKeys.user.profile(), data.profile);
    }
    triggerConfetti("level");
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    return data;
  };

  const sendMessage = async (roomId: string, message: string) => {
    const data = await apiClient.post("/collaboration/chat", { roomId, text: message });
    updateRoomsCache(data.rooms);
    return data;
  };

  const moveTask = async (roomId: string, taskId: string, newStatus: string) => {
    const data = await apiClient.post("/collaboration/task-status", { roomId, taskId, status: newStatus });
    updateRoomsCache(data.rooms);
    return data;
  };

  return { createRoom, submitProject, sendMessage, moveTask };
}
