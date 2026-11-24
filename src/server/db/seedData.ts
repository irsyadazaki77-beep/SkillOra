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
} from "../../db/schema.ts";
import { defaultCourses } from "../data/coursesData.ts";
import { count } from "drizzle-orm";

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
  // 1. Seed Courses & Lessons if courses table lacks full metadata or is empty
  const [{ value: courseCount }] = await db.select({ value: count() }).from(courses);
  if (Number(courseCount) === 0) {
    for (const item of defaultCourses) {
      const [insertedCourse] = await db
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
          image: mapCourseImage(item.id),
          skills: item.skills || [],
          projectTitle: item.project?.title || "Proyek Portofolio Akhir",
          projectDescription: item.project?.description || "Selesaikan proyek industri terverifikasi.",
          projectRubric: item.project?.rubric || "Kualitas arsitektur, kebersihan kode, dan pemenuhan studi kasus.",
          status: "published",
          isProOnly: false,
        })
        .onConflictDoNothing()
        .returning();

      const targetCourseId = insertedCourse?.id;
      if (targetCourseId && Array.isArray(item.lessons)) {
        let idx = 0;
        for (const les of item.lessons) {
          const mdContent = Array.isArray((les as any).contentBlocks)
            ? (les as any).contentBlocks.map((b: any) => b.content).join("\n\n")
            : (les as any).notes || `Materi pembelajaran terstruktur untuk ${les.title}.`;

          await db
            .insert(lessons)
            .values({
              lessonId: les.id,
              courseId: targetCourseId,
              title: les.title,
              type: "quiz",
              orderIndex: idx++,
              xpReward: les.xp || 100,
              contentMarkdown: mdContent,
              estimatedMinutes: (les as any).estimatedMinutes || 15,
              questionsData: les.questions || [],
            })
            .onConflictDoNothing();
        }
      }
    }
  } else {
    // Sync rich columns onto existing seeded courses/lessons if questionsData or image is null
    const existingCourses = await db.select().from(courses);
    for (const item of defaultCourses) {
      const existing = existingCourses.find((c) => c.courseId === item.id);
      if (existing && (!existing.image || !existing.skills)) {
        await db
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
            image: mapCourseImage(item.id),
            skills: item.skills || [],
            projectTitle: item.project?.title || "Proyek Portofolio Akhir",
            projectDescription: item.project?.description || "Selesaikan proyek industri terverifikasi.",
            projectRubric: item.project?.rubric || "Kualitas arsitektur, kebersihan kode, dan pemenuhan studi kasus.",
            status: "published",
            isProOnly: false,
          })
          .onConflictDoUpdate({
            target: courses.courseId,
            set: {
              logo: item.logo || "🎓",
              image: mapCourseImage(item.id),
              skills: item.skills || [],
              projectTitle: item.project?.title || "Proyek Portofolio Akhir",
              projectDescription: item.project?.description || "Selesaikan proyek industri terverifikasi.",
              projectRubric: item.project?.rubric || "Kualitas arsitektur, kebersihan kode, dan pemenuhan studi kasus.",
            },
          });

        if (Array.isArray(item.lessons)) {
          let idx = 0;
          for (const les of item.lessons) {
            const mdContent = Array.isArray((les as any).contentBlocks)
              ? (les as any).contentBlocks.map((b: any) => b.content).join("\n\n")
              : (les as any).notes || `Materi pembelajaran terstruktur untuk ${les.title}.`;

            await db
              .insert(lessons)
              .values({
                lessonId: les.id,
                courseId: existing.id,
                title: les.title,
                type: "quiz",
                orderIndex: idx++,
                xpReward: les.xp || 100,
                contentMarkdown: mdContent,
                estimatedMinutes: (les as any).estimatedMinutes || 15,
                questionsData: les.questions || [],
              })
              .onConflictDoUpdate({
                target: lessons.lessonId,
                set: {
                  contentMarkdown: mdContent,
                  estimatedMinutes: (les as any).estimatedMinutes || 15,
                  questionsData: les.questions || [],
                },
              });
          }
        }
      }
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
}
