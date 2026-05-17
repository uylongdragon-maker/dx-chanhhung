"use server";

import { prisma } from "@/utils/prisma";
import { revalidatePath } from "next/cache";

export async function createChatRoom(
  name: string,
  description: string,
  icon: string,
  color: string,
  createdById: string,
  memberIds: string[] = []
) {
  try {
    const room = await prisma.chatRoom.create({
      data: {
        name,
        description: description || null,
        icon: icon || "💬",
        color: color || "#3b82f6",
        createdById,
        members: {
          create: Array.from(new Set([createdById, ...memberIds])).map(id => ({ userId: id }))
        }
      },
    });
    revalidatePath("/workspace/chat");
    return { success: true, roomId: room.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function joinChatRoom(roomId: string, userId: string) {
  try {
    await prisma.chatRoomMember.upsert({
      where: { roomId_userId: { roomId, userId } },
      create: { roomId, userId },
      update: {},
    });
    revalidatePath("/workspace/chat");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addUsersToRoom(roomId: string, userIds: string[]) {
  try {
    const creates = userIds.map(userId => 
      prisma.chatRoomMember.upsert({
        where: { roomId_userId: { roomId, userId } },
        create: { roomId, userId },
        update: {}
      })
    );
    await prisma.$transaction(creates);
    revalidatePath("/workspace/chat");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function leaveChatRoom(roomId: string, userId: string) {
  try {
    await prisma.chatRoomMember.delete({
      where: { roomId_userId: { roomId, userId } },
    });
    revalidatePath("/workspace/chat");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendRoomMessage(
  content: string,
  senderId: string,
  roomId: string,
  poolId: string,
  type: string = "TEXT",
  taskRef?: string
) {
  try {
    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        roomId,
        poolId,
        type,
        taskRef: taskRef || null,
      },
    });
    revalidatePath("/workspace/chat");
    return { success: true, messageId: message.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createTaskFromMessage(
  title: string,
  description: string,
  assigneeId: string | null,
  dueDate: string | null,
  poolId: string,
  fromMessageId?: string
) {
  try {
    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        status: "TODO",
        priority: "MEDIUM",
        poolId,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
    // Optionally update message to reference the task
    if (fromMessageId) {
      await prisma.message.update({
        where: { id: fromMessageId },
        data: { taskRef: task.id, type: "TASK_REF" },
      });
    }
    revalidatePath("/workspace/kanban");
    revalidatePath("/workspace");
    revalidatePath("/workspace/chat");
    return { success: true, taskId: task.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteChatRoom(roomId: string, userId: string) {
  try {
    const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room || room.createdById !== userId) {
      return { success: false, error: "Không có quyền xoá phòng này" };
    }
    await prisma.chatRoom.delete({ where: { id: roomId } });
    revalidatePath("/workspace/chat");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
