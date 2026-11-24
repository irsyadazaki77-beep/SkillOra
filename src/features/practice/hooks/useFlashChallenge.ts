import { useState } from "react";
import { courseApi } from "../../../api/apiClient";
import { triggerConfetti } from "../../../utils/confetti";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/queryKeys";
import { Profile } from "../../../types";

export function useFlashChallenge() {
  const queryClient = useQueryClient();
  const [activeFlashChallenge, setActiveFlashChallenge] = useState<{
    question: string;
    options: string[];
    correctIdx: number;
    rewardXP: number;
    rewardGems: number;
    explanation: string;
  } | null>(null);
  const [selectedFlashOption, setSelectedFlashOption] = useState<number | null>(null);
  const [flashResult, setFlashResult] = useState<string | null>(null);
  const [flashRewardClaimed, setFlashRewardClaimed] = useState(false);

  const handleGetFlashChallenge = async () => {
    setSelectedFlashOption(null);
    setFlashResult(null);
    setFlashRewardClaimed(false);
    try {
      const data = await courseApi.getFlashChallenge();
      setActiveFlashChallenge(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnswerFlashChallenge = (index: number) => {
    if (!activeFlashChallenge || flashResult) return;
    setSelectedFlashOption(index);
    const correct = index === activeFlashChallenge.correctIdx;
    
    if (correct) {
      setFlashResult("LULUS");
      triggerConfetti("quiz");
      queryClient.setQueryData<Profile | null>(queryKeys.user.profile(), (prev) => {
        if (!prev) return null;
        return {
          ...prev,
          xp: prev.xp + activeFlashChallenge.rewardXP,
          gems: prev.gems + activeFlashChallenge.rewardGems
        };
      });
      setFlashRewardClaimed(true);
    } else {
      setFlashResult("GAGAL");
    }
  };

  const closeFlashChallenge = () => {
    setActiveFlashChallenge(null);
  };

  return {
    activeFlashChallenge,
    selectedFlashOption,
    flashResult,
    flashRewardClaimed,
    handleGetFlashChallenge,
    handleAnswerFlashChallenge,
    closeFlashChallenge
  };
}
