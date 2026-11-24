import React from "react";
import { motion } from "motion/react";
import { 
  Users,
  MessageSquare, 
  ShoppingBag, 
  Briefcase, 
  TrendingUp, 
  Compass, 
  ArrowRight, 
  Sparkles, 
  Zap,
  Award,
  BookOpen,
  Flame,
  Gem,
  ArrowUpRight
} from "lucide-react";
import { features } from "../data/jelajahiMenu";
import { Profile } from "../types";

interface JelajahiViewProps {
  profile: Profile;
  onNavigate: (tab: any) => void;
  onOpenFlashChallenge: () => void;
  onOpenMentorChat: () => void;
}

export function JelajahiView({ 
  profile, 
  onNavigate, 
  onOpenFlashChallenge,
  onOpenMentorChat
}: JelajahiViewProps) {
  
  return (
    <div className="min-h-full bg-[#030303] text-slate-200 font-sans p-6 md:p-10 rounded-3xl relative overflow-hidden shadow-sm border border-white/5">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-gradient-to-b from-indigo-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      
      <div className="w-full relative z-10 space-y-16 py-4">
        
        {/* Header / Hero */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-b border-white/5 pb-12">
          <motion.div 
            initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }} 
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6 max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-base font-semibold text-slate-300 tracking-widest uppercase">
              <Compass className="w-3.5 h-3.5" /> Dashboard Utama
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-light text-white tracking-tight leading-[1.1]">
              Eksplorasi <br/>
              <span className="font-medium text-transparent bg-clip-text from-slate-200 to-slate-500">Tanpa Batas.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 font-light max-w-lg leading-relaxed">
              Satu portal eksklusif untuk semua kebutuhan karir, pembelajaran, dan pencapaian Anda.
            </p>
          </motion.div>

          {/* Minimalist Stats */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex gap-8 lg:gap-12"
          >
            <div className="flex flex-col items-start lg:items-end">
              <span className="text-base uppercase tracking-widest text-slate-500 font-semibold mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400"/> Konsistensi
              </span>
              <span className="text-4xl font-light text-white tracking-tight">{profile.streak} <span className="text-base font-medium text-slate-500 tracking-normal">Hari</span></span>
            </div>
            <div className="w-px h-16 bg-white/10 self-center hidden lg:block" />
            <div className="flex flex-col items-start lg:items-end">
              <span className="text-base uppercase tracking-widest text-slate-500 font-semibold mb-3 flex items-center gap-2">
                <Gem className="w-4 h-4 text-emerald-400"/> Gems
              </span>
              <span className="text-4xl font-light text-white tracking-tight">{profile.gems}</span>
            </div>
          </motion.div>
        </div>

        {/* Action Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onClick={onOpenFlashChallenge}
            className="group relative bg-white/5 border border-white/10 p-8 md:p-10 rounded-[2rem] cursor-pointer overflow-hidden transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-sm hover:shadow-amber-500/10"
          >
            <div className="absolute top-0 right-0 p-10 opacity-0 group-hover:opacity-10 transition-opacity duration-300 transform group-hover:scale-105">
              <Zap className="w-40 h-40 text-amber-400" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between gap-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20 shadow-inner">
                <Zap className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-medium text-white mb-3 tracking-tight">Kuis Kilat (Flash)</h3>
                <p className="text-slate-400 mb-8 leading-relaxed font-light">Uji kemampuan taktis secara acak, jawab cepat, dan menangkan Gems ekstra untuk profil Anda.</p>
                <div className="inline-flex items-center gap-3 text-base font-semibold text-amber-400 group-hover:gap-4 transition-all uppercase tracking-wider">
                  Mulai Tantangan <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            onClick={onOpenMentorChat}
            className="group relative bg-indigo-500/5 border border-indigo-500/10 p-8 md:p-10 rounded-[2rem] cursor-pointer overflow-hidden transition-all duration-300 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:shadow-sm hover:shadow-indigo-500/10"
          >
            <div className="absolute top-0 right-0 p-10 opacity-0 group-hover:opacity-10 transition-opacity duration-300 transform group-hover:scale-105">
              <Sparkles className="w-40 h-40 text-indigo-400" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between gap-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-inner">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-medium text-white mb-3 tracking-tight">AI Mentor Owl</h3>
                <p className="text-slate-400 mb-8 leading-relaxed font-light">Bicara langsung dengan asisten cerdas untuk memecahkan masalah materi atau panduan karir.</p>
                <div className="inline-flex items-center gap-3 text-base font-semibold text-indigo-400 group-hover:gap-4 transition-all uppercase tracking-wider">
                  Mulai Konsultasi <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Modules Grid */}
        <div className="pt-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
            <h2 className="text-3xl font-light text-white tracking-tight">Katalog Modul</h2>
            <span className="text-base text-slate-400 font-semibold px-4 py-2 bg-white/5 rounded-full border border-white/5 tracking-widest uppercase">
              {features.length} Tersedia
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  onClick={() => onNavigate(item.id)}
                  className="group flex flex-col justify-between p-8 rounded-3xl bg-[#0a0a0a] border border-white/5 hover:border-white/10 hover:bg-[#111111] transition-all duration-300 cursor-pointer h-full hover:shadow-sm hover:-translate-y-1"
                >
                  <div>
                    <div className="flex items-start justify-between mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 text-slate-300 flex items-center justify-center border border-white/5 group-hover:scale-105 group-hover:bg-white/10 group-hover:text-white transition-all duration-300">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-base font-bold text-slate-500 uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/5 group-hover:text-slate-300 transition-colors">
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="text-xl font-medium text-white mb-3 group-hover:text-indigo-400 transition-colors tracking-tight">{item.title}</h3>
                    <p className="text-base text-slate-500 leading-relaxed font-light">{item.description}</p>
                  </div>
                  
                  <div className="mt-10 flex items-center gap-2 text-base font-bold uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">
                    {item.actionLabel} <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
