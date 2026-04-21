"use server";

import { prisma } from "@/utils/prisma";
import { revalidatePath } from "next/cache";

export async function updateTaskStatus(taskId: string, newStatus: string) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus },
    });
    revalidatePath("/workspace/kanban");
    revalidatePath("/workspace"); // Tải lại dữ liệu mới nhất trên Dashboard
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update task status:", error);
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

    // Tìm Không gian làm việc (Pool) của đội, nếu chưa có thì hệ thống tự tạo 1 cái mặc định
    let pool = await prisma.pool.findFirst();
    if (!pool) {
      pool = await prisma.pool.create({ 
        data: { name: "Ban Truyền thông Chánh Hưng" } 
      });
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
    revalidatePath("/workspace"); // Ép Next.js tải lại trang Workspace (Dashboard) ngay lập tức
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create task:", error);
    return { success: false, error: error.message };
  }
}

export async function updateTaskStatusAndOrder(taskId: string, newStatus: string, newIndex: number) {
  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { success: false, error: "Task not found" };

    // Lấy toàn bộ thẻ trong cột đích (trừ thẻ hiện tại nếu nó đã ở đó)
    const otherTasks = await prisma.task.findMany({
      where: { status: newStatus, id: { not: taskId } },
      orderBy: { order: 'asc' }
    });

    // Chèn thẻ hiện tại vào vị trí index mới trong mảng
    otherTasks.splice(newIndex, 0, task);

    // Cập nhật lại toàn bộ thứ tự (order) và trạng thái trong 1 transaction an toàn
    const updates = otherTasks.map((t, idx) => 
      prisma.task.update({
        where: { id: t.id },
        data: { status: newStatus, order: idx }
      })
    );
    await prisma.$transaction(updates);

    revalidatePath("/workspace/kanban");
    revalidatePath("/workspace"); 
    return { success: true };
  } catch (error: any) {
    console.error("Failed to reorder task:", error);
    return { success: false, error: error.message };
  }
}

export async function createInlineTask(title: string, status: string) {
  if (!title.trim()) return { success: false };

  try {
    // Tìm Pool chung của đội
    let pool = await prisma.pool.findFirst();
    if (!pool) {
      pool = await prisma.pool.create({ data: { name: "Ban Truyền thông Chánh Hưng" } });
    }

    // Tạo thẻ và gán đúng trạng thái của cột đó
    await prisma.task.create({
      data: {
        title: title,
        status: status, // Nằm ở cột nào thì status là cột đó
        priority: 'MEDIUM',
        poolId: pool.id,
        order: 0 // Đẩy lên đầu
      }
    });

    revalidatePath('/workspace/kanban');
    revalidatePath('/workspace');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create inline task:", error);
    return { success: false };
  }
}
