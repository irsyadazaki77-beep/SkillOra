import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../api/apiClient";
import { queryKeys } from "../../../lib/queryKeys";
import { Profile } from "../../../types";
import { triggerConfetti } from "../../../utils/confetti";

export function useUserActions() {
  const queryClient = useQueryClient();

  const updateProfileCache = (profile: Profile) => {
    queryClient.setQueryData(queryKeys.user.profile(), profile);
  };

  const claimDaily = async () => {
    const data = await apiClient.post("/user/claim-daily");
    if (data.profile) updateProfileCache(data.profile);
    triggerConfetti("level");
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    return data;
  };

  const buyFreeze = async () => {
    const data = await apiClient.post("/user/buy-freeze");
    if (data.profile) updateProfileCache(data.profile);
    triggerConfetti("level");
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    return data;
  };

  const buyItem = async (itemId: string) => {
    const data = await apiClient.post("/user/buy-item", { itemId });
    if (data.profile) updateProfileCache(data.profile);
    triggerConfetti("quiz");
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    return data;
  };

  const setAvatar = async (avatar: string) => {
    const data = await apiClient.post("/user/set-avatar", { avatar });
    if (data.profile) updateProfileCache(data.profile);
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    return data;
  };

  return { claimDaily, buyFreeze, buyItem, setAvatar };
}
