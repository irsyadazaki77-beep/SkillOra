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
    const profile = await UserRepository.getFullProfile(userId);
    const postId = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;

    await db.insert(forumPosts).values({
      postId,
      authorUserId: profile.id,
      authorName: profile.name,
      authorAvatar: profile.selectedAvatar || "🦁",
      authorLevel: profile.level,
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
    const profile = await UserRepository.getFullProfile(userId);
    const post = await db.query.forumPosts.findFirst({ where: eq(forumPosts.postId, postIdStr) });
    if (!post) throw new Error("Diskusi tidak ditemukan.");

    await db.insert(forumReplies).values({
      postId: post.id,
      authorUserId: profile.id,
      authorName: profile.name,
      authorAvatar: profile.selectedAvatar || "🦁",
      authorRole: profile.accountRole || "student",
      content,
    });

    return ForumService.getForumPosts();
  }

  static async upvotePost(userId: string, postIdStr: string) {
    await ensureSeeded();
    const profile = await UserRepository.getFullProfile(userId);
    const post = await db.query.forumPosts.findFirst({ where: eq(forumPosts.postId, postIdStr) });
    if (!post) throw new Error("Postingan tidak ditemukan.");

    const existing = await db
      .select()
      .from(forumUpvotes)
      .where(and(eq(forumUpvotes.postId, post.id), eq(forumUpvotes.userId, profile.id)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .delete(forumUpvotes)
        .where(and(eq(forumUpvotes.postId, post.id), eq(forumUpvotes.userId, profile.id)));
      await db
        .update(forumPosts)
        .set({ upvotes: Math.max(0, post.upvotes - 1) })
        .where(eq(forumPosts.id, post.id));
    } else {
      await db.insert(forumUpvotes).values({ postId: post.id, userId: profile.id });
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
    const profile = await UserRepository.getFullProfile(userId);
    const roomId = `room-${Date.now()}`;

    const [room] = await db
      .insert(collabRooms)
      .values({
        roomId,
        courseId: data.courseId || "react-tokopedia",
        title: data.title.trim(),
        members: [
          {
            name: profile.name,
            role: profile.role || "Project Lead",
            avatar: profile.selectedAvatar || "🦁",
            currentXP: profile.xp || 0,
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
      assignee: profile.name,
      status: "todo",
      priority: "Tinggi",
    });

    return ForumService.getCollaborationRooms();
  }

  static async postChat(userId: string, roomIdStr: string, text: string) {
    await ensureSeeded();
    const profile = await UserRepository.getFullProfile(userId);
    const room = await db.query.collabRooms.findFirst({ where: eq(collabRooms.roomId, roomIdStr) });
    if (!room) throw new Error("Ruangan tim tidak ditemukan");

    await db.insert(collabMessages).values({
      messageId: `m_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      roomId: room.id,
      sender: profile.name,
      avatar: profile.selectedAvatar || "🦁",
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

  static async createTask(roomIdStr: string, data: { title: string; assignee?: string; priority?: string }) {
    const room = await db.query.collabRooms.findFirst({ where: eq(collabRooms.roomId, roomIdStr) });
    if (!room) throw new Error("Ruangan tim tidak ditemukan");

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

  static async updateTaskStatus(roomIdStr: string, taskIdStr: string, status: string) {
    const room = await db.query.collabRooms.findFirst({ where: eq(collabRooms.roomId, roomIdStr) });
    if (!room) throw new Error("Ruangan tim tidak ditemukan");

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

  static async submitProject(roomIdStr: string, projectUrl: string) {
    const room = await db.query.collabRooms.findFirst({ where: eq(collabRooms.roomId, roomIdStr) });
    if (!room) throw new Error("Ruangan tim tidak ditemukan");

    await db
      .update(collabRooms)
      .set({ projectUrl, status: "Menunggu Review Mentor" })
      .where(eq(collabRooms.id, room.id));

    const rooms = await ForumService.getCollaborationRooms();
    return rooms.find((r) => r.id === roomIdStr);
  }
}
