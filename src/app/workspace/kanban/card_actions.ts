"use server";

import { prisma } from "@/utils/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

// Auth guard helper — throws if not authenticated
async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

function revalidate() {
  revalidatePath("/workspace/kanban");
  revalidatePath("/workspace");
}

export async function updateTaskDescription(taskId: string, description: string) {
  try {
    await requireAuth();
    await prisma.task.update({ where: { id: taskId }, data: { description } });
    revalidate();
    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" };
    console.error("[updateTaskDescription]", error);
    return { success: false, error: "Đã xảy ra lỗi." };
  }
}

export async function updateTaskTitle(taskId: string, title: string) {
  try {
    await requireAuth();
    if (!title.trim()) return { success: false, error: "Tiêu đề không được để trống" };
    await prisma.task.update({ where: { id: taskId }, data: { title: title.trim().substring(0, 500) } });
    revalidate();
    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" };
    console.error("[updateTaskTitle]", error);
    return { success: false, error: "Đã xảy ra lỗi." };
  }
}

export async function addChecklist(taskId: string, title: string) {
  try {
    await requireAuth();
    const checklist = await prisma.checklist.create({ data: { taskId, title: title.substring(0, 200) } });
    revalidate();
    return { success: true, data: checklist };
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" };
    console.error("[addChecklist]", error);
    return { success: false, error: "Đã xảy ra lỗi." };
  }
}

export async function addChecklistItem(checklistId: string, text: string) {
  try {
    await requireAuth();
    const item = await prisma.checklistItem.create({ data: { checklistId, text: text.substring(0, 500) } });
    revalidate();
    return { success: true, data: item };
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" };
    console.error("[addChecklistItem]", error);
    return { success: false, error: "Đã xảy ra lỗi." };
  }
}

export async function toggleChecklistItem(itemId: string, isCompleted: boolean) {
  try {
    await prisma.checklistItem.update({ where: { id: itemId }, data: { isCompleted } });
    
    // Auto-update task to DONE if all checklists are completed
    const item = await prisma.checklistItem.findUnique({ where: { id: itemId }, include: { checklist: true }});
    if (item) {
      const task = await prisma.task.findUnique({ 
        where: { id: item.checklist.taskId },
        include: { checklists: { include: { items: true } } }
      });
      if (task) {
        let allCompleted = true;
        let hasItems = false;
        task.checklists.forEach(cl => {
          cl.items.forEach(i => {
            hasItems = true;
            if (!i.isCompleted) allCompleted = false;
          });
        });
        if (hasItems && allCompleted && task.status !== 'DONE') {
          await prisma.task.update({ where: { id: task.id }, data: { status: 'DONE', completedAt: new Date() }});
        } else if (hasItems && !allCompleted && task.status === 'DONE') {
          // Revert back if unchecked
          await prisma.task.update({ where: { id: task.id }, data: { status: 'DOING', completedAt: null }});
        }
      }
    }

    revalidate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteChecklistItem(itemId: string) {
  try {
    await requireAuth();
    await prisma.checklistItem.delete({ where: { id: itemId } });
    revalidate();
    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" };
    console.error("[deleteChecklistItem]", error);
    return { success: false, error: "Đã xảy ra lỗi." };
  }
}

export async function assignChecklistItem(itemId: string, assigneeId: string | null) {
  try {
    await requireAuth();
    await prisma.checklistItem.update({
      where: { id: itemId },
      data: { assigneeId }
    });
    revalidate();
    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" };
    console.error("[assignChecklistItem]", error);
    return { success: false, error: "Đã xảy ra lỗi." };
  }
}

export async function deleteChecklist(checklistId: string) {
  try {
    await requireAuth();
    await prisma.checklist.delete({ where: { id: checklistId } });
    revalidate();
    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" };
    console.error("[deleteChecklist]", error);
    return { success: false, error: "Đã xảy ra lỗi." };
  }
}

export async function updateChecklistTitle(checklistId: string, title: string) {
  try {
    await requireAuth();
    await prisma.checklist.update({ where: { id: checklistId }, data: { title: title.substring(0, 200) } });
    revalidate();
    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" };
    console.error("[updateChecklistTitle]", error);
    return { success: false, error: "Đã xảy ra lỗi." };
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
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    const newStatus = (task && task.status === 'TODO' && assigneeId) ? 'DOING' : undefined;

    await prisma.task.update({ 
      where: { id: taskId }, 
      data: { 
        assigneeId,
        ...(newStatus ? { status: newStatus } : {})
      } 
    });
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

export async function updateTaskCreator(taskId: string, creatorId: string | null) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { creatorId },
    });
    revalidate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTaskEvaluation(taskId: string, evaluation: string) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { evaluation },
    });
    revalidate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTaskEvaluationNotes(taskId: string, notes: string | null) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { evaluationNotes: notes },
    });
    revalidate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTaskProductType(taskId: string, productType: string) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { productType },
    });
    revalidate();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleTaskAssignee(taskId: string, userId: string, assign: boolean) {
  try {
    const task = await prisma.task.findUnique({ where: { id: taskId }, include: { assignees: true } });
    if (!task) return { success: false, error: "Không tìm thấy công việc." };

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        assignees: assign 
          ? { connect: { id: userId } } 
          : { disconnect: { id: userId } },
        ...(assign && !task.assigneeId ? { assigneeId: userId } : {}),
        ...(!assign && task.assigneeId === userId ? { assigneeId: null } : {})
      },
      include: { assignees: true }
    });

    if (updated.status === 'TODO' && updated.assignees.length > 0) {
      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'DOING' }
      });
    }

    revalidate();
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi cập nhật phân công:", error);
    return { success: false, error: error.message };
  }
}


