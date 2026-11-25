import { db } from "../../db/index.ts";
import {
  courses,
  lessons,
  companies,
  jobs,
  questionsBank,
  forumPosts,
  forumReplies,
  collabRooms,
  collabTasks,
  collabMessages,
  mentoringSlots,
  scholarships,
  events,
  labChallenges,
  campusCohorts,
  learningPaths,
  learningPathCourses,
} from "../../db/schema.ts";
import { defaultCourses } from "../data/coursesData.ts";
import {
  COURSE_ENRICHMENTS,
  NEW_INDUSTRY_COURSES,
  NEW_INTERACTIVE_LABS,
  buildEnrichedLessonAssets,
} from "../data/trainingExpansionData.ts";
import { count, eq } from "drizzle-orm";

let seedPromise: Promise<void> | null = null;

function mapCourseImage(courseId: string): string {
  if (courseId.includes("bumn") || courseId.includes("finance") || courseId.includes("hr") || courseId.includes("management") || courseId.includes("business")) {
    return "/src/assets/images/course_bumn_prep_1794974023438.jpg";
  }
  return "/src/assets/images/course_tech_engineering_1794974031663.jpg";
}

export async function ensureSeeded(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = runSeed().catch((err) => {
    seedPromise = null;
    console.error("Seed error:", err);
  });
  return seedPromise;
}

async function runSeed() {
  // 1. Idempotent Upsert of All 16 Enriched Training Courses, Lessons, Inline Checks & Flashcards
  const allSeedCourses: any[] = [...defaultCourses, ...NEW_INDUSTRY_COURSES];
  for (const item of allSeedCourses) {
    const enrichment = COURSE_ENRICHMENTS[item.id];
    const resolvedImage = enrichment?.image || (item as any).image || mapCourseImage(item.id);
    const resolvedLabs = enrichment?.linkedLabIds || (item as any).linkedLabIds || [];
    const resolvedCasePrompt = enrichment?.casePrompt || (item as any).casePrompt || null;

    const [upsertedCourse] = await db
      .insert(courses)
      .values({
        courseId: item.id,
        title: item.title,
        description: (item as any).description || item.title,
        category: (item as any).category || "Teknologi & Data",
        difficulty: item.difficulty,
        duration: item.duration,
        xpReward: item.xpReward,
        partner: item.partner,
        logo: item.logo || "🎓",
        image: resolvedImage,
        skills: item.skills || [],
        projectTitle: item.project?.title || "Proyek Portofolio Akhir",
        projectDescription: item.project?.description || "Selesaikan proyek industri terverifikasi.",
        projectRubric: item.project?.rubric || "Kualitas arsitektur, kebersihan kode, dan pemenuhan studi kasus.",
        linkedLabIds: resolvedLabs,
        casePrompt: resolvedCasePrompt,
        status: "published",
        isProOnly: false,
      })
      .onConflictDoUpdate({
        target: courses.courseId,
        set: {
          image: resolvedImage,
          skills: item.skills || [],
          linkedLabIds: resolvedLabs,
          casePrompt: resolvedCasePrompt,
          projectTitle: item.project?.title || "Proyek Portofolio Akhir",
          projectDescription: item.project?.description || "Selesaikan proyek industri terverifikasi.",
          projectRubric: item.project?.rubric || "Kualitas arsitektur, kebersihan kode, dan pemenuhan studi kasus.",
        },
      })
      .returning();

    const targetCourseId = upsertedCourse?.id;
    if (!targetCourseId) continue;

    const combinedLessons: any[] = [
      ...(Array.isArray(item.lessons) ? item.lessons : []),
      ...(Array.isArray(enrichment?.extraLessons) ? enrichment.extraLessons : []),
    ];

    let idx = 0;
    for (const les of combinedLessons) {
      const mdContent =
        typeof les.contentMarkdown === "string" && les.contentMarkdown.trim()
          ? les.contentMarkdown
          : Array.isArray((les as any).contentBlocks)
            ? (les as any).contentBlocks.map((b: any) => b.content).join("\n\n")
            : (les as any).notes || `Materi pembelajaran terstruktur untuk ${les.title}.`;

      const { inlineChecks, flashcards } = buildEnrichedLessonAssets(
        item.id,
        item.skills || [],
        les,
        idx
      );

      await db
        .insert(lessons)
        .values({
          lessonId: les.id,
          courseId: targetCourseId,
          title: les.title,
          type: "quiz",
          orderIndex: idx,
          xpReward: les.xp || 120,
          contentMarkdown: mdContent,
          estimatedMinutes: (les as any).estimatedMinutes || 18,
          questionsData: les.questions || [],
          inlineChecks,
          flashcards,
        })
        .onConflictDoUpdate({
          target: lessons.lessonId,
          set: {
            orderIndex: idx,
            contentMarkdown: mdContent,
            estimatedMinutes: (les as any).estimatedMinutes || 18,
            questionsData: les.questions || [],
            inlineChecks,
            flashcards,
          },
        });
      idx++;
    }
  }

  // 2. Seed Companies & Jobs
  const [{ value: jobCount }] = await db.select({ value: count() }).from(jobs);
  if (Number(jobCount) === 0) {
    const insertedCompanies = await db
      .insert(companies)
      .values([
        {
          name: "Tokopedia",
          industry: "E-Commerce & Marketplace",
          logo: "🟢",
          location: "Jakarta (Hybrid)",
          description: "Perusahaan teknologi e-commerce terbesar di Indonesia.",
          verified: true,
          ownerUid: "system-partner-tokopedia",
        },
        {
          name: "GoTo Financial",
          industry: "Fintech & Digital Payments",
          logo: "💠",
          location: "Jakarta (WFO)",
          description: "Ekosistem layanan keuangan digital terkemuka di Asia Tenggara.",
          verified: true,
          ownerUid: "system-partner-goto",
        },
        {
          name: "Telkom Indonesia",
          industry: "BUMN Telekomunikasi & Digital",
          logo: "🔴",
          location: "Bandung (Hybrid)",
          description: "BUMN penyedia infrastruktur dan layanan digital nasional.",
          verified: true,
          ownerUid: "system-partner-telkom",
        },
        {
          name: "Traveloka",
          industry: "Travel & Lifestyle Tech",
          logo: "🔵",
          location: "Tangerang (Hybrid)",
          description: "Platform perjalanan dan gaya hidup digital Asia Tenggara.",
          verified: true,
          ownerUid: "system-partner-traveloka",
        },
        {
          name: "Bank Mandiri",
          industry: "BUMN Perbankan",
          logo: "🏦",
          location: "Jakarta (WFO)",
          description: "Program Officer Development Program (ODP) & Digital Banking.",
          verified: true,
          ownerUid: "system-partner-mandiri",
        },
      ])
      .returning();

    const companyMap = new Map(insertedCompanies.map((c) => [c.name, c]));

    await db
      .insert(jobs)
      .values([
        {
          jobId: "job-1",
          companyId: companyMap.get("Tokopedia")?.id,
          companyName: "Tokopedia",
          companyLogo: "🟢",
          title: "Junior Frontend Developer (React)",
          salary: "Rp 8.500.000 - Rp 12.000.000",
          location: "Jakarta (Hybrid)",
          jobType: "Full-time",
          requiredSkills: ["React", "TypeScript", "Tailwind CSS", "JavaScript", "REST API"],
          description:
            "Bergabung dengan tim merchant platform Tokopedia untuk membangun dasbor analitik seller berperforma tinggi yang melayani jutaan UMKM Indonesia.",
          status: "active",
        },
        {
          jobId: "job-2",
          companyId: companyMap.get("GoTo Financial")?.id,
          companyName: "GoTo Financial",
          companyLogo: "💠",
          title: "Backend API Associate (Node.js & PostgreSQL)",
          salary: "Rp 9.500.000 - Rp 13.500.000",
          location: "Jakarta (WFO)",
          jobType: "Full-time",
          requiredSkills: ["Node.js", "Express", "PostgreSQL", "REST API", "JWT Auth"],
          description:
            "Merancang layanan API transaksi keuangan skala tinggi dengan audit logging ketat, optimasi kueri SQL, dan keandalan SLA 99.99%.",
          status: "active",
        },
        {
          jobId: "job-3",
          companyId: companyMap.get("Telkom Indonesia")?.id,
          companyName: "Telkom Indonesia",
          companyLogo: "🔴",
          title: "UI/UX Product Designer (Management Trainee)",
          salary: "Rp 7.500.000 - Rp 10.500.000",
          location: "Bandung (Hybrid)",
          jobType: "MT / BUMN",
          requiredSkills: ["Figma", "Design System", "Wireframing", "Core Values AKHLAK"],
          description:
            "Merancang pengalaman digital pada produk ekosistem digital Telkom melalui riset pengguna dan penyusunan Design System terstandar.",
          status: "active",
        },
        {
          jobId: "job-4",
          companyId: companyMap.get("Traveloka")?.id,
          companyName: "Traveloka",
          companyLogo: "🔵",
          title: "Frontend Web Engineer Intern",
          salary: "Rp 5.000.000 - Rp 7.000.000",
          location: "Tangerang (Hybrid)",
          jobType: "Magang",
          requiredSkills: ["React", "TypeScript", "HTML5", "CSS3", "Git"],
          description:
            "Program magang 6 bulan bersama tim web booking flow untuk mengoptimalkan Core Web Vitals dan aksesibilitas antarmuka.",
          status: "active",
        },
        {
          jobId: "job-5",
          companyId: companyMap.get("Bank Mandiri")?.id,
          companyName: "Bank Mandiri",
          companyLogo: "🏦",
          title: "Officer Development Program (ODP) Digital & Data",
          salary: "Rp 10.000.000 - Rp 14.000.000",
          location: "Jakarta (WFO)",
          jobType: "MT / BUMN",
          requiredSkills: ["Penalaran Logis", "Deret Angka & Numerik", "Core Values AKHLAK", "SQL"],
          description:
            "Jalur akselerasi pemimpin masa depan Bank Mandiri di bidang transformasi digital, analitik risiko kredit, dan inovasi perbankan.",
          status: "active",
        },
      ])
      .onConflictDoNothing();
  }

  // 3. Seed Adaptive Questions Bank
  const [{ value: qCount }] = await db.select({ value: count() }).from(questionsBank);
  if (Number(qCount) === 0) {
    await db.insert(questionsBank).values([
      {
        category: "TKD BUMN",
        difficulty: 1,
        prompt: "SINONIM: Padanan kata yang paling tepat untuk 'AKREDITASI' adalah...",
        options: ["Pengakuan resmi terhadap standar mutu", "Penghapusan aset perusahaan", "Penundaan proyek strategis", "Penggabungan cabang wilayah"],
        answerIndex: 0,
        explanation: "Akreditasi merupakan pengakuan resmi dari lembaga berwenang bahwa suatu instansi atau program memenuhi standar mutu.",
        competencyTag: "Verbal Reasoning",
      },
      {
        category: "TKD BUMN",
        difficulty: 2,
        prompt: "DERET ANGKA: 4, 9, 19, 39, 79, ... Angka selanjutnya adalah:",
        options: ["149", "159", "169", "139"],
        answerIndex: 1,
        explanation: "Pola adalah (x2) + 1: 4*2+1=9, 9*2+1=19, 19*2+1=39, 39*2+1=79, maka 79*2+1 = 159.",
        competencyTag: "Numerik",
      },
      {
        category: "TKD BUMN",
        difficulty: 3,
        prompt: "CORE VALUES AKHLAK: Seorang rekan kerja melakukan kesalahan input data laporan sebelum rapat direksi. Sikap paling mencerminkan nilai 'Kolaboratif' & 'Amanah' adalah...",
        options: [
          "Membiarkannya agar rekan tersebut belajar dari teguran direksi",
          "Segera memberi tahu rekan secara santun dan membantu koreksi sebelum rapat dimulai",
          "Melaporkannya langsung ke HRD tanpa berkomunikasi dengan rekan",
          "Mengganti seluruh bagiannya diam-diam tanpa konfirmasi",
        ],
        answerIndex: 1,
        explanation: "Nilai Amanah menuntut tanggung jawab atas kualitas kerja, sedangkan Kolaboratif mendorong sinergi konstruktif antar anggota tim.",
        competencyTag: "AKHLAK BUMN",
      },
      {
        category: "TKD BUMN",
        difficulty: 4,
        prompt: "PENALARAN LOGIS: Semua analis kredit menguasai Excel lanjutan. Sebagian staf cabang adalah analis kredit. Kesimpulan yang paling tepat adalah...",
        options: [
          "Semua staf cabang menguasai Excel lanjutan",
          "Sebagian staf cabang menguasai Excel lanjutan",
          "Tidak ada staf cabang yang menguasai Excel lanjutan",
          "Semua yang menguasai Excel lanjutan adalah staf cabang",
        ],
        answerIndex: 1,
        explanation: "Karena sebagian staf cabang termasuk himpunan analis kredit, dan seluruh analis kredit menguasai Excel lanjutan, maka minimal sebagian staf cabang pasti menguasainya.",
        competencyTag: "Silogisme",
      },
      {
        category: "TKD BUMN",
        difficulty: 5,
        prompt: "ARITMATIKA BISNIS: Sebuah proyek BUMN ditargetkan selesai dalam 24 hari oleh 15 insinyur. Setelah berjalan 8 hari, pekerjaan terhenti 4 hari akibat cuaca. Berapa tambahan insinyur agar proyek tetap selesai tepat waktu?",
        options: ["3 orang", "5 orang", "6 orang", "8 orang"],
        answerIndex: 1,
        explanation: "Sisa beban kerja = 15 * (24 - 8) = 240 hari-orang. Sisa hari efektif = 24 - 8 - 4 = 12 hari. Butuh 240 / 12 = 20 insinyur, sehingga tambahan = 20 - 15 = 5 orang.",
        competencyTag: "Numerik Lanjutan",
      },
      {
        category: "React & Frontend",
        difficulty: 2,
        prompt: "Mengapa key unik (bukan index array) sangat disarankan pada rendering daftar dinamis di React?",
        options: [
          "Agar React dapat melacak identitas item saat urutan berubah, ditambah, atau dihapus",
          "Agar browser otomatis mengenkripsi data state",
          "Karena array index menyebabkan error kompilasi TypeScript",
          "Agar komponen selalu melakukan full reload halaman",
        ],
        answerIndex: 0,
        explanation: "Key stabil membantu algoritma reconciliation React mencocokkan node DOM secara presisi dan mencegah bug state tertukar saat list dimutasi.",
        competencyTag: "React Reconciliation",
      },
      {
        category: "React & Frontend",
        difficulty: 3,
        prompt: "Kapan hook useCallback paling tepat digunakan dalam komponen React?",
        options: [
          "Saat mengoper fungsi callback ke child component yang di-memoize (React.memo) agar referensinya stabil",
          "Untuk menggantikan seluruh pemanggilan fetch API",
          "Untuk mengubah state secara sinkron sebelum render pertama",
          "Di setiap event handler onClick tanpa terkecuali",
        ],
        answerIndex: 0,
        explanation: "useCallback menjaga referensi fungsi tetap sama antar render sehingga child component yang dibungkus React.memo atau efek yang bergantung padanya tidak terpicu ulang tanpa perlu.",
        competencyTag: "Performance Hooks",
      },
      {
        category: "React & Frontend",
        difficulty: 4,
        prompt: "Dalam pola optimistik pada TanStack Query, fungsi apa yang digunakan untuk melakukan rollback state jika mutasi server gagal?",
        options: [
          "Menyimpan snapshot cache di onMutate lalu memulihkannya di onError menggunakan queryClient.setQueryData",
          "Menjalankan window.location.reload() di onSettled",
          "Menghapus localStorage di onSuccess",
          "Menggunakan useEffect untuk polling setiap 100ms",
        ],
        answerIndex: 0,
        explanation: "Pola standar optimistic update TanStack Query: cancelQueries & simpan previousData di onMutate, kembalikan di onError, lalu invalidateQueries di onSettled.",
        competencyTag: "State & Caching",
      },
      {
        category: "Backend & SQL",
        difficulty: 2,
        prompt: "Apa fungsi utama klausa ON DELETE CASCADE pada foreign key PostgreSQL?",
        options: [
          "Otomatis menghapus baris anak yang berelasi ketika baris induk dihapus",
          "Mengunci tabel agar tidak bisa dibaca oleh pengguna lain",
          "Mengubah tipe kolom teks menjadi JSONB",
          "Membuat indeks unik secara otomatis pada seluruh kolom",
        ],
        answerIndex: 0,
        explanation: "ON DELETE CASCADE menjaga integritas referensial dengan membersihkan record turunan saat record induk dihapus.",
        competencyTag: "Relational Integrity",
      },
      {
        category: "Backend & SQL",
        difficulty: 4,
        prompt: "Dalam transaksi pembayaran di PostgreSQL, mengapa pola SELECT ... FOR UPDATE penting saat memotong saldo atau mengubah status invoice?",
        options: [
          "Mencegah race condition (double-spend) dengan mengunci baris selama transaksi berlangsung",
          "Mempercepat pengiriman email SMTP ke pengguna",
          "Menghapus seluruh cache Vite di server",
          "Membypass validasi token autentikasi",
        ],
        answerIndex: 0,
        explanation: "Row-level locking (FOR UPDATE) memastikan dua request paralel tidak membaca saldo lama yang sama secara bersamaan.",
        competencyTag: "ACID & Concurrency",
      },
      {
        category: "Situational Judgment",
        difficulty: 2,
        prompt: "Anda menemukan bug kritis di fitur produksi tepat 30 menit sebelum demo ke klien besar. Langkah terbaik adalah...",
        options: [
          "Segera laporkan ke lead, siapkan mitigasi/hotfix atau alur cadangan, dan dokumentasikan akar masalahnya",
          "Diam saja berharap klien tidak mengklik tombol tersebut",
          "Menyalahkan tim QA di grup chat publik perusahaan",
          "Menghapus seluruh modul fitur tersebut tanpa izin tim",
        ],
        answerIndex: 0,
        explanation: "Transparansi cepat, mitigasi risiko, dan komunikasi kolaboratif adalah standar profesionalisme engineering dan manajemen produk.",
        competencyTag: "Professional Ethics",
      },
    ]);
  }

  // 4. Seed Forum Posts & Replies
  const [{ value: forumCount }] = await db.select({ value: count() }).from(forumPosts);
  if (Number(forumCount) === 0) {
    const insertedPosts = await db
      .insert(forumPosts)
      .values([
        {
          postId: "fp_1",
          authorName: "Budi Santoso",
          authorAvatar: "👨‍💻",
          authorLevel: 5,
          title: "Bagaimana menangani race condition saat integrasi payment webhook di Node.js?",
          content:
            "Saat callback payment gateway masuk bersamaan dengan user refresh halaman, status order kadang terproses dua kali. Apakah sebaiknya pakai transaksi PostgreSQL FOR UPDATE dan idempotency key?",
          tags: ["Backend", "PostgreSQL", "Architecture"],
          upvotes: 18,
          isHot: true,
        },
        {
          postId: "fp_2",
          authorName: "Siti Aminah",
          authorAvatar: "👩‍💼",
          authorLevel: 8,
          title: "Pengalaman lolos seleksi TKD & Interview AKHLAK Rekrutmen Bersama BUMN 2026",
          content:
            "Kunci utamanya adalah manajemen waktu 25 detik per soal di bagian numerik & figural, serta menyiapkan 3 cerita STAR nyata untuk setiap nilai AKHLAK (Amanah, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif).",
          tags: ["Karir", "BUMN", "Interview"],
          upvotes: 46,
          isHot: true,
        },
        {
          postId: "fp_3",
          authorName: "Dimas Pratama",
          authorAvatar: "🎨",
          authorLevel: 4,
          title: "Review portofolio UI/UX Dashboard SaaS — butuh masukan untuk hierarki tabel",
          content:
            "Saya baru menyelesaikan studi kasus HRD Applicant Tracking System. Bagaimana menurut teman-teman soal penggunaan tabular-nums dan spacing antar kolom status kandidat?",
          tags: ["UI/UX", "Design System", "Portfolio"],
          upvotes: 12,
          isHot: false,
        },
      ])
      .returning();

    if (insertedPosts[0]) {
      await db.insert(forumReplies).values([
        {
          postId: insertedPosts[0].id,
          authorName: "Raka Wijaya (Mentor Backend)",
          authorAvatar: "🛡️",
          authorRole: "mentor",
          content:
            "Tepat sekali! Bungkus dalam `db.transaction` dengan `SELECT ... FOR UPDATE`, lalu cek `if (order.status === 'paid') return;` sebelum mengkreditkan saldo/langganan.",
        },
      ]);
    }
  }

  // 5. Seed Collaboration Rooms
  const [{ value: roomCount }] = await db.select({ value: count() }).from(collabRooms);
  if (Number(roomCount) === 0) {
    const [room] = await db
      .insert(collabRooms)
      .values({
        roomId: "room-tokopedia-1",
        courseId: "react-tokopedia",
        title: "Tim Tokopedia Catalyst Surabaya",
        members: [
          { name: "Riko Pratama", role: "Frontend Engineer", avatar: "👨‍💻", currentXP: 1450 },
          { name: "Siti Rahma", role: "Backend & API", avatar: "👩‍💻", currentXP: 1820 },
          { name: "Zaki Irsyad", role: "Product Designer", avatar: "🎨", currentXP: 1210 },
        ],
        projectUrl: "https://github.com/skillora-labs/tokopedia-merchant-catalyst",
        status: "Belum Dikirim",
      })
      .returning();

    if (room) {
      await db.insert(collabTasks).values([
        {
          taskId: "task-1",
          roomId: room.id,
          title: "Setup arsitektur Vite, TypeScript & Design Tokens",
          assignee: "Riko Pratama",
          status: "done",
          priority: "Tinggi",
        },
        {
          taskId: "task-2",
          roomId: room.id,
          title: "Desain katalog & keranjang belanja merchant",
          assignee: "Zaki Irsyad",
          status: "done",
          priority: "Sedang",
        },
        {
          taskId: "task-3",
          roomId: room.id,
          title: "Integrasi WebSocket live update & validasi checkout",
          assignee: "Siti Rahma",
          status: "in-progress",
          priority: "Tinggi",
        },
        {
          taskId: "task-4",
          roomId: room.id,
          title: "Pengujian unit & persiapan presentasi rubrik mentor",
          assignee: "Tim Catalyst",
          status: "todo",
          priority: "Sedang",
        },
      ]);

      await db.insert(collabMessages).values([
        {
          messageId: "m1",
          roomId: room.id,
          sender: "Zaki Irsyad",
          avatar: "🎨",
          text: "Desain sistem komponen tabel produk sudah final. Silakan cek di board tugas.",
        },
        {
          messageId: "m2",
          roomId: room.id,
          sender: "Siti Rahma",
          avatar: "👩‍💻",
          text: "Siap, endpoint transaksi PostgreSQL sudah aktif dan siap dihubungkan ke frontend.",
        },
      ]);
    }
  }

  // 6. Seed Mentoring Slots
  const [{ value: slotCount }] = await db.select({ value: count() }).from(mentoringSlots);
  if (Number(slotCount) === 0) {
    await db.insert(mentoringSlots).values([
      {
        slotId: "ms-1",
        mentorName: "Andi Kusuma",
        mentorRole: "Staff Frontend Engineer",
        mentorCompany: "Tokopedia",
        mentorAvatar: "👨‍💻",
        topic: "Bedah CV ATS, Live Code Review React & Persiapan Technical Interview",
        scheduleLabel: "Kamis, 19:00 WIB",
        durationMinutes: 45,
        priceGems: 0,
        maxQuota: 5,
        bookedCount: 2,
        status: "open",
      },
      {
        slotId: "ms-2",
        mentorName: "Riska Amelia",
        mentorRole: "Senior Talent Acquisition",
        mentorCompany: "Bank Mandiri",
        mentorAvatar: "👩‍💼",
        topic: "Strategi Lolos Wawancara HRD, Psikotes & Nilai AKHLAK BUMN",
        scheduleLabel: "Sabtu, 10:00 WIB",
        durationMinutes: 60,
        priceGems: 50,
        maxQuota: 4,
        bookedCount: 1,
        status: "open",
      },
      {
        slotId: "ms-3",
        mentorName: "Dr. Hendra Wijaya",
        mentorRole: "Dosen & Data Science Lead",
        mentorCompany: "Telkom Digital",
        mentorAvatar: "👨‍🏫",
        topic: "Konsultasi Portofolio Data Analytics, SQL & Roadmap Karir Fresh Graduate",
        scheduleLabel: "Minggu, 15:30 WIB",
        durationMinutes: 45,
        priceGems: 30,
        maxQuota: 6,
        bookedCount: 1,
        status: "open",
      },
    ]);
  }

  // 7. Seed Scholarships
  const [{ value: schCount }] = await db.select({ value: count() }).from(scholarships);
  if (Number(schCount) === 0) {
    await db.insert(scholarships).values([
      {
        scholarshipId: "sch-lpdp",
        title: "Beasiswa LPDP Reguler & Targeted STEM 2026",
        provider: "Kementerian Keuangan RI",
        degree: "S2 / S3 Dalam & Luar Negeri",
        coverage: "Full Tuition + Biaya Hidup + Riset",
        deadline: "30 Juni 2026",
        location: "Global & Indonesia",
        description: "Program beasiswa penuh pemerintah untuk mencetak pemimpin dan profesional berdaya saing global.",
        requirements: ["IPK min. 3.00 (S2)", "IELTS 6.5 / TOEFL iBT 80", "Esai Kontribusi & LoA"],
        applyUrl: "https://lpdp.kemenkeu.go.id",
      },
      {
        scholarshipId: "sch-unggul",
        title: "Beasiswa Unggulan Kemendikbudristek",
        provider: "Kemendikbudristek RI",
        degree: "S1 / S2 / S3",
        coverage: "Biaya Pendidikan + Uang Saku + Buku",
        deadline: "15 Agustus 2026",
        location: "Universitas Terakreditasi A/Unggul Indonesia",
        description: "Beasiswa bagi mahasiswa berprestasi akademik maupun non-akademik tingkat nasional/internasional.",
        requirements: ["Surat Keterangan Aktif / LoA", "IPK min. 3.25", "Sertifikat Prestasi"],
        applyUrl: "https://beasiswaunggulan.kemdikbud.go.id",
      },
      {
        scholarshipId: "sch-astra",
        title: "Astra 1st & Career Acceleration Scholarship",
        provider: "PT Astra International Tbk",
        degree: "S1 Semester 5–7",
        coverage: "Tunjangan Finansial + Mentoring Eksekutif + Jalur MT",
        deadline: "20 Juli 2026",
        location: "Seluruh Indonesia",
        description: "Program pengembangan talenta mahasiswa unggulan dengan akses magang dan mentoring langsung pimpinan Astra.",
        requirements: ["Mahasiswa aktif S1 semua jurusan", "Aktif berorganisasi", "Lolos asesmen logika & FGD"],
        applyUrl: "https://career.astra.co.id",
      },
    ]);
  }

  // 8. Seed Events
  const [{ value: evtCount }] = await db.select({ value: count() }).from(events);
  if (Number(evtCount) === 0) {
    await db.insert(events).values([
      {
        eventId: "evt-1",
        title: "Bedah Tuntas TKD BUMN & Simulasi Wawancara User Bersama HRD",
        speaker: "Riska Amelia",
        speakerRole: "Talent Acquisition Lead · BUMN Partner",
        category: "Karir & Rekrutmen",
        dateLabel: "Sabtu, 28 Nov 2026",
        timeLabel: "10:00 - 12:00 WIB",
        quota: 250,
        registeredCount: 142,
        xpReward: 150,
        description: "Sesi interaktif membedah pola soal TKD terbaru, kesalahan fatal kandidat saat menjawab STAR, dan tanya jawab langsung.",
      },
      {
        eventId: "evt-2",
        title: "Arsitektur Fullstack TypeScript & PostgreSQL untuk Skala Produksi",
        speaker: "Andi Kusuma",
        speakerRole: "Staff Software Engineer · Tech Unicorn",
        category: "Engineering",
        dateLabel: "Rabu, 2 Des 2026",
        timeLabel: "19:30 - 21:00 WIB",
        quota: 200,
        registeredCount: 98,
        xpReward: 120,
        description: "Praktik nyata membangun API tahan banting dengan Drizzle ORM, WebSocket real-time, dan strategi optimasi kueri.",
      },
      {
        eventId: "evt-3",
        title: "Workshop CV ATS & LinkedIn Optimization untuk Fresh Graduate",
        speaker: "Nadia Putri",
        speakerRole: "Career Coach & HR Specialist",
        category: "Persiapan Kerja",
        dateLabel: "Minggu, 6 Des 2026",
        timeLabel: "14:00 - 15:30 WIB",
        quota: 300,
        registeredCount: 215,
        xpReward: 100,
        description: "Cara menulis bullet point pencapaian terukur agar lolos sistem penyaringan ATS perusahaan teknologi dan multinasional.",
      },
    ]);
  }

  // 9. Seed Interactive Coding & Case Labs (Skillora 2.0 Flagship)
  const [{ value: labCount }] = await db.select({ value: count() }).from(labChallenges);
  if (Number(labCount) === 0) {
    await db.insert(labChallenges).values([
      {
        challengeId: "lab-fe-search-filter",
        title: "Filter & Deduplikasi Katalog Produk Marketplace",
        track: "frontend",
        difficulty: "Pemula",
        estimatedMinutes: 20,
        language: "javascript",
        summary: "Bangun fungsi murni untuk menyaring, menghapus duplikasi berdasarkan ID, dan mengurutkan produk berdasarkan rating tertinggi.",
        promptMarkdown: `### Konteks Kasus
Tim Frontend E-Commerce menerima gabungan respons produk dari dua layanan pencarian yang terkadang menghasilkan **ID produk duplikat**. Anda diminta membuat fungsi \`normalizeCatalog(items, minRating)\`.

### Spesifikasi Fungsi
1. Hapus produk duplikat berdasarkan \`id\` (pertahankan entri dengan \`rating\` lebih tinggi; jika sama, pertahankan yang pertama muncul).
2. Saring hanya produk yang memiliki \`inStock === true\` dan \`rating >= minRating\`.
3. Urutkan hasil akhir secara menurun berdasarkan \`rating\` tertinggi, lalu \`price\` termurah jika rating sama.
4. Kembalikan array baru tanpa memutasi array input asli.`,
        starterCode: `function normalizeCatalog(items, minRating = 4.0) {
  // Tulis solusi bersih dan efisien Anda di sini
  if (!Array.isArray(items)) return [];

  const uniqueMap = new Map();
  for (const item of items) {
    const existing = uniqueMap.get(item.id);
    if (!existing || item.rating > existing.rating) {
      uniqueMap.set(item.id, item);
    }
  }

  return Array.from(uniqueMap.values())
    .filter((item) => item.inStock && item.rating >= minRating)
    .sort((a, b) => b.rating - a.rating || a.price - b.price);
}`,
        hints: [
          "Gunakan struktur data Map agar deduplikasi berjalan dalam kompleksitas waktu O(n).",
          "Pastikan kondisi sorting memakai tie-breaker harga termurah: b.rating - a.rating || a.price - b.price.",
          "Tangani kasus array kosong atau input bukan array dengan mengembalikan []."
        ],
        testCases: [
          {
            id: "tc-1",
            label: "Deduplikasi ID & pilih rating tertinggi",
            expression: `normalizeCatalog([{id:'p1',price:100,rating:4.2,inStock:true},{id:'p1',price:100,rating:4.8,inStock:true}], 4.0).map(x => x.id + ':' + x.rating)`,
            expected: ["p1:4.8"]
          },
          {
            id: "tc-2",
            label: "Filter stok habis & ambang rating",
            expression: `normalizeCatalog([{id:'a',price:50,rating:4.9,inStock:false},{id:'b',price:80,rating:3.9,inStock:true},{id:'c',price:90,rating:4.5,inStock:true}], 4.0).map(x => x.id)`,
            expected: ["c"]
          },
          {
            id: "tc-3",
            label: "Urut rating tertinggi lalu harga termurah",
            expression: `normalizeCatalog([{id:'x',price:200,rating:4.7,inStock:true},{id:'y',price:120,rating:4.7,inStock:true},{id:'z',price:300,rating:4.9,inStock:true}], 4.0).map(x => x.id)`,
            expected: ["z", "y", "x"]
          }
        ],
        rubricCriteria: [
          { id: "r1", title: "Kebenaran Logika & Edge Cases", weight: 40, description: "Semua kasus deduplikasi, filter stok, dan urutan terpenuhi akurat." },
          { id: "r2", title: "Kompleksitas & Performa", weight: 30, description: "Menghindari nested loop O(n^2) dan tidak memutasi input." },
          { id: "r3", title: "Keterbacaan & Kualitas Kode", weight: 30, description: "Penamaan variabel jelas, ringkas, dan mudah dirawat tim." }
        ],
        skills: ["JavaScript", "TypeScript", "React", "Data Transformation"],
        xpReward: 180,
        gemsReward: 25,
      },
      {
        challengeId: "lab-fe-checkout-promo",
        title: "Mesin Kalkulasi Diskon Bertingkat Checkout",
        track: "frontend",
        difficulty: "Menengah",
        estimatedMinutes: 25,
        language: "javascript",
        summary: "Implementasikan kalkulator checkout yang menghitung subtotal, diskon voucher dengan batas maksimum, dan pembulatan rupiah yang akurat.",
        promptMarkdown: `### Konteks Kasus
Halaman checkout membutuhkan fungsi \`calculateCheckout(cart, voucher)\` yang bebas dari kesalahan pembulatan dan menolak input negatif.

### Spesifikasi Fungsi
1. Setiap item di \`cart\` memiliki \`{ price, qty }\`. Abaikan item dengan \`qty <= 0\` atau \`price < 0\`.
2. Hitung \`subtotal\` seluruh item valid.
3. Jika \`voucher\` tersedia dan \`subtotal >= (voucher.minSpend || 0)\`:
   - Jika \`voucher.type === 'percent'\`, hitung \`Math.floor(subtotal * voucher.value / 100)\`, lalu batasi dengan \`voucher.maxDiscount\` jika diset.
   - Jika \`voucher.type === 'flat'\`, diskon = \`Math.min(subtotal, voucher.value)\`.
4. Kembalikan objek \`{ subtotal, discount, total }\` dengan \`total = Math.max(0, subtotal - discount)\`.`,
        starterCode: `function calculateCheckout(cart, voucher = null) {
  // Implementasikan kalkulator checkout yang aman dan presisi
  const subtotal = (Array.isArray(cart) ? cart : []).reduce((sum, item) => {
    if (!item || item.qty <= 0 || item.price < 0) return sum;
    return sum + item.price * item.qty;
  }, 0);

  let discount = 0;
  if (voucher && subtotal >= (voucher.minSpend || 0)) {
    if (voucher.type === "percent") {
      const raw = Math.floor((subtotal * voucher.value) / 100);
      discount = voucher.maxDiscount ? Math.min(raw, voucher.maxDiscount) : raw;
    } else if (voucher.type === "flat") {
      discount = Math.min(subtotal, voucher.value);
    }
  }

  return {
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
  };
}`,
        hints: [
          "Selalu validasi item.qty > 0 dan item.price >= 0 agar tidak terjadi total negatif.",
          "Gunakan Math.floor untuk diskon persentase agar tidak menghasilkan angka desimal rupiah.",
          "Periksa syarat minSpend sebelum menerapkan voucher."
        ],
        testCases: [
          {
            id: "tc-1",
            label: "Diskon persen dengan batas maksimum (cap)",
            expression: `calculateCheckout([{price:100000,qty:3}], {type:'percent',value:20,minSpend:200000,maxDiscount:40000})`,
            expected: { subtotal: 300000, discount: 40000, total: 260000 }
          },
          {
            id: "tc-2",
            label: "Voucher tidak berlaku jika di bawah minSpend",
            expression: `calculateCheckout([{price:50000,qty:1}], {type:'flat',value:20000,minSpend:100000})`,
            expected: { subtotal: 50000, discount: 0, total: 50000 }
          },
          {
            id: "tc-3",
            label: "Abaikan item dengan qty negatif/nol",
            expression: `calculateCheckout([{price:40000,qty:2},{price:99000,qty:0},{price:-5000,qty:3}], null)`,
            expected: { subtotal: 80000, discount: 0, total: 80000 }
          }
        ],
        rubricCriteria: [
          { id: "r1", title: "Akurasi Aturan Bisnis & Cap", weight: 45, description: "Perhitungan subtotal, minSpend, flat, dan maxDiscount tepat." },
          { id: "r2", title: "Keamanan & Validasi Input", weight: 30, description: "Tahan terhadap qty nol/negatif dan voucher null." },
          { id: "r3", title: "Kebersihan Struktur Kode", weight: 25, description: "Mudah dibaca dan bebas side-effect." }
        ],
        skills: ["JavaScript", "TypeScript", "E-Commerce Logic", "Testing"],
        xpReward: 220,
        gemsReward: 30,
      },
      {
        challengeId: "lab-be-rate-limiter",
        title: "Sliding Window API Rate Limiter",
        track: "backend_sql",
        difficulty: "Lanjutan",
        estimatedMinutes: 30,
        language: "javascript",
        summary: "Rancang mekanisme pembatasan permintaan API berbasis jendela waktu geser (sliding window) untuk melindungi endpoint pembayaran.",
        promptMarkdown: `### Konteks Kasus
Layanan API Fintech perlu mencegah lonjakan trafik berbahaya dengan algoritma **Sliding Window Log**. Buat fungsi \`evaluateRequests(timestamps, limit, windowMs)\`.

### Spesifikasi Fungsi
1. Parameter \`timestamps\` adalah array angka milidetik yang sudah terurut menaik.
2. Permintaan pada waktu \`t\` **diizinkan (true)** jika jumlah permintaan yang diizinkan sebelumnya dalam rentang \`(t - windowMs, t]\` masih kurang dari \`limit\`.
3. Jika diizinkan, catat \`t\` ke dalam jendela aktif; jika ditolak (**false**), jangan catat ke jendela aktif.
4. Kembalikan array boolean sepanjang \`timestamps\`.`,
        starterCode: `function evaluateRequests(timestamps, limit, windowMs) {
  // Implementasikan sliding window rate limiter
  const accepted = [];
  const results = [];

  for (const ts of timestamps) {
    while (accepted.length > 0 && accepted[0] <= ts - windowMs) {
      accepted.shift();
    }
    if (accepted.length < limit) {
      accepted.push(ts);
      results.push(true);
    } else {
      results.push(false);
    }
  }

  return results;
}`,
        hints: [
          "Gunakan antrean (queue) berisi timestamp yang sudah disetujui; buang elemen di depan jika <= ts - windowMs.",
          "Ingat: request yang ditolak tidak masuk ke jendela kuota.",
          "Untuk skala jutaan request, pointer indeks kepala (head index) lebih cepat daripada Array.shift()."
        ],
        testCases: [
          {
            id: "tc-1",
            label: "Batas 2 request per 1000ms",
            expression: `evaluateRequests([100, 200, 300, 1100, 1250], 2, 1000)`,
            expected: [true, true, false, true, true]
          },
          {
            id: "tc-2",
            label: "Batas tepat di tepi jendela (eksklusif batas bawah)",
            expression: `evaluateRequests([0, 500, 1000], 1, 1000)`,
            expected: [true, false, true]
          }
        ],
        rubricCriteria: [
          { id: "r1", title: "Ketepatan Algoritma Sliding Window", weight: 45, description: "Kondisi batas (t - windowMs) dan pencatatan request valid akurat." },
          { id: "r2", title: "Efisiensi Memori & Kompleksitas", weight: 35, description: "Menghindari pemindaian ulang seluruh riwayat di tiap request." },
          { id: "r3", title: "Kesiapan Produksi", weight: 20, description: "Kode defensif dan jelas untuk tim backend." }
        ],
        skills: ["Node.js", "REST API", "Algorithms", "System Design"],
        xpReward: 260,
        gemsReward: 40,
      },
      {
        challengeId: "lab-sql-merchant-retention",
        title: "Query SQL Analitik Top Merchant & Retensi Bulanan",
        track: "backend_sql",
        difficulty: "Menengah",
        estimatedMinutes: 25,
        language: "sql",
        summary: "Tulis kueri PostgreSQL teroptimasi untuk menghitung GMV bersih per merchant, jumlah pembeli unik, dan peringkat kontribusi 30 hari terakhir.",
        promptMarkdown: `### Skema Tabel PostgreSQL
- \`orders(id, merchant_id, buyer_id, amount_idr, status, created_at)\`
- \`merchants(id, name, category, city)\`

### Tugas Anda
Tulis satu kueri PostgreSQL (menggunakan CTE & Window Function) yang menampilkan **10 merchant teratas dalam 30 hari terakhir** khusus transaksi dengan \`status = 'paid'\`, berisi kolom:
1. \`merchant_name\`, \`category\`
2. \`total_gmv\` (SUM \`amount_idr\`)
3. \`unique_buyers\` (COUNT DISTINCT \`buyer_id\`)
4. \`avg_order_value\` (dibulatkan ke integer)
5. \`gmv_rank\` menggunakan \`DENSE_RANK()\`
6. Sertakan juga saran 1 indeks komposit yang tepat di komentar SQL.`,
        starterCode: `-- Tulis kueri PostgreSQL lengkap beserta rekomendasi index komposit
WITH paid_recent AS (
  SELECT
    o.merchant_id,
    o.buyer_id,
    o.amount_idr
  FROM orders o
  WHERE o.status = 'paid'
    AND o.created_at >= NOW() - INTERVAL '30 days'
)
SELECT
  m.name AS merchant_name,
  m.category,
  SUM(p.amount_idr) AS total_gmv,
  COUNT(DISTINCT p.buyer_id) AS unique_buyers,
  ROUND(AVG(p.amount_idr))::int AS avg_order_value,
  DENSE_RANK() OVER (ORDER BY SUM(p.amount_idr) DESC) AS gmv_rank
FROM paid_recent p
JOIN merchants m ON m.id = p.merchant_id
GROUP BY m.id, m.name, m.category
ORDER BY total_gmv DESC
LIMIT 10;

-- Rekomendasi indeks:
-- CREATE INDEX idx_orders_status_created_merchant ON orders (status, created_at DESC, merchant_id) INCLUDE (amount_idr, buyer_id);`,
        hints: [
          "Filter status = 'paid' dan rentang 30 hari di dalam CTE sebelum melakukan JOIN ke tabel merchants.",
          "Gunakan DENSE_RANK() OVER (ORDER BY SUM(...) DESC) untuk peringkat tanpa lompatan angka.",
          "Pertimbangkan composite index (status, created_at, merchant_id) agar PostgreSQL bisa melakukan Index Scan."
        ],
        testCases: [],
        rubricCriteria: [
          { id: "r1", title: "Ketepatan Sintaks & Agregasi PostgreSQL", weight: 40, description: "CTE, JOIN, GROUP BY, dan DENSE_RANK() benar tanpa ambiguitas." },
          { id: "r2", title: "Optimasi Performa & Indexing", weight: 35, description: "Filter sebelum join dan rekomendasi composite index tepat sasaran." },
          { id: "r3", title: "Kejelasan & Standar Analitik", weight: 25, description: "Alias kolom rapi, pembulatan akurat, mudah diaudit." }
        ],
        skills: ["PostgreSQL", "SQL", "Data Analytics", "Query Optimization"],
        xpReward: 240,
        gemsReward: 35,
      },
      {
        challengeId: "lab-data-funnel-drop",
        title: "Audit Penurunan Konversi Funnel & A/B Experiment",
        track: "data",
        difficulty: "Menengah",
        estimatedMinutes: 25,
        language: "case_markdown",
        summary: "Analisis data penurunan konversi checkout sebesar 18% pada pengguna mobile dan susun hipotesis eksperimen berbasis metrik.",
        promptMarkdown: `### Data Insiden Produk
Minggu lalu, aplikasi mencatat penurunan konversi dari halaman **Keranjang -> Pembayaran Sukses** sebesar **18% khusus di Android**.
- Trafik kunjungan naik +12% dari kampanye promo.
- Waktu muat halaman checkout naik dari 1,4 detik menjadi 3,9 detik.
- Tingkat kegagalan metode QRIS naik dari 1,2% menjadi 6,8%.

### Deliverable Analisis Anda
Susun laporan ringkas terstruktur berisi:
1. **Akar Masalah Utama (Root Cause)** yang paling berdampak terhadap penurunan 18%.
2. **3 Metrik Diagnostik** tambahan yang perlu dicek di dashboard sebelum mengambil keputusan.
3. **Rencana Aksi Prioritas (Quick Win vs Jangka Menengah)** beserta target angka keberhasilan (KPI).`,
        starterCode: `## 1. Diagnosis Akar Masalah (Root Cause)
- ...

## 2. Metrik Diagnostik Tambahan
- ...

## 3. Rencana Aksi & Eksperimen A/B
- Quick Win (48 jam): ...
- Jangka Menengah (2 minggu): ...
- Target KPI: ...`,
        hints: [
          "Bedakan efek komposisi trafik (promo membawa pengunjung eksploratif) vs masalah teknis nyata (latensi 3,9 detik & gagal QRIS 6,8%).",
          "Pecah metrik berdasarkan versi aplikasi Android, jaringan, dan gateway pembayaran.",
          "Sertakan metrik guardrail (seperti error rate dan waktu respon p95) pada desain A/B test."
        ],
        testCases: [],
        rubricCriteria: [
          { id: "r1", title: "Ketajaman Root Cause Analysis", weight: 40, description: "Mampu memisahkan anomali teknis dan pergeseran trafik secara kuantitatif." },
          { id: "r2", title: "Pemilihan Metrik & Eksperimen", weight: 35, description: "Metrik primer, sekunder, dan guardrail logis dan terukur." },
          { id: "r3", title: "Prioritas Dampak Bisnis", weight: 25, description: "Rencana eksekusi realistis dengan pembagian quick win dan jangka menengah." }
        ],
        skills: ["Data Analytics", "Product Metrics", "Problem Solving"],
        xpReward: 210,
        gemsReward: 30,
      },
      {
        challengeId: "lab-bumn-case-akhlak",
        title: "Studi Kasus Manajemen Operasional & Nilai AKHLAK BUMN",
        track: "bumn_case",
        difficulty: "Pemula",
        estimatedMinutes: 20,
        language: "case_markdown",
        summary: "Latihan studi kasus wawancara user & FGD BUMN: menyelesaikan antrean layanan cabang dan konflik tim dengan kerangka STAR & AKHLAK.",
        promptMarkdown: `### Skenario Kasus BUMN
Anda ditugaskan sebagai **Officer Development Program (ODP)** di sebuah kantor cabang BUMN layanan publik.
- Rata-rata waktu tunggu nasabah naik menjadi **47 menit** (target SLA maksimal 15 menit).
- 40% antrean sebenarnya bisa diselesaikan melalui aplikasi mobile, tetapi petugas loket senior enggan mengarahkan nasabah karena khawatir target transaksi loket turun.

### Tugas Anda
Tulis rekomendasi strategis yang mencakup:
1. **Analisis Situasi & Akar Konflik** (proses layanan & psikologis tim).
2. **Solusi Konkret 30 Hari** berbasis nilai **AKHLAK** (minimal sebutkan penerapan *Adaptif*, *Kolaboratif*, dan *Amanah*).
3. **Indikator Keberhasilan (SLA & Adopsi Digital)** yang dapat dipresentasikan ke Kepala Cabang.`,
        starterCode: `## 1. Analisis Situasi & Akar Masalah
- ...

## 2. Rencana Implementasi 30 Hari (Berbasis AKHLAK)
- Adaptif: ...
- Kolaboratif: ...
- Amanah: ...

## 3. Target KPI & Mitigasi Risiko
- ...`,
        hints: [
          "Ubah insentif atau KPI petugas loket agar keberhasilan aktivasi digital ikut dihitung sebagai kinerja mereka.",
          "Tempatkan duta digital di area antrean untuk menyaring transaksi sederhana sebelum masuk loket.",
          "Gunakan angka target terukur, misalnya penurunan waktu tunggu dari 47 menit ke <18 menit dalam 30 hari."
        ],
        testCases: [],
        rubricCriteria: [
          { id: "r1", title: "Penerapan Nilai AKHLAK Otentik", weight: 35, description: "Nilai AKHLAK diterjemahkan ke tindakan manajerial nyata, bukan jargon." },
          { id: "r2", title: "Solusi Operasional & Manajemen Perubahan", weight: 40, description: "Menangani resistensi tim senior sekaligus memperbaiki alur layanan." },
          { id: "r3", title: "Ketajaman KPI & Komunikasi Eksekutif", weight: 25, description: "Terstruktur, ringkas, dan menggunakan target angka terukur." }
        ],
        skills: ["Core Values AKHLAK", "Leadership", "Penalaran Logis", "STAR Method"],
        xpReward: 190,
        gemsReward: 25,
      },
    ]).onConflictDoNothing();
  }

  // Always ensure Training Engine 3.0 additional Interactive Labs (6 new labs -> 12 total) are seeded
  await db.insert(labChallenges).values(NEW_INTERACTIVE_LABS).onConflictDoNothing();

  // 10. Seed Campus & Cohort Hubs
  const [{ value: cohortCount }] = await db.select({ value: count() }).from(campusCohorts);
  if (Number(cohortCount) === 0) {
    await db.insert(campusCohorts).values([
      {
        cohortId: "cohort-ui-tech",
        campusName: "Universitas Indonesia",
        city: "Depok, Jawa Barat",
        programTitle: "UI Career Accelerator · Software & Data",
        targetRole: "Frontend & Fullstack Engineer",
        activeStudents: 428,
        avgReadiness: 86,
        certifiedCount: 194,
        featuredLabs: ["lab-fe-search-filter", "lab-be-rate-limiter"],
      },
      {
        cohortId: "cohort-itb-eng",
        campusName: "Institut Teknologi Bandung",
        city: "Bandung, Jawa Barat",
        programTitle: "ITB Digital Systems & Architecture Track",
        targetRole: "Backend & Data Engineer",
        activeStudents: 382,
        avgReadiness: 88,
        certifiedCount: 176,
        featuredLabs: ["lab-be-rate-limiter", "lab-sql-merchant-retention"],
      },
      {
        cohortId: "cohort-ugm-bumn",
        campusName: "Universitas Gadjah Mada",
        city: "Yogyakarta",
        programTitle: "UGM Leadership & ODP BUMN Readiness",
        targetRole: "Management Trainee & BUMN",
        activeStudents: 512,
        avgReadiness: 84,
        certifiedCount: 230,
        featuredLabs: ["lab-bumn-case-akhlak", "lab-data-funnel-drop"],
      },
      {
        cohortId: "cohort-its-product",
        campusName: "Institut Teknologi Sepuluh Nopember",
        city: "Surabaya, Jawa Timur",
        programTitle: "ITS Full-Stack & Product Analytics Cohort",
        targetRole: "Software Engineer & Analyst",
        activeStudents: 345,
        avgReadiness: 83,
        certifiedCount: 158,
        featuredLabs: ["lab-fe-checkout-promo", "lab-sql-merchant-retention"],
      },
      {
        cohortId: "cohort-binus-web",
        campusName: "BINUS University",
        city: "Jakarta Barat",
        programTitle: "BINUS Industry Portfolio & Startup Sprint",
        targetRole: "Frontend Engineer & UI/UX",
        activeStudents: 460,
        avgReadiness: 82,
        certifiedCount: 211,
        featuredLabs: ["lab-fe-search-filter", "lab-fe-checkout-promo"],
      },
      {
        cohortId: "cohort-telkom-digital",
        campusName: "Telkom University",
        city: "Bandung, Jawa Barat",
        programTitle: "Tel-U Digital Talent & BUMN Synergy",
        targetRole: "Cloud, Data & Digital BUMN",
        activeStudents: 396,
        avgReadiness: 81,
        certifiedCount: 164,
        featuredLabs: ["lab-sql-merchant-retention", "lab-bumn-case-akhlak"],
      },
    ]).onConflictDoNothing();
  }

  // 13. Seed Free Structured Career Learning Paths (idempotent)
  const existingPaths = await db.select({ total: count() }).from(learningPaths);
  if ((existingPaths[0]?.total || 0) === 0) {
    const allDbCourses = await db.select().from(courses);
    const seedPathSpecs = [
      {
        slug: "path-software-cloud",
        title: "Jalur Software & Cloud Engineer",
        description: "Kurikulum gratis terurut dari fundamental Frontend, Backend API, SQL, hingga Cloud & DevOps.",
        targetRole: "Full-Stack / Cloud Engineer",
        level: "Pemula hingga Mahir",
        matcher: (c: any) => /tekno|cloud|devops|back|web|software|react|api/i.test(`${c.category || ""} ${c.title}`),
      },
      {
        slug: "path-ai-data-product",
        title: "Jalur AI, Data & Product Specialist",
        description: "Jalur penguasaan analisis data SQL, otomasi AI, serta riset & desain produk digital.",
        targetRole: "AI & Data Analyst / Product",
        level: "Menengah hingga Mahir",
        matcher: (c: any) => /ai|data|produk|ux|otomasi|analit/i.test(`${c.category || ""} ${c.title}`),
      },
      {
        slug: "path-bumn-cpns",
        title: "Jalur Persiapan BUMN, CPNS & Karier",
        description: "Persiapan lengkap TKD, AKHLAK BUMN, literasi keuangan, dan wawancara HRD tanpa biaya.",
        targetRole: "Officer / Management Trainee",
        level: "Terbuka Semua Latar Belakang",
        matcher: (c: any) => /bumn|cpns|finan|bisnis|karier/i.test(`${c.category || ""} ${c.title}`),
      },
    ];

    for (const spec of seedPathSpecs) {
      const [insertedPath] = await db
        .insert(learningPaths)
        .values({
          slug: spec.slug,
          title: spec.title,
          description: spec.description,
          targetRole: spec.targetRole,
          level: spec.level,
          badgeIcon: "compass",
        })
        .onConflictDoNothing()
        .returning();

      const targetPath =
        insertedPath ||
        (await db.select().from(learningPaths).where(eq(learningPaths.slug, spec.slug)))[0];
      if (!targetPath) continue;

      const matched = allDbCourses.filter(spec.matcher);
      let stepOrder = 0;
      for (const c of matched) {
        await db
          .insert(learningPathCourses)
          .values({
            pathId: targetPath.id,
            courseId: c.id,
            stepOrder: stepOrder++,
          })
          .onConflictDoNothing();
      }
    }
  }
}
