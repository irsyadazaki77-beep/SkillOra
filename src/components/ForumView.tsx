import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, ChevronUp, Clock, Search, X, Send, Sparkles, CheckCircle2, ShieldAlert, Flag, Heart, CornerDownRight, Shield, AlertTriangle, Filter } from "lucide-react";
import { Profile } from "../types";
import { EmptyState } from "./EmptyState";
import { playSound } from "../utils/sound";

import { forumApi } from "../api/apiClient";

export interface ForumReplyItem {
  id: string;
  author: string;
  authorAvatar: string;
  authorRole?: string;
  content: string;
  createdAt: string;
}

export interface ForumPost {
  id: string;
  author: string;
  authorAvatar: string;
  authorLevel: number;
  title: string;
  content: string;
  tags: string[];
  category?: string;
  upvotes: number;
  replies: number;
  repliesList?: ForumReplyItem[];
  createdAt: string;
  isHot?: boolean;
  isSolved?: boolean;
  isReported?: boolean;
  userLiked?: boolean;
}

interface ForumViewProps {
  profile: Profile;
  posts: ForumPost[];
  handleCreatePost: (title: string, content: string, tags: string[]) => void;
  handleUpvote: (postId: string) => void;
  onPostsUpdated?: (posts: ForumPost[]) => void;
}

export interface NestedComment {
  id: string;
  author: string;
  avatar: string;
  level: number;
  time: string;
  text: string;
  likes: number;
  userLiked?: boolean;
  replyToId?: string | null;
  replyToAuthor?: string | null;
}

export function ForumView({ profile, posts, handleCreatePost, handleUpvote, onPostsUpdated }: ForumViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [isComposing, setIsComposing] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("Frontend");
  const [newTags, setNewTags] = useState("");

  // Spam Prevention Cooldown & Duplicate Check
  const [lastPostTime, setLastPostTime] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [spamError, setSpamError] = useState<string | null>(null);

  // Moderation filter toggle
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>(posts);

  useEffect(() => {
    if (posts) {
      setForumPosts(posts);
      if (selectedPost) {
        const refreshed = posts.find((p) => p.id === selectedPost.id);
        if (refreshed) setSelectedPost(refreshed);
      }
    }
  }, [posts]);

  // Selected post for viewing replies modal
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyingToComment, setReplyingToComment] = useState<NestedComment | null>(null);

  // Report modal state
  const [reportModalPostId, setReportModalPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("Spam / Konten Berulang");

  const categories = ["Semua", "Frontend", "Backend", "UI/UX", "AI", "Karir", "Tanya Mentor", "Bug"];

  const safePosts = Array.isArray(forumPosts) ? forumPosts : [];
  const filteredPosts = safePosts.filter(post => {
    // Filter out reported posts if not in moderator panel
    if (post.isReported && !showModerationPanel) return false;

    const matchCategory = activeCategory === "Semua" || post.category === activeCategory || post.tags.includes(activeCategory);
    const matchSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleSubmit = () => {
    setSpamError(null);

    if (!newTitle.trim() || !newContent.trim()) {
      setSpamError("Judul dan isi pesan wajib diisi.");
      return;
    }

    // Anti-spam cooldown (30 seconds)
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - lastPostTime) / 1000);
    if (lastPostTime > 0 && elapsedSeconds < 30) {
      const waitTime = 30 - elapsedSeconds;
      setCooldownRemaining(waitTime);
      setSpamError(`Mohon tunggu ${waitTime} detik sebelum membuat postingan baru (Proteksi Spam).`);
      playSound("wrong");
      return;
    }

    // Anti-duplicate content check
    const isDuplicate = forumPosts.some(
      p => p.title.trim().toLowerCase() === newTitle.trim().toLowerCase() ||
           p.content.trim().toLowerCase() === newContent.trim().toLowerCase()
    );

    if (isDuplicate) {
      setSpamError("Sistem mendeteksi topik dengan judul atau isi serupa. Gunakan fitur pencarian untuk menghindari duplicate post.");
      playSound("wrong");
      return;
    }

    const tagsArray = newTags.split(",").map(t => t.trim()).filter(t => t.length > 0);
    if (!tagsArray.includes(newCategory)) {
      tagsArray.unshift(newCategory);
    }

    const newPostObj: ForumPost = {
      id: `post_${Date.now()}`,
      author: profile.name,
      authorAvatar: profile.avatar || "👤",
      authorLevel: profile.level,
      title: newTitle.trim(),
      content: newContent.trim(),
      tags: tagsArray,
      category: newCategory,
      upvotes: 1,
      replies: 0,
      createdAt: "Baru saja",
      isSolved: false,
      isReported: false
    };

    setForumPosts(prev => [newPostObj, ...prev]);
    handleCreatePost(newTitle, newContent, tagsArray);
    
    setLastPostTime(now);
    setIsComposing(false);
    setNewTitle("");
    setNewContent("");
    setNewTags("");
    playSound("levelUp");
  };

  const handleToggleLikePost = (postId: string) => {
    playSound("click");
    setForumPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const liked = !p.userLiked;
        return {
          ...p,
          userLiked: liked,
          upvotes: liked ? p.upvotes + 1 : Math.max(0, p.upvotes - 1)
        };
      }
      return p;
    }));
    handleUpvote(postId);
  };

  const handleToggleSolvePost = (postId: string) => {
    playSound("success");
    setForumPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, isSolved: !p.isSolved };
      }
      return p;
    }));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => prev ? { ...prev, isSolved: !prev.isSolved } : null);
    }
  };

  const handleReportPostSubmit = () => {
    if (!reportModalPostId) return;
    playSound("wrong");
    setForumPosts(prev => prev.map(p => p.id === reportModalPostId ? { ...p, isReported: true } : p));
    setReportModalPostId(null);
  };

  const handleModeratorApprove = (postId: string) => {
    playSound("correct");
    setForumPosts(prev => prev.map(p => p.id === postId ? { ...p, isReported: false } : p));
  };

  const handleModeratorDelete = (postId: string) => {
    playSound("laser");
    setForumPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleAddReply = async () => {
    if (!selectedPost || !replyInput.trim() || submittingReply) return;
    const postId = selectedPost.id;
    const textToSend = replyingToComment
      ? `@${replyingToComment.author} — ${replyInput.trim()}`
      : replyInput.trim();
    setSubmittingReply(true);
    try {
      const updatedPosts = await forumApi.replyPost(postId, textToSend);
      playSound("click");
      setForumPosts(updatedPosts);
      if (onPostsUpdated) onPostsUpdated(updatedPosts);
      const updatedSelected = updatedPosts.find((p: ForumPost) => p.id === postId) || null;
      setSelectedPost(updatedSelected);
      setReplyInput("");
      setReplyingToComment(null);
    } catch {
      playSound("wrong");
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="w-full space-y-6 font-sans py-2">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="space-y-1 max-w-2xl">
          <p className="text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            Komunitas Belajar &amp; Diskusi
          </p>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-zinc-950 dark:text-white">
            Forum Komunitas &amp; Diskusi
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
            Diskusikan materi, tanya jawab bug, atau berbagi info loker terbaru dengan balasan bertingkat dan sistem moderasi transparan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {(profile.role === "Admin" || profile.role === "Mentor") && (
            <button
              type="button"
              onClick={() => setShowModerationPanel(!showModerationPanel)}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                showModerationPanel
                  ? "bg-amber-500 text-zinc-950"
                  : "bg-zinc-100 dark:bg-zinc-900 text-amber-600 dark:text-amber-400 border border-amber-500/30"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Moderasi ({forumPosts.filter(p => p.isReported).length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsComposing(!isComposing)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            {isComposing ? <X className="w-4 h-4" /> : "+ Mulai Diskusi"}
          </button>
        </div>
      </header>

      {/* Moderator Panel Info */}
      {showModerationPanel && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            Mode Moderasi Aktif: Menampilkan postingan yang dilaporkan oleh pengguna.
          </span>
          <button onClick={() => setShowModerationPanel(false)} className="underline cursor-pointer">Tutup Moderasi</button>
        </div>
      )}

      {/* Compose Drawer */}
      <AnimatePresence>
      {isComposing && (
        <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -10, height: 0 }} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm space-y-4">
          <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg">Mulai Diskusi Baru</h3>
          
          {spamError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{spamError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wider">Judul Topik</label>
                <input aria-label="Apa yang ingin Anda diskusikan?" type="text" placeholder="Apa yang ingin Anda diskusikan?" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white font-medium" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wider">Kategori</label>
                <select aria-label="Input field" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white font-medium cursor-pointer">
                  {categories.filter(c => c !== "Semua").map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wider">Isi Pesan / Diskusi</label>
              <textarea aria-label="Jelaskan detail pertanyaan atau materi..." placeholder="Jelaskan detail pertanyaan atau materi..." rows={4} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white resize-none font-medium" value={newContent} onChange={e => setNewContent(e.target.value)} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wider">Tags (Pisahkan koma)</label>
              <input aria-label="React, State, Hook..." type="text" placeholder="React, State, Hook..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white font-medium" value={newTags} onChange={e => setNewTags(e.target.value)} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsComposing(false)} className="px-5 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-medium cursor-pointer">Batal</button>
              <button onClick={handleSubmit} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer">Kirim Post</button>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 md:pb-0 hide-scrollbar">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input aria-label="Cari percakapan..." type="text" placeholder="Cari percakapan..." className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <EmptyState
            variant="search"
            title="Tidak Ada Diskusi"
            description="Belum ada diskusi untuk kategori atau pencarian ini."
            onRetry={() => { setSearchQuery(""); setActiveCategory("Semua"); }}
          />
        ) : (
          filteredPosts.map(post => (
            <motion.div 
              key={post.id} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              onClick={() => setSelectedPost(post)}
              className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border transition-all duration-300 group cursor-pointer relative ${
                post.isReported
                  ? "border-amber-400 bg-amber-50/20 dark:bg-amber-950/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="flex gap-4">
                {/* Upvote Button */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleLikePost(post.id); }}
                    className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all border ${
                      post.userLiked
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-blue-600 border-slate-100 dark:border-slate-700"
                    }`}
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{post.upvotes}</span>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                        {post.authorAvatar}
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{post.author}</span>
                      <span className="text-xs font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md uppercase">Lvl {post.authorLevel}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {post.createdAt}</span>
                    </div>

                    {post.isSolved && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> SOLVED
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-display font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                    {post.isHot && <span>🔥</span>}
                    <span>{post.title}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed font-medium">
                    {post.content}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {post.tags.map(tag => (
                        <span key={tag} className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportModalPostId(post.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Laporkan Topik"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>

                      {showModerationPanel && post.isReported && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleModeratorApprove(post.id); }}
                            className="px-2 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg cursor-pointer"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleModeratorDelete(post.id); }}
                            className="px-2 py-1 bg-rose-600 text-white font-bold text-xs rounded-lg cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {post.replies} Balasan
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Nested Replies Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                    {selectedPost.authorAvatar}
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{selectedPost.author}</h4>
                    <span className="text-xs text-slate-400">{selectedPost.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleSolvePost(selectedPost.id)}
                    className={`px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                      selectedPost.isSolved
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{selectedPost.isSolved ? "Status: Solved" : "Tandai Solved"}</span>
                  </button>
                  <button 
                    onClick={() => setSelectedPost(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                <div>
                  <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-2">{selectedPost.title}</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    {selectedPost.content}
                  </p>
                </div>

                {/* Nested Comment Thread */}
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span>Balasan Diskusi ({(selectedPost.repliesList || []).length})</span>
                  </h3>

                  <div className="space-y-3">
                    {(selectedPost.repliesList || []).length === 0 ? (
                      <p className="text-xs text-slate-400">Belum ada balasan. Jadilah yang pertama menanggapi.</p>
                    ) : (
                      (selectedPost.repliesList || []).map((reply) => (
                        <div
                          key={reply.id}
                          className="p-3.5 rounded-2xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{reply.authorAvatar}</span>
                              <span>{reply.author}</span>
                              {reply.authorRole === "mentor" && (
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                  · Mentor
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(reply.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                            {reply.content}
                          </p>

                          <div className="flex justify-end pt-1 text-xs">
                            <button
                              type="button"
                              onClick={() =>
                                setReplyingToComment({
                                  id: reply.id,
                                  author: reply.author,
                                  avatar: reply.authorAvatar,
                                  level: 1,
                                  time: reply.createdAt,
                                  text: reply.content,
                                  likes: 0,
                                })
                              }
                              className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              Balas
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
                {replyingToComment && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-xl text-xs font-bold">
                    <span>Membalas: @{replyingToComment.author}</span>
                    <button onClick={() => setReplyingToComment(null)} className="p-1 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input aria-label="Tulis balasan Anda"
                    type="text"
                    placeholder={replyingToComment ? `Balas @${replyingToComment.author}...` : "Tulis balasan Anda..."}
                    value={replyInput}
                    onChange={e => setReplyInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddReply()}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddReply}
                    disabled={!replyInput.trim() || submittingReply}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> {submittingReply ? "..." : "Balas"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {reportModalPostId && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
                <Flag className="w-5 h-5" />
                <span>Laporkan Diskusi</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pilih alasan pelaporan topik ini untuk ditinjau oleh tim moderator:</p>
              
              <select aria-label="Input field" value={reportReason} onChange={e => setReportReason(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white">
                <option value="Spam / Konten Berulang">Spam / Konten Berulang</option>
                <option value="Bahasa Tidak Sopan / SARA">Bahasa Tidak Sopan / SARA</option>
                <option value="Penipuan / Lowongan Palsu">Penipuan / Lowongan Palsu</option>
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setReportModalPostId(null)} className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300">Batal</button>
                <button onClick={handleReportPostSubmit} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer">Kirim Laporan</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

