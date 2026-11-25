import { useState } from "react";
import { RotateCcw, Award, Layers, ArrowRight, History, Sparkles } from "lucide-react";
import { playSound } from "../../utils/sound";
import { Profile, SimulationAttempt } from "../../types";
import { trainingApi } from "../../api/apiClient";

interface SimulasiTahapKerjaTabProps {
  onAddXp?: (xp: number) => void;
  onProfileUpdate?: (profile: Profile) => void;
  onSimulationRecorded?: () => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

export interface ScenarioStageOption {
  id: string;
  label: string;
  points: number;
  specificFeedback: string;
}

export interface ScenarioStage {
  stageNumber: number;
  title: string;
  description: string;
  options: ScenarioStageOption[];
}

export interface WorkScenario {
  id: string;
  title: string;
  category: string;
  role: string;
  description: string;
  stages: ScenarioStage[];
}

const WORK_SCENARIOS: WorkScenario[] = [
  {
    id: "scen-1",
    title: "Konflik Arsitektur API Menjelang Rilis Produk",
    category: "Software Engineering",
    role: "Senior Frontend Lead",
    description:
      "Terjadi perbedaan pendapat tajam antara Tim Frontend & Backend terkait migrasi REST API ke GraphQL lima hari sebelum deadline peluncuran.",
    stages: [
      {
        stageNumber: 1,
        title: "Tahap 1: Analisis Situasi & Akar Masalah",
        description:
          "Kedua pihak saling menyalahkan terkait latency respon API. Bagaimana langkah diagnosa awal Anda?",
        options: [
          {
            id: "s1-opt-a",
            label:
              "Opsi A: Lakukan profil performa (benchmark) dan network audit independen untuk mengumpulkan data objektif.",
            points: 30,
            specificFeedback:
              "Diagnosa berbasis data objektif mencegah perdebatan emosional dan mengisolasi masalah secara presisi.",
          },
          {
            id: "s1-opt-b",
            label:
              "Opsi B: Langsung eskalasi masalah ke Engineering Manager untuk membuat keputusan final.",
            points: 15,
            specificFeedback:
              "Eskalasi terlalu awal tanpa bukti data menambah beban manajemen dan melemahkan kepemimpinan teknis.",
          },
          {
            id: "s1-opt-c",
            label:
              "Opsi C: Meminta Tim Backend mengikuti seluruh standar keinginan Tim Frontend tanpa kompromi.",
            points: 10,
            specificFeedback:
              "Pendekatan sepihak merusak kolaborasi lintas tim dalam jangka panjang.",
          },
        ],
      },
      {
        stageNumber: 2,
        title: "Tahap 2: Pengambilan Keputusan Taktis",
        description:
          "Benchmark menunjukkan N+1 query pada database. Waktu tersisa 5 hari sebelum peluncuran. Keputusan apa yang Anda ambil?",
        options: [
          {
            id: "s2-opt-a",
            label:
              "Opsi A: Terapkan caching Redis & indexing database untuk rilis tepat waktu, lalu jadwalkan evaluasi GraphQL pada fase 2.",
            points: 40,
            specificFeedback:
              "Keputusan bisnis dan teknis matang: menjaga stabilitas rilis sembari mengelola utang teknis secara terencana.",
          },
          {
            id: "s2-opt-b",
            label:
              "Opsi B: Paksakan merombak seluruh skema GraphQL dalam 5 hari dengan lembur penuh.",
            points: 15,
            specificFeedback:
              "Berisiko tinggi memicu bug kritis di produksi serta kelelahan tim.",
          },
          {
            id: "s2-opt-c",
            label:
              "Opsi C: Tunda tanggal peluncuran secara sepihak tanpa berkonsultasi dengan Product Owner.",
            points: 10,
            specificFeedback:
              "Menunda rilis tanpa penyelarasan bisnis merugikan roadmap pemasaran dan kepercayaan stakeholder.",
          },
        ],
      },
      {
        stageNumber: 3,
        title: "Tahap 3: Mitigasi Risiko & Post-Mortem",
        description:
          "Produk sukses dirilis tepat waktu tanpa downtime. Langkah pasca-rilis apa yang Anda rancang?",
        options: [
          {
            id: "s3-opt-a",
            label:
              "Opsi A: Agendakan Blameless Post-Mortem, susun RFC kontrak API bersama, dan jadwalkan refactoring bertahap.",
            points: 30,
            specificFeedback:
              "Kultur blameless memperkuat keamanan psikologis dan mencegah insiden serupa terulang.",
          },
          {
            id: "s3-opt-b",
            label:
              "Opsi B: Anggap masalah selesai dan biarkan solusi sementara tanpa dokumentasi utang teknis.",
            points: 10,
            specificFeedback:
              "Utang teknis tanpa dokumentasi memicu penurunan performa berulang di kemudian hari.",
          },
          {
            id: "s3-opt-c",
            label:
              "Opsi C: Memberikan penilaian buruk pada anggota tim yang sempat berbeda pendapat.",
            points: 5,
            specificFeedback:
              "Menghukum perbedaan pendapat mematikan inovasi dan merusak budaya tim.",
          },
        ],
      },
    ],
  },
  {
    id: "scen-2",
    title: "Outage Server Saat Peak Traffic Promosi Nasional",
    category: "DevOps & SRE Incident",
    role: "Site Reliability Engineer",
    description:
      "Aplikasi transaksi mengalami lonjakan error 504 Gateway Timeout di tengah promosi flash sale nasional pukul 12:00 WIB.",
    stages: [
      {
        stageNumber: 1,
        title: "Tahap 1: Respon Awal Insiden Kritis",
        description:
          "Traffic melonjak 10x lipat dan CPU utilization menyentuh 99%. Apa tindakan pertama Anda?",
        options: [
          {
            id: "s1-scen2-a",
            label:
              "Opsi A: Aktifkan Rate Limiting & ruang tunggu (Queue Page) untuk menstabilkan beban transaksi aktif.",
            points: 30,
            specificFeedback:
              "Respon darurat tepat: mencegah crash total dan melindungi transaksi yang sedang diproses.",
          },
          {
            id: "s1-scen2-b",
            label:
              "Opsi B: Melakukan restart server utama secara manual di tengah puncak traffic.",
            points: 10,
            specificFeedback:
              "Restart manual saat puncak beban justru memperparah kegagalan transaksi aktif.",
          },
          {
            id: "s1-scen2-c",
            label:
              "Opsi C: Membiarkan sistem berjalan sambil menunggu traffic mereda sendiri.",
            points: 5,
            specificFeedback:
              "Inaction saat insiden produksi berdampak langsung pada kerugian finansial.",
          },
        ],
      },
      {
        stageNumber: 2,
        title: "Tahap 2: Skalabilitas & Pemulihan Bottleneck",
        description:
          "Observability menunjukkan bottleneck pada query pencarian di database utama. Bagaimana langkah pemulihan Anda?",
        options: [
          {
            id: "s2-scen2-a",
            label:
              "Opsi A: Scale out Read-Replica dan arahkan traffic query baca ke Read-Replica sambil memasang cache.",
            points: 40,
            specificFeedback:
              "Pemisahan beban Read/Write adalah praktik arsitektur skala tinggi yang paling aman dan efektif.",
          },
          {
            id: "s2-scen2-b",
            label:
              "Opsi B: Naikkan kapasitas instance secara vertikal (Vertical Scaling) yang membutuhkan reboot.",
            points: 20,
            specificFeedback:
              "Vertical scaling berbiaya tinggi dan tetap memerlukan jeda downtime tanpa mengatasi akar query berat.",
          },
          {
            id: "s2-scen2-c",
            label: "Opsi C: Mematikan sementara seluruh koneksi database.",
            points: 5,
            specificFeedback:
              "Memutus total database tanpa graceful degradation merusak konsistensi transaksi.",
          },
        ],
      },
      {
        stageNumber: 3,
        title: "Tahap 3: Komunikasi Manajemen & Pemulihan Kepercayaan",
        description:
          "Layanan pulih dalam 25 menit. Bagaimana laporan yang Anda sajikan kepada jajaran direksi?",
        options: [
          {
            id: "s3-scen2-a",
            label:
              "Opsi A: Rilis incident timeline transparan, analisis dampak, rencana perbaikan permanen, serta rekomendasi pemulihan pelanggan.",
            points: 30,
            specificFeedback:
              "Transparansi dan rencana tindak lanjut terukur mencerminkan akuntabilitas profesional tingkat senior.",
          },
          {
            id: "s3-scen2-b",
            label:
              "Opsi B: Menyembunyikan durasi downtime dan menyalahkan penyedia cloud eksternal.",
            points: 10,
            specificFeedback:
              "Melempar tanggung jawab merusak integritas dan kredibilitas tim teknis.",
          },
          {
            id: "s3-scen2-c",
            label: "Opsi C: Tidak mengirimkan laporan resmi karena sistem sudah kembali normal.",
            points: 5,
            specificFeedback:
              "Tanpa laporan insiden, organisasi kehilangan kesempatan memperkuat keandalan sistem.",
          },
        ],
      },
    ],
  },
  {
    id: "scen-3",
    title: "Dilema Integritas & Kepatuhan Vendor BUMN",
    category: "Corporate Ethics & AKHLAK",
    role: "Project Manager BUMN",
    description:
      "Vendor mitra meminta Anda menandatangani berita acara serah terima proyek meski dua fitur utama belum tuntas, dengan iming-iming potongan harga di luar kontrak.",
    stages: [
      {
        stageNumber: 1,
        title: "Tahap 1: Evaluasi Etika & Kepatuhan",
        description:
          "Vendor mendesak tanda tangan hari ini agar pencairan termin tidak tertunda.",
        options: [
          {
            id: "s1-scen3-a",
            label:
              "Opsi A: Tolak penandatanganan secara tegas dan terbitkan catatan kekurangan resmi sesuai mekanisme kontrak.",
            points: 30,
            specificFeedback:
              "Menjunjung tinggi nilai AKHLAK (Amanah & Loyal) melindungi organisasi dari temuan audit dan risiko hukum.",
          },
          {
            id: "s1-scen3-b",
            label:
              "Opsi B: Menandatangani serah terima dengan janji lisan vendor akan menyelesaikannya pekan depan.",
            points: 10,
            specificFeedback:
              "Janji lisan tanpa adendum resmi melanggar prinsip Good Corporate Governance (GCG).",
          },
          {
            id: "s1-scen3-c",
            label: "Opsi C: Menerima penawaran potongan di luar kontrak untuk kas tim.",
            points: 0,
            specificFeedback:
              "Pelanggaran kode etik serius yang melanggar aturan gratifikasi dan hukum.",
          },
        ],
      },
      {
        stageNumber: 2,
        title: "Tahap 2: Manajemen Eskalasi & Legal",
        description:
          "Vendor mengancam menarik tim pengembang jika serah terima tidak segera disetujui.",
        options: [
          {
            id: "s2-scen3-a",
            label:
              "Opsi A: Berpegang pada klausul SLA tertulis dan libatkan Unit Legal serta Pengadaan untuk mediasi formal.",
            points: 40,
            specificFeedback:
              "Melibatkan fungsi hukum dan pengadaan memastikan posisi perusahaan kuat dan akuntabel.",
          },
          {
            id: "s2-scen3-b",
            label: "Opsi B: Menyetujui tuntutan vendor demi menghindari konflik.",
            points: 10,
            specificFeedback:
              "Kompromi terhadap tekanan menciptakan preseden buruk bagi tata kelola proyek.",
          },
          {
            id: "s2-scen3-c",
            label:
              "Opsi C: Memutus kontrak sepihak secara emosional tanpa prosedur sengketa.",
            points: 15,
            specificFeedback:
              "Pemutusan tanpa prosedur kontrak berisiko menimbulkan gugatan balik.",
          },
        ],
      },
      {
        stageNumber: 3,
        title: "Tahap 3: Penguatan Tata Kelola Berkelanjutan",
        description:
          "Vendor akhirnya menuntaskan seluruh fitur secara resmi. Langkah perbaikan sistem apa yang Anda usulkan?",
        options: [
          {
            id: "s3-scen3-a",
            label:
              "Opsi A: Usulkan scorecard evaluasi vendor transparan berbasis SLA dan verifikasi UAT independen.",
            points: 30,
            specificFeedback:
              "Perbaikan berbasis sistem mencegah celah kepatuhan serupa pada pengadaan berikutnya.",
          },
          {
            id: "s3-scen3-b",
            label: "Opsi B: Menutup catatan kendala vendor agar laporan proyek terlihat mulus.",
            points: 10,
            specificFeedback:
              "Menyembunyikan riwayat performa vendor membahayakan unit kerja lain.",
          },
          {
            id: "s3-scen3-c",
            label: "Opsi C: Menghentikan seluruh kerja sama eksternal di masa depan.",
            points: 15,
            specificFeedback:
              "Generalisasi berlebihan membatasi kapasitas inovasi dan kolaborasi ekosistem.",
          },
        ],
      },
    ],
  },
  {
    id: "scen-4",
    title: "Mitigasi Risiko Kredit & Target Kinerja Cabang Perbankan",
    category: "Banking & Management Trainee",
    role: "Management Trainee / Risk Analyst",
    description:
      "Menjelang tutup kuartal, cabang Anda kekurangan 12% target penyaluran kredit UMKM, sementara terdapat satu calon debitur bernilai besar dengan rasio DSCR di bawah standar kebijakan risiko.",
    stages: [
      {
        stageNumber: 1,
        title: "Tahap 1: Penilaian Prinsip Kehati-hatian (5C)",
        description:
          "Relationship Manager mendorong persetujuan cepat agar bonus kuartal cabang tercapai. Apa rekomendasi awal Anda?",
        options: [
          {
            id: "s1-scen4-a",
            label:
              "Opsi A: Lakukan stress-test arus kas debitur dan analisis jaminan secara objektif sesuai komite risiko, tanpa mengabaikan ambang DSCR.",
            points: 30,
            specificFeedback:
              "Menjaga kualitas aset (NPL rendah) lebih penting daripada mengejar target jangka pendek dengan risiko gagal bayar tinggi.",
          },
          {
            id: "s1-scen4-b",
            label:
              "Opsi B: Langsung menyetujui plafon penuh dengan syarat laporan keuangan disusulkan bulan depan.",
            points: 5,
            specificFeedback:
              "Melanggar prinsip kehati-hatian perbankan (prudential banking) dan membuka risiko kredit macet.",
          },
          {
            id: "s1-scen4-c",
            label:
              "Opsi C: Menolak seluruh pengajuan tanpa memberikan analisis atau opsi struktur alternatif.",
            points: 15,
            specificFeedback:
              "Aman secara risiko, namun kurang solutif untuk pertumbuhan bisnis yang sehat.",
          },
        ],
      },
      {
        stageNumber: 2,
        title: "Tahap 2: Restrukturisasi Skema Kredit yang Sehat",
        description:
          "Hasil stress-test menunjukkan bisnis debitur sebenarnya prospektif, namun cicilan terlalu berat di tahun pertama. Langkah strategis apa yang Anda tawarkan?",
        options: [
          {
            id: "s2-scen4-a",
            label:
              "Opsi A: Usulkan penyesuaian plafon bertahap (tranche) dengan covenant arus kas dan agunan memadai agar DSCR kembali sehat.",
            points: 40,
            specificFeedback:
              "Sangat strategis! Menyeimbangkan pertumbuhan bisnis cabang dengan manajemen risiko yang disiplin.",
          },
          {
            id: "s2-scen4-b",
            label:
              "Opsi B: Menaikkan suku bunga setinggi mungkin agar menutupi potensi gagal bayar.",
            points: 15,
            specificFeedback:
              "Bunga terlalu tinggi justru memperbesar beban cicilan dan meningkatkan probabilitas default.",
          },
          {
            id: "s2-scen4-c",
            label:
              "Opsi C: Memecah kredit ke beberapa nama berbeda agar lolos batas wewenang cabang.",
            points: 0,
            specificFeedback:
              "Tindakan splitting untuk menghindari komite risiko merupakan pelanggaran kepatuhan berat.",
          },
        ],
      },
      {
        stageNumber: 3,
        title: "Tahap 3: Monitoring Portofolio & Early Warning",
        description:
          "Skema bertahap disetujui komite kredit. Bagaimana Anda memastikan kualitas portofolio cabang tetap terjaga?",
        options: [
          {
            id: "s3-scen4-a",
            label:
              "Opsi A: Tetapkan pemantauan covenant bulanan dan indikator Early Warning System (EWS) untuk intervensi dini.",
            points: 30,
            specificFeedback:
              "Pemantauan proaktif berbasis EWS menjaga NPL tetap terkendali sekaligus mendampingi nasabah bertumbuh.",
          },
          {
            id: "s3-scen4-b",
            label:
              "Opsi B: Menunggu hingga terjadi tunggakan 90 hari sebelum melakukan evaluasi ulang.",
            points: 10,
            specificFeedback:
              "Menunggu hingga kategori macet membuat biaya pemulihan jauh lebih mahal.",
          },
          {
            id: "s3-scen4-c",
            label: "Opsi C: Menyerahkan seluruh monitoring kepada debitur secara mandiri.",
            points: 5,
            specificFeedback:
              "Fungsi kontrol risiko tidak dapat didelegasikan kepada pihak debitur.",
          },
        ],
      },
    ],
  },
];

export function SimulasiTahapKerjaTab({
  onAddXp,
  onProfileUpdate,
  onSimulationRecorded,
  showToast,
}: SimulasiTahapKerjaTabProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(WORK_SCENARIOS[0].id);
  const [difficulty, setDifficulty] = useState<"Pemula" | "Menengah" | "Industri">("Menengah");
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, ScenarioStageOption>>({});
  const [isFinished, setIsFinished] = useState(false);

  const [history, setHistory] = useState<SimulationAttempt[]>(() => {
    try {
      const saved = localStorage.getItem("skillora_simulasi_decision_history");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const activeScenario =
    WORK_SCENARIOS.find((s) => s.id === selectedScenarioId) || WORK_SCENARIOS[0];
  const currentStage = activeScenario.stages[currentStageIdx];

  const handleSelectOption = (opt: ScenarioStageOption) => {
    if (isFinished) return;
    playSound("click");
    setSelectedOptions((prev) => ({ ...prev, [currentStageIdx]: opt }));
  };

  const handleNextStage = async () => {
    if (!selectedOptions[currentStageIdx]) return;

    if (currentStageIdx < activeScenario.stages.length - 1) {
      setCurrentStageIdx((prev) => prev + 1);
      playSound("correct");
      return;
    }

    setIsFinished(true);
    playSound("levelUp");

    const stage1Score = selectedOptions[0]?.points || 0;
    const stage2Score = selectedOptions[1]?.points || 0;
    const stage3Score = selectedOptions[2]?.points || 0;
    const totalScore = Math.min(100, stage1Score + stage2Score + stage3Score);

    const feedbackList = [
      `Tahap 1: ${selectedOptions[0]?.specificFeedback}`,
      `Tahap 2: ${selectedOptions[1]?.specificFeedback}`,
      `Tahap 3: ${selectedOptions[2]?.specificFeedback}`,
    ];

    const newAttempt: SimulationAttempt = {
      id: `sim_${Date.now()}`,
      scenarioId: activeScenario.id,
      scenarioTitle: activeScenario.title,
      type: "DecisionSimulation",
      difficulty,
      score: totalScore,
      completedAt: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      specificFeedback: feedbackList,
      stageScores: { stage1: stage1Score, stage2: stage2Score, stage3: stage3Score },
    };

    const updatedHistory = [newAttempt, ...history.slice(0, 9)];
    setHistory(updatedHistory);
    localStorage.setItem("skillora_simulasi_decision_history", JSON.stringify(updatedHistory));

    const earnedXp = totalScore >= 70 ? 200 : 75;
    try {
      const saved = await trainingApi.recordSimulation({
        simType: "decision",
        title: `${activeScenario.title} (${difficulty})`,
        score: totalScore,
        metrics: {
          scenarioId: activeScenario.id,
          role: activeScenario.role,
          difficulty,
          stageScores: { stage1: stage1Score, stage2: stage2Score, stage3: stage3Score },
        },
        aiFeedback: feedbackList.join(" | "),
        earnedXp,
      });
      if (saved?.profile) onProfileUpdate?.(saved.profile);
      else if (onAddXp && totalScore >= 70) onAddXp(earnedXp);
      onSimulationRecorded?.();
      showToast?.(`Simulasi Keputusan tersimpan (${totalScore}/100 · +${earnedXp} XP).`, "success");
    } catch {
      if (onAddXp && totalScore >= 70) onAddXp(earnedXp);
    }
  };

  const handleRestart = () => {
    setCurrentStageIdx(0);
    setSelectedOptions({});
    setIsFinished(false);
  };

  const calculateTotalScore = () =>
    Object.values(selectedOptions).reduce((acc, curr) => acc + curr.points, 0);

  return (
    <div className="space-y-5">
      {/* Top Scenario Selector */}
      <div className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
              4 Skenario Keputusan Industri
            </span>
            <h3 className="font-display font-bold text-base text-zinc-950 dark:text-white">
              Simulasi Studi Kasus Multi-Tahap
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Level:</span>
            <div className="flex bg-zinc-100 dark:bg-zinc-950 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
              {(["Pemula", "Menengah", "Industri"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    difficulty === lvl
                      ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {WORK_SCENARIOS.map((scen) => {
            const active = selectedScenarioId === scen.id;
            return (
              <button
                key={scen.id}
                type="button"
                onClick={() => {
                  setSelectedScenarioId(scen.id);
                  handleRestart();
                }}
                className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer space-y-1.5 ${
                  active
                    ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/35 text-zinc-950 dark:text-white"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold block truncate">
                  {scen.role}
                </span>
                <div className="text-xs font-bold line-clamp-2 leading-snug">{scen.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {!isFinished ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Interactive Stage Panel */}
          <div className="lg:col-span-8 p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <Layers className="w-3.5 h-3.5" />
                  {currentStage.title}
                </span>
                <span className="tabular-nums">
                  Tahap {currentStageIdx + 1}/{activeScenario.stages.length}
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{
                    width: `${((currentStageIdx + 1) / activeScenario.stages.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                Situasi Keputusan
              </span>
              <p className="text-sm font-semibold text-zinc-950 dark:text-white leading-relaxed">
                {currentStage.description}
              </p>
            </div>

            <div className="space-y-2.5">
              {currentStage.options.map((opt) => {
                const isSelected = selectedOptions[currentStageIdx]?.id === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full text-left p-3.5 rounded-lg text-xs sm:text-sm border transition-colors cursor-pointer ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-semibold"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                disabled={currentStageIdx === 0}
                onClick={() => setCurrentStageIdx((prev) => prev - 1)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Tahap Sebelumnya
              </button>

              <button
                type="button"
                disabled={!selectedOptions[currentStageIdx]}
                onClick={handleNextStage}
                className="px-5 py-2.5 bg-zinc-950 dark:bg-zinc-100 disabled:opacity-40 text-white dark:text-zinc-950 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <span>
                  {currentStageIdx < activeScenario.stages.length - 1
                    ? "Lanjut Tahap Berikutnya"
                    : "Selesaikan & Evaluasi"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Context Column */}
          <div className="lg:col-span-4 p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h4 className="font-mono text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Ringkasan Kasus
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {activeScenario.description}
            </p>
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              {activeScenario.stages.map((stg, i) => {
                const opt = selectedOptions[i];
                return (
                  <div
                    key={stg.stageNumber}
                    className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800"
                  >
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      Tahap {i + 1}
                    </span>
                    <span
                      className={`font-mono tabular-nums ${
                        opt ? "text-emerald-700 dark:text-emerald-400 font-semibold" : "text-zinc-400"
                      }`}
                    >
                      {opt ? "Terpilih" : "Menunggu"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 sm:p-7 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-6 max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
                  Evaluasi Keputusan ({difficulty})
                </p>
                <h3 className="font-display font-bold text-xl text-zinc-950 dark:text-white">
                  Skor Akhir: <span className="font-mono tabular-nums">{calculateTotalScore()}/100</span>
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRestart}
              className="px-4 py-2 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg font-semibold text-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Ulangi Skenario
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-xs text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Umpan Balik Spesifik per Tahap
            </h4>
            {activeScenario.stages.map((stg, i) => {
              const opt = selectedOptions[i];
              return (
                <div
                  key={stg.stageNumber}
                  className="p-4 bg-zinc-50 dark:bg-zinc-950/60 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-950 dark:text-white">
                    <span>{stg.title}</span>
                    <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                      +{opt?.points || 0} poin
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {opt?.specificFeedback}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
          <h3 className="font-mono text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-emerald-600" />
            Riwayat Skenario Keputusan ({history.length})
          </h3>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {history.slice(0, 5).map((attempt) => (
              <div
                key={attempt.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-950 dark:text-white truncate">
                    {attempt.scenarioTitle}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    {attempt.difficulty} · {attempt.completedAt}
                  </p>
                </div>
                <span className="font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400 shrink-0">
                  {attempt.score}/100
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
