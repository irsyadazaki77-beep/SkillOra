export interface TkdQuestionItem {
  id: string;
  category:
    | "Verbal Reasoning"
    | "Numerik & Deret"
    | "Logika Silogisme"
    | "Figural & Spasial"
    | "Core Values AKHLAK";
  subtopic: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const TKD_QUESTIONS: TkdQuestionItem[] = [
  // --- 1. VERBAL REASONING (4 Soal) ---
  {
    id: "tkd_1",
    category: "Verbal Reasoning",
    subtopic: "Sinonim & Padanan Kata",
    question:
      "SINONIM: Manakah kata yang paling padan maknanya dengan kata 'AKREDITASI' dalam konteks tata kelola organisasi?",
    options: [
      "A. Pengakuan resmi terhadap kelayakan dan standar mutu",
      "B. Pengawasan kinerja berkala oleh auditor independen",
      "C. Penundaan kewajiban pembayaran aset perusahaan",
      "D. Penggabungan dua entitas bisnis secara hukum",
    ],
    correctIndex: 0,
    explanation:
      "Akreditasi adalah bentuk pengakuan resmi dari lembaga berwenang terhadap kelayakan dan pemenuhan standar mutu suatu institusi atau program.",
  },
  {
    id: "tkd_2",
    category: "Verbal Reasoning",
    subtopic: "Antonim",
    question:
      "ANTONIM: Lawan kata yang paling tepat untuk kata 'PROLIFERASI' dalam laporan pertumbuhan unit bisnis adalah...",
    options: [
      "A. Ekspansi",
      "B. Penyusutan",
      "C. Diversifikasi",
      "D. Akselerasi",
    ],
    correctIndex: 1,
    explanation:
      "Proliferasi bermakna pembiakan atau pertambahan jumlah secara cepat. Lawan katanya adalah penyusutan (reduksi jumlah/skala).",
  },
  {
    id: "tkd_3",
    category: "Verbal Reasoning",
    subtopic: "Analogi Verbal",
    question:
      "ANALOGI: AUDITOR : LAPORAN KEUANGAN = ... : ...",
    options: [
      "A. Kurator : Pameran Seni",
      "B. Hakim : Penjara",
      "C. Arsitek : Batu Bata",
      "D. Editor : Naskah Buku",
    ],
    correctIndex: 3,
    explanation:
      "Auditor memeriksa, memverifikasi, dan memastikan kualitas laporan keuangan; sebagaimana Editor memeriksa dan memvalidasi kualitas naskah buku sebelum diterbitkan.",
  },
  {
    id: "tkd_4",
    category: "Verbal Reasoning",
    subtopic: "Pemahaman Wacana",
    question:
      "Transformasi digital di sektor logistik BUMN memangkas waktu bongkar muat hingga 32%, namun menuntut penyesuaian kompetensi SDM lapangan. Gagasan utama kalimat tersebut adalah...",
    options: [
      "A. SDM lapangan menolak transformasi digital logistik",
      "B. Waktu bongkar muat sebelumnya selalu melebihi 32%",
      "C. Transformasi digital meningkatkan efisiensi logistik sekaligus memerlukan peningkatan kompetensi SDM",
      "D. Digitalisasi hanya berdampak pada divisi pelabuhan",
    ],
    correctIndex: 2,
    explanation:
      "Kalimat tersebut memuat dua poin inti yang seimbang: manfaat efisiensi (pangkas waktu 32%) dan konsekuensi kebutuhan penyesuaian kompetensi SDM.",
  },

  // --- 2. NUMERIK & DERET (4 Soal) ---
  {
    id: "tkd_5",
    category: "Numerik & Deret",
    subtopic: "Pola Angka Eksponensial",
    question: "Tentukan angka selanjutnya dari deret berikut: 4, 9, 19, 39, 79, ...?",
    options: ["A. 119", "B. 159", "C. 149", "D. 169"],
    correctIndex: 1,
    explanation:
      "Pola deret: (n × 2) + 1. 4×2+1=9, 9×2+1=19, 19×2+1=39, 39×2+1=79, sehingga angka berikutnya (79 × 2) + 1 = 159.",
  },
  {
    id: "tkd_6",
    category: "Numerik & Deret",
    subtopic: "Deret Bertingkat",
    question: "Tentukan dua angka berikutnya pada deret: 3, 6, 11, 18, 27, ..., ...?",
    options: ["A. 36, 47", "B. 38, 51", "C. 38, 49", "D. 37, 50"],
    correctIndex: 1,
    explanation:
      "Selisih antar suku adalah bilangan ganjil berurutan: +3, +5, +7, +9. Maka berikutnya +11 (27+11=38) dan +13 (38+13=51).",
  },
  {
    id: "tkd_7",
    category: "Numerik & Deret",
    subtopic: "Persentase & Aritmatika Bisnis",
    question:
      "Sebuah unit BUMN membeli bahan baku senilai Rp 120.000.000 dengan diskon 15%. Jika hasil olahan dijual dengan target profit 25% dari harga beli bersih, berapakah harga jual totalnya?",
    options: [
      "A. Rp 127.500.000",
      "B. Rp 135.000.000",
      "C. Rp 140.000.000",
      "D. Rp 120.000.000",
    ],
    correctIndex: 0,
    explanation:
      "Harga beli bersih = 85% × Rp120 jt = Rp102 jt. Profit 25% × Rp102 jt = Rp25,5 jt. Harga jual = Rp102 jt + Rp25,5 jt = Rp127.500.000.",
  },
  {
    id: "tkd_8",
    category: "Numerik & Deret",
    subtopic: "Perbandingan Berbalik Nilai",
    question:
      "Suatu proyek migrasi server selesai dalam 18 hari oleh 12 engineer. Jika manajemen mempercepat target menjadi 8 hari, berapa tambahan engineer minimal yang dibutuhkan?",
    options: ["A. 15 orang", "B. 27 orang", "C. 12 orang", "D. 18 orang"],
    correctIndex: 0,
    explanation:
      "Total beban = 18 × 12 = 216 hari-orang. Untuk 8 hari butuh 216 / 8 = 27 orang. Karena sudah ada 12 orang, tambahannya 27 - 12 = 15 orang.",
  },

  // --- 3. LOGIKA SILOGISME (4 Soal) ---
  {
    id: "tkd_9",
    category: "Logika Silogisme",
    subtopic: "Penalaran Kategori",
    question:
      "Premis 1: Semua karyawan lulusan program Management Trainee wajib menguasai data analytics.\nPremis 2: Sebagian staf pemasaran bukan lulusan program Management Trainee.\nKesimpulan yang tepat adalah...",
    options: [
      "A. Sebagian staf pemasaran tidak terikat kewajiban menguasai data analytics dari program MT",
      "B. Semua staf pemasaran pasti menguasai data analytics",
      "C. Tidak ada staf pemasaran yang menguasai data analytics",
      "D. Lulusan Management Trainee tidak ditempatkan di pemasaran",
    ],
    correctIndex: 0,
    explanation:
      "Hanya anggota himpunan lulusan MT yang terkena syarat wajib tersebut; sebagian staf pemasaran di luar himpunan MT tidak terikat aturan itu.",
  },
  {
    id: "tkd_10",
    category: "Logika Silogisme",
    subtopic: "Modus Tollens",
    question:
      "Premis 1: Jika sistem keamanan lulus uji penetrasi, maka aplikasi dirilis ke publik pada hari Jumat.\nPremis 2: Aplikasi tidak dirilis ke publik pada hari Jumat.\nKesimpulan yang sah adalah...",
    options: [
      "A. Aplikasi dirilis pada hari Senin",
      "B. Sistem keamanan tidak lulus uji penetrasi",
      "C. Tim pengembang belum melakukan uji penetrasi",
      "D. Sebagian fitur aplikasi tidak lulus uji",
    ],
    correctIndex: 1,
    explanation:
      "Berdasarkan kaidah Modus Tollens (P → Q, ~Q ⊢ ~P), karena konsekuen Q tidak terjadi, maka anteseden P pasti tidak terpenuhi.",
  },
  {
    id: "tkd_11",
    category: "Logika Silogisme",
    subtopic: "Penalaran Analitis Urutan",
    question:
      "Lima proyek (P, Q, R, S, T) dijadwalkan berurutan. P dikerjakan sebelum R tetapi setelah T. Q dikerjakan tepat sebelum S, dan S selesai lebih dulu daripada T. Urutan proyek dari yang pertama hingga terakhir adalah...",
    options: [
      "A. Q - S - T - P - R",
      "B. S - Q - T - P - R",
      "C. T - P - R - Q - S",
      "D. Q - T - S - P - R",
    ],
    correctIndex: 0,
    explanation:
      "Diketahui Q tepat sebelum S (Q-S), S sebelum T (Q-S-T), serta T sebelum P dan P sebelum R (T-P-R). Gabungan utuh: Q - S - T - P - R.",
  },
  {
    id: "tkd_12",
    category: "Logika Silogisme",
    subtopic: "Negasi Pernyataan Majemuk",
    question:
      "Ingkaran (negasi) yang setara secara logika dari pernyataan 'Semua peserta lulus TKD dan hadir tepat waktu' adalah...",
    options: [
      "A. Semua peserta tidak lulus TKD dan terlambat",
      "B. Ada peserta yang tidak lulus TKD atau tidak hadir tepat waktu",
      "C. Tidak ada peserta yang lulus TKD atau hadir tepat waktu",
      "D. Sebagian peserta lulus TKD tetapi terlambat",
    ],
    correctIndex: 1,
    explanation:
      "Hukum De Morgan untuk kuantor universal: ~(∀x (P(x) ∧ Q(x))) ≡ ∃x (~P(x) ∨ ~Q(x)), yakni 'Ada peserta yang tidak lulus TKD atau tidak hadir tepat waktu'.",
  },

  // --- 4. FIGURAL & SPASIAL (4 Soal) ---
  {
    id: "tkd_13",
    category: "Figural & Spasial",
    subtopic: "Rotasi Pola Matriks",
    question:
      "Sebuah panah di dalam kotak berotasi 90° searah jarum jam pada setiap langkah, sementara titik hitam di sudut kotak berpindah 1 sudut berlawanan arah jarum jam. Jika pada posisi 1 panah menghadap UTARA dan titik di KIRI-ATAS, di mana keduanya pada posisi 4?",
    options: [
      "A. Panah menghadap BARAT, titik di KANAN-ATAS",
      "B. Panah menghadap SELATAN, titik di KANAN-BAWAH",
      "C. Panah menghadap TIMUR, titik di KIRI-BAWAH",
      "D. Panah menghadap BARAT, titik di KIRI-BAWAH",
    ],
    correctIndex: 0,
    explanation:
      "Dari posisi 1 ke posisi 4 ada 3 langkah. Panah 3×90° searah jarum jam: Utara → Timur → Selatan → Barat. Titik 3 sudut berlawanan jarum jam: Kiri-Atas → Kiri-Bawah → Kanan-Bawah → Kanan-Atas.",
  },
  {
    id: "tkd_14",
    category: "Figural & Spasial",
    subtopic: "Jaring-Jaring Kubus",
    question:
      "Pada sebuah dadu standar, jumlah titik pada dua sisi yang saling berhadapan selalu 7. Jika sisi ATAS bernilai 2 dan sisi DEPAN bernilai 3, berapakah nilai sisi BAWAH dan sisi BELAKANG berturut-turut?",
    options: ["A. 5 dan 4", "B. 4 dan 5", "C. 6 dan 1", "D. 5 dan 3"],
    correctIndex: 0,
    explanation:
      "Sisi bawah berhadapan dengan sisi atas (7 - 2 = 5). Sisi belakang berhadapan dengan sisi depan (7 - 3 = 4).",
  },
  {
    id: "tkd_15",
    category: "Figural & Spasial",
    subtopic: "Konsistensi Transformasi Simbol",
    question:
      "Deret simbol mengikuti pola jumlah sisi poligon: Segitiga (3), Persegi (4), Pentagon (5), Heksagon (6) dengan warna bergantian Gelap-Terang-Gelap-Terang. Bentuk dan warna ke-7 adalah...",
    options: [
      "A. Nonagon (9 sisi), Gelap",
      "B. Oktagon (8 sisi), Terang",
      "C. Nonagon (9 sisi), Terang",
      "D. Dekagon (10 sisi), Gelap",
    ],
    correctIndex: 0,
    explanation:
      "Suku ke-n memiliki (n + 2) sisi, sehingga suku ke-7 memiliki 9 sisi (Nonagon). Posisi ganjil selalu berwarna Gelap.",
  },
  {
    id: "tkd_16",
    category: "Figural & Spasial",
    subtopic: "Pencerminan Spasial",
    question:
      "Jika kode karakter 'B7N' dicerminkan secara horizontal (cermin tegak di sebelah kanan), urutan karakter dari kiri ke kanan menjadi...",
    options: [
      "A. N terbalik, 7 terbalik, B terbalik",
      "B. B terbalik, 7 terbalik, N terbalik",
      "C. N tegak, 7 tegak, B terbalik",
      "D. 7 terbalik, N terbalik, B terbalik",
    ],
    correctIndex: 0,
    explanation:
      "Cermin tegak di sisi kanan membalik urutan posisi (kanan menjadi kiri: N, 7, B) sekaligus membalik orientasi horizontal tiap karakter.",
  },

  // --- 5. CORE VALUES AKHLAK (4 Soal) ---
  {
    id: "tkd_17",
    category: "Core Values AKHLAK",
    subtopic: "Amanah & Integritas",
    question:
      "Anda menemukan kelebihan pembayaran proyek dari vendor akibat kesalahan sistem billing internal, dan vendor belum menyadarinya. Sikap yang mencerminkan nilai AMANAH adalah...",
    options: [
      "A. Membiarkan dana di kas unit kerja selama tidak ada temuan audit",
      "B. Menggunakan kelebihan dana tersebut untuk kegiatan sosial internal tim",
      "C. Segera melaporkan ke atasan dan divisi keuangan untuk mengembalikan dana secara transparan",
      "D. Menghubungi vendor secara pribadi untuk meminta imbalan penyelesaian",
    ],
    correctIndex: 2,
    explanation:
      "Nilai Amanah mewajibkan insan BUMN menjaga kepercayaan dengan bertindak jujur, transparan, dan akuntabel tanpa memanfaatkan celah sistem.",
  },
  {
    id: "tkd_18",
    category: "Core Values AKHLAK",
    subtopic: "Adaptif & Digitalisasi",
    question:
      "Perusahaan menerapkan sistem ERP baru yang mengubah alur kerja manual lama Anda. Respon ADAPTIF yang paling tepat adalah...",
    options: [
      "A. Tetap menggunakan alur manual lama karena sudah terbiasa",
      "B. Antusias mempelajari sistem baru, mengikuti pelatihan, dan mengusulkan optimasi alur digital",
      "C. Mengkritik manajemen di forum terbuka karena perubahan terasa mendadak",
      "D. Meminta rekan kerja lain menginput seluruh data milik Anda",
    ],
    correctIndex: 1,
    explanation:
      "Nilai Adaptif tercermin dari kesiapan menghadapi perubahan, proaktif belajar teknologi baru, dan terus berinovasi.",
  },
  {
    id: "tkd_19",
    category: "Core Values AKHLAK",
    subtopic: "Harmonis & Inklusivitas",
    question:
      "Dalam tim lintas daerah terjadi perbedaan gaya komunikasi saat menyusun presentasi direksi. Sikap HARMONIS yang tepat adalah...",
    options: [
      "A. Memaksa seluruh anggota mengikuti gaya mayoritas",
      "B. Mendengarkan aktif setiap perspektif dan menyepakati standar profesional bersama",
      "C. Memisahkan tim menjadi dua presentasi berbeda",
      "D. Melaporkan anggota yang berbeda pendapat ke bagian SDM",
    ],
    correctIndex: 1,
    explanation:
      "Nilai Harmonis diwujudkan melalui sikap saling peduli, menghargai perbedaan latar belakang, dan membangun lingkungan kerja kondusif.",
  },
  {
    id: "tkd_20",
    category: "Core Values AKHLAK",
    subtopic: "Kompeten & Kolaboratif",
    question:
      "Divisi Anda diminta membantu proyek lintas-unit yang memanfaatkan analitik data di luar keahlian harian Anda. Perilaku yang mencerminkan KOMPETEN sekaligus KOLABORATIF adalah...",
    options: [
      "A. Menolak penugasan karena di luar deskripsi pekerjaan utama",
      "B. Mempelajari standar analitik terkait secara cepat sekaligus menyinergikan keahlian dengan analis lintas-unit",
      "C. Mengerjakan sendiri tanpa berkonsultasi dengan tim data agar terlihat mandiri",
      "D. Menyerahkan seluruh tugas ke tim lain dan hanya hadir saat rapat akhir",
    ],
    correctIndex: 1,
    explanation:
      "Kompeten berarti terus belajar meningkatkan kapabilitas, sedangkan Kolaboratif berarti terbuka bekerja sama lintas fungsi demi hasil terbaik.",
  },
];
