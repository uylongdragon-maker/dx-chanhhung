"use server";

import { prisma } from "@/utils/prisma";
import { revalidatePath } from "next/cache";

function revalidate() {
  revalidatePath("/workspace/kanban");
  revalidatePath("/workspace");
}

export async function updateTaskDescription(taskId: string, description: string) {
  try {
    await prisma.task.update({ where: { id: taskId }, data: { description } });
    revalidate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addChecklist(taskId: string, title: string) {
  try {
    const checklist = await prisma.checklist.create({ data: { taskId, title } });
    revalidate();
    return { success: true, data: checklist };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addChecklistItem(checklistId: string, text: string) {
  try {
    const item = await prisma.checklistItem.create({ data: { checklistId, text } });
    revalidate();
    return { success: true, data: item };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleChecklistItem(itemId: string, isCompleted: boolean) {
  try {
    await prisma.checklistItem.update({ where: { id: itemId }, data: { isCompleted } });
    revalidate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteChecklistItem(itemId: string) {
  try {
    await prisma.checklistItem.delete({ where: { id: itemId } });
    revalidate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteChecklist(checklistId: string) {
  try {
    await prisma.checklist.delete({ where: { id: checklistId } });
    revalidate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addTaskActivity(taskId: string, userId: string, type: string, text: string) {
  try {
    await prisma.activity.create({ data: { taskId, userId, type, text } });
    revalidate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTaskDueDate(taskId: string, dueDate: string | null) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { dueDate: dueDate ? new Date(dueDate) : null },
    });
    revalidate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTaskAssignment(taskId: string, assigneeId: string | null) {
  try {
    await prisma.task.update({ where: { id: taskId }, data: { assigneeId } });
    revalidate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTaskPriority(taskId: string, priority: string) {
  try {
    await prisma.task.update({ where: { id: taskId }, data: { priority } });
    revalidate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTaskEstimatedHours(taskId: string, hours: number | null) {
  try {
    await prisma.task.update({ where: { id: taskId }, data: { estimatedHours: hours } });
    revalidate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addTaskAttachment(taskId: string, url: string) {
  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { success: false, error: "Task not found" };
    await prisma.task.update({
      where: { id: taskId },
      data: { attachments: { push: url } },
    });
    revalidate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addTaskLabel(taskId: string, name: string, color: string) {
  try {
    await prisma.taskLabel.create({ data: { taskId, name, color } });
    revalidate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeTaskLabel(labelId: string) {
  try {
    await prisma.taskLabel.delete({ where: { id: labelId } });
    revalidate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addTaskWatcher(taskId: string, userId: string) {
  try {
    await prisma.taskWatcher.create({ data: { taskId, userId } });
    revalidate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeTaskWatcher(taskId: string, userId: string) {
  try {
    await prisma.taskWatcher.delete({ where: { taskId_userId: { taskId, userId } } });
    revalidate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
