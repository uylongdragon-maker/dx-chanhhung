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
