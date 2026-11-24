import { JobVacancy, Profile } from "../../types";

export interface CareerFilters {
  query: string;
  location: string;
  workMode: string; // remote, hybrid, on-site
  jobType: string; // full-time, part-time, internship
  level: string; // junior, mid, senior
  skill: string;
  salaryMin?: number;
  salaryMax?: number;
  sortBy: "terbaru" | "relevansi";
}

export type ApplicationStatus = "Belum Dilamar" | "Terkirim" | "Ditinjau" | "Wawancara AI" | "Interview" | "Shortlisted" | "Diterima" | "Ditolak";
