import { useState, useRef, useEffect, useMemo } from "react";
import {
  Users,
  Send,
  ExternalLink,
  MessageSquare,
  Calendar,
  Kanban,
  Sliders,
  Star,
  Gift,
  ShieldAlert,
  Sparkles,
  Edit3,
  AlignLeft,
  Activity,
  CheckCircle2,
  FolderGit2,
  Plus,
  Wifi,
  WifiOff,
} from "lucide-react";
import { CollabRoom } from "../types";
import { forumApi, getAuthTokenForWs } from "../api/apiClient";
import { motion } from "motion/react";

interface KolaborasiViewProps {
  rooms: CollabRoom[];
  chatMessage: string;
  setChatMessage: (msg: string) => void;
  handleSendMessage: (roomId: string) => void;
  handleMoveTask: (roomId: string, taskId: string, status: "todo" | "in-progress" | "review" | "done") => void;
  handleCollabProjectSubmit: (roomId: string, url: string) => void;
  onRoomsUpdated?: (rooms: CollabRoom[] | ((prev: CollabRoom[]) => CollabRoom[])) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

const PRIORITY_STYLE: Record<string, string> = {
  Tinggi: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  Sedang: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  Rendah: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
};

export function KolaborasiView({
  rooms,
  chatMessage,
  setChatMessage,
  handleSendMessage,
  handleMoveTask,
  handleCollabProjectSubmit,
  onRoomsUpdated,
  showToast,
}: KolaborasiViewProps) {
  const [activeRoomId, setActiveRoomId] = useState<string>(rooms[0]?.id || "");
  const [collabUrl, setCollabUrl] = useState("");
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [wsConnected, setWsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [viewMode, setViewMode] = useState<"kanban" | "timeline" | "whiteboard">("kanban");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>("all");
  const [activeRightTab, setActiveRightTab] = useState<"chat" | "team" | "activity">("chat");
  const [activityLogs, setActivityLogs] = useState<string[]>([
    "Terhubung ke papan kolaborasi tim Skillora",
  ]);
  const [whiteboardText, setWhiteboardText] = useState(
    "## Catatan Sprints Tim\n- Sinkronisasi tugas di papan Kanban\n- Review kode sebelum submit tautan repositori"
  );

  // Create room inline modal state
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);

  // Create task inline state
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"Tinggi" | "Sedang" | "Rendah">("Sedang");
  const [creatingTask, setCreatingTask] = useState(false);

  useEffect(() => {
    if (rooms.length > 0 && !rooms.some((r) => r.id === activeRoomId)) {
      setActiveRoomId(rooms[0].id);
    }
  }, [rooms, activeRoomId]);

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId) || rooms[0],
    [rooms, activeRoomId]
  );

  // Real-time WebSocket sync per active room
  useEffect(() => {
    if (!activeRoom?.id) return;
    let cancelled = false;
    let ws: WebSocket | null = null;

    getAuthTokenForWs().then((token) => {
      if (cancelled || !token) return;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const url = `${protocol}//${window.location.host}/ws/collab?roomId=${encodeURIComponent(
        activeRoom.id
      )}&token=${encodeURIComponent(token)}`;
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!cancelled) setWsConnected(true);
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === "connected") {
            setOnlineCount(msg.onlineCount || 1);
          } else if (msg.type === "chat:sync" && msg.roomId === activeRoom.id) {
            onRoomsUpdated?.((prev) =>
              prev.map((r) => (r.id === activeRoom.id ? { ...r, chat: msg.messages || [] } : r))
            );
            setActivityLogs((prev) => [`Pesan baru diterima di ruang ${activeRoom.title}`, ...prev].slice(0, 20));
          } else if (msg.type === "task:sync" && msg.roomId === activeRoom.id) {
            onRoomsUpdated?.((prev) =>
              prev.map((r) => (r.id === activeRoom.id ? { ...r, tasks: msg.tasks || [] } : r))
            );
            setActivityLogs((prev) => [`Status tugas diperbarui secara real-time`, ...prev].slice(0, 20));
          } else if (msg.type === "error" && msg.message) {
            showToast?.(msg.message, "error");
          }
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        if (!cancelled) {
          setWsConnected(false);
          if (wsRef.current === ws) wsRef.current = null;
        }
      };

      ws.onerror = () => {
        if (!cancelled) setWsConnected(false);
      };
    });

    return () => {
      cancelled = true;
      setWsConnected(false);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [activeRoom?.id]);

  useEffect(() => {
    if (activeRightTab === "chat" && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [activeRoom?.chat, activeRightTab]);

  const sendMessageSmart = (roomId: string) => {
    const trimmed = chatMessage.trim();
    if (!trimmed) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "chat:send", text: trimmed }));
      setChatMessage("");
    } else {
      handleSendMessage(roomId);
    }
  };

  const moveTaskSmart = (
    roomId: string,
    taskId: string,
    status: "todo" | "in-progress" | "review" | "done"
  ) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "task:status", taskId, status }));
    } else {
      handleMoveTask(roomId, taskId, status);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomTitle.trim() || creatingRoom) return;
    setCreatingRoom(true);
    try {
      const updatedRooms = await forumApi.createCollaborationRoom(newRoomTitle.trim());
      if (Array.isArray(updatedRooms)) {
        onRoomsUpdated?.(updatedRooms);
        const created = updatedRooms[updatedRooms.length - 1];
        if (created?.id) setActiveRoomId(created.id);
      }
      setNewRoomTitle("");
      setShowCreateRoom(false);
      showToast?.("Ruang kolaborasi baru berhasil dibuat!", "success");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal membuat ruang kolaborasi.", "error");
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleCreateTask = async () => {
    if (!activeRoom || !newTaskTitle.trim() || creatingTask) return;
    setCreatingTask(true);
    try {
      const res = await forumApi.createTask(
        activeRoom.id,
        newTaskTitle.trim(),
        newTaskAssignee.trim() || "Tim",
        newTaskPriority
      );
      if (res?.tasks) {
        onRoomsUpdated?.((prev) =>
          prev.map((r) => (r.id === activeRoom.id ? { ...r, tasks: res.tasks } : r))
        );
      }
      setNewTaskTitle("");
      setNewTaskAssignee("");
      setShowCreateTask(false);
      setActivityLogs((prev) => [`Tugas baru ditambahkan: ${newTaskTitle.trim()}`, ...prev].slice(0, 20));
      showToast?.("Tugas baru ditambahkan ke papan Kanban.", "success");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal menambahkan tugas.", "error");
    } finally {
      setCreatingTask(false);
    }
  };

  if (!activeRoom) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 border border-slate-200 dark:border-slate-800 text-center space-y-5 shadow-sm">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-800 mx-auto flex items-center justify-center">
          <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="space-y-2 max-w-lg mx-auto">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Belum Ada Ruang Kolaborasi Aktif
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Buat ruang kolaborasi tim pertama Anda untuk mulai membagi tugas Kanban dan berdiskusi real-time.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="flex gap-2 max-w-md w-full">
            <input
              type="text"
              value={newRoomTitle}
              onChange={(e) => setNewRoomTitle(e.target.value)}
              placeholder="Nama proyek kolaborasi tim..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
            />
            <button
              onClick={handleCreateRoom}
              disabled={!newRoomTitle.trim() || creatingRoom}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
            >
              {creatingRoom ? "Membuat..." : "Buat Ruang"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const doneTasksCount = activeRoom.tasks.filter((t) => t.status === "done").length;
  const totalTasksCount = activeRoom.tasks.length;
  const teamCompletionPercentage = totalTasksCount > 0 ? Math.round((doneTasksCount / totalTasksCount) * 100) : 0;

  return (
    <div id="view-kolaborasi" className="space-y-6">
      {/* Room Selector & Create Room Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
            Ruang Aktif:
          </span>
          {rooms.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setActiveRoomId(r.id);
                setCollabUrl("");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                r.id === activeRoom.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {r.title}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowCreateRoom((v) => !v)}
          className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Buat Ruang Tim
        </button>
      </div>

      {showCreateRoom && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <input
            type="text"
            value={newRoomTitle}
            onChange={(e) => setNewRoomTitle(e.target.value)}
            placeholder="Contoh: Sprint Capstone E-Commerce BUMN"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreateRoom}
              disabled={!newRoomTitle.trim() || creatingRoom}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
            >
              {creatingRoom ? "Menyimpan..." : "Simpan Ruang"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateRoom(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* MAIN CONTENT AREA (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Workspace Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> RUANG KOLABORASI TIM
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1.5 tabular-nums ${
                      wsConnected
                        ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                        : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {wsConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                    {wsConnected ? `Live WS Sync • ${onlineCount} Online` : "Sinkronisasi HTTP"}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {activeRoom.title}
                </h2>
              </div>

              {/* View Mode Controllers */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 self-start md:self-center shrink-0">
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === "kanban"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Kanban className="w-3.5 h-3.5" /> Kanban
                </button>
                <button
                  onClick={() => setViewMode("timeline")}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === "timeline"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" /> Ringkasan
                </button>
                <button
                  onClick={() => setViewMode("whiteboard")}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === "whiteboard"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Catatan
                </button>
              </div>
            </div>

            {/* Progress Bar & Target Rewards Banner */}
            <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 shrink-0">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block">Target Sprints Bersama</span>
                    <span className="text-xs text-slate-400 font-medium">
                      Selesaikan seluruh tugas untuk klaim bonus proyek tim
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto tabular-nums">
                  <span className="text-xs font-bold bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-emerald-400">
                    Progres: {teamCompletionPercentage}%
                  </span>
                  <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700">
                    {doneTasksCount} / {totalTasksCount} Tugas
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${teamCompletionPercentage}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 font-medium pt-1">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Gift className="w-3.5 h-3.5 text-amber-400" /> Reward Selesai Sprints: +100 Gems & Lencana Tim
                </span>
                <span className="tabular-nums">{activeRoom.members.length} Kontributor</span>
              </div>
            </div>
          </div>

          {/* VIEW MODE CONTENT */}
          {viewMode === "kanban" ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Kanban className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Papan Kanban Kerja Tim</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      aria-label="Filter prioritas tugas"
                      value={selectedPriorityFilter}
                      onChange={(e) => setSelectedPriorityFilter(e.target.value)}
                      className="text-xs font-bold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Semua Prioritas</option>
                      <option value="Tinggi">Prioritas Tinggi</option>
                      <option value="Sedang">Prioritas Sedang</option>
                      <option value="Rendah">Prioritas Rendah</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCreateTask((v) => !v)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Tugas
                  </button>
                </div>
              </div>

              {showCreateTask && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Judul tugas baru..."
                    className="sm:col-span-5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    placeholder="Penanggung jawab..."
                    className="sm:col-span-3 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                  <select
                    aria-label="Prioritas tugas baru"
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Tinggi">Tinggi</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Rendah">Rendah</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleCreateTask}
                    disabled={!newTaskTitle.trim() || creatingTask}
                    className="sm:col-span-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                  >
                    {creatingTask ? "..." : "Simpan"}
                  </button>
                </div>
              )}

              {/* Kanban Columns */}
              <div className="overflow-x-auto pb-2 -mx-2 px-2">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-w-[700px] xl:min-w-0">
                  {[
                    { key: "todo" as const, label: "Rencana", dot: "bg-slate-400", bg: "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800", next: "in-progress" as const, nextLabel: "Kerjakan →" },
                    { key: "in-progress" as const, label: "Dikerjakan", dot: "bg-blue-500", bg: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50", next: "review" as const, nextLabel: "Tinjau →" },
                    { key: "review" as const, label: "Evaluasi", dot: "bg-amber-500", bg: "bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50", next: "done" as const, nextLabel: "Selesai ✓" },
                    { key: "done" as const, label: "Selesai", dot: "bg-emerald-500", bg: "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50", next: null, nextLabel: "" },
                  ].map((col) => {
                    const colTasks = activeRoom.tasks.filter(
                      (t) =>
                        t.status === col.key &&
                        (selectedPriorityFilter === "all" || (t.priority || "Sedang") === selectedPriorityFilter)
                    );
                    return (
                      <div key={col.key} className={`${col.bg} p-3.5 rounded-xl border space-y-3`}>
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${col.dot}`}></span> {col.label}
                          </span>
                          <span className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold text-xs px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 tabular-nums">
                            {colTasks.length}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {colTasks.map((task) => {
                            const priority = task.priority || "Sedang";
                            return (
                              <motion.div
                                layoutId={`task-${task.id}`}
                                key={task.id}
                                className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5"
                              >
                                <div className="flex items-center justify-between text-xs font-bold">
                                  <span className={`px-2 py-0.5 rounded border ${PRIORITY_STYLE[priority] || PRIORITY_STYLE.Sedang}`}>
                                    {priority}
                                  </span>
                                  {col.key === "done" && (
                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                                    </span>
                                  )}
                                </div>
                                <p
                                  className={`font-semibold text-xs leading-snug ${
                                    col.key === "done"
                                      ? "text-slate-500 line-through"
                                      : "text-slate-900 dark:text-white"
                                  }`}
                                >
                                  {task.title}
                                </p>
                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 font-medium">
                                  <span className="truncate max-w-[90px]">{task.assignee}</span>
                                  {col.next && (
                                    <button
                                      onClick={() => moveTaskSmart(activeRoom.id, task.id, col.next!)}
                                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-white hover:bg-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded font-bold transition-colors border border-blue-200 dark:border-blue-800 cursor-pointer"
                                    >
                                      {col.nextLabel}
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : viewMode === "timeline" ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Ringkasan Distribusi Tugas</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
                {[
                  { label: "Rencana", count: activeRoom.tasks.filter((t) => t.status === "todo").length, color: "text-slate-700 dark:text-slate-200" },
                  { label: "Dikerjakan", count: activeRoom.tasks.filter((t) => t.status === "in-progress").length, color: "text-blue-600 dark:text-blue-400" },
                  { label: "Evaluasi", count: activeRoom.tasks.filter((t) => t.status === "review").length, color: "text-amber-600 dark:text-amber-400" },
                  { label: "Selesai", count: doneTasksCount, color: "text-emerald-600 dark:text-emerald-400" },
                ].map((stat) => (
                  <div key={stat.label} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">{stat.label}</span>
                    <span className={`text-2xl font-bold ${stat.color}`}>{stat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col h-[460px]">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <AlignLeft className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Catatan Kolaborasi Tim</h3>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {activeRoom.members.length} Anggota
                </span>
              </div>

              <textarea
                aria-label="Catatan kolaborasi tim"
                value={whiteboardText}
                onChange={(e) => setWhiteboardText(e.target.value)}
                className="w-full flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed font-mono focus:outline-none focus:border-blue-500"
                placeholder="Ketik catatan sprints kelompok di sini..."
              />
            </div>
          )}

          {/* Repository Submission Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-slate-800 dark:text-slate-200" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Tautan Repository Projek Tim</h3>
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700">
                Status: {activeRoom.status}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              Satu tautan proyek mewakili kontribusi seluruh anggota tim. Pastikan tugas utama berada di kolom{" "}
              <span className="font-bold text-emerald-700 dark:text-emerald-400">Selesai</span> sebelum pengiriman final.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                aria-label="Tautan repository proyek"
                type="url"
                placeholder="https://github.com/username/repository-proyek-tim"
                value={collabUrl || activeRoom.projectUrl}
                onChange={(e) => setCollabUrl(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                onClick={() => handleCollabProjectSubmit(activeRoom.id, collabUrl || activeRoom.projectUrl)}
                disabled={!collabUrl && !activeRoom.projectUrl}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                Kirim Projek
              </button>
            </div>

            {activeRoom.projectUrl && (
              <div className="pt-1 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span>Tautan Dikirim:</span>
                <a
                  href={activeRoom.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded border border-blue-100 dark:border-blue-800"
                >
                  {activeRoom.projectUrl} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[580px] overflow-hidden">
            {/* Tabs Navigation Header */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-1.5 shrink-0">
              <button
                onClick={() => setActiveRightTab("chat")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeRightTab === "chat"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Obrolan
              </button>
              <button
                onClick={() => setActiveRightTab("team")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeRightTab === "team"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Anggota
              </button>
              <button
                onClick={() => setActiveRightTab("activity")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeRightTab === "activity"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Activity className="w-3.5 h-3.5" /> Aktivitas
              </button>
            </div>

            {activeRightTab === "chat" && (
              <div className="flex flex-col flex-1 overflow-hidden p-4">
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                  {activeRoom.chat.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 py-10">
                      Belum ada pesan di ruang ini. Mulai diskusi dengan tim!
                    </div>
                  ) : (
                    activeRoom.chat.map((msg) => (
                      <div key={msg.id} className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                          <span className="w-5 h-5 bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-md text-xs border border-slate-200 dark:border-slate-700">
                            {msg.avatar}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200">{msg.sender}</span>
                          <span className="text-slate-400 font-normal">• {msg.timestamp}</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3 rounded-xl rounded-tl-none text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed max-w-[95%]">
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-2 space-y-2 shrink-0">
                  <div className="relative">
                    <input
                      aria-label="Ketik pesan diskusi tim..."
                      type="text"
                      placeholder="Ketik pesan diskusi tim..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessageSmart(activeRoom.id)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      onClick={() => sendMessageSmart(activeRoom.id)}
                      disabled={!chatMessage.trim()}
                      aria-label="Kirim pesan"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 disabled:opacity-40 bg-blue-600 hover:bg-blue-700 text-white w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeRightTab === "team" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Anggota Ruang Kolaborasi
                </h4>
                {activeRoom.members.map((mbr, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">
                        {mbr.avatar}
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 dark:text-white text-xs leading-tight">{mbr.name}</h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">{mbr.role}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800 tabular-nums">
                      {mbr.currentXP} XP
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeRightTab === "activity" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" /> Log Sinkronisasi Real-Time
                </h4>
                {activityLogs.map((log, i) => (
                  <div
                    key={i}
                    className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium leading-normal bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <span className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <p>{log}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
