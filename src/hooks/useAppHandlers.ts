import { useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import {
  Profile,
  Course,
  CollabRoom,
  JobVacancy,
  SystemNotification,
  Lesson,
  MentorReview,
} from "../types";
import type { ForumPost } from "../components/ForumView";
import { courseApi, jobApi, forumApi, notificationApi, aiApi, apiClient } from "../api/apiClient";

export interface FlashChallengeData {
  question: string;
  options: string[];
  correctIdx: number;
  rewardXP: number;
  rewardGems: number;
  explanation: string;
}

interface UseAppHandlersParams {
  profile: Profile | null;
  setProfile: (val: Profile | null | ((prev: Profile | null) => Profile | null)) => void;
  setJobs: (val: JobVacancy[] | ((prev: JobVacancy[]) => JobVacancy[])) => void;
  setRooms: (val: CollabRoom[] | ((prev: CollabRoom[]) => CollabRoom[])) => void;
  setNotifications: (val: SystemNotification[] | ((prev: SystemNotification[]) => SystemNotification[])) => void;
  setForumPosts: (val: ForumPost[] | ((prev: ForumPost[]) => ForumPost[])) => void;
  setReviews: (val: Record<string, MentorReview> | ((prev: Record<string, MentorReview>) => Record<string, MentorReview>)) => void;
  loadData: () => Promise<void>;
  navigate: NavigateFunction;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

export async function triggerConfetti(type: "level" | "quiz" | "certification") {
  const confetti = (await import("canvas-confetti")).default;
  if (type === "level") {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
  } else if (type === "quiz") {
    confetti({ particleCount: 80, spread: 50, colors: ["#a3e635", "#22c55e", "#eab308"] });
  } else {
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors: ["#3b82f6", "#10b981", "#eab308"] });
  }
}

export function useAppHandlers({
  profile,
  setProfile,
  setJobs,
  setRooms,
  setNotifications,
  setForumPosts,
  setReviews,
  loadData,
  navigate,
  showToast,
}: UseAppHandlersParams) {
  const [currentQuizCourse, setCurrentQuizCourse] = useState<Course | null>(null);
  const [currentQuizLesson, setCurrentQuizLesson] = useState<Lesson | null>(null);

  const [projectUrl, setProjectUrl] = useState("");
  const [studentCodeNotes, setStudentCodeNotes] = useState("");
  const [submittingProject, setSubmittingProject] = useState(false);
  const [projectBoilerplate, setProjectBoilerplate] = useState<string | null>(null);
  const [loadingBoilerplate, setLoadingBoilerplate] = useState(false);

  const [chatMessage, setChatMessage] = useState("");
  const [newSkillName, setNewSkillName] = useState("");
  const [showAddSkillForm, setShowAddSkillForm] = useState(false);

  const [activeInterviewJob, setActiveInterviewJob] = useState<JobVacancy | null>(null);
  const [interviewChat, setInterviewChat] = useState<{ sender: "user" | "hr"; text: string }[]>([]);
  const [interviewInput, setInterviewInput] = useState("");
  const [loadingInterview, setLoadingInterview] = useState(false);

  const [activeFlashChallenge, setActiveFlashChallenge] = useState<FlashChallengeData | null>(null);
  const [selectedFlashOption, setSelectedFlashOption] = useState<number | null>(null);
  const [flashResult, setFlashResult] = useState<string | null>(null);

  const handleClaimDaily = async () => {
    try {
      const data = await apiClient.post("/user/claim-daily");
      setProfile(data.profile);
      triggerConfetti("level");
      const rxp = data.rewardXp ?? 20;
      const rgems = data.rewardGems ?? 15;
      showToast(`Hadiah harian berhasil diklaim! +${rxp} XP & +${rgems} Gems!`, "success");
      const nData = await apiClient.get("/notifications");
      setNotifications(nData);
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "Gagal mengklaim hadiah harian.", "error");
    }
  };

  const handleCreateForumPost = async (title: string, content: string, tags: string[]) => {
    try {
      const data = await apiClient.post("/forum", { title, content, tags });
      setForumPosts(data);
      showToast("Postingan forum berhasil dibuat!", "success");
    } catch {
      showToast("Gagal membuat postingan.", "error");
    }
  };

  const handleUpvoteForumPost = async (postId: string) => {
    try {
      const data = await apiClient.post(`/forum/${postId}/upvote`);
      setForumPosts(data);
    } catch {
      // ignore upvote errors silently
    }
  };

  const handleBuyFreeze = async () => {
    try {
      const data = await apiClient.post("/user/buy-freeze");
      setProfile(data.profile);
      triggerConfetti("level");
      showToast("Berhasil mengaktifkan perlindungan Streak Freeze!", "success");
      const nData = await apiClient.get("/notifications");
      setNotifications(nData);
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "Gagal membeli Streak Freeze.", "error");
    }
  };

  const handleBuyItem = async (itemId: string) => {
    try {
      const data = await apiClient.post("/user/buy-item", { itemId });
      setProfile(data.profile);
      triggerConfetti("quiz");
      showToast("Berhasil membeli item toko!", "success");
      const nData = await apiClient.get("/notifications");
      setNotifications(nData);
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "Gagal membeli item toko.", "error");
    }
  };

  const handleSetAvatar = async (avatar: string) => {
    try {
      const data = await apiClient.post("/user/set-avatar", { avatar });
      if (data?.profile) {
        setProfile(data.profile);
      }
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "Gagal mengubah avatar.", "error");
    }
  };

  const handleStartInterview = (job: JobVacancy) => {
    const candidateName = profile?.name || "Kandidat";
    setActiveInterviewJob(job);
    setInterviewChat([
      {
        sender: "hr",
        text: `Halo ${candidateName}, senang bertemu dengan Anda. Saya Ibu Riska dari ${job.company}. Terima kasih sudah melamar posisi '${job.title}' melalui sistem penyaluran otomatis Skillora. Apakah Anda siap memulai simulasi wawancara teknis singkat hari ini?`,
      },
    ]);
  };

  const handleSendInterviewMessage = async () => {
    if (!interviewInput.trim() || loadingInterview || !activeInterviewJob) return;
    const userMsg = interviewInput;
    setInterviewChat((prev) => [...prev, { sender: "user", text: userMsg }]);
    setInterviewInput("");
    setLoadingInterview(true);
    try {
      const data = await apiClient.post("/jobs/interview", { jobId: activeInterviewJob.id, message: userMsg });
      setInterviewChat((prev) => [...prev, { sender: "hr", text: data.response }]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInterview(false);
    }
  };

  const handleGetProjectAssist = async (courseId: string) => {
    setLoadingBoilerplate(true);
    setProjectBoilerplate(null);
    try {
      const data = await apiClient.post("/project/assist", { courseId });
      setProjectBoilerplate(data.template);
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "Gagal membuat starter guide proyek.", "error");
    } finally {
      setLoadingBoilerplate(false);
    }
  };

  const handleGetFlashChallenge = async () => {
    setSelectedFlashOption(null);
    setFlashResult(null);
    try {
      const data = await courseApi.getFlashChallenge();
      setActiveFlashChallenge(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnswerFlashChallenge = async (index: number) => {
    if (!activeFlashChallenge || flashResult) return;
    setSelectedFlashOption(index);
    const correct = index === activeFlashChallenge.correctIdx;
    if (correct) {
      setFlashResult("LULUS");
      triggerConfetti("quiz");
      try {
        const res = await courseApi.claimFlashChallenge(index);
        if (res?.profile) {
          setProfile(res.profile);
        }
        if (res?.alreadyClaimed) {
          showToast("Jawaban benar! Hadiah Flash Challenge hari ini sudah pernah diklaim.", "info");
        } else {
          showToast(
            `Jawaban benar! +${res?.rewardXP ?? activeFlashChallenge.rewardXP} XP & +${res?.rewardGems ?? activeFlashChallenge.rewardGems} Gems!`,
            "success"
          );
        }
      } catch (err: any) {
        showToast(err?.message || "Jawaban benar, namun gagal menyimpan hadiah ke server.", "info");
      }
    } else {
      setFlashResult("ULANG");
    }
  };

  const handleBookmarkCourse = async (courseId: string) => {
    if (!profile) return;
    const currentBookmarks = profile.bookmarkedCourses || [];
    const isBookmarked = currentBookmarks.includes(courseId);
    const updatedBookmarks = isBookmarked
      ? currentBookmarks.filter((id) => id !== courseId)
      : [...currentBookmarks, courseId];

    showToast(isBookmarked ? "Kursus dihapus dari daftar simpan." : "Kursus berhasil disimpan!", isBookmarked ? "info" : "success");
    setProfile((prev) => (prev ? { ...prev, bookmarkedCourses: updatedBookmarks } : null));

    try {
      await apiClient.post("/user/bookmark-course", { courseId });
    } catch (e) {
      console.error("Gagal menyimpan bookmark ke server:", e);
    }
  };

  const handleBookmarkJob = async (jobId: string) => {
    const previousProfile = profile;
    if (profile) {
      const currentBookmarks = profile.bookmarkedJobs || [];
      const isBookmarked = currentBookmarks.includes(jobId);
      const newBookmarks = isBookmarked
        ? currentBookmarks.filter((id) => id !== jobId)
        : [...currentBookmarks, jobId];
      setProfile({ ...profile, bookmarkedJobs: newBookmarks });
    }

    try {
      const data = await apiClient.post("/jobs/bookmark", { jobId });
      if (data?.profile) {
        setProfile(data.profile);
        showToast(
          data.profile.bookmarkedJobs?.includes(jobId) ? "Pekerjaan disimpan!" : "Pekerjaan dihapus dari simpanan.",
          "success"
        );
      }
    } catch {
      if (previousProfile) setProfile(previousProfile);
      showToast("Gagal menyimpan pekerjaan", "error");
    }
  };

  const handleAddSkillSubmit = async () => {
    if (!newSkillName.trim()) return;
    try {
      const data = await apiClient.post("/user/add-skill", { skillName: newSkillName });
      if (data?.profile) {
        setProfile(data.profile);
        setNewSkillName("");
        setShowAddSkillForm(false);
        const jobsData = await apiClient.get("/jobs");
        setJobs(jobsData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startQuiz = (course: Course, lesson: Lesson) => {
    setCurrentQuizCourse(course);
    setCurrentQuizLesson(lesson);
    navigate(`/belajar/kursus/${course.id}/latihan/${lesson.id}`);
  };

  const handleProjectSubmit = async (courseId: string) => {
    if (!projectUrl.trim()) return;
    setSubmittingProject(true);
    try {
      const data = await aiApi.submitProject(courseId, projectUrl, studentCodeNotes);
      if (data?.review) {
        setReviews((prev) => ({ ...prev, [courseId]: data.review }));
        setProfile(data.profile);
        triggerConfetti("certification");
        setProjectUrl("");
        setStudentCodeNotes("");
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleSendMessage = async (roomId: string) => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatMessage("");
    try {
      const data = await forumApi.postChat(roomId, userMsg);
      if (data?.messages) {
        setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, chat: data.messages } : r)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveTask = async (
    roomId: string,
    taskId: string,
    newStatus: "todo" | "in-progress" | "review" | "done"
  ) => {
    try {
      const data = await apiClient.post("/collaboration/task-status", { roomId, taskId, status: newStatus });
      if (data?.tasks) {
        setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, tasks: data.tasks } : r)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCollabProjectSubmit = async (roomId: string, url: string) => {
    try {
      const data = await apiClient.post("/collaboration/submit-project", { roomId, projectUrl: url });
      if (data) {
        setRooms((prev) =>
          prev.map((r) => (r.id === roomId ? { ...r, status: "Menunggu Penilaian AI Mentor", projectUrl: url } : r))
        );
        setTimeout(() => {
          loadData();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyJob = async (jobId: string, cvDocumentId?: number | null, coverNote?: string) => {
    try {
      const data = await jobApi.applyJob(jobId, cvDocumentId, coverNote);
      if (data?.job) {
        setJobs((prev) => prev.map((j) => (j.id === jobId ? data.job : j)));
        setProfile(data.profile);
        triggerConfetti("certification");
        showToast("Lamaran berhasil dikirim!", "success");
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || "Gagal mengirim lamaran.";
      showToast(msg, "error");
    }
  };

  const handleClearNotifications = async () => {
    try {
      await notificationApi.clearNotifications();
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  return {
    currentQuizCourse,
    currentQuizLesson,
    projectUrl,
    setProjectUrl,
    studentCodeNotes,
    setStudentCodeNotes,
    submittingProject,
    projectBoilerplate,
    setProjectBoilerplate,
    loadingBoilerplate,
    chatMessage,
    setChatMessage,
    newSkillName,
    setNewSkillName,
    showAddSkillForm,
    setShowAddSkillForm,
    activeInterviewJob,
    setActiveInterviewJob,
    interviewChat,
    interviewInput,
    setInterviewInput,
    loadingInterview,
    activeFlashChallenge,
    setActiveFlashChallenge,
    selectedFlashOption,
    flashResult,
    handleClaimDaily,
    handleCreateForumPost,
    handleUpvoteForumPost,
    handleBuyFreeze,
    handleBuyItem,
    handleSetAvatar,
    handleStartInterview,
    handleSendInterviewMessage,
    handleGetProjectAssist,
    handleGetFlashChallenge,
    handleAnswerFlashChallenge,
    handleBookmarkCourse,
    handleBookmarkJob,
    handleAddSkillSubmit,
    startQuiz,
    handleProjectSubmit,
    handleSendMessage,
    handleMoveTask,
    handleCollabProjectSubmit,
    handleApplyJob,
    handleClearNotifications,
  };
}
