export interface ExpandedInlineCheck {
  id: string;
  afterParagraph: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  competencyTag: string;
}

export interface ExpandedFlashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  competencyTag: string;
}

export interface ExpandedCasePrompt {
  title: string;
  scenario: string;
  deliverables: string[];
  rubricCriteria: string[];
}

export interface CourseEnrichmentSpec {
  image?: string;
  linkedLabIds: string[];
  casePrompt: ExpandedCasePrompt;
  extraLessons?: Array<{
    id: string;
    title: string;
    xp: number;
    estimatedMinutes: number;
    contentMarkdown: string;
    questions: Array<{
      id: string;
      text: string;
      options: string[];
      answerIndex: number;
      explanation: string;
      competencyTag: string;
      hint?: string;
    }>;
    inlineChecks?: ExpandedInlineCheck[];
    flashcards?: ExpandedFlashcard[];
  }>;
  customFlashcards?: ExpandedFlashcard[];
}

export const COURSE_ENRICHMENTS: Record<string, CourseEnrichmentSpec> = {
  "tkd-bumn-akhlak": {
    image: "/src/assets/images/course_bumn_prep_1794974023438.jpg",
    linkedLabIds: ["lab-bumn-case-akhlak", "lab-cpns-tkp-policy"],
    casePrompt: {
      title: "Memo Transformasi Layanan Cabang BUMN Berbasis AKHLAK",
      scenario:
        "Anda adalah peserta Management Trainee di sebuah BUMN energi & layanan publik. Survei kepuasan pelanggan cabang turun 19% akibat antrean verifikasi manual yang lambat, sementara sebagian pegawai senior menolak sistem antrean digital karena takut dianggap lambat beradaptasi.",
      deliverables: [
        "Identifikasi 3 akar masalah operasional dan budaya kerja secara objektif.",
        "Susun rencana perubahan 30 hari yang menerapkan minimal 4 nilai AKHLAK (Amanah, Kompeten, Harmonis, Adaptif, Kolaboratif) dalam tindakan konkret.",
        "Tetapkan 3 metrik keberhasilan (SLA, adopsi digital, kepuasan nasabah) beserta mitigasi resistensi tim.",
      ],
      rubricCriteria: [
        "Ketajaman analisis akar masalah operasional dan psikologis",
        "Penerapan nilai AKHLAK secara konkret (bukan slogan)",
        "Kelayakan rencana eksekusi 30 hari dan manajemen perubahan",
        "Kejelasan metrik keberhasilan kuantitatif",
      ],
    },
    customFlashcards: [
      {
        id: "fc_bumn_1",
        front: "Apa perbedaan utama antara 'Efektif' dan 'Efisien' pada soal Verbal TKD?",
        back: "Efektif berarti tepat sasaran / berhasil mencapai tujuan (lawan kata: futil/inefektif). Efisien berarti hemat sumber daya, waktu, atau biaya (lawan kata: boros/inefisien).",
        hint: "Keduanya BUKAN antonim satu sama lain.",
        competencyTag: "Verbal Reasoning",
      },
      {
        id: "fc_bumn_2",
        front: "Sebutkan 6 pilar Core Values AKHLAK BUMN dan kata kunci utamanya.",
        back: "Amanah (integritas & kepercayaan), Kompeten (terus belajar & kapabilitas), Harmonis (saling peduli & menghargai), Loyal (berdedikasi pada bangsa/negara), Adaptif (inovasi & antusias perubahan), Kolaboratif (sinergi lintas unit).",
        hint: "A-K-H-L-A-K ditetapkan lewat SE Menteri BUMN.",
        competencyTag: "Core Values AKHLAK",
      },
      {
        id: "fc_bumn_3",
        front: "Apa strategi tercepat mengenali Deret Angka Lompat (2 larik)?",
        back: "Jika angka naik-turun tidak beraturan secara berurutan, pisahkan suku ganjil (1, 3, 5...) dan suku genap (2, 4, 6...) lalu cek selisih atau rasio masing-masing larik.",
        hint: "Perhatikan pola zig-zag atau dua tren paralel.",
        competencyTag: "Deret Angka & Numerik",
      },
      {
        id: "fc_bumn_4",
        front: "Aturan arah pada Analogi Kata [A : B = C : D]",
        back: "Kalimat jembatan dari A ke B harus konsisten arah dan kategorinya dengan C ke D. Jangan pernah membalik urutan [Profesi : Hasil] menjadi [Hasil : Profesi].",
        competencyTag: "Verbal Reasoning",
      },
    ],
  },
  "tpa-psikotes-kerja": {
    image: "/src/assets/images/course_cpns_finance_1795577729361.jpg",
    linkedLabIds: ["lab-excel-finance-kpi", "lab-data-funnel-drop"],
    casePrompt: {
      title: "Analisis Kuantitatif & Logika Keputusan Ekspansi Cabang",
      scenario:
        "Direksi meminta analisis cepat atas 2 kandidat kota ekspansi: Kota A (populasi produktif 420.000, biaya sewa Rp 95 juta/bln, estimasi konversi 1,8%, AOV Rp 180.000) vs Kota B (populasi 280.000, biaya sewa Rp 52 juta/bln, konversi 2,4%, AOV Rp 165.000) dengan margin kontribusi 35%.",
      deliverables: [
        "Hitung estimasi pendapatan kotor, margin kontribusi, dan surplus/defisit setelah biaya sewa untuk kedua kota.",
        "Uji asumsi menggunakan penalaran logis: risiko sensitivitas jika konversi turun 20%.",
        "Berikan rekomendasi final beserta syarat kondisi (contingency plan).",
      ],
      rubricCriteria: [
        "Ketepatan perhitungan numerik dan persentase",
        "Kualitas analisis sensitivitas dan risiko",
        "Kejelasan penalaran deduktif dalam rekomendasi",
        "Struktur penyajian eksekutif yang ringkas",
      ],
    },
    extraLessons: [
      {
        id: "tpa_3",
        title: "Tes Spasial, Rotasi 3D, & Ketahanan Psikotes Kraepelin",
        xp: 140,
        estimatedMinutes: 18,
        contentMarkdown: `### Strategi Tes Spasial & Rotasi Jaring Kubus

Dalam psikotes korporasi dan BUMN, soal spasial menguji kemampuan memanipulasi objek 2D/3D secara mental tanpa memutar kertas.

1. **Hukum Sisi Berlawanan Kubus**: Pada jaring-jaring kubus standar (pola 1-4-1), dua persegi yang dipisahkan tepat 1 kotak dalam satu garis lurus **pasti saling berlawanan**—artinya keduanya **tidak mungkin terlihat bersamaan** dalam satu tampilan kubus 3D.
2. **Eliminasi Orientasi Simbol**: Fokus hanya pada 1 simbol asimetris (seperti panah atau huruf L) lalu cek apakah ujung panah menunjuk sisi yang benar setelah dilipat.

### Memahami Kurva Kerja Kraepelin / Pauli

Tes koran (Kraepelin/Pauli) tidak hanya menilai seberapa cepat Anda menjumlahkan dua angka satuan, tetapi mengukur **4 dimensi psikologis**:
- **Kecepatan (Panker)**: Rata-rata jumlah hitungan per kolom.
- **Ketelitian (Tianker)**: Rasio kesalahan & koreksi (usahakan akurasi > 96%).
- **Stabilitas Emosi (Hanker)**: Selisih antara kolom tertinggi dan terendah tidak terlalu tajam.
- **Ketahanan Kerja (Janker)**: Tren garis kurva dari awal ke akhir stabil atau naik perlahan (hindari ngebut di awal lalu anjlok di akhir).`,
        questions: [
          {
            id: "tpa_3_q1",
            text: "Pada jaring-jaring kubus linear 4 kotak berurutan [A][B][C][D], pasangan sisi manakah yang TIDAK mungkin terlihat bersamaan saat kubus dilipat?",
            options: [
              "Sisi A dan Sisi B",
              "Sisi A dan Sisi C",
              "Sisi B dan Sisi C",
              "Sisi C dan Sisi D",
            ],
            answerIndex: 1,
            explanation: "Dua sisi yang dipisahkan tepat 1 kotak pada garis lurus (A dan C, atau B dan D) selalu menjadi sisi berlawanan saat dilipat.",
            competencyTag: "Tes Spasial",
          },
          {
            id: "tpa_3_q2",
            text: "Dalam tes Kraepelin, peserta yang memulai dengan kecepatan sangat tinggi lalu turun drastis pada paruh kedua biasanya terindikasi memiliki...",
            options: [
              "Daya tahan kerja (endurance) dan pengelolaan ritme yang kurang stabil",
              "Ketelitian yang sangat tinggi di seluruh sesi",
              "Kestabilan emosi optimal di bawah tekanan",
              "Kemampuan analitik verbal di atas rata-rata",
            ],
            answerIndex: 0,
            explanation: "Kurva yang menukik tajam menandakan kelelahan dini atau pacing yang tidak terjaga. Ritme konsisten dengan tren sedikit menanjak dinilai paling ideal.",
            competencyTag: "Psikotes Kraepelin",
          },
          {
            id: "tpa_3_q3",
            text: "Jika sebuah panah menghadap ke Utara lalu diputar 90° searah jarum jam sebanyak 3 kali, lalu dicerminkan secara vertikal (kiri-kanan), ke arah mana panah tersebut menunjuk?",
            options: ["Utara", "Timur", "Selatan", "Barat"],
            answerIndex: 1,
            explanation: "Utara + 270° searah jarum jam = Barat. Pencerminan vertikal (sumbu Y) membalik Barat menjadi Timur.",
            competencyTag: "Tes Spasial",
          },
        ],
      },
    ],
    customFlashcards: [
      {
        id: "fc_tpa_1",
        front: "Rumus Modus Tollens dalam Silogisme Logis",
        back: "Premis 1: Jika P maka Q (P → Q). Premis 2: Bukan Q (~Q). Kesimpulan valid: Bukan P (~P). Hati-hati: ~P tidak otomatis menghasilkan ~Q!",
        competencyTag: "Penalaran Logis",
      },
      {
        id: "fc_tpa_2",
        front: "Apa 4 dimensi evaluasi utama pada Tes Kraepelin/Pauli?",
        back: "Kecepatan (Panker), Ketelitian (Tianker), Kestabilan/Keajegan (Hanker), dan Ketahanan/Tren Kerja (Janker).",
        competencyTag: "Psikotes Kraepelin",
      },
      {
        id: "fc_tpa_3",
        front: "Kapan kesimpulan 'Sebagian A bukan C' valid pada silogisme?",
        back: "Ketika premis menyatakan 'Semua B adalah C' dan 'Sebagian A bukan B'—kesimpulan yang aman adalah 'Sebagian A mungkin bukan C', kecuali dinyatakan secara eksklusif.",
        competencyTag: "Penalaran Logis",
      },
    ],
  },
  "interview-hr-user": {
    image: "/src/assets/images/course_cpns_finance_1795577729361.jpg",
    linkedLabIds: ["lab-bumn-case-akhlak", "lab-pm-prd-funnel"],
    casePrompt: {
      title: "Penyusunan 2 Jawaban Behavioral STAR Tingkat Senior",
      scenario:
        "Anda masuk tahap User Interview untuk posisi impian. Pewawancara mengajukan dua pertanyaan behavioral tersulit: (1) Ceritakan kegagalan proyek terbesar Anda dan bagaimana Anda memulihkannya, (2) Ceritakan saat Anda berbeda pendapat tajam dengan atasan atau senior.",
      deliverables: [
        "Tuliskan jawaban lengkap untuk kedua pertanyaan menggunakan format eksplisit Situation, Task, Action (porsi 60% fokus pada kontribusi pribadi), dan Result.",
        "Sertakan minimal 2 angka/metrik terukur pada bagian Result (waktu, biaya, persentase efisiensi, atau kepuasan pengguna).",
        "Tambahkan refleksi pembelajaran (lesson learned) yang menunjukkan kedewasaan profesional.",
      ],
      rubricCriteria: [
        "Kelengkapan struktur STAR tanpa lompatan logika",
        "Ketajaman porsi Action pribadi ('Saya', bukan hanya 'Kami')",
        "Kuantifikasi Result yang kredibel dan relevan",
        "Kematangan refleksi, akuntabilitas, dan komunikasi profesional",
      ],
    },
    extraLessons: [
      {
        id: "int_3",
        title: "Negosiasi Gaji, Pertanyaan Balik Strategis, & Follow-Up HR",
        xp: 140,
        estimatedMinutes: 16,
        contentMarkdown: `### Teknik Negosiasi Kompensasi Berbasis Data Pasar

Saat HR menanyakan ekspektasi gaji terlalu awal, hindari menyebut satu angka tunggal yang terlalu rendah atau tanpa dasar riset.

1. **Berikan Rentang Berbasis Riset**: Gunakan format *"Berdasarkan riset pasar untuk peran ini dan pengalaman proyek saya di bidang X, rentang ekspektasi saya berada di Rp A – Rp B per bulan, namun saya terbuka mendiskusikan paket kompensasi total."*
2. **Evaluasi Total Compensation**: Perhitungkan tunjangan tetap, bonus tahunan/THR, asuransi kesehatan keluarga, anggaran belajar, dan skema kerja hybrid.

### 3 Pertanyaan Balik yang Membuat User Terkesan
- *"Apa tantangan terbesar yang perlu diselesaikan oleh kandidat terpilih dalam 90 hari pertama?"*
- *"Seperti apa indikator keberhasilan (KPI) pada 6 bulan pertama untuk posisi ini?"*
- *"Bagaimana kolaborasi tim ini dengan divisi produk atau bisnis dalam mengambil keputusan prioritas?"*`,
        questions: [
          {
            id: "int_3_q1",
            text: "Respons paling profesional ketika HR menanyakan 'Berapa ekspektasi gaji Anda?' pada tahap screening awal adalah...",
            options: [
              "Menjawab 'Terserah perusahaan saja, yang penting dapat pengalaman'",
              "Menyebutkan rentang realistis berbasis riset pasar serta terbuka membahas total kompensasi",
              "Menolak menjawab sama sekali sampai surat offering diterbitkan",
              "Menyebutkan angka dua kali lipat standar pasar tanpa penjelasan nilai tambah",
            ],
            answerIndex: 1,
            explanation: "Rentang berbasis riset pasar menunjukkan kesiapan profesional sekaligus membuka ruang negosiasi berbasis nilai kontribusi.",
            competencyTag: "Negosiasi & Komunikasi",
          },
          {
            id: "int_3_q2",
            text: "Mengapa porsi 'Action' harus mendominasi sekitar 55%–65% dari total durasi jawaban metode STAR?",
            options: [
              "Karena pewawancara ingin melihat proses berpikir, keputusan, dan langkah konkret milik kandidat sendiri",
              "Karena latar belakang cerita (Situation) tidak pernah penting",
              "Agar pewawancara tidak sempat bertanya lanjutan",
              "Karena hasil akhir (Result) tidak perlu disebutkan",
            ],
            answerIndex: 0,
            explanation: "Situation & Task cukup singkat (20–25%) sebagai konteks; pewawancara menilai kompetensi lewat langkah spesifik yang Anda ambil (Action) dan dampaknya (Result).",
            competencyTag: "STAR Method",
          },
        ],
      },
    ],
    customFlashcards: [
      {
        id: "fc_int_1",
        front: "Proporsi waktu ideal untuk masing-masing komponen STAR (S-T-A-R)",
        back: "Situation ~15%, Task ~10%, Action ~55-60% (fokus pada 'Saya melakukan...'), Result ~15-20% (wajib ada metrik/dampak terukur).",
        competencyTag: "STAR Method",
      },
      {
        id: "fc_int_2",
        front: "Bagaimana menjawab pertanyaan 'Apa kelemahan terbesar Anda?' secara otentik?",
        back: "Pilih kelemahan nyata yang bukan syarat fatal posisi (mis. terlalu detail saat review dokumen), lalu tunjukkan sistem konkret yang sedang Anda jalankan untuk mengatasinya beserta progres terukur.",
        competencyTag: "HR Interview",
      },
    ],
  },
  "sjt-work-ethics": {
    image: "/src/assets/images/course_bumn_prep_1794974023438.jpg",
    linkedLabIds: ["lab-bumn-case-akhlak", "lab-cpns-tkp-policy"],
    casePrompt: {
      title: "Resolusi Dilema Etika Vendor & Konflik Tenggat Lintas Divisi",
      scenario:
        "Dua hari sebelum peluncuran sistem, vendor utama menawarkan voucher perjalanan pribadi kepada Anda agar meloloskan modul yang masih memiliki 2 bug minor tanpa uji ulang. Di sisi lain, manajer bisnis menekan agar peluncuran tidak ditunda.",
      deliverables: [
        "Tentukan keputusan etis utama beserta landasan tata kelola (GCG & integritas).",
        "Tuliskan skrip komunikasi penolakan gratifikasi yang tegas namun profesional kepada vendor.",
        "Susun opsi mitigasi teknis & jadwal kepada manajer bisnis agar risiko bug minor terkendali tanpa melanggar standar mutu.",
      ],
      rubricCriteria: [
        "Ketegasan integritas dan kepatuhan anti-gratifikasi",
        "Kualitas diplomasi komunikasi lintas pemangku kepentingan",
        "Solusi mitigasi risiko teknis yang pragmatis",
        "Keseimbangan antara kepatuhan dan orientasi hasil bisnis",
      ],
    },
    extraLessons: [
      {
        id: "sjt_2",
        title: "Prioritas Pekerjaan, Escalation Matrix, & Akuntabilitas Tim",
        xp: 130,
        estimatedMinutes: 16,
        contentMarkdown: `### Matriks Eisenhower & Manajemen Eskalasi Profesional

Pada soal *Situational Judgment Test* (SJT), kandidat sering diuji menghadapi **dua tugas mendesak secara bersamaan** dari pemangku kepentingan berbeda.

- **Jangan Diam atau Mengiyakan Semua Tanpa Realitas**: Mengambil semua tugas lalu gagal di keduanya mendapat skor terendah dalam SJT.
- **Komunikasi Proaktif dengan Opsi Solusi**: Saat konflik prioritas muncul, sampaikan fakta beban kerja secara transparan kepada atasan disertai **usulan urutan prioritas berdasarkan dampak bisnis**.
- **Prinsip Eskalasi Tepat Waktu**: Eskalasi bukan tanda kelemahan—eskalasi yang disertai analisis akar masalah dan 2 opsi solusi adalah ciri *ownership* tinggi.`,
        questions: [
          {
            id: "sjt_2_q1",
            text: "Dua manajer dari divisi berbeda memberi Anda tugas mendesak dengan tenggat sore hari yang sama, sementara kapasitas waktu Anda hanya cukup untuk satu tugas. Tindakan SJT terbaik adalah...",
            options: [
              "Mengerjakan keduanya setengah jadi agar terlihat sibuk",
              "Menolak salah satu tugas lewat chat tanpa menjelaskan alasan",
              "Memetakan dampak bisnis kedua tugas, lalu segera berdiskusi dengan atasan langsung untuk menyepakati prioritas dan menegosiasikan ulang tenggat tugas kedua",
              "Meminta rekan junior mengerjakan salah satu tugas tanpa persetujuan atasan",
            ],
            answerIndex: 2,
            explanation: "Komunikasi transparan berbasis dampak bisnis dan penyelarasan prioritas dengan atasan menunjukkan akuntabilitas dan manajemen stakeholder yang matang.",
            competencyTag: "Prioritas & Eskalasi",
          },
          {
            id: "sjt_2_q2",
            text: "Anda menyadari ada kesalahan rumus pada laporan yang sudah Anda kirim 1 jam lalu ke tim manajemen. Respons paling tepat adalah...",
            options: [
              "Menunggu sampai rapat dimulai untuk melihat apakah ada yang menyadarinya",
              "Segera mengirim revisi beserta ringkasan poin koreksi, penyebab kesalahan, dan langkah pencegahan agar tidak terulang",
              "Menyalahkan sumber data dari divisi lain dalam email susulan",
              "Menghapus file lama tanpa pemberitahuan",
            ],
            answerIndex: 1,
            explanation: "Akuntabilitas tinggi berarti mengakui kesalahan dengan cepat, memperbaikinya segera, dan mencegah keputusan manajemen diambil dari data yang keliru.",
            competencyTag: "Integritas & Ownership",
          },
        ],
      },
    ],
    customFlashcards: [
      {
        id: "fc_sjt_1",
        front: "3 Prinsip emas menjawab soal Situational Judgment Test (SJT)",
        back: "1) Integritas & kepatuhan tidak bisa ditawar, 2) Proaktif membawa solusi (bukan hanya keluhan), 3) Kolaboratif dan menghormati alur komunikasi profesional.",
        competencyTag: "Work Ethics",
      },
    ],
  },
  "english-for-jobs": {
    image: "/src/assets/images/course_cpns_finance_1795577729361.jpg",
    linkedLabIds: ["lab-ai-prompt-architecture", "lab-pm-prd-funnel"],
    casePrompt: {
      title: "Executive English Email: Project Delay & Recovery Plan",
      scenario:
        "You are a Project Coordinator communicating with a regional client in Singapore. A third-party API outage caused a 4-day delay on Milestone 2, which was originally due this Friday.",
      deliverables: [
        "Write a concise, polite, and confident business email (150–250 words) in English with a clear Subject Line.",
        "Explain the root cause objectively without sounding defensive.",
        "Present a concrete 2-step recovery timeline and propose a quick sync call with clear time options.",
      ],
      rubricCriteria: [
        "Business tone, politeness, and executive clarity",
        "Grammar accuracy and professional vocabulary",
        "Accountability and solution-oriented structure",
        "Clear Call-to-Action (CTA) and timeline",
      ],
    },
    extraLessons: [
      {
        id: "eng_3",
        title: "Presentasi Data Bisnis, Signposting, & Q&A Profesional",
        xp: 140,
        estimatedMinutes: 18,
        contentMarkdown: `### Signposting Phrases untuk Presentasi Profesional

Pembicara bisnis yang efektif membantu audiens mengikuti alur presentasi melalui *signposting* yang jernih:

- **Opening**: *"Good morning everyone. Today I will walk you through three key findings from our Q3 retention audit."*
- **Transitioning**: *"Having covered the baseline metrics, let's move on to the primary bottleneck."*
- **Highlighting Data**: *"As illustrated in the chart, conversion dipped by 12% following the checkout latency spike."*
- **Handling Tough Q&A**: *"That's a crucial point. While we don't have the exact cohort split on hand today, I will validate the numbers and circulate a brief summary by 4 PM."*`,
        questions: [
          {
            id: "eng_3_q1",
            text: "Which sentence sounds most professional when you need time to verify a data question during a client Q&A?",
            options: [
              "I have no idea, nobody told me that.",
              "That's a great question—let me verify the exact breakdown after this call and share an update by end of day.",
              "Maybe around 20 percent, I am just guessing.",
              "Please ask the data team yourself later.",
            ],
            answerIndex: 1,
            explanation: "Acknowledging the question professionally and committing to a concrete follow-up deadline builds strong executive credibility.",
            competencyTag: "Presentation & Q&A",
          },
          {
            id: "eng_3_q2",
            text: "Choose the most concise and natural Business English phrasing for an email follow-up:",
            options: [
              "I am writing this email to humbly beg you to reply fast.",
              "Following up on our proposal sent Tuesday—could we confirm your feedback by Thursday afternoon?",
              "Why haven't you answered my previous email yet?",
              "Please do the needful urgently asap.",
            ],
            answerIndex: 1,
            explanation: "Polite, direct, and time-bound phrasing ('Following up on... could we confirm by...') is the gold standard in international workplaces.",
            competencyTag: "Business Writing",
          },
        ],
      },
    ],
    customFlashcards: [
      {
        id: "fc_eng_1",
        front: "Upgrade frasa informal 'I'm sorry for the late reply' ke Business English yang lebih percaya diri",
        back: "'Thank you for your patience' atau 'Thank you for waiting—here is the complete update you requested.'",
        competencyTag: "Business Writing",
      },
      {
        id: "fc_eng_2",
        front: "Perbedaan 'Affect' (verb) vs 'Effect' (noun) dalam laporan bisnis",
        back: "Affect = memengaruhi (kata kerja): 'Latency affects conversion.' Effect = dampak/hasil (kata benda): 'The policy had a positive effect on retention.'",
        competencyTag: "Grammar Precision",
      },
    ],
  },
  "react-tokopedia": {
    image: "/src/assets/images/course_tech_engineering_1794974031663.jpg",
    linkedLabIds: ["lab-fe-search-filter", "lab-fe-checkout-promo"],
    casePrompt: {
      title: "Arsitektur Frontend Halaman Pencarian & Optimasi Render Marketplace",
      scenario:
        "Halaman katalog dengan 5.000 produk mengalami lag saat pengguna mengetik filter pencarian dan menggeser filter harga. Profiling menunjukkan seluruh kartu produk re-render di setiap ketukan tombol serta terjadi race condition pada API pencarian.",
      deliverables: [
        "Rancang arsitektur state (URL search params, debounced query, server state caching) yang bersih.",
        "Jelaskan penanganan race condition menggunakan AbortController atau request cancellation.",
        "Susun strategi optimasi performa render (memoization terukur, virtualisasi list, code splitting) beserta metrik Web Vitals yang ditargetkan (INP/LCP).",
      ],
      rubricCriteria: [
        "Ketepatan desain state & pemisahan server/client state",
        "Solusi penanganan race condition & error/loading states",
        "Ketajaman optimasi performa React & Web Vitals",
        "Kejelasan trade-off arsitektur frontend",
      ],
    },
    customFlashcards: [
      {
        id: "fc_react_1",
        front: "Kapan React 'useMemo' justru kontraproduktif?",
        back: "Saat dipakai membungkus kalkulasi sangat ringan (seperti penjumlahan sederhana) karena biaya alokasi memori dan perbandingan dependency array lebih besar daripada menghitung ulang.",
        competencyTag: "React Performance",
      },
      {
        id: "fc_react_2",
        front: "Bagaimana mencegah race condition saat fetching data di dalam useEffect?",
        back: "Gunakan AbortController (passing signal ke fetch) atau flag cleanup boolean `let active = true` pada return function useEffect agar respons request lama diabaikan.",
        competencyTag: "React Hooks",
      },
      {
        id: "fc_react_3",
        front: "Mengapa index array buruk dijadikan 'key' pada list yang bisa diurutkan/dihapus?",
        back: "React mengidentifikasi elemen berdasarkan key. Jika item disisipkan atau dihapus, index bergeser sehingga state internal komponen anak (seperti input) menempel pada data yang salah.",
        competencyTag: "React Reconciliation",
      },
    ],
  },
  "node-goto": {
    image: "/src/assets/images/course_cloud_devops_1795577730437.jpg",
    linkedLabIds: ["lab-be-rate-limiter", "lab-devops-security-audit"],
    casePrompt: {
      title: "Desain Endpoint Pembayaran Idempoten & Perlindungan Lonjakan Trafik",
      scenario:
        "Saat flash sale, aplikasi mobile sering mengirim ulang request POST /api/payments akibat koneksi seluler tidak stabil, menyebabkan saldo pengguna terpotong dua kali dan database mengalami connection pool exhaustion.",
      deliverables: [
        "Rancang mekanisme Idempotency-Key lengkap dengan alur tabel/Redis dan status HTTP yang dikembalikan.",
        "Jelaskan penggunaan database transaction & row-level locking (SELECT ... FOR UPDATE) untuk mencegah race condition saldo.",
        "Tambahkan strategi rate limiting dan circuit breaker agar kegagalan payment gateway tidak menjatuhkan seluruh server.",
      ],
      rubricCriteria: [
        "Ketepatan arsitektur Idempotency-Key & deduplikasi",
        "Penguasaan transaksi ACID dan row-level locking",
        "Strategi ketahanan trafik (rate limiter, pooling, timeout)",
        "Kejelasan kontrak API dan skenario edge case",
      ],
    },
    extraLessons: [
      {
        id: "node_2",
        title: "Database Transaction, Row Locking, & Idempotency pada Fintech API",
        xp: 160,
        estimatedMinutes: 22,
        contentMarkdown: `### Mencegah Double-Spend dengan Transaksi ACID

Pada sistem dompet digital atau e-commerce, dua permintaan paralel dapat membaca saldo yang sama sebelum salah satunya sempat mengurangi saldo (*Time-of-Check to Time-of-Use / Race Condition*).

1. **Row-Level Locking**: Gunakan \`SELECT ... FROM wallets WHERE user_id = $1 FOR UPDATE\` di dalam transaksi PostgreSQL agar transaksi kedua menunggu transaksi pertama selesai commit.
2. **Idempotency-Key**: Klien mengirim header unik \`Idempotency-Key: uuid-v4\`. Server menyimpan hasil respons pertama di database/Redis; jika request dengan key sama masuk lagi akibat retry jaringan, server langsung mengembalikan respons yang tersimpan tanpa mengeksekusi debit ulang.
3. **Structured Error & Timeout**: Selalu pasang timeout ketat saat memanggil API pihak ketiga agar thread/worker tidak menggantung.`,
        questions: [
          {
            id: "node_2_q1",
            text: "Apa fungsi utama header 'Idempotency-Key' pada endpoint pembayaran POST /api/payments?",
            options: [
              "Mempercepat kompresi JSON di browser",
              "Memastikan request ulang (retry) akibat jaringan putus tidak menyebabkan transaksi terproses dua kali",
              "Menggantikan kebutuhan autentikasi JWT",
              "Menghapus log audit transaksi secara otomatis",
            ],
            answerIndex: 1,
            explanation: "Idempotency-Key memungkinkan server mengenali retry dari transaksi yang sama dan mengembalikan hasil aslinya tanpa memotong saldo ganda.",
            competencyTag: "Backend Architecture",
          },
          {
            id: "node_2_q2",
            text: "Mengapa 'SELECT ... FOR UPDATE' penting saat mengurangi saldo akun pengguna di PostgreSQL?",
            options: [
              "Untuk mengunci baris saldo terkait hingga transaksi selesai sehingga mencegah race condition debit ganda",
              "Untuk membuat tabel dapat diakses tanpa password",
              "Untuk menonaktifkan indeks primary key",
              "Untuk mengubah tipe data kolom secara dinamis",
            ],
            answerIndex: 0,
            explanation: "Row-level locking memastikan transaksi konkuren pada baris pengguna yang sama dieksekusi secara serial dan konsisten.",
            competencyTag: "Database Concurrency",
          },
          {
            id: "node_2_q3",
            text: "Status kode HTTP manakah yang paling tepat ketika klien melampaui batas kuota Rate Limiter API?",
            options: ["400 Bad Request", "403 Forbidden", "429 Too Many Requests", "502 Bad Gateway"],
            answerIndex: 2,
            explanation: "HTTP 429 Too Many Requests secara standar memberi tahu klien bahwa batas permintaan terlampaui (biasanya disertai header Retry-After).",
            competencyTag: "REST API Design",
          },
        ],
      },
      {
        id: "node_3",
        title: "Observability, Structured Logging, & Keamanan API Produksi",
        xp: 160,
        estimatedMinutes: 20,
        contentMarkdown: `### Pilar Observability untuk Layanan Node.js Skala Produksi

Menjalankan backend di produksi membutuhkan visibilitas cepat saat insiden terjadi:
- **Structured JSON Logging**: Sertakan \`requestId\`, \`userId\`, \`latencyMs\`, dan \`statusCode\`, dan **jangan pernah** mencatat password, token JWT, atau nomor kartu ke log.
- **Validasi Schema di Gerbang API**: Validasi body/query sebelum menyentuh service layer untuk mencegah injection dan payload berlebih.
- **Graceful Shutdown**: Tangani sinyal \`SIGTERM\` dengan menutup penerimaan koneksi baru, menyelesaikan request yang sedang berjalan, lalu menutup pool database secara bersih.`,
        questions: [
          {
            id: "node_3_q1",
            text: "Informasi manakah yang WAJIB disaring (redacted) agar tidak pernah tertulis ke dalam file log server produksi?",
            options: [
              "Request ID dan Latency dalam milidetik",
              "HTTP method dan status code",
              "Authorization Bearer token, password, dan API key",
              "Nama endpoint tanpa parameter sensitif",
            ],
            answerIndex: 2,
            explanation: "Mencatat kredensial atau token ke dalam log membuka celah kebocoran akun jika sistem log diakses pihak tak berwenang.",
            competencyTag: "API Security",
          },
          {
            id: "node_3_q2",
            text: "Apa tujuan utama mekanisme Graceful Shutdown saat container backend di-deploy ulang?",
            options: [
              "Mematikan server seketika tanpa menunggu respons klien",
              "Menyelesaikan request yang sedang berjalan dan menutup koneksi database dengan rapi sebelum proses berhenti",
              "Menghapus seluruh cache Redis secara permanen",
              "Menurunkan versi Node.js otomatis",
            ],
            answerIndex: 1,
            explanation: "Graceful shutdown mencegah error 502/putus transaksi di tengah jalan saat rolling deployment berlangsung.",
            competencyTag: "Production Reliability",
          },
        ],
      },
    ],
    customFlashcards: [
      {
        id: "fc_node_1",
        front: "Apa bedanya Authentication (401) vs Authorization (403)?",
        back: "Authentication (401 Unauthorized) memverifikasi identitas siapa pengguna (belum login / token invalid). Authorization (403 Forbidden) memverifikasi hak akses apakah identitas tersebut boleh mengakses resource terkait.",
        competencyTag: "API Security",
      },
      {
        id: "fc_node_2",
        front: "Kapan sebaiknya menggunakan Composite Index (A, B) di PostgreSQL?",
        back: "Saat kueri sering memfilter kolom A saja atau (A dan B) bersama-sama. Ingat aturan leftmost prefix: index (status, created_at) efektif untuk WHERE status = 'paid' AND created_at >= ..., tetapi tidak optimal jika hanya memfilter created_at.",
        competencyTag: "Database Performance",
      },
    ],
  },
  "data-traveloka": {
    image: "/src/assets/images/course_ai_automation_1795577727396.jpg",
    linkedLabIds: ["lab-sql-merchant-retention", "lab-data-funnel-drop"],
    casePrompt: {
      title: "Investigasi Penurunan Retensi Pengguna Bulan ke-2 (Cohort & SQL Plan)",
      scenario:
        "Tim Growth Traveloka melihat retensi bulan ke-2 pengguna baru turun dari 34% menjadi 22% pada kuartal ini, meskipun jumlah instalasi aplikasi naik 40%.",
      deliverables: [
        "Tuliskan logika kueri SQL (CTE/Window Function) untuk membangun tabel cohort retensi berdasarkan channel akuisisi.",
        "Identifikasi 3 hipotesis penyebab penurunan retensi (kualitas trafik akuisisi, friksi onboarding, atau ketidakcocokan promo).",
        "Rancang 1 eksperimen A/B lengkap dengan metrik primer, metrik guardrail, dan kriteria keputusan rilis.",
      ],
      rubricCriteria: [
        "Ketepatan logika SQL cohort dan segmentasi data",
        "Kedalaman perumusan hipotesis bisnis berbasis data",
        "Desain eksperimen A/B dan metrik guardrail yang valid",
        "Kejelasan rekomendasi aksi untuk pemangku kepentingan",
      ],
    },
    extraLessons: [
      {
        id: "data_2",
        title: "SQL Window Functions, Cohort Retention, & Optimasi Query",
        xp: 160,
        estimatedMinutes: 22,
        contentMarkdown: `### Window Functions yang Wajib Dikuasai Data Analyst

Berbeda dengan \`GROUP BY\` yang menciutkan banyak baris menjadi satu ringkasan, **Window Functions** memungkinkan perhitungan agregasi/peringkat sambil mempertahankan detail tiap baris.

- **\`ROW_NUMBER()\` vs \`RANK()\` vs \`DENSE_RANK()\`**: Gunakan \`DENSE_RANK()\` bila nilai seri harus mendapat peringkat sama tanpa melompati angka berikutnya (1, 1, 2).
- **\`LAG()\` / \`LEAD()\`**: Sangat kuat untuk menghitung pertumbuhan *Month-over-Month (MoM)* atau selisih hari antar transaksi seorang pelanggan.
- **Running Total**: \`SUM(revenue) OVER (PARTITION BY region ORDER BY tx_date)\` untuk melacak akumulasi pendapatan harian per wilayah.`,
        questions: [
          {
            id: "data_2_q1",
            text: "Fungsi SQL manakah yang paling tepat untuk membandingkan pendapatan bulan ini dengan pendapatan bulan sebelumnya pada baris yang sama?",
            options: ["COUNT()", "LAG() OVER (ORDER BY month)", "GROUP BY", "COALESCE()"],
            answerIndex: 1,
            explanation: "LAG() mengakses nilai dari baris sebelumnya dalam partisi terurut sehingga memudahkan kalkulasi pertumbuhan MoM/YoY.",
            competencyTag: "SQL Analytics",
          },
          {
            id: "data_2_q2",
            text: "Jika dua merchant memiliki GMV tertinggi yang sama persis, peringkat apa yang diberikan DENSE_RANK() untuk merchant urutan ketiga?",
            options: ["Peringkat 1", "Peringkat 2", "Peringkat 3", "NULL"],
            answerIndex: 1,
            explanation: "DENSE_RANK menghasilkan urutan 1, 1, 2 (tanpa celah angka), sedangkan RANK menghasilkan 1, 1, 3.",
            competencyTag: "SQL Analytics",
          },
        ],
      },
      {
        id: "data_3",
        title: "A/B Testing, Statistical Significance, & Storytelling Eksekutif",
        xp: 150,
        estimatedMinutes: 20,
        contentMarkdown: `### Menghindari Jebakan Analitik dalam Eksperimen A/B

1. **Peeking Problem**: Jangan menghentikan eksperimen terlalu cepat hanya karena p-value < 0.05 di hari kedua; tetapkan ukuran sampel minimum (*sample size*) sebelum tes berjalan.
2. **Guardrail Metrics**: Kenaikan klik tombol *Checkout* (+8%) tidak dianggap sukses jika metrik guardrail *Cancellation Rate* atau *Page Load Latency* ikut memburuk drastis.
3. **Struktur Storytelling (Pyramid Principle)**: Mulai presentasi data dari **Kesimpulan & Rekomendasi Utama**, baru diikuti bukti data pendukung dan langkah selanjutnya.`,
        questions: [
          {
            id: "data_3_q1",
            text: "Mengapa metrik guardrail (seperti error rate atau margin kotor) wajib dipantau dalam eksperimen A/B?",
            options: [
              "Untuk memastikan peningkatan metrik utama tidak mengorbankan kesehatan produk atau profitabilitas",
              "Agar eksperimen bisa dihentikan dalam 1 jam",
              "Untuk menggantikan kebutuhan grup kontrol",
              "Karena metrik utama tidak bisa diukur",
            ],
            answerIndex: 0,
            explanation: "Guardrail metrics melindungi bisnis dari optimasi lokal yang justru merusak pengalaman pengguna atau keuangan perusahaan.",
            competencyTag: "Experimentation",
          },
        ],
      },
    ],
    customFlashcards: [
      {
        id: "fc_data_1",
        front: "Perbedaan WHERE vs HAVING dalam SQL",
        back: "WHERE menyaring baris mentah SEBELUM agregasi (GROUP BY). HAVING menyaring hasil kelompok SETELAH agregasi (mis. HAVING SUM(amount) > 1000000).",
        competencyTag: "SQL Analytics",
      },
      {
        id: "fc_data_2",
        front: "Apa yang dimaksud Simpson's Paradox dalam analisis bisnis?",
        back: "Tren yang muncul pada data agregat keseluruhan bisa berbalik arah ketika data dipecah berdasarkan segmen penting (mis. platform Android vs iOS atau channel organik vs iklan).",
        competencyTag: "Data Storytelling",
      },
    ],
  },
  "uiux-telkom": {
    image: "/src/assets/images/course_product_ux_1795577728388.jpg",
    linkedLabIds: ["lab-ux-heuristic-redesign", "lab-pm-prd-funnel"],
    casePrompt: {
      title: "Audit Heuristik & Redesain Alur Registrasi Aplikasi Layanan Publik",
      scenario:
        "Tingkat pengabaian (drop-off) pada layar pendaftaran aplikasi mobile mencapai 54%. Pengguna mengeluh formulir terlalu panjang (14 kolom dalam satu layar), pesan error hanya muncul setelah tombol Kirim ditekan, dan kontras teks label terlalu tipis di bawah sinar matahari.",
      deliverables: [
        "Petakan 4 pelanggaran Nielsen's 10 Usability Heuristics dan WCAG AA pada kondisi saat ini.",
        "Rancang ulang arsitektur alur registrasi bertahap (progressive disclosure) beserta microcopy error yang membantu.",
        "Susun rencana Usability Testing bersama 5 pengguna target beserta metrik keberhasilan (Task Completion Rate & Time on Task).",
      ],
      rubricCriteria: [
        "Ketepatan diagnosis Heuristik Usability & Aksesibilitas WCAG",
        "Kualitas solusi alur & pengurangan beban kognitif",
        "Kejelasan microcopy dan feedback interaksi",
        "Validitas metodologi Usability Testing",
      ],
    },
    extraLessons: [
      {
        id: "uiux_2",
        title: "Design System, Aksesibilitas WCAG AA, & Usability Testing",
        xp: 150,
        estimatedMinutes: 20,
        contentMarkdown: `### Membangun Design System yang Konsisten & Aksesibel

Design system bukan sekadar kumpulan komponen Figma—ia adalah kontrak bersama antara Desainer dan Engineer.
- **Design Tokens**: Pisahkan warna semantik (\`surface-primary\`, \`text-muted\`, \`accent-action\`) dari palet mentah agar dukungan Light & Dark mode konsisten.
- **Standar Kontras WCAG 2.1 AA**: Teks normal minimal rasio kontras **4.5:1**, teks besar minimal **3:1**, dan target sentuh mobile minimal **44×44px**.
- **Aturan 5 Pengguna (Jakob Nielsen)**: Pengujian usability kualitatif dengan 5 peserta representatif sudah mampu mengungkap ~85% masalah kegunaan mayor.`,
        questions: [
          {
            id: "uiux_2_q1",
            text: "Berapakah rasio kontras warna minimum menurut standar aksesibilitas WCAG AA untuk teks paragraf ukuran normal?",
            options: ["2.0 : 1", "3.0 : 1", "4.5 : 1", "10.0 : 1"],
            answerIndex: 2,
            explanation: "WCAG AA menetapkan minimal rasio kontras 4.5:1 untuk teks ukuran normal dan 3:1 untuk teks besar agar tetap terbaca oleh pengguna dengan gangguan penglihatan ringan.",
            competencyTag: "Accessibility",
          },
          {
            id: "uiux_2_q2",
            text: "Mengapa sinyal error pada form tidak boleh hanya mengandalkan perubahan warna border menjadi merah?",
            options: [
              "Pengguna dengan buta warna dapat melewatkannya; wajib disertai pesan teks spesifik dan ikon",
              "Warna merah membuat browser melambat",
              "Border merah dilarang pada perangkat mobile",
              "Agar form tidak perlu validasi server",
            ],
            answerIndex: 0,
            explanation: "Prinsip aksesibilitas melarang penyampaian status hanya lewat warna (hue-only signaling); selalu sertakan teks instruksi perbaikan yang jelas.",
            competencyTag: "UI/UX Principles",
          },
        ],
      },
    ],
    customFlashcards: [
      {
        id: "fc_ux_1",
        front: "Apa prinsip 'Visibility of System Status' dari Nielsen Heuristics?",
        back: "Sistem harus selalu memberi tahu pengguna apa yang sedang terjadi melalui umpan balik jelas dalam waktu wajar (mis. loading skeleton, progres unggah, konfirmasi tersimpan).",
        competencyTag: "Usability Heuristics",
      },
      {
        id: "fc_ux_2",
        front: "Perbedaan User Interview (Discovery) vs Usability Testing (Validation)",
        back: "User Interview menggali perilaku, kebutuhan, dan masalah masa lalu pengguna. Usability Testing mengamati langsung pengguna mencoba menyelesaikan tugas nyata pada prototipe/produk.",
        competencyTag: "UX Research",
      },
    ],
  },
  "marketing-digital": {
    image: "/src/assets/images/course_product_ux_1795577728388.jpg",
    linkedLabIds: ["lab-data-funnel-drop", "lab-excel-finance-kpi"],
    casePrompt: {
      title: "Strategi Alokasi Budget Performance Ads Rp 50 Juta & Perbaikan ROAS",
      scenario:
        "Brand D2C lokal memiliki anggaran iklan bulanan Rp 50 juta. Bulan lalu ROAS turun dari 3,6x menjadi 1,9x; CTR tinggi (2,8%) tetapi Conversion Rate landing page hanya 0,7% dengan biaya CAC Rp 145.000 (sementara margin kotor per pesanan hanya Rp 120.000).",
      deliverables: [
        "Diagnosis titik bocor funnel (ad creative vs audience targeting vs landing page/offer).",
        "Susun pembagian alokasi budget baru lintas funnel (Prospecting, Retargeting, Retention/CRM).",
        "Tetapkan target metrik sehat (Target CAC, ROAS breakeven, LTV:CAC) serta rencana uji kreatif 14 hari.",
      ],
      rubricCriteria: [
        "Ketepatan diagnosis metrik funnel (CTR, CVR, CAC vs Margin)",
        "Logika alokasi anggaran berbasis unit economics",
        "Kekuatan rencana eksperimen kreatif & landing page",
        "Kejelasan target KPI dan kontrol efisiensi biaya",
      ],
    },
    extraLessons: [
      {
        id: "mkt_2",
        title: "Unit Economics Pemasaran: CAC, LTV, ROAS Breakeven, & Retargeting",
        xp: 150,
        estimatedMinutes: 20,
        contentMarkdown: `### Menghitung ROAS Breakeven Agar Iklan Tidak Bakar Uang

Banyak pemasar hanya mengejar ROAS tinggi tanpa memeriksa **Gross Margin**.
- **Rumus Breakeven ROAS**: \`1 / Gross Margin %\`. Jika margin kotor produk Anda 40% (0,40), maka Breakeven ROAS adalah \`1 / 0,40 = 2,5x\`. Artinya ROAS 2,0x sebenarnya **merugi** secara kontribusi!
- **Rasio Sehat LTV : CAC**: Bisnis berkelanjutan menargetkan \`LTV : CAC >= 3 : 1\` dengan periode balik modal (*CAC Payback*) singkat.
- **Diagnosis Funnel Cepat**:
  - CTR rendah (<1%) → Masalah *hook* kreatif atau audiens tidak relevan.
  - CTR tinggi tapi CVR rendah (<1%) → Masalah janji iklan tidak sinkron dengan *landing page*, harga, atau kecepatan muat situs.`,
        questions: [
          {
            id: "mkt_2_q1",
            text: "Jika margin kotor (gross margin) produk Anda sebesar 25%, berapakah angka Breakeven ROAS minimum agar iklan tidak merugi?",
            options: ["1.5x", "2.5x", "4.0x", "5.0x"],
            answerIndex: 2,
            explanation: "Breakeven ROAS = 1 / Gross Margin = 1 / 0.25 = 4.0x.",
            competencyTag: "Unit Economics",
          },
          {
            id: "mkt_2_q2",
            text: "Kampanye iklan memiliki CTR sangat tinggi (3,4%) namun tingkat konversi pembelian di website sangat rendah (0,4%). Area prioritas pertama yang perlu diaudit adalah...",
            options: [
              "Keselarasan pesan landing page, kecepatan halaman, dan hambatan checkout",
              "Menaikkan budget harian dua kali lipat seketika",
              "Menghapus seluruh pixel pelacakan konversi",
              "Mengganti nama domain perusahaan",
            ],
            answerIndex: 0,
            explanation: "CTR tinggi menandakan iklan menarik perhatian, tetapi kebocoran terjadi setelah klik—fokuskan audit pada pengalaman landing page, penawaran, dan alur checkout.",
            competencyTag: "Funnel Optimization",
          },
        ],
      },
    ],
    customFlashcards: [
      {
        id: "fc_mkt_1",
        front: "Rumus Breakeven ROAS berdasarkan Gross Margin",
        back: "Breakeven ROAS = 1 / Gross Margin. Contoh: Gross Margin 50% → Breakeven ROAS 2.0x; Gross Margin 33% → Breakeven ROAS 3.0x.",
        competencyTag: "Performance Marketing",
      },
    ],
  },
  "finance-accounting": {
    image: "/src/assets/images/course_cpns_finance_1795577729361.jpg",
    linkedLabIds: ["lab-excel-finance-kpi", "lab-data-funnel-drop"],
    casePrompt: {
      title: "Memo Evaluasi Kelayakan Kredit & Kesehatan Arus Kas Korporasi",
      scenario:
        "Sebuah perusahaan distribusi mengajukan kredit modal kerja Rp 4 Miliar. Laporan menunjukkan Laba Bersih naik 22% YoY, namun Arus Kas Operasi (Operating Cash Flow) negatif Rp 1,1 Miliar, Days Sales Outstanding (DSO) naik dari 38 hari menjadi 79 hari, dan Current Ratio turun ke 1,05x.",
      deliverables: [
        "Jelaskan mengapa perusahaan bisa mencatat laba bersih positif namun arus kas operasi negatif.",
        "Analisis 3 risiko likuiditas dan kualitas piutang dari data di atas.",
        "Berikan rekomendasi keputusan kredit (Disetujui penuh / Disetujui bersyarat / Ditunda) lengkap dengan syarat covenant pengaman.",
      ],
      rubricCriteria: [
        "Pemahaman keterkaitan Laba Rugi, Neraca, dan Arus Kas",
        "Ketajaman analisis rasio likuiditas & perputaran piutang (DSO)",
        "Kualitas manajemen risiko kredit & struktur covenant",
        "Kejelasan rekomendasi finansial profesional",
      ],
    },
    extraLessons: [
      {
        id: "fin_2",
        title: "Analisis Rasio Keuangan, Arus Kas vs Laba, & Kesehatan Likuiditas",
        xp: 155,
        estimatedMinutes: 20,
        contentMarkdown: `### Mengapa 'Profit is an Opinion, Cash is a Fact'

Perusahaan dengan pertumbuhan penjualan agresif tetap bisa mengalami gagal bayar jika kas tertahan terlalu lama di piutang (*Accounts Receivable*) atau persediaan (*Inventory*).

- **Current Ratio** = \`Aset Lancar / Liabilitas Lancar\` (umumnya sehat di kisaran 1,5x – 2,5x).
- **Debt-to-Equity Ratio (DER)** = \`Total Utang / Total Ekuitas\` mengukur tingkat leverage keuangan.
- **Cash Conversion Cycle (CCC)** = \`DIO + DSO - DPO\`. Semakin pendek CCC, semakin cepat perusahaan memutar modal kerjanya menjadi kas kembali.`,
        questions: [
          {
            id: "fin_2_q1",
            text: "Kenaikan tajam pada Days Sales Outstanding (DSO) dari 35 hari menjadi 80 hari mengindikasikan...",
            options: [
              "Pelanggan membayar jauh lebih cepat daripada sebelumnya",
              "Penagihan piutang melambat drastis sehingga menekan arus kas operasi",
              "Margin laba kotor meningkat dua kali lipat",
              "Utang jangka panjang perusahaan lunas seluruhnya",
            ],
            answerIndex: 1,
            explanation: "DSO mengukur rata-rata hari untuk menagih piutang. Lonjakan DSO menahan kas perusahaan dan meningkatkan risiko piutang tak tertagih.",
            competencyTag: "Cash Flow Analysis",
          },
          {
            id: "fin_2_q2",
            text: "Komponen rumus Cash Conversion Cycle (CCC) yang benar adalah...",
            options: [
              "DIO + DSO - DPO",
              "Laba Bersih / Total Aset",
              "Aset Lancar - Total Utang",
              "EBITDA + Penyusutan",
            ],
            answerIndex: 0,
            explanation: "CCC = Days Inventory Outstanding + Days Sales Outstanding - Days Payable Outstanding.",
            competencyTag: "Working Capital",
          },
        ],
      },
    ],
    customFlashcards: [
      {
        id: "fc_fin_1",
        front: "Apa rumus Cash Conversion Cycle (CCC) dan artinya?",
        back: "CCC = DIO + DSO - DPO. Mengukur berapa hari kas perusahaan terikat dalam persediaan dan piutang sebelum kembali menjadi kas setelah dikurangi tempo pembayaran ke pemasok.",
        competencyTag: "Financial Analysis",
      },
    ],
  },
  "data-entry-admin": {
    image: "/src/assets/images/course_cpns_finance_1795577729361.jpg",
    linkedLabIds: ["lab-excel-finance-kpi", "lab-sql-merchant-retention"],
    casePrompt: {
      title: "Otomasi Rekonsiliasi Laporan Penjualan Multi-Cabang di Excel",
      scenario:
        "Setiap hari Senin, tim operasional menghabiskan 6 jam menyatukan file penjualan mentah dari 12 cabang yang sering memiliki format tanggal campur, spasi ganda pada kode SKU, dan duplikasi nomor faktur.",
      deliverables: [
        "Rancang alur pembersihan data (TRIM, CLEAN, Remove Duplicates, Data Validation, atau Power Query).",
        "Tuliskan kombinasi rumus Excel modern (XLOOKUP, SUMIFS, IFERROR) untuk mencocokkan harga SKU dan menghitung total per cabang secara otomatis.",
        "Jelaskan desain struktur sheet (Raw Data, Master SKU, Pivot Dashboard) agar minim human error.",
      ],
      rubricCriteria: [
        "Ketepatan pemilihan dan sintaks formula Excel/Sheets",
        "Kualitas desain pemisahan data mentah vs laporan",
        "Pencegahan human error (validasi & penanganan #N/A)",
        "Dampak efisiensi waktu kerja yang terukur",
      ],
    },
    extraLessons: [
      {
        id: "adm_2",
        title: "XLOOKUP, SUMIFS, Data Cleaning, & Pivot Table Dashboard",
        xp: 145,
        estimatedMinutes: 20,
        contentMarkdown: `### Menguasai Rumus Inti Excel untuk Tes Kerja Administrasi & Operasional

Pada tes praktik Excel di perusahaan, Anda jarang diminta menghafal teori—melainkan merapikan tabel kotor dan membuat ringkasan cepat dalam 30 menit.

1. **XLOOKUP menggantikan VLOOKUP**: \`=XLOOKUP(A2, Master!A:A, Master!C:C, "SKU Tidak Ditemukan")\` tidak rusak jika kolom disisipkan dan langsung mendukung pencarian ke kiri maupun nilai default jika tidak ketemu.
2. **SUMIFS Multi-Kriteria**: \`=SUMIFS(Sales!D:D, Sales!B:B, "Jakarta", Sales!C:C, ">=2026-01-01")\` untuk menjumlahkan omzet berdasarkan beberapa syarat sekaligus.
3. **Pembersihan Teks**: Gunakan \`=TRIM(UPPER(A2))\` untuk menghapus spasi berlebih dan menyamakan kapitalisasi sebelum melakukan lookup.`,
        questions: [
          {
            id: "adm_2_q1",
            text: "Keunggulan utama XLOOKUP dibandingkan VLOOKUP klasik di Excel adalah...",
            options: [
              "Dapat mencari ke kiri maupun kanan, tahan terhadap penyisipan kolom, dan memiliki argumen bawaan untuk nilai tidak ditemukan",
              "Hanya bekerja untuk angka bulat positif",
              "Menghapus otomatis seluruh duplikasi baris",
              "Tidak memerlukan referensi rentang sel",
            ],
            answerIndex: 0,
            explanation: "XLOOKUP menghilangkan ketergantungan pada nomor indeks kolom statis (col_index_num) yang sering rusak pada VLOOKUP.",
            competencyTag: "Excel Formulas",
          },
          {
            id: "adm_2_q2",
            text: "Fungsi Excel manakah yang paling tepat untuk menghilangkan spasi ganda tersembunyi di awal/akhir kode SKU yang menyebabkan hasil #N/A?",
            options: ["COUNTIF", "TRIM", "MEDIAN", "ROUND"],
            answerIndex: 1,
            explanation: "TRIM membersihkan spasi berlebih di awal, akhir, dan ganda di tengah teks sehingga kunci lookup cocok sempurna.",
            competencyTag: "Data Cleaning",
          },
        ],
      },
    ],
    customFlashcards: [
      {
        id: "fc_adm_1",
        front: "Sintaks dasar SUMIFS di Excel",
        back: "=SUMIFS(sum_range, criteria_range1, criteria1, [criteria_range2, criteria2], ...). Ingat: argumen pertama selalu kolom angka yang akan dijumlahkan!",
        competencyTag: "Excel Formulas",
      },
    ],
  },
};

export const NEW_INDUSTRY_COURSES = [
  {
    id: "ai-prompt-automation",
    title: "AI & Prompt Engineering untuk Produktivitas Kerja",
    description:
      "Kuasai rekayasa prompt terstruktur, evaluasi output LLM, perancangan alur kerja otomasi berbasis AI, dan tata kelola keamanan data perusahaan.",
    category: "AI & Otomasi",
    difficulty: "Menengah" as const,
    partner: "Skillora AI Engineering Lab",
    logo: "🤖",
    image: "/src/assets/images/course_ai_automation_1795577727396.jpg",
    duration: "3 Minggu",
    xpReward: 780,
    skills: ["Prompt Engineering", "Structured JSON Output", "AI Workflow Automation", "AI Evaluation", "Data Privacy"],
    linkedLabIds: ["lab-ai-prompt-architecture", "lab-data-funnel-drop"],
    casePrompt: {
      title: "Rancang Sistem AI Triage Tiket Pelanggan dengan Output JSON Terverifikasi",
      scenario:
        "Tim Customer Support menerima 1.800 tiket keluhan per hari. Anda diminta merancang arsitektur System Prompt dan alur evaluasi kualitas agar AI dapat mengklasifikasi urgensi, merangkum inti keluhan, dan mengusulkan draf balasan tanpa pernah membocorkan data sensitif atau mengarang kebijakan refund.",
      deliverables: [
        "Tulis rancangan System Prompt lengkap (Role, Guardrails, Few-Shot Examples, dan Strict JSON Output Schema).",
        "Jelaskan mekanisme pencegahan halusinasi (grounding/RAG) dan penanganan kasus berisiko tinggi (eskalasi manusia).",
        "Susun 4 metrik evaluasi uji coba sebelum rilis ke produksi (akurasi klasifikasi, tingkat halusinasi, latensi, kepuasan CS).",
      ],
      rubricCriteria: [
        "Kejelasan struktur System Prompt & batasan anti-halusinasi",
        "Ketepatan desain JSON schema & konsistensi output",
        "Keamanan data (PII redaction) dan aturan eskalasi manusia",
        "Ketajaman kerangka evaluasi & pengujian sebelum rilis",
      ],
    },
    project: {
      title: "Blueprint Otomasi AI Operasional Departemen",
      description: "Susun dokumentasi prompt terstruktur, skema JSON, dan rubrik evaluasi untuk satu proses kerja nyata.",
      rubric: "Ketepatan teknik prompting, pencegahan halusinasi, keamanan data PII, dan keterukuran dampak produktivitas.",
    },
    lessons: [
      {
        id: "ai_1",
        title: "Arsitektur Prompt Terstruktur: Role, Context, Constraints, & Few-Shot",
        xp: 160,
        estimatedMinutes: 20,
        contentMarkdown: `### Mengapa Prompt Kasual Gagal di Lingkungan Kerja

Mengetik instruksi samar seperti *"Buatkan ringkasan laporan ini"* menghasilkan format yang berubah-ubah setiap kali dijalankan. Untuk kebutuhan kerja profesional dan integrasi aplikasi, gunakan **Kerangka 5 Pilar Prompt**:

1. **Role & Persona**: Tetapkan sudut pandang keahlian (mis. *Analis Risiko Kredit Senior*).
2. **Task & Objective**: Kata kerja spesifik beserta batas ruang lingkupnya.
3. **Context & Grounding**: Sertakan sumber fakta yang menjadi satu-satunya dasar jawaban.
4. **Constraints & Guardrails**: Larangan eksplisit (mis. *"Jika data tidak ada di dokumen, jawab 'Tidak tersedia di sumber'—jangan menebak"*).
5. **Output Schema & Few-Shot**: Berikan 2–3 contoh pasangan input-output ideal agar gaya dan format konsisten 95%+.

> 💡 **Tips Praktik Industri:** Memisahkan *System Instruction* (aturan tetap) dari *User Input* (data dinamis) mencegah risiko *prompt injection* dan membuat perilaku model jauh lebih stabil.`,
        inlineChecks: [
          {
            id: "ic_ai_1",
            afterParagraph: 2,
            question: "Elemen prompt manakah yang paling efektif mencegah model AI mengarang kebijakan yang tidak tercantum di dokumen perusahaan?",
            options: [
              "Meminta jawaban yang sangat panjang",
              "Menetapkan grounding sumber fakta dan constraint eksplisit untuk menyatakan 'tidak tersedia' jika data absen",
              "Menghapus seluruh contoh format keluaran",
              "Menulis instruksi dengan huruf kapital semua",
            ],
            answerIndex: 1,
            explanation: "Grounding yang jelas dikombinasikan dengan aturan eksplisit untuk menolak menebak secara drastis menurunkan tingkat halusinasi.",
            competencyTag: "Prompt Engineering",
          },
        ],
        flashcards: [
          {
            id: "fc_ai_1",
            front: "Apa fungsi teknik Few-Shot Prompting?",
            back: "Memberikan 2–5 contoh nyata pasangan input dan output yang diinginkan di dalam prompt agar model meniru struktur, nada, dan tingkat kedetailan secara konsisten.",
            competencyTag: "Prompt Engineering",
          },
          {
            id: "fc_ai_2",
            front: "Mengapa System Instruction harus dipisahkan dari User Content?",
            back: "Untuk menjaga hirarki instruksi, memastikan aturan bisnis/keamanan tidak mudah ditimpa oleh teks pengguna (mitigasi prompt injection).",
            competencyTag: "AI Security",
          },
        ],
        questions: [
          {
            id: "ai_1_q1",
            text: "Teknik prompting yang menyertakan 2–3 contoh pasangan input dan output ideal sebelum pertanyaan utama disebut...",
            options: ["Zero-Shot Prompting", "Few-Shot Prompting", "Token Truncation", "Model Quantization"],
            answerIndex: 1,
            explanation: "Few-Shot Prompting memberi contoh konkret sehingga model jauh lebih patuh terhadap format dan standar kualitas yang diharapkan.",
            competencyTag: "Prompt Engineering",
          },
          {
            id: "ai_1_q2",
            text: "Langkah paling tepat untuk mengurangi halusinasi AI saat merangkum kontrak legal perusahaan adalah...",
            options: [
              "Menggunakan grounding dokumen sumber serta instruksi kutipan pasal eksplisit dan larangan asumsi",
              "Meminta model menulis secara kreatif dan bebas",
              "Tidak menyertakan teks kontrak sama sekali",
              "Mengabaikan verifikasi manusia sebelum ditandatangani",
            ],
            answerIndex: 0,
            explanation: "Grounding pada dokumen sumber ditambah verifikasi sitasi memastikan setiap klaim dapat diaudit kembali ke teks asli.",
            competencyTag: "Hallucination Control",
          },
          {
            id: "ai_1_q3",
            text: "Mengapa pemisahan System Instruction dan User Input penting dalam sistem AI produksi?",
            options: [
              "Membantu menegakkan aturan peran dan mengurangi risiko prompt injection dari input pengguna",
              "Menghapus kebutuhan akan koneksi internet",
              "Membuat ukuran database berkurang 90%",
              "Menggantikan seluruh unit test aplikasi",
            ],
            answerIndex: 0,
            explanation: "System instruction bertindak sebagai kebijakan tingkat tinggi yang memandu perilaku model terlepas dari variasi masukan pengguna.",
            competencyTag: "AI Security",
          },
          {
            id: "ai_1_q4",
            text: "Kapan Structured Output (JSON Schema) lebih unggul dibanding teks bebas?",
            options: [
              "Saat hasil AI harus langsung diproses otomatis oleh kode backend, tabel dashboard, atau API downstream",
              "Saat menulis puisi bebas",
              "Saat tidak memerlukan konsistensi field sama sekali",
              "Hanya ketika pengguna tidak memiliki browser",
            ],
            answerIndex: 0,
            explanation: "Structured JSON Schema menjamin tipe data dan properti selalu valid untuk konsumsi sistem otomatis.",
            competencyTag: "Structured JSON Output",
          },
        ],
      },
      {
        id: "ai_2",
        title: "Structured JSON Outputs, Evaluasi Kualitas (Evals), & RAG Praktis",
        xp: 170,
        estimatedMinutes: 22,
        contentMarkdown: `### Membangun Alur AI yang Dapat Diukur dengan Evals

Perbedaan terbesar antara eksperimen AI biasa dan sistem AI siap produksi adalah **Evaluasi Sistematis (Evals)**.

1. **Golden Dataset**: Kumpulkan 20–50 contoh kasus nyata (termasuk *edge case* sulit) lengkap dengan jawaban standar emas.
2. **Rubric-Based Grading**: Nilai akurasi fakta, kepatuhan format JSON, dan keamanan nada secara otomatis setiap kali Anda mengubah prompt.
3. **Retrieval-Augmented Generation (RAG)**: Alih-alih melatih ulang model setiap minggu, simpan SOP/dokumen terbaru dalam indeks pencarian lalu sisipkan potongan dokumen paling relevan ke dalam konteks prompt.`,
        inlineChecks: [
          {
            id: "ic_ai_2",
            afterParagraph: 1,
            question: "Mengapa tim engineering memilih pendekatan RAG dibanding fine-tuning untuk SOP perusahaan yang berubah setiap bulan?",
            options: [
              "RAG memungkinkan pembaruan sumber pengetahuan secara instan tanpa melatih ulang bobot model dan menyediakan sitasi dokumen",
              "RAG tidak membutuhkan dokumen sumber sama sekali",
              "Fine-tuning tidak bisa membaca teks bahasa Indonesia",
              "RAG otomatis menghapus seluruh biaya penyimpanan",
            ],
            answerIndex: 0,
            explanation: "RAG memisahkan pengetahuan dinamis (database dokumen) dari kemampuan penalaran model sehingga mudah diperbarui dan diaudit.",
            competencyTag: "RAG Architecture",
          },
        ],
        flashcards: [
          {
            id: "fc_ai_3",
            front: "Apa itu Golden Dataset dalam pengembangan fitur AI?",
            back: "Kumpulan kasus uji representatif (termasuk edge case) beserta ekspektasi keluaran yang digunakan untuk menguji apakah perubahan prompt meningkatkan atau menurunkan akurasi.",
            competencyTag: "AI Evaluation",
          },
          {
            id: "fc_ai_4",
            front: "Kapan menggunakan RAG vs Fine-Tuning?",
            back: "Gunakan RAG untuk menyuntikkan fakta/dokumen terkini yang sering berubah. Gunakan Fine-Tuning untuk mengubah gaya/pola perilaku khusus secara konsisten pada skala besar.",
            competencyTag: "RAG Architecture",
          },
        ],
        questions: [
          {
            id: "ai_2_q1",
            text: "Apa manfaat utama menjalankan Golden Dataset Evals setiap kali tim memodifikasi System Prompt?",
            options: [
              "Mendeteksi regresi kualitas secara objektif sebelum perubahan dirilis ke pengguna",
              "Membuat respons model menjadi acak",
              "Menghilangkan kebutuhan dokumentasi kode",
              "Menonaktifkan skema JSON",
            ],
            answerIndex: 0,
            explanation: "Perbaikan pada satu kasus kadang merusak kasus lain; Golden Dataset memastikan peningkatan kualitas bersifat menyeluruh.",
            competencyTag: "AI Evaluation",
          },
          {
            id: "ai_2_q2",
            text: "Komponen inti dalam arsitektur Retrieval-Augmented Generation (RAG) adalah...",
            options: [
              "Mencari potongan dokumen relevan dari knowledge base lalu menyertakannya ke konteks prompt model",
              "Menghapus seluruh dokumen lama perusahaan",
              "Menyimpan API key di kode browser",
              "Mengubah semua teks menjadi file audio",
            ],
            answerIndex: 0,
            explanation: "RAG mengambil konteks paling relevan secara real-time untuk memperkuat akurasi faktual jawaban model.",
            competencyTag: "RAG Architecture",
          },
          {
            id: "ai_2_q3",
            text: "Prinsip keamanan data (PII Protection) yang wajib diterapkan sebelum mengirim data pelanggan ke LLM adalah...",
            options: [
              "Menyaring/masking NIK, nomor kartu, dan kata sandi serta meminimalkan data pribadi yang tidak relevan",
              "Mengirim seluruh dump database produksi mentah",
              "Mempublikasikan riwayat percakapan pelanggan ke forum umum",
              "Menyimpan token rahasia di teks prompt",
            ],
            answerIndex: 0,
            explanation: "Data minimization dan PII redaction melindungi privasi pelanggan serta mematuhi regulasi UU PDP.",
            competencyTag: "Data Privacy",
          },
        ],
      },
      {
        id: "ai_3",
        title: "Human-in-the-Loop, Guardrails, & Tata Kelola AI di Perusahaan",
        xp: 160,
        estimatedMinutes: 18,
        contentMarkdown: `### Merancang Alur Kerja AI yang Aman (Human-in-the-Loop)

Tidak semua keputusan cocok diotomatisasi 100%. Klasifikasikan tugas kerja Anda ke dalam tiga tingkat risiko:
- **Risiko Rendah (Otomasi Penuh)**: Klasifikasi tag internal, ringkasan notulen rapat, ekstraksi kata kunci.
- **Risiko Menengah (AI Draft + Human Review)**: Draf email klien, evaluasi awal CV, rekomendasi perbaikan kode.
- **Risiko Tinggi (Wajib Persetujuan Manusia)**: Keputusan persetujuan kredit, pemutusan kontrak, klaim medis/hukum, atau transfer dana.

Pastikan setiap fitur AI menyimpan **jejak audit** (input teranonymisasi, versi prompt, dan keputusan final manusia).`,
        inlineChecks: [
          {
            id: "ic_ai_3",
            afterParagraph: 1,
            question: "Tugas manakah yang PALING wajib menerapkan skema Human-in-the-Loop sebelum keputusan dieksekusi?",
            options: [
              "Penandaan kategori artikel blog internal",
              "Persetujuan akhir pencairan kredit nasabah atau penolakan otomatis pelamar kerja",
              "Pembuatan daftar istilah glosarium belajar",
              "Pengecekan typo pada catatan pribadi",
            ],
            answerIndex: 1,
            explanation: "Keputusan yang berdampak hukum, finansial, atau karier seseorang harus memiliki pengawasan dan keputusan akhir manusia.",
            competencyTag: "AI Governance",
          },
        ],
        flashcards: [
          {
            id: "fc_ai_5",
            front: "Apa tujuan pola Human-in-the-Loop (HITL)?",
            back: "Menempatkan peninjauan manusia pada titik keputusan berisiko tinggi agar kecepatan AI tetap terjaga tanpa mengorbankan akuntabilitas, keadilan, dan keamanan bisnis.",
            competencyTag: "AI Governance",
          },
        ],
        questions: [
          {
            id: "ai_3_q1",
            text: "Mengapa alur AI untuk screening lamaran kerja harus dilengkapi mekanisme Human-in-the-Loop?",
            options: [
              "Untuk mencegah bias algoritmik dan memastikan keputusan karier kandidat tetap adil serta dapat dipertanggungjawabkan",
              "Agar proses rekrutmen memakan waktu 6 bulan",
              "Karena AI tidak mampu membaca format teks",
              "Untuk menghapus seluruh kriteria kompetensi lowongan",
            ],
            answerIndex: 0,
            explanation: "HITL mencegah bias tidak sengaja dan memastikan transparansi evaluasi kandidat.",
            competencyTag: "AI Governance",
          },
          {
            id: "ai_3_q2",
            text: "Apa langkah pertama yang harus dilakukan ketika fitur AI di produksi mulai menghasilkan jawaban melenceng dari kebijakan baru perusahaan?",
            options: [
              "Memperbarui dokumen sumber grounding/prompt, lalu menjalankan ulang Golden Dataset evals sebelum deploy",
              "Membiarkannya sampai pelanggan berhenti memakai aplikasi",
              "Menghapus seluruh pesan error di tampilan pengguna",
              "Mematikan pencatatan log audit",
            ],
            answerIndex: 0,
            explanation: "Pembaruan sumber pengetahuan yang tervalidasi oleh evaluasi otomatis menjamin perbaikan yang akurat dan aman.",
            competencyTag: "AI Operations",
          },
        ],
      },
    ],
  },
  {
    id: "product-management-growth",
    title: "Product Management & Growth Strategy",
    description:
      "Pelajari cara menyusun PRD tajam, menentukan North Star Metric, memprioritaskan roadmap dengan RICE, dan merancang eksperimen pertumbuhan produk digital.",
    category: "Desain & Produk",
    difficulty: "Menengah" as const,
    partner: "Indonesia Product Guild",
    logo: "🧭",
    image: "/src/assets/images/course_product_ux_1795577728388.jpg",
    duration: "4 Minggu",
    xpReward: 800,
    skills: ["Product Strategy", "PRD Writing", "RICE Prioritization", "North Star Metric", "Growth Experimentation"],
    linkedLabIds: ["lab-pm-prd-funnel", "lab-ux-heuristic-redesign"],
    casePrompt: {
      title: "Mini-PRD & Prioritas Roadmap Fitur Onboarding Pengguna Baru",
      scenario:
        "Hanya 28% pengguna baru aplikasi fintech yang menyelesaikan verifikasi akun dan transaksi pertama dalam 7 hari. Tim engineering hanya memiliki kapasitas 1 sprint (2 minggu) untuk 1 inisiatif utama.",
      deliverables: [
        "Rumuskan Problem Statement berbasis perilaku pengguna dan definisikan North Star + Activation Metric.",
        "Bandingkan 3 ide solusi menggunakan kerangka RICE (Reach, Impact, Confidence, Effort) untuk memilih 1 pemenang.",
        "Tulis Acceptance Criteria inti, potensi risiko, dan rencana pengukuran sukses pasca-rilis 14 hari.",
      ],
      rubricCriteria: [
        "Ketajaman rumusan masalah dan validasi metrik aktivasi",
        "Objektivitas dan ketepatan kalkulasi prioritas RICE",
        "Kejelasan cakupan MVP & Acceptance Criteria untuk engineer",
        "Kelengkapan guardrail metrics & mitigasi risiko rilis",
      ],
    },
    project: {
      title: "Product Requirements Document (PRD) & Growth Experiment Deck",
      description: "Susun PRD lengkap dari discovery hingga metrik evaluasi untuk produk digital siap rilis.",
      rubric: "Kejelasan masalah, prioritas berbasis data, acceptance criteria terukur, dan keselarasan bisnis.",
    },
    lessons: [
      {
        id: "pm_1",
        title: "Product Discovery, Problem Framing, & North Star Metric",
        xp: 160,
        estimatedMinutes: 20,
        contentMarkdown: `### Menemukan Masalah yang Layak Dipecahkan Sebelum Menulis Kode

Kesalahan paling mahal dalam pengembangan produk adalah membangun fitur yang rapi namun tidak menyelesaikan masalah nyata pengguna (*Feature Factory*).

- **Opportunity Solution Tree**: Mulai dari satu *Business Outcome* terukur → petakan *Opportunities* (pain points dari riset pengguna) → baru turunkan *Solutions* dan eksperimen kecil.
- **North Star Metric (NSM)**: Satu metrik inti yang mencerminkan **nilai nyata yang diterima pengguna** sekaligus memprediksi pertumbuhan pendapatan jangka panjang (contoh: *Weekly Completed Lessons* atau *Successful Monthly Bookings*, bukan sekadar jumlah unduhan).`,
        inlineChecks: [
          {
            id: "ic_pm_1",
            afterParagraph: 1,
            question: "Manakah yang paling memenuhi syarat sebagai North Star Metric untuk aplikasi edukasi karier?",
            options: [
              "Total tampilan halaman beranda per bulan",
              "Jumlah pengguna aktif yang menyelesaikan minimal 1 modul + kuis terverifikasi per minggu",
              "Jumlah notifikasi push yang dikirim server",
              "Jumlah baris kode yang ditulis tim engineering",
            ],
            answerIndex: 1,
            explanation: "North Star Metric harus menangkap nilai inti yang benar-benar dirasakan pengguna, bukan vanity metric seperti pageviews.",
            competencyTag: "Product Metrics",
          },
        ],
        flashcards: [
          {
            id: "fc_pm_1",
            front: "Apa beda Vanity Metric vs Actionable Metric?",
            back: "Vanity metric terlihat besar tapi tidak memandu keputusan (mis. total kumulatif unduhan). Actionable metric terkait langsung dengan perilaku nilai pengguna dan bisa diuji dampaknya (mis. Day-7 Activation Rate).",
            competencyTag: "Product Metrics",
          },
          {
            id: "fc_pm_2",
            front: "Sebutkan 4 variabel pada kerangka prioritas RICE.",
            back: "Reach (jumlah pengguna terdampak), Impact (besar dampak per pengguna), Confidence (tingkat keyakinan data), dibagi Effort (biaya person-months). Skor = (R × I × C) / E.",
            competencyTag: "Prioritization",
          },
        ],
        questions: [
          {
            id: "pm_1_q1",
            text: "Mengapa jumlah total unduhan aplikasi sejak rilis sering dianggap sebagai 'Vanity Metric'?",
            options: [
              "Angkanya selalu naik kumulatif dan tidak mencerminkan apakah pengguna benar-benar aktif serta mendapatkan nilai produk",
              "Karena tidak bisa dihitung di spreadsheet",
              "Karena aplikasi gratis tidak membutuhkan pengguna",
              "Karena unduhan hanya terjadi di desktop",
            ],
            answerIndex: 0,
            explanation: "Metrik kumulatif selalu tampak tumbuh meski retensi sebenarnya anjlok; PM berfokus pada aktivasi, retensi, dan engagement nyata.",
            competencyTag: "Product Metrics",
          },
          {
            id: "pm_1_q2",
            text: "Rumus skor prioritas RICE yang benar adalah...",
            options: [
              "(Reach × Impact × Confidence) / Effort",
              "(Reach + Effort) / Impact",
              "Effort / (Reach × Confidence)",
              "Impact × Effort × Cost",
            ],
            answerIndex: 0,
            explanation: "RICE memaksimalkan dampak dan jangkauan dengan keyakinan data tinggi per satuan upaya engineering.",
            competencyTag: "Prioritization",
          },
          {
            id: "pm_1_q3",
            text: "Apa bahaya pola kerja 'Feature Factory' dalam tim produk?",
            options: [
              "Tim sibuk merilis banyak fitur tanpa memverifikasi apakah fitur tersebut memecahkan masalah pengguna atau menggerakkan metrik bisnis",
              "Tim terlalu sering berbicara dengan pelanggan",
              "Tim menulis terlalu banyak acceptance criteria",
              "Tim melakukan eksperimen sebelum rilis penuh",
            ],
            answerIndex: 0,
            explanation: "Keberhasilan PM diukur dari outcome (dampak pengguna & bisnis), bukan output (jumlah fitur yang diluncurkan).",
            competencyTag: "Product Strategy",
          },
        ],
      },
      {
        id: "pm_2",
        title: "Menulis PRD Tajam, User Story, & Kolaborasi Engineering-Design",
        xp: 165,
        estimatedMinutes: 20,
        contentMarkdown: `### Anatomi PRD (Product Requirements Document) Modern

PRD modern bukan dokumen 40 halaman yang kaku, melainkan referensi hidup yang menyelaraskan PM, Desainer, QA, dan Engineer:
1. **Context & Problem**: Data kuantitatif + temuan kualitatif mengapa masalah ini penting *sekarang*.
2. **Goals & Non-Goals**: Mendefinisikan apa yang **tidak** masuk cakupan (Non-Goals) sama pentingnya untuk mencegah *scope creep*.
3. **User Flows & Edge Cases**: Tangani state kosong, gagal jaringan, dan pembatalan transaksi.
4. **Acceptance Criteria (Given-When-Then)**: Kriteria terukur agar QA dan Engineer memiliki definisi "Selesai" yang identik.`,
        inlineChecks: [
          {
            id: "ic_pm_2",
            afterParagraph: 1,
            question: "Mengapa bagian 'Non-Goals / Out of Scope' sangat penting di dalam dokumen PRD?",
            options: [
              "Untuk mencegah scope creep dan menyelaraskan ekspektasi stakeholder mengenai batas rilis tahap pertama",
              "Untuk memperpanjang jumlah halaman dokumen",
              "Agar engineer tidak perlu membuat pengujian otomatis",
              "Untuk menghapus seluruh metrik keberhasilan",
            ],
            answerIndex: 0,
            explanation: "Non-Goals eksplisit melindungi jadwal rilis MVP dan memperjelas fitur apa yang ditunda ke iterasi berikutnya.",
            competencyTag: "PRD Writing",
          },
        ],
        flashcards: [
          {
            id: "fc_pm_3",
            front: "Format penulisan Acceptance Criteria bergaya Gherkin",
            back: "GIVEN [kondisi awal], WHEN [aksi pengguna/sistem], THEN [hasil terukur yang diharapkan].",
            competencyTag: "PRD Writing",
          },
        ],
        questions: [
          {
            id: "pm_2_q1",
            text: "Manakah contoh Acceptance Criteria yang paling jelas dan dapat diuji oleh tim QA?",
            options: [
              "Halaman checkout harus terasa cepat dan nyaman",
              "Given keranjang bernilai Rp 250.000, When pengguna memakai voucher 20% (cap Rp 40.000), Then total bayar menjadi Rp 210.000 dalam <300ms",
              "Sistem diskon harus canggih seperti kompetitor",
              "Desain tombol harus disukai semua orang",
            ],
            answerIndex: 1,
            explanation: "Acceptance criteria yang kuat bersifat spesifik, objektif, dan memiliki hasil yang dapat diverifikasi otomatis maupun manual.",
            competencyTag: "PRD Writing",
          },
          {
            id: "pm_2_q2",
            text: "Ketika stakeholder meminta tambahan fitur besar di tengah sprint yang sedang berjalan, respons PM terbaik adalah...",
            options: [
              "Langsung memasukkannya ke sprint saat ini tanpa mengurangi tugas lain",
              "Mengevaluasi dampaknya terhadap target sprint, memaparkan trade-off ruang lingkup/jadwal secara transparan, dan memasukkannya ke backlog prioritas jika tidak darurat",
              "Mengabaikan pesan stakeholder",
              "Meminta engineer lembur setiap hari tanpa diskusi",
            ],
            answerIndex: 1,
            explanation: "PM menjaga fokus tim dengan mengelola trade-off secara transparan berbasis data dan kapasitas tim.",
            competencyTag: "Stakeholder Management",
          },
        ],
      },
      {
        id: "pm_3",
        title: "Growth Loops, Funnel AARRR, & Strategi Retensi Produk",
        xp: 165,
        estimatedMinutes: 20,
        contentMarkdown: `### Dari Linear Funnel (AARRR) ke Growth Loops Berkelanjutan

Kerangka **AARRR** (*Acquisition, Activation, Retention, Referral, Revenue*) memetakan titik bocor terbesar produk. Namun, produk dengan pertumbuhan majemuk membangun **Growth Loops**—di mana output satu kohort pengguna secara alami menarik pengguna baru (misalnya: peserta membagikan **Portofolio Terverifikasi / Sertifikat** ke LinkedIn → kolega melihat → mendaftar belajar).

- **Perbaiki Retensi Sebelum Memperbesar Akuisisi**: Menuangkan iklan ke produk dengan retensi rendah hanya menciptakan *leaky bucket*.`,
        inlineChecks: [
          {
            id: "ic_pm_3",
            afterParagraph: 1,
            question: "Apa risiko utama memperbesar anggaran iklan Acquisition saat Day-30 Retention produk masih sangat rendah?",
            options: [
              "Fenomena 'leaky bucket': biaya akuisisi membengkak namun pengguna cepat pergi sehingga pertumbuhan tidak berkelanjutan",
              "Server tidak lagi memerlukan database",
              "Retensi akan otomatis naik 100%",
              "Tidak ada dampak terhadap keuangan perusahaan",
            ],
            answerIndex: 0,
            explanation: "Memperkuat aktivasi dan retensi terlebih dahulu memastikan setiap rupiah akuisisi menghasilkan nilai jangka panjang (LTV).",
            competencyTag: "Growth Strategy",
          },
        ],
        flashcards: [
          {
            id: "fc_pm_4",
            front: "Apa kepanjangan Pirate Metrics (AARRR)?",
            back: "Acquisition (akuisisi), Activation (pengalaman aha pertama), Retention (kembali lagi), Referral (mengajak orang lain), Revenue (monetisasi).",
            competencyTag: "Growth Strategy",
          },
        ],
        questions: [
          {
            id: "pm_3_q1",
            text: "Momen pertama ketika pengguna baru benar-benar merasakan nilai inti produk Anda disebut tahap...",
            options: ["Activation (Aha! Moment)", "Churn", "Depreciation", "Procurement"],
            answerIndex: 0,
            explanation: "Activation adalah jembatan krusial dari pendaftaran menuju kebiasaan penggunaan berulang.",
            competencyTag: "Growth Strategy",
          },
          {
            id: "pm_3_q2",
            text: "Contoh nyata 'Viral / Content Growth Loop' pada platform edukasi karier adalah...",
            options: [
              "Lulusan membagikan halaman portofolio & sertifikat terverifikasi ke LinkedIn yang menarik calon peserta baru secara organik",
              "Membeli billboard statis tanpa tautan",
              "Menghapus tombol berbagi di aplikasi",
              "Menonaktifkan halaman verifikasi publik",
            ],
            answerIndex: 0,
            explanation: "Growth loop memanfaatkan output alami aktivitas pengguna untuk mendatangkan pengguna baru secara berulang dengan CAC rendah.",
            competencyTag: "Growth Strategy",
          },
        ],
      },
    ],
  },
  {
    id: "cloud-devops-security",
    title: "Cloud DevOps & Cybersecurity Fundamentals",
    description:
      "Pelajari containerization Docker, CI/CD zero-downtime, pencegahan OWASP Top 10, manajemen secret, dan respons insiden layanan cloud modern.",
    category: "Teknologi & IT",
    difficulty: "Lanjutan" as const,
    partner: "Cloud Native & SecOps ID",
    logo: "🛡️",
    image: "/src/assets/images/course_cloud_devops_1795577730437.jpg",
    duration: "4 Minggu",
    xpReward: 850,
    skills: ["Docker & Containers", "CI/CD Pipeline", "OWASP Security", "Cloud Architecture", "Incident Response"],
    linkedLabIds: ["lab-devops-security-audit", "lab-be-rate-limiter"],
    casePrompt: {
      title: "Audit Keamanan OWASP & Rancangan Pipeline CI/CD Zero-Downtime",
      scenario:
        "Sebuah startup SaaS masih melakukan deploy manual via SSH pada jam kerja, menyimpan kredensial database di file konfigurasi yang ikut ter-commit ke Git, dan baru saja mengalami insiden Broken Object Level Authorization (IDOR) di endpoint /api/invoices/:id.",
      deliverables: [
        "Susun rencana remediasi darurat (rotasi secret, perbaikan IDOR ownership check, dan secret scanning).",
        "Rancang tahapan pipeline CI/CD otomatis (Lint, Typecheck, Unit/Security Test, Build Docker Multi-Stage, Rolling/Blue-Green Deploy).",
        "Jelaskan strategi pemantauan & rollback cepat jika error rate pasca-rilis melebihi 1%.",
      ],
      rubricCriteria: [
        "Ketepatan mitigasi celah IDOR dan kebocoran secret",
        "Kelengkapan desain pipeline CI/CD & zero-downtime deployment",
        "Kualitas praktik container & least-privilege security",
        "Kesiapan observability dan prosedur rollback insiden",
      ],
    },
    project: {
      title: "Hardening & Deployment Runbook Layanan Produksi",
      description: "Susun Dockerfile multi-stage, alur CI/CD, dan checklist keamanan OWASP untuk aplikasi web modern.",
      rubric: "Keamanan kredensial, pencegahan OWASP Top 10, ketahanan deployment, dan kejelasan runbook.",
    },
    lessons: [
      {
        id: "dev_1",
        title: "Containerization Docker Multi-Stage & Prinsip Least Privilege",
        xp: 170,
        estimatedMinutes: 22,
        contentMarkdown: `### Mengapa Multi-Stage Docker Build Wajib di Produksi

Build image Docker naif sering membungkus compiler, devDependencies, dan hak akses \`root\` ke dalam container produksi—memperbesar permukaan serangan (*attack surface*) sekaligus memperlambat deployment.

1. **Multi-Stage Build**: Tahap pertama (\`builder\`) menginstal dependensi dan mengompilasi TypeScript/bundle; tahap kedua (\`runner\`) hanya menyalin artefak produksi ke base image ramping (\`node:20-alpine\`).
2. **Non-Root User**: Selalu jalankan proses aplikasi dengan \`USER node\` (bukan \`root\`).
3. **Immutable Artifacts**: Jangan pernah menanamkan file \`.env\` atau secret di dalam Docker image; suntikkan lewat *Secret Manager* saat runtime.`,
        inlineChecks: [
          {
            id: "ic_dev_1",
            afterParagraph: 1,
            question: "Apa manfaat keamanan utama menjalankan container Docker dengan non-root user dan multi-stage build?",
            options: [
              "Memperkecil ukuran image, membuang tool build yang tidak perlu, dan membatasi dampak jika aplikasi berhasil dieksploitasi",
              "Menghilangkan kebutuhan HTTPS pada load balancer",
              "Membuat database tidak perlu backup",
              "Mengizinkan secret ditulis langsung di Dockerfile",
            ],
            answerIndex: 0,
            explanation: "Mengurangi komponen di image akhir dan menanggalkan hak root (least privilege) secara signifikan mempersempit celah eksploitasi.",
            competencyTag: "Container Security",
          },
        ],
        flashcards: [
          {
            id: "fc_dev_1",
            front: "Mengapa file .env atau API key tidak boleh dimasukkan ke Docker image?",
            back: "Siapa pun yang memiliki akses ke container registry atau layer image dapat mengekstrak kredensial tersebut, dan rotasi secret menjadi sulit karena harus rebuild image.",
            competencyTag: "Secrets Management",
          },
          {
            id: "fc_dev_2",
            front: "Perbedaan Rolling Deployment vs Blue-Green Deployment",
            back: "Rolling mengganti instance lama secara bertahap. Blue-Green menyiapkan lingkungan baru penuh (Green) paralel dengan yang lama (Blue), lalu mengalihkan trafik seketika sehingga rollback bisa dilakukan dalam hitungan detik.",
            competencyTag: "CI/CD Pipeline",
          },
        ],
        questions: [
          {
            id: "dev_1_q1",
            text: "Praktik terbaik mengelola kredensial database dan API key pada layanan cloud modern adalah...",
            options: [
              "Menyimpannya di Secret Manager dan menyuntikkannya melalui environment variable saat runtime",
              "Menulisnya langsung di dalam Dockerfile agar cepat",
              "Menyimpannya di repositori Git publik dengan nama file berbeda",
              "Mengirimnya melalui query parameter URL frontend",
            ],
            answerIndex: 0,
            explanation: "Secret Manager mendukung enkripsi, kontrol akses ketat, audit akses, serta rotasi berkala tanpa mengubah kode.",
            competencyTag: "Secrets Management",
          },
          {
            id: "dev_1_q2",
            text: "Keunggulan utama strategi Blue-Green Deployment ketika rilis terbaru memicu bug kritis adalah...",
            options: [
              "Trafik dapat segera dialihkan kembali ke lingkungan stabil sebelumnya (instant rollback)",
              "Tidak membutuhkan pengujian otomatis sama sekali",
              "Menghapus seluruh data pengguna otomatis",
              "Mematikan seluruh server selama 2 jam",
            ],
            answerIndex: 0,
            explanation: "Karena versi stabil sebelumnya masih siaga di lingkungan paralel, pemulihan layanan terjadi hampir seketika.",
            competencyTag: "CI/CD Pipeline",
          },
          {
            id: "dev_1_q3",
            text: "Mengapa tahap Multi-Stage Build memisahkan stage 'builder' dan stage 'runner'?",
            options: [
              "Agar image produksi akhir ramping, bebas devDependencies, dan memiliki permukaan serangan lebih kecil",
              "Agar ukuran image menjadi lebih dari 4 GB",
              "Agar source code mentah selalu dapat diedit di dalam container",
              "Untuk menonaktifkan caching layer Docker",
            ],
            answerIndex: 0,
            explanation: "Image runner hanya memuat runtime dan hasil kompilasi yang dibutuhkan untuk menjalankan aplikasi.",
            competencyTag: "Container Security",
          },
        ],
      },
      {
        id: "dev_2",
        title: "OWASP Top 10: Mitigasi IDOR, SQL Injection, XSS, & Rate Limiting",
        xp: 175,
        estimatedMinutes: 22,
        contentMarkdown: `### 4 Celah OWASP Paling Sering Ditemukan pada Audit Aplikasi Web

1. **Broken Access Control / IDOR**: Endpoint \`GET /api/orders/1042\` tidak boleh sekadar memeriksa apakah pengguna sudah login—ia **wajib** memverifikasi \`order.userId === req.userId\` di sisi server.
2. **SQL Injection**: Selalu gunakan *parameterized queries* (seperti Drizzle ORM/Prepared Statements); jangan pernah menggabungkan input pengguna ke string SQL mentah.
3. **Cross-Site Scripting (XSS)**: Hindari injeksi HTML mentah dari data tak tepercaya dan aktifkan header keamanan (\`Content-Security-Policy\`, \`HttpOnly\` cookies).
4. **Brute Force & Abuse**: Lindungi endpoint login dan AI dengan Rate Limiter berlapis.`,
        inlineChecks: [
          {
            id: "ic_dev_2",
            afterParagraph: 1,
            question: "Bagaimana cara paling tepat menutup celah IDOR pada endpoint GET /api/invoices/:invoiceId?",
            options: [
              "Memverifikasi di server bahwa invoice.ownerId sama dengan identitas user yang terautentikasi (atau role admin)",
              "Menyembunyikan tombol invoice di tampilan frontend saja",
              "Mengubah HTTP method dari GET menjadi POST tanpa cek kepemilikan",
              "Mengandalkan parameter userId yang dikirim dari body klien",
            ],
            answerIndex: 0,
            explanation: "Pemeriksaan kepemilikan (authorization check) harus selalu ditegakkan di sisi server berdasarkan token identitas yang terverifikasi.",
            competencyTag: "OWASP Security",
          },
        ],
        flashcards: [
          {
            id: "fc_dev_3",
            front: "Apa itu kerentanan IDOR (Insecure Direct Object Reference)?",
            back: "Celah Broken Access Control di mana pengguna dapat mengakses atau mengubah data milik pengguna lain hanya dengan mengganti ID pada URL/payload karena server lupa memeriksa hak kepemilikan.",
            competencyTag: "OWASP Security",
          },
        ],
        questions: [
          {
            id: "dev_2_q1",
            text: "Cara paling efektif dan standar untuk mencegah SQL Injection pada backend Node.js/TypeScript adalah...",
            options: [
              "Menggunakan parameterized queries atau ORM yang memisahkan struktur kueri dari nilai parameter",
              "Menghapus karakter spasi dari seluruh input pengguna",
              "Mengubah nama tabel menjadi huruf kapital",
              "Menyembunyikan pesan error database di CSS",
            ],
            answerIndex: 0,
            explanation: "Parameterized queries memastikan masukan pengguna selalu diperlakukan sebagai data literal, bukan perintah SQL yang dapat dieksekusi.",
            competencyTag: "OWASP Security",
          },
          {
            id: "dev_2_q2",
            text: "Flag cookie manakah yang mencegah JavaScript di browser membaca cookie sesi sehingga membatasi dampak pencurian sesi akibat XSS?",
            options: ["HttpOnly", "PublicRead", "MaxWidth", "NoCache"],
            answerIndex: 0,
            explanation: "Cookie bertanda HttpOnly tidak dapat diakses melalui document.cookie oleh skrip klien.",
            competencyTag: "Web Security",
          },
        ],
      },
      {
        id: "dev_3",
        title: "SLI/SLO, Alerting Cerdas, & Blameless Post-Mortem Insiden",
        xp: 165,
        estimatedMinutes: 18,
        contentMarkdown: `### Mengelola Keandalan Layanan Secara Profesional

- **SLI (Service Level Indicator)**: Ukuran nyata performa (mis. 99,94% request berhasil dalam <300ms).
- **SLO (Service Level Objective)**: Target internal tim (mis. 99,9% per 30 hari) yang menentukan *Error Budget*.
- **Blameless Post-Mortem**: Setelah layanan pulih dari gangguan, fokus investigasi bukan mencari "siapa yang salah", melainkan **"celah sistem apa yang membuat kesalahan manusia bisa lolos ke produksi"** beserta aksi pencegahan terukur.`,
        inlineChecks: [
          {
            id: "ic_dev_3",
            afterParagraph: 1,
            question: "Apa fokus utama dokumen Blameless Post-Mortem setelah insiden downtime teratasi?",
            options: [
              "Mengidentifikasi akar masalah sistemik dan menyusun perbaikan proses/otomasi agar insiden serupa tidak terulang",
              "Mencari individu untuk diberi sanksi di grup umum",
              "Menghapus riwayat monitoring agar laporan terlihat bersih",
              "Menunda dokumentasi hingga akhir tahun",
            ],
            answerIndex: 0,
            explanation: "Budaya blameless mendorong pelaporan jujur dan perbaikan sistemik yang jauh lebih efektif mencegah insiden berulang.",
            competencyTag: "Incident Response",
          },
        ],
        flashcards: [
          {
            id: "fc_dev_4",
            front: "Perbedaan SLI, SLO, dan SLA",
            back: "SLI = indikator pengukuran aktual; SLO = target reliabilitas internal tim; SLA = perjanjian resmi dengan pelanggan beserta konsekuensi kompensasi jika dilanggar.",
            competencyTag: "Site Reliability",
          },
        ],
        questions: [
          {
            id: "dev_3_q1",
            text: "Jika sebuah sistem menetapkan SLO ketersediaan 99,9% dalam 30 hari, sisa 0,1% toleransi gangguan disebut...",
            options: ["Error Budget", "Technical Debt Tax", "Throughput Cap", "Cold Start"],
            answerIndex: 0,
            explanation: "Error Budget menyeimbangkan kecepatan inovasi rilis fitur dengan kewajiban menjaga kestabilan layanan.",
            competencyTag: "Site Reliability",
          },
          {
            id: "dev_3_q2",
            text: "Langkah prioritas PERTAMA saat alarm lonjakan error 5xx berbunyi di produksi pasca-rilis baru adalah...",
            options: [
              "Mitigasi dampak pengguna secepatnya (rollback atau matikan feature flag) sebelum melakukan investigasi mendalam",
              "Menulis ulang seluruh modul dari awal di server produksi",
              "Mematikan sistem notifikasi alarm",
              "Menunggu hingga jam kerja keesokan harinya",
            ],
            answerIndex: 0,
            explanation: "Dalam respons insiden SRE, pemulihan layanan (mitigation/rollback) selalu menjadi prioritas utama sebelum root-cause deep dive.",
            competencyTag: "Incident Response",
          },
        ],
      },
    ],
  },
  {
    id: "cpns-skd-kedinasan",
    title: "Persiapan CPNS & Kedinasan: TWK, TIU, TKP",
    description:
      "Latihan intensif Seleksi Kompetensi Dasar (SKD) berbasis CAT BKN: penalaran pilar kebangsaan TWK, kecepatan hitung & silogisme TIU, dan strategi skor 5 TKP.",
    category: "Persiapan BUMN & Corporate",
    difficulty: "Menengah" as const,
    partner: "Akademi ASN & Kedinasan Nusantara",
    logo: "🇮🇩",
    image: "/src/assets/images/course_cpns_finance_1795577729361.jpg",
    duration: "4 Minggu",
    xpReward: 820,
    skills: ["TWK Pilar Negara", "TIU Numerik & Logika", "TKP Pelayanan Publik", "Anti-Radikalisme", "Manajemen Waktu CAT"],
    linkedLabIds: ["lab-cpns-tkp-policy", "lab-bumn-case-akhlak"],
    casePrompt: {
      title: "Analisis Kebijakan Pelayanan Publik & Integritas ASN (Studi Kasus SKB/TKP)",
      scenario:
        "Anda ditugaskan sebagai analis layanan publik di kantor pelayanan terpadu daerah. Warga mengeluhkan pungutan liar oleh oknum perantara di luar loket serta lambatnya pengurusan dokumen perizinan bagi warga lansia yang kurang paham teknologi.",
      deliverables: [
        "Susun langkah penegakan integritas dan transparansi biaya/alur layanan sesuai nilai BerAKHLAK ASN.",
        "Rancang skema layanan inklusif (jalur cepat/pendampingan lansia & digitalisasi antrean) tanpa mengorbankan standar verifikasi.",
        "Tentukan indikator evaluasi pelayanan publik 60 hari untuk dilaporkan kepada pimpinan instansi.",
      ],
      rubricCriteria: [
        "Kepatuhan pada prinsip integritas, netralitas, dan anti-pungli",
        "Inklusivitas dan empati dalam desain pelayanan publik",
        "Kelayakan langkah digitalisasi dan penyederhanaan birokrasi",
        "Kejelasan metrik akuntabilitas layanan",
      ],
    },
    project: {
      title: "Kajian Reformasi Birokrasi & Standar Pelayanan Publik",
      description: "Susun usulan perbaikan SOP layanan instansi berbasis prinsip BerAKHLAK dan keterbukaan informasi.",
      rubric: "Ketepatan landasan konstitusional, solusi pelayanan konkret, dan indikator keberhasilan terukur.",
    },
    lessons: [
      {
        id: "cpns_1",
        title: "TWK Penalaran: Implementasi Pancasila, UUD 1945, & Bela Negara",
        xp: 160,
        estimatedMinutes: 20,
        contentMarkdown: `### Pola Soal TWK Modern: Dari Hafalan ke Penalaran Kasus

Seleksi SKD CPNS terbaru menggeser soal TWK dari sekadar hafalan tanggal menjadi **penerapan nilai dalam konteks kebangsaan dan birokrasi**.

- **Integritas vs Nasionalisme vs Bela Negara**:
  - **Integritas**: Kejujuran, konsistensi ucapan & tindakan, menolak gratifikasi/konflik kepentingan.
  - **Nasionalisme**: Menempatkan kepentingan bangsa di atas golongan, mencintai produk dan persatuan Indonesia.
  - **Bela Negara**: Kesiapan berkontribusi nyata sesuai profesi (ASN melayani tanpa diskriminasi, guru mencerdaskan, engineer menjaga keamanan data negara).
- **UUD 1945**: Pahami fungsi kewenangan lembaga negara pasca-amandemen (DPR legislasi/anggaran/pengawasan, MK uji materi UU terhadap UUD, BPK pemeriksaan keuangan negara).`,
        inlineChecks: [
          {
            id: "ic_cpns_1",
            afterParagraph: 1,
            question: "Lembaga negara yang berwenang menguji undang-undang terhadap Undang-Undang Dasar 1945 (judicial review) adalah...",
            options: ["Mahkamah Agung", "Mahkamah Konstitusi", "Badan Pemeriksa Keuangan", "Komisi Yudisial"],
            answerIndex: 1,
            explanation: "Berdasarkan Pasal 24C UUD 1945, Mahkamah Konstitusi menguji UU terhadap UUD, sedangkan Mahkamah Agung menguji peraturan di bawah UU terhadap UU.",
            competencyTag: "TWK Pilar Negara",
          },
        ],
        flashcards: [
          {
            id: "fc_cpns_1",
            front: "Perbedaan kewenangan uji materi Mahkamah Konstitusi (MK) vs Mahkamah Agung (MA)",
            back: "MK menguji Undang-Undang (UU) terhadap UUD 1945. MA menguji peraturan perundang-undangan di bawah UU (seperti PP, Perpres, Perda) terhadap UU.",
            competencyTag: "TWK Pilar Negara",
          },
          {
            id: "fc_cpns_2",
            front: "Apa 5 aspek utama pada subtes TKP CPNS?",
            back: "Pelayanan Publik, Jejaring Kerja, Sosial Budaya, Teknologi Informasi & Komunikasi (TIK), Profesionalisme, serta Anti-Radikalisme.",
            competencyTag: "TKP ASN",
          },
        ],
        questions: [
          {
            id: "cpns_1_q1",
            text: "Seorang ASN menolak pemberian parsel mewah dari kontraktor proyek jalan yang sedang dievaluasi timnya. Sikap tersebut paling utama mencerminkan pilar...",
            options: ["Integritas dan pengamalan Sila ke-2 & ke-5", "Egoisme sektoral", "Sentralisasi kewenangan", "Netralitas pasif"],
            answerIndex: 0,
            explanation: "Menolak gratifikasi yang berpotensi menimbulkan konflik kepentingan adalah wujud inti integritas aparatur sipil negara.",
            competencyTag: "TWK Integritas",
          },
          {
            id: "cpns_1_q2",
            text: "Pengujian Peraturan Daerah (Perda) terhadap Undang-Undang merupakan kewenangan dari...",
            options: ["Mahkamah Konstitusi", "Mahkamah Agung", "DPR RI", "Dewan Perwakilan Daerah"],
            answerIndex: 1,
            explanation: "Peraturan di bawah tingkat Undang-Undang diuji terhadap Undang-Undang oleh Mahkamah Agung (Pasal 24A UUD 1945).",
            competencyTag: "TWK Pilar Negara",
          },
          {
            id: "cpns_1_q3",
            text: "Bentuk pengamalan Bela Negara paling kontekstual bagi seorang analis data di instansi pemerintah adalah...",
            options: [
              "Menjaga keamanan data kependudukan dan menyusun analitik kebijakan publik secara akurat serta akuntabel",
              "Menolak bekerja sama dengan unit daerah lain",
              "Mengutamakan kepentingan kelompok sendiri dalam penyusunan anggaran",
              "Menunda digitalisasi agar pekerjaan manual tetap panjang",
            ],
            answerIndex: 0,
            explanation: "Bela Negara dilaksanakan sesuai peran dan profesi masing-masing demi kedaulatan, keamanan, dan kesejahteraan masyarakat.",
            competencyTag: "TWK Bela Negara",
          },
        ],
      },
      {
        id: "cpns_2",
        title: "TIU Cepat: Perbandingan Senilai/Berbalik Nilai, Silogisme, & Analitis",
        xp: 165,
        estimatedMinutes: 20,
        contentMarkdown: `### Trik 25 Detik Menyelesaikan Soal Hitungan TIU

1. **Perbandingan Berbalik Nilai (Pekerja × Waktu)**:
   - Jika 12 pekerja menyelesaikan proyek dalam 20 hari, maka total beban kerja = \`12 × 20 = 240 orang-hari\`.
   - Jika pekerjaan terhenti 4 hari setelah berjalan 8 hari, sisa beban = \`240 - (12 × 8) = 144 orang-hari\`, sisa waktu = \`20 - 8 - 4 = 8 hari\`. Maka pekerja dibutuhkan = \`144 / 8 = 18 pekerja\` (tambahan **6 pekerja**).
2. **Kecepatan & Berpapasan**:
   - Waktu berpapasan (berangkat bersamaan) = \`Jarak Total / (v1 + v2)\`.
   - Waktu menyusul = \`Selisih Jarak Awal / (v_cepat - v_lambat)\`.`,
        inlineChecks: [
          {
            id: "ic_cpns_2",
            afterParagraph: 1,
            question: "Dua mobil berangkat bersamaan dari Kota A dan Kota B yang berjarak 240 km dengan kecepatan 50 km/jam dan 70 km/jam saling mendekat. Setelah berapa jam mereka berpapasan?",
            options: ["1,5 jam", "2 jam", "2,5 jam", "3 jam"],
            answerIndex: 1,
            explanation: "Waktu berpapasan = 240 / (50 + 70) = 240 / 120 = 2 jam.",
            competencyTag: "TIU Numerik",
          },
        ],
        flashcards: [
          {
            id: "fc_cpns_3",
            front: "Rumus cepat waktu berpapasan vs waktu menyusul pada TIU",
            back: "Berpapasan (berangkat sama) = Jarak / (v1 + v2). Menyusul = Selisih Jarak Awal / (v2 - v1).",
            competencyTag: "TIU Numerik",
          },
        ],
        questions: [
          {
            id: "cpns_2_q1",
            text: "Suatu proyek direncanakan selesai dalam 30 hari oleh 15 pekerja. Setelah dikerjakan 6 hari, proyek terhenti 4 hari. Berapa tambahan pekerja agar proyek selesai tepat waktu?",
            options: ["2 orang", "3 orang", "4 orang", "5 orang"],
            answerIndex: 1,
            explanation: "Total beban = 450. Selesai 6 hari = 90. Sisa beban = 360. Sisa hari = 30 - 6 - 4 = 20 hari. Pekerja perlu = 360/20 = 18 orang → tambahan 18 - 15 = 3 orang.",
            competencyTag: "TIU Numerik",
          },
          {
            id: "cpns_2_q2",
            text: "Jika seluruh peserta yang lulus tahap administrasi mengikuti ujian CAT, dan sebagian peserta ujian CAT mendapat nilai di atas ambang batas, kesimpulan paling valid adalah...",
            options: [
              "Sebagian peserta yang lulus administrasi mendapat nilai di atas ambang batas",
              "Semua peserta yang lulus administrasi pasti lulus ujian CAT",
              "Tidak ada peserta ujian CAT yang lulus administrasi",
              "Semua peserta ujian CAT mendapat nilai sempurna",
            ],
            answerIndex: 0,
            explanation: "Himpunan lulus administrasi berada di dalam peserta CAT, sehingga irisan 'di atas ambang batas' berlaku bagi sebagian peserta.",
            competencyTag: "TIU Silogisme",
          },
          {
            id: "cpns_2_q3",
            text: "Harga sebuah buku setelah diskon 20% adalah Rp 96.000. Berapakah harga awal buku tersebut sebelum diskon?",
            options: ["Rp 110.000", "Rp 115.200", "Rp 120.000", "Rp 125.000"],
            answerIndex: 2,
            explanation: "80% × Harga Awal = 96.000 → Harga Awal = 96.000 / 0,8 = Rp 120.000.",
            competencyTag: "TIU Numerik",
          },
        ],
      },
      {
        id: "cpns_3",
        title: "Strategi Skor 5 TKP: Pelayanan Publik, TIK, & Anti-Radikalisme",
        xp: 165,
        estimatedMinutes: 18,
        contentMarkdown: `### Cara Memilih Opsi Bernilai Poin 5 (Tertinggi) pada TKP

Pada TKP, seluruh pilihan terlihat baik—tetapi hanya **satu opsi** yang mendapat skor 5. Gunakan kunci pemetaan berikut:
- **Pelayanan Publik**: Pilih opsi yang **ramah, cepat, solutif, tidak diskriminatif, dan tetap patuh SOP** (bukan melanggar aturan demi cepat).
- **TIK**: Pilih opsi yang **antusias mempelajari teknologi baru, mendorong efisiensi tim, dan menjaga keamanan siber**.
- **Anti-Radikalisme**: Pilih opsi yang **tegas menolak intoleransi/ujaran kebencian secara persuasif, objektif, dan melapor lewat jalur resmi bila mengancam keamanan**.`,
        inlineChecks: [
          {
            id: "ic_cpns_3",
            afterParagraph: 1,
            question: "Dalam soal TKP Pelayanan Publik, seorang warga marah di loket karena dokumen persyaratannya kurang lengkap. Opsi poin 5 adalah...",
            options: [
              "Tetap tenang, mendengarkan keluhan dengan empati, menjelaskan syarat secara jelas, dan memandu cara melengkapinya secepat mungkin sesuai prosedur",
              "Meloloskan berkasnya meski syarat wajib kurang agar warga berhenti marah",
              "Membalas dengan nada tinggi karena kesalahan ada pada warga",
              "Menutup loket lebih awal untuk menghindari keributan",
            ],
            answerIndex: 0,
            explanation: "Opsi poin 5 menggabungkan empati tinggi, komunikasi jernih, solusi konkret, dan kepatuhan pada SOP.",
            competencyTag: "TKP Pelayanan Publik",
          },
        ],
        flashcards: [
          {
            id: "fc_cpns_4",
            front: "Ciri utama jawaban poin 5 pada subtes TKP Sosial Budaya",
            back: "Menghargai keberagaman adat/agama/latar belakang, proaktif beradaptasi, bersikap inklusif tanpa membeda-bedakan layanan, dan menjaga harmoni kerja.",
            competencyTag: "TKP Sosial Budaya",
          },
        ],
        questions: [
          {
            id: "cpns_3_q1",
            text: "Instansi Anda meluncurkan aplikasi arsip digital baru yang membuat sebagian pegawai senior kebingungan. Tindakan bernilai TKP tertinggi adalah...",
            options: [
              "Menguasai sistem baru lebih dulu lalu berinisiatif membuat panduan ringkas dan mendampingi rekan senior secara sabar",
              "Fokus menyelesaikan pekerjaan sendiri saja karena bukan tugas Anda melatih orang lain",
              "Menyarankan pimpinan kembali ke arsip kertas selamanya",
              "Mengeluh tentang lambatnya rekan kerja di media sosial",
            ],
            answerIndex: 0,
            explanation: "Menggabungkan penguasaan TIK, kolaborasi jejaring kerja, dan kepedulian tim meraih skor tertinggi (5).",
            competencyTag: "TKP TIK & Jejaring Kerja",
          },
          {
            id: "cpns_3_q2",
            text: "Anda menemukan rekan di grup chat kerja menyebarkan konten provokatif bermuatan intoleransi yang belum terverifikasi. Sikap TKP Anti-Radikalisme terbaik adalah...",
            options: [
              "Mengingatkan secara santun dan objektif tentang etika bermedia ASN, mengajak cek fakta, serta berkoordinasi dengan atasan jika perilaku berlanjut",
              "Ikut meneruskan pesan tersebut agar banyak yang tahu",
              "Diam sepenuhnya meski merusak keharmonisan unit kerja",
              "Membalas dengan hinaan personal di grup",
            ],
            answerIndex: 0,
            explanation: "Pendekatan tegas, objektif, edukatif, dan sesuai mekanisme pembinaan organisasi adalah respons poin 5 untuk Anti-Radikalisme.",
            competencyTag: "TKP Anti-Radikalisme",
          },
        ],
      },
    ],
  },
];

export const NEW_INTERACTIVE_LABS = [
  {
    challengeId: "lab-ai-prompt-architecture",
    title: "Desain System Prompt & JSON Schema Triage Pelanggan AI",
    track: "data",
    difficulty: "Menengah",
    estimatedMinutes: 25,
    language: "case_markdown",
    summary:
      "Rancang arsitektur System Prompt anti-halusinasi, skema output JSON ketat, dan strategi eskalasi manusia untuk otomasi Customer Support.",
    promptMarkdown: `### Konteks Kasus
Sebuah perusahaan e-commerce ingin mengotomatiskan klasifikasi awal 1.800 tiket keluhan pelanggan per hari menggunakan LLM.

### Tantangan Utama
- Model sebelumnya sering mengarang kebijakan pengembalian dana (*hallucination*).
- Output teks bebas sulit dibaca otomatis oleh sistem CRM.
- Beberapa tiket mengandung nomor rekening & NIK pelanggan (PII).

### Tugas Anda
Tulis blueprint prompt lengkap mencakup:
1. **System Prompt** terstruktur (Role, Rules anti-halusinasi, aturan masking PII).
2. **Skema Output JSON** (field \`category\`, \`urgency\`, \`requiresHumanEscalation\`, \`draftReply\`, \`confidence\`).
3. **2 Contoh Few-Shot** (1 kasus normal, 1 kasus eskalasi risiko tinggi).`,
    starterCode: `## 1. System Prompt & Guardrails
Role: ...
Aturan Anti-Halusinasi:
- ...

## 2. Skema Output JSON
\`\`\`json
{
  "category": "refund | pengiriman | akun | teknis",
  "urgency": "low | medium | high",
  "requiresHumanEscalation": false,
  "draftReply": "..."
}
\`\`\`

## 3. Contoh Few-Shot & Rencana Evals
- Kasus 1 (Normal): ...
- Kasus 2 (Eskalasi Manusia): ...`,
    hints: [
      "Tegaskan bahwa jika kebijakan tidak tercantum pada konteks SOP, AI wajib mengisi requiresHumanEscalation: true.",
      "Sertakan aturan untuk tidak pernah mengulang nomor kartu/NIK di draftReply.",
      "Tambahkan 2–3 metrik evaluasi seperti JSON Validity Rate dan Hallucination Rate.",
    ],
    testCases: [],
    rubricCriteria: [
      { id: "r1", title: "Kejelasan System Prompt & Guardrails", weight: 35, description: "Aturan peran, grounding fakta, dan pencegahan halusinasi tegas." },
      { id: "r2", title: "Ketepatan JSON Schema & Few-Shot", weight: 35, description: "Skema mudah diparse backend dan didukung contoh akurat." },
      { id: "r3", title: "Keamanan PII & Evaluasi Kualitas", weight: 30, description: "Ada aturan privasi data dan metrik evaluasi sebelum rilis." },
    ],
    skills: ["Prompt Engineering", "Structured JSON Output", "AI Evaluation", "Data Privacy"],
    xpReward: 230,
    gemsReward: 30,
  },
  {
    challengeId: "lab-pm-prd-funnel",
    title: "Mini-PRD & Prioritas RICE Fitur Aktivasi Fintech",
    track: "bumn_case",
    difficulty: "Menengah",
    estimatedMinutes: 25,
    language: "case_markdown",
    summary:
      "Rumuskan Problem Statement, hitung prioritas RICE untuk 3 inisiatif fitur, dan tulis Acceptance Criteria siap bangun bagi tim Engineering.",
    promptMarkdown: `### Konteks Kasus
Tingkat penyelesaian verifikasi akun (e-KYC) pada aplikasi finansial hanya **31%**. Analitik menunjukkan 60% pengguna berhenti pada langkah unggah foto KTP karena kamera sering gagal fokus dan tidak ada panduan pencahayaan.

### Tugas Anda
Susun Mini-PRD ringkas berisi:
1. **Problem Statement & Target Metrik** (Activation Rate + Guardrail Fraud Rate).
2. **Matriks Prioritas RICE** membandingkan 3 ide (Panduan Kamera Real-time, Login Sosial, dan Program Cashback).
3. **Acceptance Criteria (Given-When-Then)** untuk solusi pemenang dan **Non-Goals** sprint pertama.`,
    starterCode: `## 1. Problem Statement & Metrik
- Masalah: ...
- Target Primer: ...
- Metrik Guardrail: ...

## 2. Perbandingan Prioritas RICE
| Inisiatif | Reach | Impact | Confidence | Effort | Skor RICE |
| --- | --- | --- | --- | --- | --- |
| Panduan Kamera Real-time | ... | ... | ... | ... | ... |

## 3. Acceptance Criteria & Non-Goals
- Given ..., When ..., Then ...
- Non-Goals Sprint 1: ...`,
    hints: [
      "Hitung skor RICE secara konsisten: (Reach * Impact * Confidence) / Effort.",
      "Pastikan metrik guardrail mencakup tingkat kesalahan verifikasi (false acceptance/rejection) agar keamanan KYC tetap terjaga.",
      "Tulis Non-Goals eksplisit agar tim engineering tidak terkena scope creep.",
    ],
    testCases: [],
    rubricCriteria: [
      { id: "r1", title: "Ketajaman Problem & Metrik", weight: 35, description: "Masalah terukur jelas lengkap dengan target primer dan guardrail." },
      { id: "r2", title: "Objektivitas Prioritas RICE", weight: 35, description: "Perbandingan inisiatif logis dan perhitungan konsisten." },
      { id: "r3", title: "Acceptance Criteria & Scope Control", weight: 30, description: "Siap diuji QA dan menyertakan Non-Goals yang tegas." },
    ],
    skills: ["Product Strategy", "PRD Writing", "RICE Prioritization", "Growth Experimentation"],
    xpReward: 220,
    gemsReward: 30,
  },
  {
    challengeId: "lab-devops-security-audit",
    title: "Audit OWASP API & Rancangan Pipeline CI/CD Zero-Downtime",
    track: "backend_sql",
    difficulty: "Lanjutan",
    estimatedMinutes: 30,
    language: "case_markdown",
    summary:
      "Identifikasi celah IDOR, kebocoran secret, dan susun pipeline CI/CD container aman dengan strategi rollback cepat.",
    promptMarkdown: `### Temuan Audit Awal
Sebuah API Node.js + PostgreSQL menunjukkan gejala berisiko tinggi:
1. Endpoint \`GET /api/documents/:id\` mengembalikan dokumen milik pengguna lain saat ID diganti.
2. File \`.env\` pernah ter-commit ke repositori Git.
3. Deployment manual menyebabkan downtime 6 menit setiap kali rilis.

### Tugas Anda
Tulis rencana teknis terstruktur:
1. **Remediasi Keamanan Segera** (perbaikan kode IDOR, rotasi secret, parameterized query, dan secret scanning).
2. **Tahapan CI/CD Pipeline** (Lint/Typecheck → Security Scan → Multi-Stage Docker Build → Blue-Green/Rolling Deploy).
3. **Strategi Monitoring & Rollback** berbasis metrik error rate 5xx dan latensi p95.`,
    starterCode: `## 1. Remediasi Keamanan (IDOR & Secrets)
- Perbaikan endpoint: ...
- Penanganan secret bocor: ...

## 2. Arsitektur Pipeline CI/CD Zero-Downtime
1. ...
2. ...

## 3. Observability & Prosedur Rollback
- Trigger Rollback: ...`,
    hints: [
      "Menghapus .env dari commit terbaru TIDAK cukup—wajib melakukan rotasi seluruh kredensial yang pernah terpapar.",
      "Untuk IDOR, filter kueri langsung menggunakan WHERE id = $1 AND user_id = $2 dari token terverifikasi.",
      "Sertakan non-root user pada Docker runner dan health check endpoint sebelum memindahkan trafik.",
    ],
    testCases: [],
    rubricCriteria: [
      { id: "r1", title: "Ketepatan Remediasi OWASP & Secret", weight: 40, description: "Menutup IDOR di server dan melakukan rotasi penuh kredensial bocor." },
      { id: "r2", title: "Kualitas Pipeline CI/CD & Container", weight: 35, description: "Tahapan otomatis, multi-stage non-root, dan zero-downtime valid." },
      { id: "r3", title: "Observability & Rollback Readiness", weight: 25, description: "Memiliki ambang alarm jelas dan langkah pemulihan cepat." },
    ],
    skills: ["OWASP Security", "CI/CD Pipeline", "Docker & Containers", "Incident Response"],
    xpReward: 260,
    gemsReward: 40,
  },
  {
    challengeId: "lab-excel-finance-kpi",
    title: "Kalkulator Unit Economics: Gross Margin, Breakeven ROAS & CCC",
    track: "data",
    difficulty: "Menengah",
    estimatedMinutes: 25,
    language: "javascript",
    summary:
      "Implementasikan fungsi analisis keuangan & pemasaran untuk menghitung Gross Margin %, Breakeven ROAS, Net Profit, dan Cash Conversion Cycle.",
    promptMarkdown: `### Konteks Kasus
Tim Finance & Business Analytics membutuhkan fungsi murni \`analyzeUnitEconomics(input)\` untuk mengaudit kelayakan produk D2C sebelum skala anggaran iklan.

### Spesifikasi Fungsi
Input berbentuk objek \`{ revenue, cogs, adSpend, operatingCost, dio, dso, dpo }\`:
1. \`grossProfit = revenue - cogs\`
2. \`grossMarginPct = revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(1)) : 0\`
3. \`breakevenRoas = grossProfit > 0 ? Number((revenue / grossProfit).toFixed(2)) : 0\`
4. \`actualRoas = adSpend > 0 ? Number((revenue / adSpend).toFixed(2)) : 0\`
5. \`netProfit = revenue - cogs - adSpend - operatingCost\`
6. \`cccDays = dio + dso - dpo\`
7. \`isHealthy = netProfit > 0 && actualRoas >= breakevenRoas\`
Kembalikan objek berisi 7 properti tersebut.`,
    starterCode: `function analyzeUnitEconomics(input) {
  const { revenue = 0, cogs = 0, adSpend = 0, operatingCost = 0, dio = 0, dso = 0, dpo = 0 } = input || {};
  const grossProfit = revenue - cogs;
  const grossMarginPct = revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(1)) : 0;
  const breakevenRoas = grossProfit > 0 ? Number((revenue / grossProfit).toFixed(2)) : 0;
  const actualRoas = adSpend > 0 ? Number((revenue / adSpend).toFixed(2)) : 0;
  const netProfit = revenue - cogs - adSpend - operatingCost;
  const cccDays = dio + dso - dpo;
  const isHealthy = netProfit > 0 && actualRoas >= breakevenRoas;

  return {
    grossProfit,
    grossMarginPct,
    breakevenRoas,
    actualRoas,
    netProfit,
    cccDays,
    isHealthy,
  };
}`,
    hints: [
      "Gunakan Number((nilai).toFixed(2)) agar hasil pembulatan konsisten sebagai tipe number, bukan string.",
      "Pastikan tidak terjadi pembagian dengan nol (division by zero) saat revenue, grossProfit, atau adSpend bernilai 0.",
      "Ingat rumus Cash Conversion Cycle: DIO + DSO - DPO.",
    ],
    testCases: [
      {
        id: "tc-1",
        label: "Bisnis sehat dengan margin 40% dan ROAS 4.0x",
        expression: `analyzeUnitEconomics({ revenue: 100000000, cogs: 60000000, adSpend: 25000000, operatingCost: 5000000, dio: 30, dso: 20, dpo: 35 })`,
        expected: {
          grossProfit: 40000000,
          grossMarginPct: 40,
          breakevenRoas: 2.5,
          actualRoas: 4,
          netProfit: 10000000,
          cccDays: 15,
          isHealthy: true,
        },
      },
      {
        id: "tc-2",
        label: "Bisnis merugi karena ROAS di bawah breakeven",
        expression: `analyzeUnitEconomics({ revenue: 80000000, cogs: 56000000, adSpend: 30000000, operatingCost: 6000000, dio: 45, dso: 50, dpo: 25 })`,
        expected: {
          grossProfit: 24000000,
          grossMarginPct: 30,
          breakevenRoas: 3.33,
          actualRoas: 2.67,
          netProfit: -12000000,
          cccDays: 70,
          isHealthy: false,
        },
      },
    ],
    rubricCriteria: [
      { id: "r1", title: "Akurasi Formula Finansial & Unit Economics", weight: 45, description: "Margin, Breakeven ROAS, Net Profit, dan CCC tepat." },
      { id: "r2", title: "Penanganan Edge Cases & Pembulatan", weight: 30, description: "Aman dari division-by-zero dan mengembalikan tipe numerik konsisten." },
      { id: "r3", title: "Keterbacaan & Kualitas Implementasi", weight: 25, description: "Kode bersih, deklaratif, dan mudah diaudit analis." },
    ],
    skills: ["Financial Analysis", "Unit Economics", "JavaScript", "Excel Formulas"],
    xpReward: 220,
    gemsReward: 30,
  },
  {
    challengeId: "lab-ux-heuristic-redesign",
    title: "Audit Heuristik & Aksesibilitas WCAG Alur Checkout Mobile",
    track: "frontend",
    difficulty: "Pemula",
    estimatedMinutes: 20,
    language: "case_markdown",
    summary:
      "Evaluasi layar checkout yang mengalami drop-off tinggi menggunakan Nielsen's 10 Heuristics & WCAG AA lalu susun rekomendasi perbaikan terukur.",
    promptMarkdown: `### Kondisi Layar Saat Ini
- Tombol "Bayar Sekarang" berukuran 28×28px dengan teks abu-abu tipis di atas latar terang.
- Jika kode promo salah, seluruh isi formulir alamat terhapus otomatis dan hanya muncul teks *"Error 400"*.
- Total biaya ongkir baru terlihat setelah pengguna menekan tombol konfirmasi akhir.

### Tugas Anda
1. Identifikasi **3 pelanggaran Heuristik Usability / WCAG AA** beserta tingkat keparahannya.
2. Tulis **solusi desain ulang** konkret termasuk contoh *microcopy* error yang ramah dan konstruktif.
3. Sebutkan **2 metrik usability** untuk memvalidasi keberhasilan redesain.`,
    starterCode: `## 1. Temuan Audit Heuristik & WCAG
1. ...
2. ...
3. ...

## 2. Rekomendasi Redesain & Microcopy Baru
- ...

## 3. Rencana Validasi Usability Testing
- ...`,
    hints: [
      "Hubungkan biaya tersembunyi dengan kurangnya transparansi/visibility of system status dan kepercayaan checkout.",
      "Target sentuh mobile WCAG/Apple HIG minimal 44×44px dengan rasio kontras teks minimal 4.5:1.",
      "Pertahankan input pengguna saat error terjadi (error recovery) dan berikan pesan spesifik.",
    ],
    testCases: [],
    rubricCriteria: [
      { id: "r1", title: "Akurasi Diagnosis Heuristik & WCAG", weight: 40, description: "Mengenali masalah aksesibilitas, transparansi biaya, dan error recovery." },
      { id: "r2", title: "Kualitas Solusi & Microcopy", weight: 35, description: "Perbaikan konkret, berpusat pada pengguna, dan siap diimplementasikan." },
      { id: "r3", title: "Validasi & Pengukuran Dampak", weight: 25, description: "Metrik usability dan skenario uji realistis." },
    ],
    skills: ["UI/UX Principles", "Accessibility", "Usability Heuristics", "UX Research"],
    xpReward: 190,
    gemsReward: 25,
  },
  {
    challengeId: "lab-cpns-tkp-policy",
    title: "Studi Kasus Reformasi Pelayanan Publik & Integritas ASN/BUMN",
    track: "bumn_case",
    difficulty: "Pemula",
    estimatedMinutes: 20,
    language: "case_markdown",
    summary:
      "Susun rekomendasi penanganan pungli, transparansi antrean, dan pelayanan inklusif bagi warga lansia berbasis nilai BerAKHLAK.",
    promptMarkdown: `### Skenario Instansi Layanan Publik
Di kantor pelayanan perizinan terpadu, ditemukan antrean menumpuk sejak pukul 06.00 pagi, warga lansia kesulitan menggunakan formulir daring, dan beredar praktik percaloan di sekitar gerbang kantor.

### Tugas Anda
Buat rekomendasi kebijakan pelayanan publik yang mencakup:
1. **Penegakan Integritas & Anti-Pungli** (transparansi tarif/waktu SLA, saluran pelaporan).
2. **Layanan Inklusif & Adaptasi TIK** (pendampingan lansia/disabilitas + sistem antrean terjadwal).
3. **Indikator Keberhasilan Pelayanan 60 Hari** (Indeks Kepuasan Masyarakat, waktu layanan, zero pungli).`,
    starterCode: `## 1. Langkah Integritas & Pemberantasan Pungli
- ...

## 2. Desain Layanan Inklusif & Digitalisasi Antrean
- ...

## 3. Target KPI Pelayanan (60 Hari)
- ...`,
    hints: [
      "Terapkan prinsip Pelayanan Prima: transparan, cepat, akuntabel, tanpa diskriminasi, dan sesuai SOP.",
      "Sediakan loket prioritas/petugas pendamping digital bagi lansia agar transformasi digital tetap inklusif.",
      "Gunakan papan informasi SLA & biaya resmi yang terbuka serta mekanisme whistleblowing aman.",
    ],
    testCases: [],
    rubricCriteria: [
      { id: "r1", title: "Integritas & Kepatuhan Tata Kelola", weight: 35, description: "Langkah anti-pungli dan transparansi realistis serta sesuai SOP." },
      { id: "r2", title: "Inklusivitas & Inovasi Pelayanan", weight: 40, description: "Menyeimbangkan digitalisasi antrean dengan aksesibilitas warga lansia." },
      { id: "r3", title: "Kejelasan Indikator Kinerja", weight: 25, description: "KPI layanan terukur dan dapat diaudit pimpinan." },
    ],
    skills: ["TKP Pelayanan Publik", "Core Values AKHLAK", "TWK Integritas", "Problem Solving"],
    xpReward: 190,
    gemsReward: 25,
  },
];

import {
  COURSE_2026_BLUEPRINTS,
  enrichQuestionWithOptionAnalysis,
} from "./curriculum2026Upgrade.ts";

/**
 * Generates guaranteed inline knowledge checks and flashcards for any lesson
 * (combines custom lesson definitions with intelligent derivation from lesson questions & skills
 * so ALL 16 courses and EVERY single lesson have rich interactive checks and spaced-repetition flashcards).
 */
export function buildEnrichedLessonAssets(
  courseId: string,
  courseSkills: string[],
  lesson: any,
  lessonIdx: number
): { inlineChecks: ExpandedInlineCheck[]; flashcards: ExpandedFlashcard[] } {
  const rawInlineChecks: ExpandedInlineCheck[] = Array.isArray(lesson.inlineChecks)
    ? [...lesson.inlineChecks]
    : [];
  const flashcards: ExpandedFlashcard[] = Array.isArray(lesson.flashcards)
    ? [...lesson.flashcards]
    : [];

  const questions: any[] = Array.isArray(lesson.questions) ? lesson.questions : [];
  const primarySkill = courseSkills?.[lessonIdx % Math.max(1, courseSkills.length)] || "Konsep Inti";

  // Ensure at least 1-2 inline knowledge checks per lesson derived cleanly from real questions
  if (rawInlineChecks.length === 0 && questions.length > 0) {
    const qFirst = questions[0];
    rawInlineChecks.push({
      id: `ic_${lesson.id}_1`,
      afterParagraph: 1,
      question: qFirst.text,
      options: qFirst.options,
      answerIndex: qFirst.answerIndex,
      explanation: qFirst.explanation,
      competencyTag: qFirst.competencyTag || primarySkill,
    });
    if (questions.length >= 3) {
      const qMid = questions[2];
      rawInlineChecks.push({
        id: `ic_${lesson.id}_2`,
        afterParagraph: 3,
        question: qMid.text,
        options: qMid.options,
        answerIndex: qMid.answerIndex,
        explanation: qMid.explanation,
        competencyTag: qMid.competencyTag || primarySkill,
      });
    }
  }

  const inlineChecks = rawInlineChecks.map((chk) =>
    enrichQuestionWithOptionAnalysis(chk, chk.competencyTag || primarySkill)
  );

  // Ensure at least 3-4 high-signal flashcards per lesson including 2026 flashcards
  const bp2026 = COURSE_2026_BLUEPRINTS[courseId];
  if (flashcards.length === 0) {
    const enrichment = COURSE_ENRICHMENTS[courseId];
    if (lessonIdx === 0 && enrichment?.customFlashcards?.length) {
      flashcards.push(...enrichment.customFlashcards.slice(0, 3));
    }

    const needed = Math.max(0, 3 - flashcards.length);
    for (let i = 0; i < Math.min(questions.length, needed + 1); i++) {
      const q = questions[i];
      if (!q || !Array.isArray(q.options)) continue;
      const correctAnswer = q.options[q.answerIndex] || "";
      const cardId = `fc_${lesson.id}_${i + 1}`;
      if (!flashcards.some((f) => f.id === cardId)) {
        flashcards.push({
          id: cardId,
          front: q.text,
          back: `${correctAnswer}\n\nAlasan: ${q.explanation}`,
          hint: q.hint || `Fokus pada kompetensi ${q.competencyTag || primarySkill}.`,
          competencyTag: q.competencyTag || primarySkill,
        });
      }
    }
  }

  if (bp2026?.extraFlashcards2026?.length) {
    for (const fc of bp2026.extraFlashcards2026) {
      const scopedId = `${fc.id}_${lesson.id}`;
      if (!flashcards.some((existing) => existing.id === scopedId || existing.front === fc.front)) {
        flashcards.push({
          ...fc,
          id: scopedId,
        });
      }
    }
  }

  return { inlineChecks, flashcards };
}
