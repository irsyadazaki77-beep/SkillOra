import { Shield, Twitter, Linkedin, Github, MessageSquare } from "lucide-react";
import { SkilloraLogo } from "./SkilloraLogo";

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 pt-16 pb-36 md:pb-16 px-4 md:px-12 mt-auto relative overflow-hidden rounded-t-[2.5rem] mt-3">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-2 lg:gap-16 relative z-10">
        <div className="col-span-1 md:col-span-4 space-y-5 text-center md:text-left">
          <div className="flex items-center gap-2.5 justify-center md:justify-start">
            <SkilloraLogo variant="full" size="lg" darkMode={true} />
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-xs px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest shadow-sm ml-1">PRO</span>
          </div>
          <p className="leading-relaxed text-slate-400 font-medium text-base">
            Platform pembelajaran dan bursa kerja tergamifikasi. Menyediakan kurikulum berbasis AI yang disesuaikan dengan kebutuhan industri masa kini.
          </p>
          <div className="flex items-center gap-2 justify-center md:justify-start pt-2">
            {[
              { icon: Twitter, link: "#", label: "Twitter" },
              { icon: Linkedin, link: "#", label: "LinkedIn" },
              { icon: Github, link: "#", label: "GitHub" },
              { icon: MessageSquare, link: "#", label: "Discord" }
            ].map((social, i) => {
              const Icon = social.icon;
              return (
                <a key={i} href={social.link} aria-label={social.label} className="w-9 h-9 rounded-full bg-slate-800 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors border border-slate-700 hover:border-blue-500 group">
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-white" />
                </a>
              );
            })}
          </div>
        </div>

        <div className="col-span-1 md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>
            <span className="font-sans font-bold text-white block mb-4">Produk Utama</span>
            <ul className="space-y-3 text-base font-medium text-slate-400">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Jalur Belajar AI</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Ruang Kolaborasi</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Bursa Kerja</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Evaluasi Portofolio</a></li>
            </ul>
          </div>
          <div>
            <span className="font-sans font-bold text-white block mb-4">Mitra Perekrut</span>
            <ul className="space-y-3 text-base font-medium text-slate-400">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Gojek Tech</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Tokopedia Engineering</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Traveloka Design</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Telkom Digital</a></li>
            </ul>
          </div>
          <div>
            <span className="font-sans font-bold text-white block mb-4">Integrasi AI</span>
            <ul className="space-y-3 text-base font-medium text-slate-400">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Gemini Pro 1.5</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">AI Code Reviewer</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Auto-Matching CV</a></li>
            </ul>
          </div>
          <div>
            <span className="font-sans font-bold text-white block mb-4">Perusahaan</span>
            <ul className="space-y-3 text-base font-medium text-slate-400">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Tentang Kami</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Karir</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Pusat Bantuan</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-800/80 pt-8 mt-4 flex flex-col md:flex-row justify-between items-center text-base text-slate-500 font-medium relative z-10">
        <p>© 2026 Skillora EduAI Platform. Seluruh hak cipta dilindungi undang-undang.</p>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <a href="#" className="hover:text-slate-300">Syarat & Ketentuan</a>
          <a href="#" className="hover:text-slate-300">Kebijakan Privasi</a>
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Bersertifikasi AI Studio</span>
        </div>
      </div>
    </footer>
  );
}
