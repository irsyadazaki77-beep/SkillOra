export const ROUTES = {
  dashboard: "/belajar", // Default dashboard/landing
  lab: {
    root: "/lab",
    detail: (id: string) => `/lab/${id}`,
  },
  arena: {
    root: "/arena",
  },
  learning: {
    root: "/belajar",
    catalog: "/belajar/katalog",
    lmsWorkspace: "/belajar/lms",
    courseDetail: (id: string) => `/belajar/kursus/${id}`,
    lessonMateri: (courseId: string, lessonId: string) => `/belajar/kursus/${courseId}/materi/${lessonId}`,
    lessonLatihan: (courseId: string, lessonId: string) => `/belajar/kursus/${courseId}/latihan/${lessonId}`,
    practice: "/belajar/latihan",
    project: "/belajar/proyek",
  },
  career: {
    root: "/karier",
    jobs: "/karier",
    simulation: "/karier/simulasi",
    adaptive: "/karier/asesmen-adaptif",
    cvBuilder: "/karier/cv-ats",
    voiceInterview: "/karier/mock-interview",
    scholarship: "/karier/beasiswa",
    mentoring: "/karier/mentoring",
    portfolio: "/karier/portofolio",
    campus: "/karier/kampus",
  },
  publicPortfolio: (slug: string) => `/portfolio/${slug}`,
  community: {
    root: "/komunitas",
    forum: "/komunitas",
    collaboration: "/komunitas/kolaborasi",
    event: "/komunitas/event",
  },
  profile: {
    root: "/profil",
    analytics: "/profil/analitik",
    shop: "/profil/toko",
  },
  mentor: {
    root: "/portal-mentor",
  },
  recruiter: {
    root: "/portal-hrd",
  },
  upgrade: "/pusat-upgrade",
  lms: "/kelola-lms",
  faq: "/faq",
  brand: "/brand",
};
