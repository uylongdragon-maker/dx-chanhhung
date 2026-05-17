import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ newMessages: [], newTasks: [], upcomingMeetings: [], overdueTasks: [] });

  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60_000);
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60_000);

  try {
    const [newMessages, newTasks, upcomingMeetings, overdueTasks] = await Promise.all([
      // New messages in rooms user is a member of, sent in last 2 minutes by others
      prisma.message.findMany({
        where: {
          senderId: { not: userId },
          createdAt: { gte: new Date(now.getTime() - 2 * 60_000) },
          room: {
            members: { some: { userId } }
          }
        },
        include: {
          sender: { select: { name: true } },
          room: { select: { name: true } }
        },
        take: 10,
        orderBy: { createdAt: "desc" }
      }),

      // New tasks assigned to me — detected via Activity events in last 2 mins
      prisma.activity.findMany({
        where: {
          type: "CREATED",
          task: { assigneeId: userId },
          createdAt: { gte: new Date(now.getTime() - 2 * 60_000) }
        },
        include: { task: { select: { id: true, title: true } } },
        take: 5
      }),

      // Meetings starting in next 30 minutes
      prisma.meeting.findMany({
        where: {
          startTime: { gte: now, lte: thirtyMinutesFromNow }
        },
        select: { id: true, topic: true, startTime: true },
        take: 5
      }),

      // Overdue tasks assigned to user
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: { not: "DONE" },
          dueDate: { lt: now }
        },
        select: { id: true, title: true, dueDate: true },
        take: 5
      })
    ]);

    return NextResponse.json({
      newMessages: newMessages.map(m => ({
        id: m.id,
        roomName: m.room?.name || "Phòng chat",
        senderName: m.sender?.name || "Thành viên",
        content: m.content
      })),
      newTasks: newTasks.map((a: any) => ({ id: a.task?.id, title: a.task?.title })).filter((t: any) => t.id),
      upcomingMeetings: upcomingMeetings.map(m => ({
        id: m.id,
        topic: m.topic,
        startTime: new Date(m.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" })
      })),
      overdueTasks: overdueTasks.map(t => ({ id: t.id, title: t.title }))
    }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch {
    return NextResponse.json({ newMessages: [], newTasks: [], upcomingMeetings: [], overdueTasks: [] });
  }
}
