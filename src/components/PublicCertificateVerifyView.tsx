import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";

export function PublicCertificateVerifyView() {
  const { certificateId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cert, setCert] = useState<any>(null);

  useEffect(() => {
    if (!certificateId) {
      setError("ID Sertifikat tidak valid.");
      setLoading(false);
      return;
    }

    const fetchCert = async () => {
      try {
        const res = await fetch(`/api/public/certificates/${certificateId}`);
        const data = await res.json();
        
        if (!data.success) {
          setError(data.error || "Gagal memverifikasi sertifikat.");
        } else {
          setCert(data.certificate);
        }
      } catch (err) {
        setError("Network error. Gagal menghubungi server verifikasi.");
      } finally {
        setLoading(false);
      }
    };

    fetchCert();
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
        <p className="font-mono text-emerald-500">Memverifikasi Sertifikat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">❌</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Verifikasi Gagal</h2>
        <p className="text-slate-400 max-w-md">{error}</p>
        <button 
          onClick={() => navigate("/")}
          className="mt-8 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  if (!cert) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-xl font-bold text-white">S</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-tight">Skillora Pro</h1>
            <p className="text-xs text-amber-500 font-bold uppercase tracking-wider">Verifikasi Kredensial</p>
          </div>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-colors"
        >
          <span>🖨️</span>
          <span className="hidden sm:inline">Cetak Dokumen</span>
        </button>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:col-span-8 flex justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[900px] flex flex-col gap-6"
          >
            <div 
              id="printable-certificate"
              className="relative w-full aspect-[1.414/1] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-white/10"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
              
              <div className="relative z-10 w-full h-full p-8 md:p-12 lg:p-16 flex gap-8 md:gap-12">
                <div className="w-1/3 flex flex-col justify-between border-r border-slate-500/20 pr-8 md:pr-12">
                  <div className="space-y-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-3xl font-bold text-white">S</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white leading-none">SKILLORA</h2>
                      <p className="text-xs text-amber-500 font-bold uppercase tracking-widest mt-1">Industrial Tech Academy</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <span className="block text-xs font-black uppercase text-slate-500 tracking-widest mb-2">Status Kredensial</span>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-xs font-bold uppercase">Terverifikasi</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 p-3 bg-slate-950/50 rounded-xl border border-white/5">
                      <div className="p-1 bg-white rounded-lg shrink-0 flex items-center justify-center">
                        <QRCodeSVG value={window.location.href} size={64} level="M" />
                      </div>
                      <div className="text-left leading-none">
                        <span className="font-mono text-xs font-bold text-emerald-500">ID: {cert.certificateId.slice(0, 16)}...</span>
                        <span className="block text-[8px] text-slate-400 mt-1 font-semibold">Tervalidasi Digital</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col justify-between text-left">
                  <div>
                    <div className="space-y-2 mb-8">
                      <h5 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                        SERTIFIKAT KELULUSAN &bull; CERTIFICATE OF COMPLETION
                      </h5>
                      <p className="text-sm font-medium italic text-slate-400">
                        Sertifikat ini secara resmi dianugerahkan kepada / This is to officially certify that:
                      </p>
                    </div>
                    
                    <div className="mb-8">
                      <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight from-white via-indigo-100 to-violet-300 bg-clip-text text-transparent">
                        {cert.recipientName}
                      </h2>
                      <div className="h-1 w-32 mt-4 from-amber-500 to-yellow-400 bg-gradient-to-r rounded-full"></div>
                    </div>
                    
                    <p className="text-sm md:text-base leading-relaxed text-slate-300 mb-6 max-w-xl">
                      Telah sukses menyelesaikan evaluasi komprehensif, pengerjaan projek standar industri mitra, dan dinilai memenuhi kualifikasi profesional tingkat tinggi dalam bidang:
                    </p>
                    
                    <div className="p-5 rounded-xl border relative overflow-hidden bg-slate-950/60 border-white/5">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-yellow-400"></div>
                      <h3 className="font-display text-xl md:text-2xl font-black text-white">
                        &ldquo;{cert.courseId}&rdquo;
                      </h3>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 text-sm border-t border-slate-500/10 pt-6 mt-8">
                    <div>
                      <span className="block font-black uppercase text-slate-500 tracking-wider mb-1">Tanggal Terbit</span>
                      <span className="font-semibold text-slate-200">{new Date(cert.issuedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div>
                      <span className="block font-black uppercase text-slate-500 tracking-wider mb-1">Nilai Evaluasi</span>
                      <span className="font-black text-emerald-400">{cert.score ? `Grade ${(cert.score >= 90 ? 'A+' : cert.score >= 80 ? 'A' : cert.score >= 70 ? 'B' : 'C')} (${cert.score}/100)` : 'Lulus'} ⭐</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-white/10 rounded-lg p-4 flex gap-3 text-slate-400 text-sm">
              <span className="text-xl shrink-0">📢</span>
              <p className="leading-relaxed">
                <strong className="text-slate-200 block mb-1">Bagaimana Cara Kerja Verifikasi Ini?</strong> 
                Halaman ini memvalidasi ID Sertifikat secara langsung terhadap database pusat Skillora. Jika sertifikat ini dicabut atau tidak terdaftar, halaman ini akan menampilkan status tidak valid. Ini memberikan keamanan verifikasi secara matematis bagi perekrut dan mitra industri.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="mt-auto border-t border-white/5 py-6 text-center text-sm text-slate-500">
        <p>&copy; 2026 SKILLORA PRO &bull; Industrial Tech Academy &bull; Kredensial Terverifikasi Secara Resmi.</p>
      </footer>

      <style>{`
        @media print {
          @page { size: landscape; margin: 0; }
          body { background: none !important; margin: 0; color: black; }
          header, footer, .bg-slate-900 { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; max-width: 100vw !important; }
          #printable-certificate { position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; margin: 0 !important; padding: 3rem !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}
