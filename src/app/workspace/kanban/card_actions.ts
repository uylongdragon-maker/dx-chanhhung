"use server";

import { prisma } from "@/utils/prisma";
import { revalidatePath } from "next/cache";

/**
 * Cập nhật mô tả chi tiết của thẻ việc
 */
export async function updateTaskDescription(taskId: string, description: string) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { description },
    });
    revalidatePath("/workspace/kanban");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Thêm danh sách công việc (Checklist)
 */
export async function addChecklist(taskId: string, title: string) {
  try {
    const checklist = await prisma.checklist.create({
      data: {
        taskId,
        title,
      },
    });
    revalidatePath("/workspace/kanban");
    return { success: true, data: checklist };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Thêm mục con vào Checklist
 */
export async function addChecklistItem(checklistId: string, text: string) {
  try {
    const item = await prisma.checklistItem.create({
      data: {
        checklistId,
        text,
      },
    });
    revalidatePath("/workspace/kanban");
    return { success: true, data: item };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Đánh dấu hoàn thành/chưa hoàn thành mục checklist
 */
export async function toggleChecklistItem(itemId: string, isCompleted: boolean) {
  try {
    await prisma.checklistItem.update({
      where: { id: itemId },
      data: { isCompleted },
    });
    revalidatePath("/workspace/kanban");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Ghi lại hoạt động hoặc bình luận
 */
export async function addTaskActivity(taskId: string, userId: string, type: string, text: string) {
  try {
    await prisma.activity.create({
      data: {
        taskId,
        userId,
        type,
        text,
      },
    });
    revalidatePath("/workspace/kanban");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Cập nhật ngày hết hạn
 */
export async function updateTaskDueDate(taskId: string, dueDate: Date | null) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { dueDate },
    });
    revalidatePath("/workspace/kanban");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Cập nhật người phụ trách
 */
export async function updateTaskAssignment(taskId: string, assigneeId: string | null) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { assigneeId },
    });
    revalidatePath("/workspace/kanban");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Cập nhật độ ưu tiên
 */
export async function updateTaskPriority(taskId: string, priority: string) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { priority },
    });
    revalidatePath("/workspace/kanban");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Thêm tệp đính kèm (Lưu mảng URL)
 */
export async function addTaskAttachment(taskId: string, url: string) {
  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { success: false, error: "Task not found" };
    
    await prisma.task.update({
      where: { id: taskId },
      data: {
        attachments: {
          push: url
        }
      },
    });
    revalidatePath("/workspace/kanban");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
