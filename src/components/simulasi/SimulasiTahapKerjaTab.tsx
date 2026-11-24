import { useState, useEffect } from "react";
import { Play, RotateCcw, Award, ShieldAlert, Layers, CheckCircle2, AlertTriangle, ArrowRight, History, Sparkles, Sliders } from "lucide-react";
import { playSound } from "../../utils/sound";
import { SimulationAttempt } from "../../types";

interface SimulasiTahapKerjaTabProps {
  onAddXp?: (xp: number) => void;
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
    title: "Konflik Arsitektur Kode & Perbedaan Pendapat Tim Dev",
    category: "Software Engineering & Team Conflict",
    role: "Senior Frontend Lead",
    description: "Terjadi perselisihan sengit antara Tim Frontend & Backend terkait keputusan migrasi REST API ke GraphQL menjelang deadline peluncuran produk.",
    stages: [
      {
        stageNumber: 1,
        title: "Tahap 1: Analisis Situasi & Akar Masalah",
        description: "Kedua pihak saling menyalahkan terkait latency respon API. Bagaimana langkah diagnosa awal Anda?",
        options: [
          {
            id: "s1-opt-a",
            label: "Opsi A: Lakukan profil performa (benchmark) dan network audit independen untuk mengumpulkan data objektif.",
            points: 30,
            specificFeedback: "Sangat baik! Diagnosa berbasis data objektif mencegah perdebatan opini emosional dan mengisolasi masalah secara presisi."
          },
          {
            id: "s1-opt-b",
            label: "Opsi B: Langsung eskalasi masalah ke Engineering Manager untuk membuat keputusan final secepatnya.",
            points: 15,
            specificFeedback: "Eskalasi terlalu awal tanpa data pendukung menambah beban manajemen dan mengikis kepercayaan tim pada kepemimpinan teknis Anda."
          },
          {
            id: "s1-opt-c",
            label: "Opsi C: Meminta Tim Backend menyerah dan mengikuti semua standar keinginan Tim Frontend.",
            points: 10,
            specificFeedback: "Pendekatan sepihak menciptakan iklim kerja toksik dan merusak kolaborasi lintas tim dalam jangka panjang."
          }
        ]
      },
      {
        stageNumber: 2,
        title: "Tahap 2: Pengambilan Keputusan & Aksi Taktis",
        description: "Hasil benchmark menunjukkan N+1 query pada database. Waktu tersisa 5 hari sebelum peluncuran. Keputusan apa yang Anda ambil?",
        options: [
          {
            id: "s2-opt-a",
            label: "Opsi A: Terapkan caching Redis & indexing database sementara (Quick Fix), dan tunda migrasi GraphQL untuk rilis fase 2.",
            points: 40,
            specificFeedback: "Keputusan bisnis & teknis yang sangat matang! Mengutamakan stabilitas rilis tepat waktu sembari menyiapkan utang teknis secara terencana."
          },
          {
            id: "s2-opt-b",
            label: "Opsi B: Paksakan merombak seluruh skema GraphQL dalam 5 hari dengan meminta tim lembur tanpa batas.",
            points: 15,
            specificFeedback: "Berisiko tinggi memicu bug kritis di production dan risiko burnout parah pada anggota tim."
          },
          {
            id: "s2-opt-c",
            label: "Opsi C: Tunda tanggal peluncuran secara sepihak tanpa berkonsultasi dengan Product Owner.",
            points: 10,
            specificFeedback: "Menunda rilis tanpa kesepakatan stakeholder bisnis merugikan roadmap pemasaran dan reputasi tim dev."
          }
        ]
      },
      {
        stageNumber: 3,
        title: "Tahap 3: Mitigasi Risiko & Post-Mortem",
        description: "Produk sukses dirilis tepat waktu tanpa downtime. Langkah pasca-rilis apa yang Anda rancang?",
        options: [
          {
            id: "s3-opt-a",
            label: "Opsi A: Agendakan sesi Blameless Post-Mortem, buat RFC standar API bersama, dan atur jadwal refactoring bertahap.",
            points: 30,
            specificFeedback: "Luar biasa! Pembelajaran kultur blameless memperkuat hubungan kerja dan mencegah terulangnya insiden serupa."
          },
          {
            id: "s3-opt-b",
            label: "Opsi B: Menganggap masalah selesai dan membiarkan kode temporary tanpa dokumentasi utang teknis.",
            points: 10,
            specificFeedback: "Membiarkan utang teknis tanpa dokumentasi akan memicu masalah performa yang lebih besar di masa mendatang."
          },
          {
            id: "s3-opt-c",
            label: "Opsi C: Memberikan penalti atau penilaian buruk pada anggota tim yang sempat berbeda pendapat.",
            points: 5,
            specificFeedback: "Menghukum perbedaan pendapat mematikan inovasi dan menurunkan psikologis keamanan (psychological safety) tim."
          }
        ]
      }
    ]
  },
  {
    id: "scen-2",
    title: "Krisis Outage Server saat Peak Traffic Promosi BUMN",
    category: "DevOps & Infrastructure Incident",
    role: "System Reliability Engineer",
    description: "Sistem aplikasi tiba-tiba mengalami lonjakan error 504 Gateway Timeout di tengah promosi flash sale nasional jam 12:00 WIB.",
    stages: [
      {
        stageNumber: 1,
        title: "Tahap 1: Respon Awal Insiden Kritis",
        description: "Traffic naik 10x lipat,CPU utilization server mencapai 99%. Apa tindakan pertama Anda?",
        options: [
          {
            id: "s1-scen2-a",
            label: "Opsi A: Aktifkan mode pembatasan kuota (Rate Limiting) & sajikan halaman ruang tunggu (Queue Page) untuk stabilisasi beban.",
            points: 30,
            specificFeedback: "Respon tanggap darurat yang tepat! Mencegah server mati total (crash) dan menjaga ketersediaan layanan untuk transaksi yang sedang berjalan."
          },
          {
            id: "s1-scen2-b",
            label: "Opsi B: Melakukan restart server utama secara manual di jam sibuk.",
            points: 10,
            specificFeedback: "Restart manual saat lonjakan traffic akan memperburuk downtime dan menggagalkan ribuan transaksi aktif."
          },
          {
            id: "s1-scen2-c",
            label: "Opsi C: Membiarkan sistem dan berharap traffic akan reda dengan sendirinya.",
            points: 5,
            specificFeedback: "Inaction saat insiden darurat berakibat fatal pada kerugian finansial dan kepercayaan pengguna."
          }
        ]
      },
      {
        stageNumber: 2,
        title: "Tahap 2: Skalabilitas & Taktik Pemulihan",
        description: "Layanan kembali merespon lambat akibat bottleneck database. Bagaimana Anda menyelesaikan akar masalah ini?",
        options: [
          {
            id: "s2-scen2-a",
            label: "Opsi A: Lakukan auto-scaling read-replica database dan alihkan query pencarian produk ke Read-Replica.",
            points: 40,
            specificFeedback: "Pemisahan beban Read/Write pada database merupakan best practice infrastruktur skala tinggi yang sangat efektif."
          },
          {
            id: "s2-scen2-b",
            label: "Opsi B: Langsung menaikkan kapasitas instance (Vertical Scaling) tanpa mematikan fitur yang boros query.",
            points: 20,
            specificFeedback: "Vertical scaling instan memerlukan waktu reboot dan biaya sangat mahal tanpa menyelesaikan query yang tidak efisien."
          },
          {
            id: "s2-scen2-c",
            label: "Opsi C: Mematikan seluruh database secara mendadak.",
            points: 5,
            specificFeedback: "Tindakan drastis tanpa peringatan merusak konsistensi data transaksi finansial pengguna."
          }
        ]
      },
      {
        stageNumber: 3,
        title: "Tahap 3: Komunikasi Stakeholder & Komitmen Kualitas",
        description: "Insiden berhasil diatasi dalam 25 menit. Bagaimana laporan penanganan yang Anda sajikan ke jajaran Manajemen?",
        options: [
          {
            id: "s3-scen2-a",
            label: "Opsi A: Rilis laporan incident timeline yang transparan, estimasi dampak, dan langkah kompensasi voucher bagi pengguna terdampak.",
            points: 30,
            specificFeedback: "Transparansi dan solusi pemulihan nama baik perusahaan menunjukkan profesionalisme tingkat senior."
          },
          {
            id: "s3-scen2-b",
            label: "Opsi B: Menyembunyikan durasi downtime dan menyalahkan penyedia cloud vendor external.",
            points: 10,
            specificFeedback: "Melempar tanggung jawab merusak integritas Anda sebagai profesional yang dapat diandalkan."
          },
          {
            id: "s3-scen2-c",
            label: "Opsi C: Tidak mengirimkan laporan dan menganggap insiden telah berlalu.",
            points: 5,
            specificFeedback: "Tanpa laporan insiden, manajemen tidak dapat mengambil keputusan investasi perbaikan infrastruktur."
          }
        ]
      }
    ]
  },
  {
    id: "scen-3",
    title: "Dilema Integritas & Nilai AKHLAK BUMN",
    category: "Corporate Ethics & Compliance",
    role: "Project Manager Specialist",
    description: "Anda menemukan vendor mitra menawarkan potongan harga di luar kontrak resmi demi meloloskan audit kriteria proyek.",
    stages: [
      {
        stageNumber: 1,
        title: "Tahap 1: Evaluasi Etika & Kepatuhan",
        description: "Vendor meminta Anda menandatangani berita acara serah terima meskipun ada 2 fitur utama yang belum selesai.",
        options: [
          {
            id: "s1-scen3-a",
            label: "Opsi A: Tolak penandatanganan secara tegas dan penerbitan adendum waktu penyelesaian resmi sesuai regulasi.",
            points: 30,
            specificFeedback: "Prinsip AKHLAK (Amanah & Loyal) dijunjung tinggi! Menolak kompromi integritas melindungi organisasi dari konsekuensi hukum."
          },
          {
            id: "s1-scen3-b",
            label: "Opsi B: Menandatangani serah terima dengan janji lisan vendor akan menyelesaikan fitur minggu depan.",
            points: 10,
            specificFeedback: "Janji lisan tanpa ikatan hukum melanggar prinsip tata kelola perusahaan yang baik (GCG)."
          },
          {
            id: "s1-scen3-c",
            label: "Opsi C: Menerima penawaran vendor dan membagi keuntungan bersama tim internal.",
            points: 0,
            specificFeedback: "Pelanggaran berat kode etik integritas yang dapat berakibat sanksi pidana dan pemecatan tidak hormat."
          }
        ]
      },
      {
        stageNumber: 2,
        title: "Tahap 2: Manajemen Konflik & Komunikasi Vendor",
        description: "Vendor mengancam akan menarik seluruh tim pengembang jika Anda tidak meloloskan serah terima.",
        options: [
          {
            id: "s2-scen3-a",
            label: "Opsi A: Tetap berpegang pada syarat kontrak tertulis dan libatkan Tim Hukum / Compliance Perusahaan untuk mendampingi.",
            points: 40,
            specificFeedback: "Sangat tepat! Melibatkan unit legal memastikan posisi perusahaan terlindungi secara sah dan akuntabel."
          },
          {
            id: "s2-scen3-b",
            label: "Opsi B: Panik dan langsung menyetujui tuntutan vendor demi menghindari perdebatan.",
            points: 10,
            specificFeedback: "Tunduk pada ancaman vendor menunjukkan kelemahan manajemen kontrol dan kepemimpinan."
          },
          {
            id: "s2-scen3-c",
            label: "Opsi C: Membatalkan kontrak secara emosional tanpa koordinasi dengan Tim Pengadaan.",
            points: 15,
            specificFeedback: "Pembatalan sepihak tanpa mekanisme sengketa kontrak berisiko memicu gugatan balik ke perusahaan."
          }
        ]
      },
      {
        stageNumber: 3,
        title: "Tahap 3: Pencegahan Kebocoran Risiko Merek",
        description: "Proyek akhirnya berhasil dirampungkan secara legal sesuai kriteria. Langkah penguatan sistem apa yang Anda usulkan?",
        options: [
          {
            id: "s3-scen3-a",
            label: "Opsi A: Buat matriks evaluasi kinerja vendor terbuka dan usulkan audit independen berkala.",
            points: 30,
            specificFeedback: "Sangat baik! Membangun sistem evaluasi transparan meningkatkan standar kualitas vendor mitra di masa mendatang."
          },
          {
            id: "s3-scen3-b",
            label: "Opsi B: Menutup-nutupi rekam jejak vendor agar nama baik proyek tetap terlihat sempurna.",
            points: 10,
            specificFeedback: "Menutup rekam jejak yang buruk berisiko menjebak unit kerja lain dalam menggunakan vendor bermasalah."
          },
          {
            id: "s3-scen3-c",
            label: "Opsi C: Menghentikan seluruh kerja sama dengan vendor luar di masa depan secara permanen.",
            points: 15,
            specificFeedback: "Generalisasi ekstrem tanpa analisis objektif dapat membatasi akses perusahaan terhadap inovasi ekosistem mitra."
          }
        ]
      }
    ]
  }
];

export function SimulasiTahapKerjaTab({ onAddXp }: SimulasiTahapKerjaTabProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(WORK_SCENARIOS[0].id);
  const [difficulty, setDifficulty] = useState<"Pemula" | "Menengah" | "Industri">("Menengah");
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, ScenarioStageOption>>({});
  const [isFinished, setIsFinished] = useState(false);

  // Simulation History state
  const [history, setHistory] = useState<SimulationAttempt[]>(() => {
    try {
      const saved = localStorage.getItem("skillora_simulasi_decision_history");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const activeScenario = WORK_SCENARIOS.find(s => s.id === selectedScenarioId) || WORK_SCENARIOS[0];
  const currentStage = activeScenario.stages[currentStageIdx];

  const handleSelectOption = (opt: ScenarioStageOption) => {
    if (isFinished) return;
    playSound("click");
    setSelectedOptions(prev => ({ ...prev, [currentStageIdx]: opt }));
  };

  const handleNextStage = () => {
    if (!selectedOptions[currentStageIdx]) return;

    if (currentStageIdx < activeScenario.stages.length - 1) {
      setCurrentStageIdx(prev => prev + 1);
      playSound("correct");
    } else {
      // Finish simulation
      setIsFinished(true);
      playSound("levelUp");

      // Calculate scores
      const stage1Score = selectedOptions[0]?.points || 0;
      const stage2Score = selectedOptions[1]?.points || 0;
      const stage3Score = selectedOptions[2]?.points || 0;
      const totalScore = Math.min(100, stage1Score + stage2Score + stage3Score);

      const feedbackList = [
        `Tahap 1: ${selectedOptions[0]?.specificFeedback}`,
        `Tahap 2: ${selectedOptions[1]?.specificFeedback}`,
        `Tahap 3: ${selectedOptions[2]?.specificFeedback}`
      ];

      const newAttempt: SimulationAttempt = {
        id: `sim_${Date.now()}`,
        scenarioId: activeScenario.id,
        scenarioTitle: activeScenario.title,
        type: "DecisionSimulation",
        difficulty,
        score: totalScore,
        completedAt: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        specificFeedback: feedbackList,
        stageScores: { stage1: stage1Score, stage2: stage2Score, stage3: stage3Score }
      };

      const updatedHistory = [newAttempt, ...history.slice(0, 9)];
      setHistory(updatedHistory);
      localStorage.setItem("skillora_simulasi_decision_history", JSON.stringify(updatedHistory));

      if (onAddXp && totalScore >= 70) {
        onAddXp(200);
      }
    }
  };

  const handleRestart = () => {
    setCurrentStageIdx(0);
    setSelectedOptions({});
    setIsFinished(false);
  };

  const calculateTotalScore = () => {
    return Object.values(selectedOptions).reduce((acc, curr) => acc + curr.points, 0);
  };

  return (
    <div className="space-y-6">
      {/* Top Scenario Controls */}
      <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Pilih Skenario Masalah Industri</span>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Simulasi Keputusan Studi Kasus Multi-Tahap</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Tingkat Kesulitan:</span>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {(["Pemula", "Menengah", "Industri"] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setDifficulty(lvl)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    difficulty === lvl
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scenario Selector Chips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {WORK_SCENARIOS.map((scen) => (
            <button
              key={scen.id}
              onClick={() => {
                setSelectedScenarioId(scen.id);
                handleRestart();
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                selectedScenarioId === scen.id
                  ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-950 dark:text-blue-200 font-bold shadow-2xs"
                  : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <span className="text-xs uppercase font-black tracking-wider px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-md">
                {scen.role}
              </span>
              <div className="text-xs font-bold line-clamp-2">{scen.title}</div>
            </button>
          ))}
        </div>
      </div>

      {!isFinished ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stage Interactive Form */}
          <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-6 shadow-sm">
            {/* Stage Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <Layers className="w-4 h-4" />
                  {currentStage.title}
                </span>
                <span>Tahap {currentStageIdx + 1} dari {activeScenario.stages.length}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${((currentStageIdx + 1) / activeScenario.stages.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Stage Description */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400">Konstruksi Masalah</span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                {currentStage.description}
              </p>
            </div>

            {/* Options List */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Respon Keputusan Anda:</label>
              {currentStage.options.map((opt) => {
                const isSelected = selectedOptions[currentStageIdx]?.id === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full text-left p-4 rounded-2xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-950 dark:text-blue-100 font-bold ring-2 ring-blue-500/30"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                disabled={currentStageIdx === 0}
                onClick={() => setCurrentStageIdx(prev => prev - 1)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-900 disabled:opacity-40 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Tahap Sebelumnya
              </button>

              <button
                disabled={!selectedOptions[currentStageIdx]}
                onClick={handleNextStage}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 transition-all shadow-md"
              >
                <span>{currentStageIdx < activeScenario.stages.length - 1 ? "Lanjut Tahap Berikutnya" : "Selesaikan & Lihat Evaluasi"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Scenario Context & Live Decision Summary */}
          <div className="space-y-6">
            <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Ringkasan Skenario</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeScenario.description}
              </p>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Progres Pilihan Anda</span>
                {activeScenario.stages.map((stg, i) => {
                  const opt = selectedOptions[i];
                  return (
                    <div key={stg.stageNumber} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-900">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Tahap {i + 1}</span>
                      <span className={opt ? "text-emerald-600 font-bold" : "text-slate-400 italic"}>
                        {opt ? `Dipilih (+${opt.points} poin)` : "Belum diisi"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Evaluation & Specific Feedback Display */
        <div className="p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-6 max-w-3xl mx-auto shadow-xl">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950 rounded-2xl flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-xl text-slate-900 dark:text-white">Hasil Evaluasi Simulasi Kerja</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Skor Performa & Feedback Spesifik Berdasarkan Keputusan Anda ({difficulty})
            </p>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-around text-center">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase">Skor Total Keputusan</span>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{calculateTotalScore()} / 100</div>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase">Status Evaluasi</span>
              <div className={`text-sm font-black mt-1 ${calculateTotalScore() >= 70 ? "text-emerald-600" : "text-amber-600"}`}>
                {calculateTotalScore() >= 70 ? "SANGAT DIREKOMENDASIKAN" : "PERLU EVALUASI ULANG"}
              </div>
            </div>
          </div>

          {/* Specific Feedback List */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Feedback Spesifik Per Tahap Keputusan:</span>
            </h4>

            {activeScenario.stages.map((stg, i) => {
              const opt = selectedOptions[i];
              return (
                <div key={stg.stageNumber} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span>{stg.title}</span>
                    <span className="text-blue-600 dark:text-blue-400">+{opt?.points || 0} Poin</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1">
                    "{opt?.specificFeedback}"
                  </p>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleRestart}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Coba Ulang Simulasi Skenario Ini</span>
          </button>
        </div>
      )}

      {/* History of Simulation Runs */}
      {history.length > 0 && (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
          <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <span>Riwayat Simulasi Skenario Kerja Sebelumnya ({history.length})</span>
          </h3>

          <div className="space-y-3">
            {history.map((attempt) => (
              <div key={attempt.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{attempt.scenarioTitle}</span>
                  <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg font-black">
                    Skor: {attempt.score}/100
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Tingkat: <strong>{attempt.difficulty}</strong></span>
                  <span>{attempt.completedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
