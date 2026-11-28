import { db } from "../../db/index.js";
import {
  forumPosts,
  forumReplies,
  forumUpvotes,
  collabRooms,
  collabTasks,
  collabMessages,
} from "../../db/schema.js";
import { ensureSeeded } from "../db/seedData.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { eq, and, desc, asc } from "drizzle-orm";
import { assertSafeHttpUrl } from "../../utils/urlUtils.js";

export class ForumService {
  static async getForumPosts() {
    await ensureSeeded();
    const posts = await db.query.forumPosts.findMany({
      with: { replies: true },
      orderBy: [desc(forumPosts.id)],
    });

    return posts.map((p) => ({
      id: p.postId,
      dbId: p.id,
      author: p.authorName,
      authorAvatar: p.authorAvatar || "👨‍💻",
      authorLevel: p.authorLevel || 1,
      title: p.title,
      content: p.content,
      tags: Array.isArray(p.tags) ? p.tags : [],
      upvotes: p.upvotes,
      replies: p.replies?.length || 0,
      repliesList: (p.replies || []).map((r) => ({
        id: `rep_${r.id}`,
        author: r.authorName,
        authorAvatar: r.authorAvatar,
        authorRole: r.authorRole,
        content: r.content,
        createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      })),
      createdAt: p.createdAt ? p.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "Baru saja",
      isHot: p.isHot || p.upvotes >= 15,
    }));
  }

  static async createPost(userId: string, title: string, content: string, tags: string[]) {
    await ensureSeeded();
    const userRow = await UserRepository.getOrCreateUser(userId, "user@skillora.app", "Pengguna");
    const postId = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;

    await db.insert(forumPosts).values({
      postId,
      authorUserId: userRow.id,
      authorName: userRow.name,
      authorAvatar: userRow.avatar || "🦁",
      authorLevel: userRow.level,
      title,
      content,
      tags: Array.isArray(tags) && tags.length > 0 ? tags : ["Umum"],
      upvotes: 1,
      isHot: false,
    });

    return ForumService.getForumPosts();
  }

  static async replyPost(userId: string, postIdStr: string, content: string) {
    await ensureSeeded();
    const [userRow, post] = await Promise.all([
      UserRepository.getOrCreateUser(userId, "user@skillora.app", "Pengguna"),
      db.query.forumPosts.findFirst({ where: eq(forumPosts.postId, postIdStr) }),
    ]);
    if (!post) throw new Error("Diskusi tidak ditemukan.");

    await db.insert(forumReplies).values({
      postId: post.id,
      authorUserId: userRow.id,
      authorName: userRow.name,
      authorAvatar: userRow.avatar || "🦁",
      authorRole: userRow.accountRole || "student",
      content,
    });

    return ForumService.getForumPosts();
  }

  static async upvotePost(userId: string, postIdStr: string) {
    await ensureSeeded();
    const [userRow, post] = await Promise.all([
      UserRepository.getOrCreateUser(userId, "user@skillora.app", "Pengguna"),
      db.query.forumPosts.findFirst({ where: eq(forumPosts.postId, postIdStr) }),
    ]);
    if (!post) throw new Error("Postingan tidak ditemukan.");

    const existing = await db
      .select()
      .from(forumUpvotes)
      .where(and(eq(forumUpvotes.postId, post.id), eq(forumUpvotes.userId, userRow.id)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .delete(forumUpvotes)
        .where(and(eq(forumUpvotes.postId, post.id), eq(forumUpvotes.userId, userRow.id)));
      await db
        .update(forumPosts)
        .set({ upvotes: Math.max(0, post.upvotes - 1) })
        .where(eq(forumPosts.id, post.id));
    } else {
      await db.insert(forumUpvotes).values({ postId: post.id, userId: userRow.id });
      await db
        .update(forumPosts)
        .set({ upvotes: post.upvotes + 1, isHot: post.upvotes + 1 >= 15 })
        .where(eq(forumPosts.id, post.id));
    }

    return ForumService.getForumPosts();
  }

  static async getCollaborationRooms() {
    await ensureSeeded();
    const rooms = await db.query.collabRooms.findMany({
      with: {
        tasks: { orderBy: [asc(collabTasks.id)] },
        messages: { orderBy: [asc(collabMessages.id)] },
      },
      orderBy: [desc(collabRooms.id)],
    });

    return rooms.map((r) => ({
      id: r.roomId,
      courseId: r.courseId,
      title: r.title,
      members: Array.isArray(r.members) ? r.members : [],
      tasks: (r.tasks || []).map((t) => ({
        id: t.taskId,
        title: t.title,
        assignee: t.assignee,
        status: t.status,
        priority: t.priority,
      })),
      chat: (r.messages || []).map((m) => ({
        id: m.messageId,
        sender: m.sender,
        avatar: m.avatar,
        text: m.text,
        timestamp: m.createdAt
          ? m.createdAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
          : "Baru saja",
      })),
      projectUrl: r.projectUrl,
      status: r.status,
    }));
  }

  static async createCollaborationRoom(userId: string, data: { title: string; courseId?: string }) {
    await ensureSeeded();
    const userRow = await UserRepository.getOrCreateUser(userId, "user@skillora.app", "Pengguna");
    const roomId = `room-${Date.now()}`;

    const [room] = await db
      .insert(collabRooms)
      .values({
        roomId,
        courseId: data.courseId || "react-tokopedia",
        title: data.title.trim(),
        members: [
          {
            uid: userRow.uid,
            name: userRow.name,
            role: userRow.role || "Project Lead",
            avatar: userRow.avatar || "🦁",
            currentXP: userRow.xp || 0,
          },
        ],
        projectUrl: "",
        status: "Belum Dikirim",
      })
      .returning();

    await db.insert(collabTasks).values({
      taskId: `task-${Date.now()}`,
      roomId: room.id,
      title: "Inisialisasi repositori & pembagian tugas tim",
      assignee: userRow.name,
      status: "todo",
      priority: "Tinggi",
    });

    return ForumService.getCollaborationRooms();
  }

  static async assertRoomAccess(userId: string, room: typeof collabRooms.$inferSelect) {
    const userRow = await UserRepository.getOrCreateUser(userId, "user@skillora.app", "Pengguna");
    const isStaff = ["admin", "mentor"].includes(userRow.accountRole) || ["Admin", "Developer"].includes(userRow.role);
    if (isStaff) return userRow;

    const members = Array.isArray(room.members) ? (room.members as any[]) : [];
    const hasScopedMembers = members.some((m) => Boolean(m?.uid));
    if (!hasScopedMembers) {
      // Seeded open demo rooms have no uid bindings
      return userRow;
    }

    const isMember = members.some((m) => m?.uid === userRow.uid);
    if (!isMember) {
      throw new Error("Akses ditolak: Anda bukan anggota ruang kolaborasi ini.");
    }
    return userRow;
  }

  static async postChat(userId: string, roomIdStr: string, text: string) {
    await ensureSeeded();
    const room = await db.query.collabRooms.findFirst({ where: eq(collabRooms.roomId, roomIdStr) });
    if (!room) throw new Error("Ruangan tim tidak ditemukan");
    const userRow = await ForumService.assertRoomAccess(userId, room);

    await db.insert(collabMessages).values({
      messageId: `m_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      roomId: room.id,
      sender: userRow.name,
      avatar: userRow.avatar || "🦁",
      text,
    });

    const messages = await db
      .select()
      .from(collabMessages)
      .where(eq(collabMessages.roomId, room.id))
      .orderBy(asc(collabMessages.id));

    return messages.map((m) => ({
      id: m.messageId,
      sender: m.sender,
      avatar: m.avatar,
      text: m.text,
      timestamp: m.createdAt
        ? m.createdAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        : "Baru saja",
    }));
  }

  private static async assertRoomMember(userId: string, room: typeof collabRooms.$inferSelect) {
    return ForumService.assertRoomAccess(userId, room);
  }

  static async createTask(userId: string, roomIdStr: string, data: { title: string; assignee?: string; priority?: string }) {
    const room = await db.query.collabRooms.findFirst({ where: eq(collabRooms.roomId, roomIdStr) });
    if (!room) throw new Error("Ruangan tim tidak ditemukan");
    await ForumService.assertRoomMember(userId, room);

    await db.insert(collabTasks).values({
      taskId: `task_${Date.now()}`,
      roomId: room.id,
      title: data.title.trim(),
      assignee: data.assignee?.trim() || "Tim",
      status: "todo",
      priority: data.priority || "Sedang",
    });

    const tasks = await db
      .select()
      .from(collabTasks)
      .where(eq(collabTasks.roomId, room.id))
      .orderBy(asc(collabTasks.id));

    return tasks.map((t) => ({
      id: t.taskId,
      title: t.title,
      assignee: t.assignee,
      status: t.status,
      priority: t.priority,
    }));
  }

  static async updateTaskStatus(userId: string, roomIdStr: string, taskIdStr: string, status: string) {
    const room = await db.query.collabRooms.findFirst({ where: eq(collabRooms.roomId, roomIdStr) });
    if (!room) throw new Error("Ruangan tim tidak ditemukan");
    await ForumService.assertRoomMember(userId, room);

    await db
      .update(collabTasks)
      .set({ status })
      .where(and(eq(collabTasks.roomId, room.id), eq(collabTasks.taskId, taskIdStr)));

    const tasks = await db
      .select()
      .from(collabTasks)
      .where(eq(collabTasks.roomId, room.id))
      .orderBy(asc(collabTasks.id));

    return tasks.map((t) => ({
      id: t.taskId,
      title: t.title,
      assignee: t.assignee,
      status: t.status,
      priority: t.priority,
    }));
  }

  static async submitProject(userId: string, roomIdStr: string, projectUrl: string) {
    const safeUrl = assertSafeHttpUrl(projectUrl, "Tautan proyek");
    const room = await db.query.collabRooms.findFirst({ where: eq(collabRooms.roomId, roomIdStr) });
    if (!room) throw new Error("Ruangan tim tidak ditemukan");
    await ForumService.assertRoomMember(userId, room);

    await db
      .update(collabRooms)
      .set({ projectUrl: safeUrl, status: "Menunggu Review Mentor" })
      .where(eq(collabRooms.id, room.id));

    const rooms = await ForumService.getCollaborationRooms();
    return rooms.find((r) => r.id === roomIdStr);
  }
}
