import type { Server as HttpServer, IncomingMessage } from "http";
import * as crypto from "crypto";
import { WebSocketServer, WebSocket, type RawData } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { adminAuth } from "../lib/firebase-admin.js";
import { UserRepository } from "./repositories/UserRepository.js";
import { ForumService } from "./services/forumService.js";
import { InterviewService } from "./services/interviewService.js";
import { resolveTierFromXp } from "./services/arenaService.js";
import { ensureSeeded } from "./db/seedData.js";
import { db } from "../db/index.js";
import { AI_MODELS } from "./config/aiConfig.js";
import { fisherYatesShuffle } from "./utils/shuffle.js";
import { arenaMatches, collabRooms, interviewSessions, questionsBank, users } from "../db/schema.js";
import { eq } from "drizzle-orm";

interface AuthenticatedWsIdentity {
  dbUserId: number;
  uid: string;
  name: string;
  email: string;
  avatar: string;
  isGuest: boolean;
}

interface ArenaPlayer {
  uid: string;
  dbUserId: number;
  name: string;
  avatar: string;
  score: number;
  correctCount: number;
  ws: WebSocket;
}

interface ArenaQuestionItem {
  id: number;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  competencyTag: string;
}

interface ArenaRoom {
  roomCode: string;
  topic: string;
  hostUid: string;
  status: "lobby" | "active" | "finished";
  players: Map<string, ArenaPlayer>;
  questions: ArenaQuestionItem[];
  currentIdx: number;
  roundEndsAt: number;
  roundDurationMs: number;
  answersThisRound: Map<string, { optionIndex: number; answeredAt: number }>;
  roundTimer?: ReturnType<typeof setTimeout>;
  nextRoundTimer?: ReturnType<typeof setTimeout>;
  createdAt: number;
}

const MAX_ARENA_ROOMS = 200;
const STALE_ROOM_TTL_MS = 15 * 60 * 1000;

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }
  return code;
}

function isAllowedWsOrigin(req: IncomingMessage): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const origin = req.headers.origin;
  if (!origin) return true;
  const allowedOrigins = (process.env.CORS_ORIGINS || process.env.APP_URL || "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  const normalized = origin.trim().replace(/\/+$/, "");
  if (allowedOrigins.includes(normalized)) return true;
  try {
    const parsed = new URL(normalized);
    const reqHost = String(req.headers["x-forwarded-host"] || req.headers.host || "");
    return Boolean(reqHost && parsed.host.toLowerCase() === reqHost.toLowerCase());
  } catch {
    return false;
  }
}

async function resolveWsIdentity(token: string | null): Promise<AuthenticatedWsIdentity | null> {
  if (!token) return null;

  if (token === "guest-demo-token") {
    if (process.env.DISABLE_GUEST_DEMO === "true") {
      return null;
    }
    const userRow = await UserRepository.getOrCreateUser("user-dev-default", "guest@skillora.app", "Tamu Skillora");
    return {
      dbUserId: userRow.id,
      uid: userRow.uid,
      name: userRow.name,
      email: userRow.email,
      avatar: userRow.avatar || "🦁",
      isGuest: true,
    };
  }

  try {
    if (!adminAuth) return null;
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded?.uid) return null;
    const userRow = await UserRepository.getOrCreateUser(
      decoded.uid,
      decoded.email || "user@skillora.app",
      decoded.name || decoded.email || "Pengguna Skillora"
    );
    return {
      dbUserId: userRow.id,
      uid: userRow.uid,
      name: userRow.name,
      email: userRow.email,
      avatar: userRow.avatar || "🦁",
      isGuest: false,
    };
  } catch {
    return null;
  }
}

export function attachWsHub(httpServer: HttpServer) {
  const collabWss = new WebSocketServer({ noServer: true, maxPayload: 256 * 1024 });
  const interviewWss = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024 });
  const arenaWss = new WebSocketServer({ noServer: true, maxPayload: 256 * 1024 });

  // Room map: roomId -> Set<WebSocket>
  const roomSubscribers = new Map<string, Set<WebSocket>>();

  // Battle Quiz Arena state (server-authoritative)
  const arenaRooms = new Map<string, ArenaRoom>();
  const arenaClients = new Set<WebSocket>();
  const socketToRoom = new Map<WebSocket, { roomCode: string; uid: string }>();

  function pruneStaleArenaRooms() {
    const now = Date.now();
    for (const [code, room] of arenaRooms.entries()) {
      const isEmpty = room.players.size === 0;
      const isStale = now - room.createdAt > STALE_ROOM_TTL_MS && room.status !== "active";
      if (isEmpty || isStale) {
        clearRoomTimers(room);
        arenaRooms.delete(code);
      }
    }
  }

  function broadcastToRoom(roomId: string, payload: any) {
    const subs = roomSubscribers.get(roomId);
    if (!subs) return;
    const msg = JSON.stringify(payload);
    for (const client of subs) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    }
  }

  function serializePublicLobbies() {
    return Array.from(arenaRooms.values())
      .filter((r) => r.status === "lobby" && r.players.size > 0)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 12)
      .map((r) => {
        const host = r.players.get(r.hostUid);
        return {
          roomCode: r.roomCode,
          topic: r.topic,
          hostName: host?.name || "Host",
          playerCount: r.players.size,
          status: r.status,
        };
      });
  }

  function broadcastPublicLobbies() {
    const payload = JSON.stringify({ type: "room:list", rooms: serializePublicLobbies() });
    for (const client of arenaClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  function serializeRoomState(room: ArenaRoom) {
    const players = Array.from(room.players.values())
      .map((p) => ({
        uid: p.uid,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        correctCount: p.correctCount,
        isHost: p.uid === room.hostUid,
        answered: room.answersThisRound.has(p.uid),
      }))
      .sort((a, b) => b.score - a.score);

    return {
      roomCode: room.roomCode,
      topic: room.topic,
      hostUid: room.hostUid,
      status: room.status,
      currentIdx: room.currentIdx,
      totalQuestions: room.questions.length,
      roundEndsAt: room.roundEndsAt,
      players,
    };
  }

  function broadcastArenaRoom(room: ArenaRoom, payload: any) {
    const msg = JSON.stringify(payload);
    for (const p of room.players.values()) {
      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(msg);
      }
    }
  }

  function clearRoomTimers(room: ArenaRoom) {
    if (room.roundTimer) {
      clearTimeout(room.roundTimer);
      room.roundTimer = undefined;
    }
    if (room.nextRoundTimer) {
      clearTimeout(room.nextRoundTimer);
      room.nextRoundTimer = undefined;
    }
  }

  async function finishArenaMatch(room: ArenaRoom) {
    clearRoomTimers(room);
    room.status = "finished";

    const ranked = Array.from(room.players.values())
      .map((p) => ({
        uid: p.uid,
        dbUserId: p.dbUserId,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        correctCount: p.correctCount,
      }))
      .sort((a, b) => b.score - a.score);

    const winner = ranked[0];

    try {
      await db.insert(arenaMatches).values({
        roomCode: room.roomCode,
        topic: room.topic,
        mode: ranked.length > 1 ? "multiplayer_battle" : "solo_sprint",
        participants: ranked.map((r) => ({
          name: r.name,
          score: r.score,
          correctCount: r.correctCount,
          avatar: r.avatar,
        })),
        winnerName: winner?.name || null,
        questionCount: room.questions.length,
        finishedAt: new Date(),
      });

      // Award XP & weeklyXp to each registered participant (skip guest demo account)
      for (let i = 0; i < ranked.length; i++) {
        const p = ranked[i];
        if (p.uid === "user-dev-default") continue;
        const xpGain = Math.max(25, Math.min(200, Math.round(p.score / 12) + (i === 0 ? 45 : 20)));
        const existingUser = await db.query.users.findFirst({ where: eq(users.id, p.dbUserId) });
        if (existingUser) {
          const nextXp = existingUser.xp + xpGain;
          const nextWeeklyXp = (existingUser.weeklyXp || 0) + xpGain;
          const nextLevel = Math.max(existingUser.level, Math.floor(nextXp / 500) + 1);
          await db
            .update(users)
            .set({
              xp: nextXp,
              weeklyXp: nextWeeklyXp,
              level: nextLevel,
              leagueTier: resolveTierFromXp(nextWeeklyXp),
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingUser.id));
        }
      }
    } catch (err) {
      console.warn("Arena match persistence warning:", err);
    }

    broadcastArenaRoom(room, {
      type: "match:finished",
      room: serializeRoomState(room),
      rankings: ranked.map((r, i) => ({
        rank: i + 1,
        uid: r.uid,
        name: r.name,
        avatar: r.avatar,
        score: r.score,
        correctCount: r.correctCount,
        xpAwarded: Math.max(25, Math.min(200, Math.round(r.score / 12) + (i === 0 ? 45 : 20))),
      })),
    });

    broadcastPublicLobbies();
  }

  function resolveArenaRound(room: ArenaRoom) {
    if (room.status !== "active") return;
    clearRoomTimers(room);

    const q = room.questions[room.currentIdx];
    if (!q) {
      finishArenaMatch(room);
      return;
    }

    const roundStart = room.roundEndsAt - room.roundDurationMs;
    for (const [uid, ans] of room.answersThisRound.entries()) {
      const player = room.players.get(uid);
      if (!player) continue;
      if (ans.optionIndex === q.answerIndex) {
        const remainingRatio = Math.max(0, Math.min(1, (room.roundEndsAt - ans.answeredAt) / room.roundDurationMs));
        const speedBonus = Math.round(remainingRatio * 120);
        const points = 100 + speedBonus;
        player.score += points;
        player.correctCount += 1;
      } else if (ans.answeredAt < roundStart) {
        // ignore invalid timestamps
      }
    }

    broadcastArenaRoom(room, {
      type: "round:result",
      questionIndex: room.currentIdx,
      correctOption: q.answerIndex,
      explanation: q.explanation,
      room: serializeRoomState(room),
    });

    room.nextRoundTimer = setTimeout(() => {
      if (room.players.size === 0) {
        arenaRooms.delete(room.roomCode);
        broadcastPublicLobbies();
        return;
      }
      if (room.currentIdx + 1 >= room.questions.length) {
        finishArenaMatch(room);
      } else {
        room.currentIdx += 1;
        startArenaRound(room);
      }
    }, 3200);
  }

  function startArenaRound(room: ArenaRoom) {
    clearRoomTimers(room);
    const q = room.questions[room.currentIdx];
    if (!q) {
      finishArenaMatch(room);
      return;
    }

    room.answersThisRound.clear();
    room.roundDurationMs = 15000;
    room.roundEndsAt = Date.now() + room.roundDurationMs;

    broadcastArenaRoom(room, {
      type: "round:question",
      questionIndex: room.currentIdx,
      totalQuestions: room.questions.length,
      roundEndsAt: room.roundEndsAt,
      question: {
        id: q.id,
        prompt: q.prompt,
        options: q.options,
        competencyTag: q.competencyTag,
      },
      room: serializeRoomState(room),
    });

    room.roundTimer = setTimeout(() => {
      resolveArenaRound(room);
    }, room.roundDurationMs + 250);
  }

  function removeSocketFromArenaRoom(ws: WebSocket) {
    const binding = socketToRoom.get(ws);
    if (!binding) return;
    socketToRoom.delete(ws);

    const room = arenaRooms.get(binding.roomCode);
    if (!room) return;

    room.players.delete(binding.uid);
    if (room.players.size === 0) {
      clearRoomTimers(room);
      arenaRooms.delete(room.roomCode);
    } else {
      if (room.hostUid === binding.uid) {
        const nextHost = room.players.values().next().value;
        if (nextHost) room.hostUid = nextHost.uid;
      }
      broadcastArenaRoom(room, { type: "room:state", room: serializeRoomState(room) });
    }
    broadcastPublicLobbies();
  }

  arenaWss.on("connection", async (ws: WebSocket, _req: IncomingMessage, context: { user: AuthenticatedWsIdentity }) => {
    const { user } = context;
    arenaClients.add(ws);

    ws.send(
      JSON.stringify({
        type: "arena:connected",
        uid: user.uid,
        name: user.name,
        rooms: serializePublicLobbies(),
      })
    );

    ws.on("message", async (raw: RawData) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === "room:list") {
          ws.send(JSON.stringify({ type: "room:list", rooms: serializePublicLobbies() }));
          return;
        }

        if (msg.type === "room:leave") {
          removeSocketFromArenaRoom(ws);
          ws.send(JSON.stringify({ type: "room:left" }));
          return;
        }

        if (msg.type === "room:create") {
          removeSocketFromArenaRoom(ws);
          pruneStaleArenaRooms();
          if (arenaRooms.size >= MAX_ARENA_ROOMS) {
            ws.send(JSON.stringify({ type: "error", message: "Kapasitas ruang Arena sedang penuh. Coba lagi sebentar." }));
            return;
          }
          await ensureSeeded();
          const topic = typeof msg.topic === "string" && msg.topic.trim() ? msg.topic.trim().slice(0, 80) : "Semua";
          const allQ = await db.select().from(questionsBank);
          const filtered =
            topic === "Semua"
              ? allQ
              : allQ.filter((q) => q.category.toLowerCase() === topic.toLowerCase());
          const poolQ = fisherYatesShuffle(filtered.length >= 5 ? filtered : allQ)
            .slice(0, 6)
            .map((q) => ({
              id: q.id,
              prompt: q.prompt,
              options: Array.isArray(q.options) ? (q.options as string[]) : [],
              answerIndex: q.answerIndex,
              explanation: q.explanation,
              competencyTag: q.competencyTag,
            }));

          let roomCode = generateRoomCode();
          while (arenaRooms.has(roomCode)) roomCode = generateRoomCode();

          const room: ArenaRoom = {
            roomCode,
            topic,
            hostUid: user.uid,
            status: "lobby",
            players: new Map(),
            questions: poolQ,
            currentIdx: 0,
            roundEndsAt: 0,
            roundDurationMs: 15000,
            answersThisRound: new Map(),
            createdAt: Date.now(),
          };

          room.players.set(user.uid, {
            uid: user.uid,
            dbUserId: user.dbUserId,
            name: user.name,
            avatar: user.avatar,
            score: 0,
            correctCount: 0,
            ws,
          });

          arenaRooms.set(roomCode, room);
          socketToRoom.set(ws, { roomCode, uid: user.uid });
          broadcastArenaRoom(room, { type: "room:state", room: serializeRoomState(room) });
          broadcastPublicLobbies();
          return;
        }

        if (msg.type === "room:join") {
          const code = String(msg.roomCode || "").trim().toUpperCase();
          const room = arenaRooms.get(code);
          if (!room) {
            ws.send(JSON.stringify({ type: "error", message: `Kode ruang "${code}" tidak ditemukan.` }));
            return;
          }
          if (room.status !== "lobby") {
            ws.send(JSON.stringify({ type: "error", message: "Pertandingan di ruang ini sudah dimulai atau selesai." }));
            return;
          }
          if (room.players.size >= 8) {
            ws.send(JSON.stringify({ type: "error", message: "Ruang sudah penuh (maksimal 8 peserta)." }));
            return;
          }

          removeSocketFromArenaRoom(ws);
          room.players.set(user.uid, {
            uid: user.uid,
            dbUserId: user.dbUserId,
            name: user.name,
            avatar: user.avatar,
            score: 0,
            correctCount: 0,
            ws,
          });
          socketToRoom.set(ws, { roomCode: room.roomCode, uid: user.uid });
          broadcastArenaRoom(room, { type: "room:state", room: serializeRoomState(room) });
          broadcastPublicLobbies();
          return;
        }

        if (msg.type === "room:start") {
          const binding = socketToRoom.get(ws);
          if (!binding) return;
          const room = arenaRooms.get(binding.roomCode);
          if (!room || room.status !== "lobby") return;
          if (room.hostUid !== user.uid) {
            ws.send(JSON.stringify({ type: "error", message: "Hanya pembuat ruang (Host) yang dapat memulai duel." }));
            return;
          }
          room.status = "active";
          room.currentIdx = 0;
          broadcastPublicLobbies();
          startArenaRound(room);
          return;
        }

        if (msg.type === "round:answer") {
          const binding = socketToRoom.get(ws);
          if (!binding) return;
          const room = arenaRooms.get(binding.roomCode);
          if (!room || room.status !== "active") return;
          if (room.answersThisRound.has(user.uid)) return;

          const optionIndex = Number(msg.optionIndex);
          if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 5) return;

          room.answersThisRound.set(user.uid, { optionIndex, answeredAt: Date.now() });
          broadcastArenaRoom(room, { type: "room:state", room: serializeRoomState(room) });

          // If every active player answered, end round early
          if (room.answersThisRound.size >= room.players.size) {
            resolveArenaRound(room);
          }
        }
      } catch (err: any) {
        ws.send(JSON.stringify({ type: "error", message: err.message || "Gagal memproses aksi Arena." }));
      }
    });

    ws.on("close", () => {
      arenaClients.delete(ws);
      removeSocketFromArenaRoom(ws);
    });
  });

  collabWss.on("connection", async (ws: WebSocket, _req: IncomingMessage, context: { roomId: string; user: AuthenticatedWsIdentity }) => {
    const { roomId, user } = context;
    try {
      const existingRoom = await db.query.collabRooms.findFirst({
        where: eq(collabRooms.roomId, roomId),
      });
      if (!existingRoom) {
        ws.send(JSON.stringify({ type: "error", message: "Ruang kolaborasi tidak ditemukan." }));
        ws.close(1008, "Room not found");
        return;
      }
      await ForumService.assertRoomAccess(user.uid, existingRoom);
    } catch (err: any) {
      ws.send(JSON.stringify({ type: "error", message: err?.message || "Akses ruang kolaborasi ditolak." }));
      ws.close(1008, "Forbidden");
      return;
    }

    if (!roomSubscribers.has(roomId)) {
      roomSubscribers.set(roomId, new Set());
    }
    roomSubscribers.get(roomId)!.add(ws);

    ws.send(
      JSON.stringify({
        type: "connected",
        roomId,
        onlineCount: roomSubscribers.get(roomId)!.size,
      })
    );

    ws.on("message", async (raw: RawData) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "chat:send" && typeof msg.text === "string" && msg.text.trim()) {
          if (user.isGuest) {
            ws.send(JSON.stringify({ type: "error", message: "Masuk dengan akun terdaftar untuk mengirim pesan tim." }));
            return;
          }
          const messages = await ForumService.postChat(user.uid, roomId, msg.text.trim().slice(0, 1000));
          broadcastToRoom(roomId, { type: "chat:sync", roomId, messages });
        } else if (msg.type === "task:status" && msg.taskId && msg.status) {
          if (user.isGuest) {
            ws.send(JSON.stringify({ type: "error", message: "Masuk dengan akun terdaftar untuk mengubah status tugas." }));
            return;
          }
          const tasks = await ForumService.updateTaskStatus(user.uid, roomId, msg.taskId, msg.status);
          broadcastToRoom(roomId, { type: "task:sync", roomId, tasks });
        }
      } catch (err: any) {
        ws.send(JSON.stringify({ type: "error", message: err.message || "Gagal memproses pesan kolaborasi." }));
      }
    });

    ws.on("close", () => {
      const subs = roomSubscribers.get(roomId);
      if (subs) {
        subs.delete(ws);
        if (subs.size === 0) roomSubscribers.delete(roomId);
      }
    });
  });

  interviewWss.on("connection", async (clientWs: WebSocket, _req: IncomingMessage, context: { sessionId: string; user: AuthenticatedWsIdentity }) => {
    const { sessionId } = context;
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      clientWs.send(JSON.stringify({ type: "error", message: "GEMINI_API_KEY belum tersedia di server." }));
      clientWs.close();
      return;
    }

    const sessionRow = await db.query.interviewSessions.findFirst({
      where: eq(interviewSessions.sessionId, sessionId),
    });

    if (!sessionRow || sessionRow.userId !== context.user.dbUserId) {
      clientWs.send(JSON.stringify({ type: "error", message: "Akses ditolak: Sesi wawancara tidak ditemukan atau bukan milik Anda." }));
      clientWs.close(1008, "Forbidden");
      return;
    }

    const jobTitle = sessionRow?.jobTitle || "Frontend Engineer";
    const companyName = sessionRow?.companyName || "Perusahaan Mitra Skillora";

    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const systemInstruction = `Anda adalah Ibu Riska, Senior HRD & Technical Recruiter di ${companyName}.
Anda sedang memandu Mock Interview Suara secara langsung dalam Bahasa Indonesia untuk posisi "${jobTitle}".
ATURAN WAWANCARA:
1. Sapa kandidat dengan ramah lalu ajukan 1 pertanyaan wawancara kerja terarah (teknis atau metode STAR) setiap giliran.
2. Dengarkan jawaban kandidat, beri tanggapan singkat yang konstruktif (maksimal 2 kalimat), lalu lanjutkan ke pertanyaan berikutnya.
3. Gunakan bahasa Indonesia profesional yang natural dan jelas didengar.
4. JANGAN pernah meminta informasi pribadi sensitif asli (NIK, alamat rumah, kata sandi).`;

    let liveSession: any = null;
    let isClosed = false;

    const sessionPromise = ai.live
      .connect({
        model: AI_MODELS.live,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction,
        },
        callbacks: {
          onopen: () => {
            if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "live:ready", sessionId }));
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;

            const content = message.serverContent;
            if (content?.inputTranscription?.text) {
              const text = content.inputTranscription.text;
              clientWs.send(JSON.stringify({ type: "transcript:candidate", text }));
              InterviewService.appendTurn(sessionId, "candidate", text).catch(() => {});
            }

            if (content?.outputTranscription?.text) {
              const text = content.outputTranscription.text;
              clientWs.send(JSON.stringify({ type: "transcript:interviewer", text }));
              InterviewService.appendTurn(sessionId, "interviewer", text).catch(() => {});
            }

            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({ type: "audio", data: part.inlineData.data }));
              }
            }

            if (content?.interrupted) {
              clientWs.send(JSON.stringify({ type: "interrupted" }));
            }

            if (content?.turnComplete) {
              clientWs.send(JSON.stringify({ type: "turnComplete" }));
            }
          },
          onerror: (err: any) => {
            console.error("Gemini Live error:", err);
            if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "error", message: "Koneksi suara Gemini Live terputus." }));
            }
          },
          onclose: () => {
            if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "live:closed" }));
            }
          },
        },
      })
      .then((s) => {
        liveSession = s;
        if (!isClosed) {
          s.sendRealtimeInput({
            text: `Halo Bu Riska, saya kandidat yang siap mengikuti wawancara untuk posisi ${jobTitle} di ${companyName}. Silakan mulai sesi wawancara.`,
          });
        }
        return s;
      })
      .catch((err) => {
        console.error("Failed to connect Gemini Live:", err);
        if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: "error", message: err.message || "Gagal membuka sesi Gemini Live." }));
        }
      });

    clientWs.on("message", async (raw: RawData) => {
      try {
        const msg = JSON.parse(raw.toString());
        const session = liveSession || (await sessionPromise);
        if (!session || isClosed) return;

        if (msg.type === "audio" && typeof msg.data === "string") {
          session.sendRealtimeInput({
            audio: { data: msg.data, mimeType: "audio/pcm;rate=16000" },
          });
        } else if (msg.type === "text" && typeof msg.text === "string" && msg.text.trim()) {
          const clean = msg.text.trim();
          clientWs.send(JSON.stringify({ type: "transcript:candidate", text: clean }));
          InterviewService.appendTurn(sessionId, "candidate", clean).catch(() => {});
          session.sendRealtimeInput({ text: clean });
        }
      } catch (err) {
        console.warn("WS interview message parse warning:", err);
      }
    });

    clientWs.on("close", () => {
      isClosed = true;
      try {
        liveSession?.close?.();
      } catch {
        // ignore close error
      }
    });
  });

  httpServer.on("upgrade", async (req: IncomingMessage, socket, head) => {
    try {
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
      const pathname = url.pathname;

      if (pathname !== "/ws/collab" && pathname !== "/ws/interview" && pathname !== "/ws/arena") {
        return;
      }

      if (!isAllowedWsOrigin(req)) {
        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
        socket.destroy();
        return;
      }

      const token = url.searchParams.get("token");
      const user = await resolveWsIdentity(token);
      if (!user) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      if (pathname === "/ws/arena") {
        arenaWss.handleUpgrade(req, socket, head, (ws) => {
          arenaWss.emit("connection", ws, req, { user });
        });
        return;
      }

      if (pathname === "/ws/collab") {
        const roomId = url.searchParams.get("roomId") || "room-tokopedia-1";
        collabWss.handleUpgrade(req, socket, head, (ws) => {
          collabWss.emit("connection", ws, req, { roomId, user });
        });
        return;
      }

      if (pathname === "/ws/interview") {
        if (user.isGuest) {
          socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
          socket.destroy();
          return;
        }
        const sessionId = url.searchParams.get("sessionId");
        if (!sessionId) {
          socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
          socket.destroy();
          return;
        }
        interviewWss.handleUpgrade(req, socket, head, (ws) => {
          interviewWss.emit("connection", ws, req, { sessionId, user });
        });
      }
    } catch {
      socket.destroy();
    }
  });
}
