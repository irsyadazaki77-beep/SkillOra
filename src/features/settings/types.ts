import { Profile, Course, MentorReview } from "../../types";

export type SettingsSection = "profile" | "security" | "mentor" | "notifications" | "appearance" | "developer";

export interface SettingsViewProps {
  profile: Profile;
  onSettingsSaved: (updatedProfile: Profile) => void;
  onDevAction?: (data: { profile: Profile; courses?: Course[]; reviews?: Record<string, MentorReview> }) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}
