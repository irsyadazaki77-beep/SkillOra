import type { Server as HttpServer, IncomingMessage } from "http";
import { WebSocketServer, WebSocket, type RawData } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { adminAuth } from "../lib/firebase-admin.js";
import { UserRepository } from "./repositories/UserRepository.js";
import { ForumService } from "./services/forumService.js";
import { InterviewService } from "./services/interviewService.js";
import { db } from "../db/index.js";
import { AI_MODELS } from "./config/aiConfig.js";
import { interviewSessions } from "../db/schema.js";
import { eq } from "drizzle-orm";

interface AuthenticatedWsIdentity {
  dbUserId: number;
  uid: string;
  name: string;
  email: string;
  isGuest: boolean;
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
      isGuest: false,
    };
  } catch {
    return null;
  }
}

export function attachWsHub(httpServer: HttpServer) {
  const collabWss = new WebSocketServer({ noServer: true });
  const interviewWss = new WebSocketServer({ noServer: true });

  // Room map: roomId -> Set<WebSocket>
  const roomSubscribers = new Map<string, Set<WebSocket>>();

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

  collabWss.on("connection", async (ws: WebSocket, _req: IncomingMessage, context: { roomId: string; user: AuthenticatedWsIdentity }) => {
    const { roomId, user } = context;
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
        // Kick off greeting cleanly once connected
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

      if (pathname !== "/ws/collab" && pathname !== "/ws/interview") {
        // Leave unknown upgrade paths untouched (or destroy cleanly if not Vite HMR)
        return;
      }

      const token = url.searchParams.get("token");
      const user = await resolveWsIdentity(token);
      if (!user) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
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
    } catch (err) {
      socket.destroy();
    }
  });
}
