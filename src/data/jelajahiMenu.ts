import { 
  Users, 
  ShoppingBag, 
  Briefcase, 
  TrendingUp, 
  MessageSquare,
  BookOpen,
  Award,
  Sparkles,
  Brain,
  FileText,
  Mic,
  Crown
} from "lucide-react";

export const features = [
    {
      id: "karier/asesmen-adaptif",
      title: "Asesmen AI Adaptif (CAT)",
      description: "Tes kemampuan adaptif berjenjang level 1-5 yang menyesuaikan tingkat kesulitan real-time beserta ringkasan diagnostik AI.",
      icon: Brain,
      badge: "CAT AI",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100",
      color: "from-indigo-500 to-blue-600",
      glowColor: "rgba(99, 102, 241, 0.15)",
      actionLabel: "Mulai Asesmen CAT"
    },
    {
      id: "karier/cv-ats",
      title: "CV ATS Builder & Audit AI",
      description: "Susun CV terstruktur standar ATS HRD, impor sertifikat terverifikasi 1-klik, dan audit skor kata kunci terhadap lowongan target.",
      icon: FileText,
      badge: "ATS Score",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
      color: "from-emerald-500 to-teal-600",
      glowColor: "rgba(16, 185, 129, 0.15)",
      actionLabel: "Buka CV Builder"
    },
    {
      id: "karier/mock-interview",
      title: "Mock Interview Suara AI",
      description: "Latihan wawancara kerja interaktif berbasis suara real-time dengan evaluasi rubrik komunikasi, metode STAR, dan akurasi teknis.",
      icon: Mic,
      badge: "Voice Live",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-100",
      color: "from-rose-500 to-orange-600",
      glowColor: "rgba(244, 63, 94, 0.15)",
      actionLabel: "Mulai Interview Suara"
    },
    {
      id: "pusat-upgrade",
      title: "Skillora Pro & Kredit Billing",
      description: "Tingkatkan akses keanggotaan Pro, top-up paket Gems, atau beli voucher sertifikasi industri dengan pembayaran QRIS dan VA.",
      icon: Crown,
      badge: "Pro & Coins",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-100",
      color: "from-amber-500 to-yellow-600",
      glowColor: "rgba(245, 158, 11, 0.15)",
      actionLabel: "Buka Pusat Upgrade"
    },
    {
      id: "komunitas/kolaborasi",
      title: "Ruang Kolaborasi Tim",
      description: "Bergabung dengan tim belajar, berkolaborasi mengerjakan projek kloning industri lewat Kanban Board & obrolan interaktif.",
      icon: Users,
      badge: "Kerja Tim",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-100",
      color: "from-blue-500 to-indigo-600",
      glowColor: "rgba(59, 130, 246, 0.15)",
      actionLabel: "Masuk Workspace"
    },
    {
      id: "profil/toko",
      title: "Toko Reward & Gems",
      description: "Gunakan koin Gems hasil belajar untuk membeli isi ulang nyawa kuis, streak freeze pelindung harian, atau koleksi avatar keren.",
      icon: ShoppingBag,
      badge: "Avatar & Items",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
      color: "from-emerald-500 to-teal-600",
      glowColor: "rgba(16, 185, 129, 0.15)",
      actionLabel: "Buka Toko Belanja"
    },
    {
      id: "karier",
      title: "Bursa Kerja & Wawancara AI",
      description: "Lihat kecocokan kualifikasi Anda dengan lowongan mitra secara real-time, tingkatkan CV digital, dan simulasi interview HR AI.",
      icon: Briefcase,
      badge: "Karir & AI",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100",
      color: "from-indigo-500 to-purple-600",
      glowColor: "rgba(99, 102, 241, 0.15)",
      actionLabel: "Mulai Cari Kerja"
    },
    {
      id: "profil/analitik",
      title: "Analitik Progress & Liga",
      description: "Periksa visualisasi performa belajar terperinci Anda, posisi terkini di Liga Amethyst, serta koleksi sertifikat QR-Verified.",
      icon: TrendingUp,
      badge: "Statistik",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-100",
      color: "from-amber-500 to-orange-600",
      glowColor: "rgba(245, 158, 11, 0.15)",
      actionLabel: "Pantau Progress"
    },
    {
      id: "komunitas",
      title: "Forum Diskusi Komunitas",
      description: "Tanya jawab masalah coding, berbagi tips, dan ngobrol santai bersama ribuan pelajar lainnya di seluruh Indonesia.",
      icon: MessageSquare,
      badge: "Komunitas",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-100",
      color: "from-rose-500 to-pink-600",
      glowColor: "rgba(244, 63, 94, 0.15)",
      actionLabel: "Buka Forum"
    },
    {
      id: "komunitas/event",
      title: "Event & Webinar Live",
      description: "Daftar dan ikuti sesi live coding, bedah portfolio, hingga talkshow bersama expert dari industri teknologi ternama.",
      icon: BookOpen,
      badge: "Live Session",
      badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-100",
      color: "from-cyan-500 to-blue-600",
      glowColor: "rgba(6, 182, 212, 0.15)",
      actionLabel: "Lihat Jadwal"
    },
    {
      id: "karier/beasiswa",
      title: "Pusat Beasiswa & Bantuan",
      description: "Temukan peluang beasiswa bootcamp, bantuan perangkat belajar, atau pendanaan pendidikan dari berbagai mitra corporate.",
      icon: Award,
      badge: "Pendanaan",
      badgeColor: "bg-violet-50 text-violet-700 border-violet-100",
      color: "from-violet-500 to-fuchsia-600",
      glowColor: "rgba(139, 92, 246, 0.15)",
      actionLabel: "Cari Beasiswa"
    },
    {
      id: "karier/mentoring",
      title: "Mentoring 1-on-1",
      description: "Booking jadwal konsultasi karir, review code, atau bimbingan teknis secara privat dengan mentor profesional kami.",
      icon: Sparkles,
      badge: "Bimbingan",
      badgeColor: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
      color: "from-fuchsia-500 to-pink-600",
      glowColor: "rgba(217, 70, 239, 0.15)",
      actionLabel: "Booking Mentor"
    }
  ];
