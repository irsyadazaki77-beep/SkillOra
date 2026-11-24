import { useState } from "react";
import { aiApi } from "../../../api/apiClient";
import { JobVacancy } from "../../../types";

export function useInterviewSimulation() {
  const [activeInterviewJob, setActiveInterviewJob] = useState<JobVacancy | null>(null);
  const [interviewChat, setInterviewChat] = useState<{ sender: "user" | "hr"; text: string }[]>([]);
  const [interviewInput, setInterviewInput] = useState("");
  const [loadingInterview, setLoadingInterview] = useState(false);

  const startInterview = (job: JobVacancy) => {
    setActiveInterviewJob(job);
    setInterviewChat([
      { sender: "hr", text: `Halo! Saya HR dari ${job.company}. Kita akan memulai wawancara simulasi untuk posisi ${job.title}. Ceritakan sedikit tentang diri Anda dan mengapa Anda tertarik dengan posisi ini?` }
    ]);
  };

  const closeInterview = () => {
    setActiveInterviewJob(null);
    setInterviewChat([]);
    setInterviewInput("");
  };

  const sendInterviewMessage = async () => {
    if (!interviewInput.trim() || !activeInterviewJob) return;
    const userMessage = interviewInput.trim();
    const newChat = [...interviewChat, { sender: "user" as const, text: userMessage }];
    setInterviewChat(newChat);
    setInterviewInput("");
    setLoadingInterview(true);
    try {
      const data = await aiApi.hrInterview(activeInterviewJob.id, userMessage);
      setInterviewChat([...newChat, { sender: "hr", text: data.response }]);
    } catch (error) {
      console.error(error);
      setInterviewChat([...newChat, { sender: "hr", text: "Maaf, terjadi gangguan jaringan. Silakan coba lagi." }]);
    } finally {
      setLoadingInterview(false);
    }
  };

  return {
    activeInterviewJob,
    interviewChat,
    interviewInput,
    setInterviewInput,
    loadingInterview,
    startInterview,
    closeInterview,
    sendInterviewMessage,
  };
}
