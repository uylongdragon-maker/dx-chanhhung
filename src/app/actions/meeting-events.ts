"use server";

import { prisma } from "@/utils/prisma";
import { revalidatePath } from "next/cache";

export async function createMeetingEvent(
  title: string,
  description: string,
  location: string,
  startTime: string,
  endTime: string,
  color: string,
  maxAttendees: string,
  createdById: string
) {
  try {
    const event = await prisma.meetingEvent.create({
      data: {
        title,
        description: description || null,
        location: location || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        color: color || "#3b82f6",
        maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
        createdById,
        attendees: {
          create: { userId: createdById }
        }
      },
    });
    revalidatePath("/workspace/meetings");
    revalidatePath("/workspace");
    return { success: true, eventId: event.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function registerForMeetingEvent(eventId: string, userId: string) {
  try {
    await prisma.meetingAttendee.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId },
      update: {},
    });
    revalidatePath("/workspace/meetings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function unregisterFromMeetingEvent(eventId: string, userId: string) {
  try {
    await prisma.meetingAttendee.delete({
      where: { eventId_userId: { eventId, userId } },
    });
    revalidatePath("/workspace/meetings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMeetingEventsForMonth(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  return prisma.meetingEvent.findMany({
    where: { startTime: { gte: start, lte: end } },
    include: {
      createdBy: { select: { name: true, avatarUrl: true } },
      attendees: { include: { user: { select: { name: true, avatarUrl: true } } } }
    },
    orderBy: { startTime: "asc" }
  });
}

export async function deleteMeetingEvent(eventId: string, userId: string) {
  try {
    const event = await prisma.meetingEvent.findUnique({ where: { id: eventId } });
    if (!event || event.createdById !== userId) {
      return { success: false, error: "Không có quyền xoá sự kiện này" };
    }
    await prisma.meetingEvent.delete({ where: { id: eventId } });
    revalidatePath("/workspace/meetings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
