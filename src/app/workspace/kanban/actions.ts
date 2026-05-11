"use server";

import { prisma } from "@/utils/prisma";
import { revalidatePath } from "next/cache";

export async function updateTaskStatus(taskId: string, newStatus: string) {
  try {
    const data: any = { status: newStatus }
    if (newStatus === 'DONE') data.completedAt = new Date()
    else data.completedAt = null

    await prisma.task.update({ where: { id: taskId }, data });
    revalidatePath("/workspace/kanban");
    revalidatePath("/workspace");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createTask(formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const priority = formData.get("priority") as string;
    const assigneeId = formData.get("assigneeId") as string;
    const description = formData.get("description") as string;

    if (!title || title.trim() === "") {
      return { success: false, error: "Tiêu đề không được để trống" };
    }

    let pool = await prisma.pool.findFirst();
    if (!pool) {
      pool = await prisma.pool.create({ data: { name: "Ban Truyền thông Chánh Hưng" } });
    }

    await prisma.task.create({
      data: {
        title,
        description: description || null,
        priority: priority || "MEDIUM",
        status: "TODO",
        poolId: pool.id,
        assigneeId: assigneeId || null,
      },
    });

    revalidatePath("/workspace/kanban");
    revalidatePath("/workspace");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTaskStatusAndOrder(taskId: string, newStatus: string, newIndex: number) {
  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { success: false, error: "Task not found" };

    const otherTasks = await prisma.task.findMany({
      where: { status: newStatus, id: { not: taskId } },
      orderBy: { order: 'asc' }
    });

    otherTasks.splice(newIndex, 0, task);

    const data: any = { status: newStatus }
    if (newStatus === 'DONE' && task.status !== 'DONE') data.completedAt = new Date()
    else if (newStatus !== 'DONE') data.completedAt = null

    const updates = otherTasks.map((t, idx) =>
      prisma.task.update({
        where: { id: t.id },
        data: { ...data, order: idx }
      })
    );
    await prisma.$transaction(updates);

    revalidatePath("/workspace/kanban");
    revalidatePath("/workspace");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createInlineTask(title: string, status: string) {
  if (!title.trim()) return { success: false };
  try {
    let pool = await prisma.pool.findFirst();
    if (!pool) {
      pool = await prisma.pool.create({ data: { name: "Ban Truyền thông Chánh Hưng" } });
    }

    await prisma.task.create({
      data: { title, status, priority: 'MEDIUM', poolId: pool.id, order: 0 }
    });

    revalidatePath('/workspace/kanban');
    revalidatePath('/workspace');
    return { success: true };
  } catch (error: any) {
    return { success: false };
  }
}

export async function deleteTask(taskId: string) {
  try {
    await prisma.task.delete({ where: { id: taskId } });
    revalidatePath('/workspace/kanban');
    revalidatePath('/workspace');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function togglePoolItem(taskId: string, isPoolItem: boolean) {
  try {
    await prisma.task.update({ where: { id: taskId }, data: { isPoolItem } });
    revalidatePath('/workspace/kanban');
    revalidatePath('/workspace');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
