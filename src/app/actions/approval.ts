"use server";

import { prisma } from "@/utils/prisma";
import { revalidatePath } from "next/cache";

export async function submitContent(
  title: string,
  content: string, // Link or description
  mediaUrls: string[],
  authorId: string
) {
  try {
    const post = await prisma.post.create({
      data: {
        title,
        content,
        mediaUrls,
        status: "PENDING",
        authorId
      }
    });
    revalidatePath("/workspace/approval");
    return { success: true, postId: post.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateApprovalStatus(
  id: string,
  status: string,
  feedback: string | null
) {
  try {
    // Only allow specific statuses
    if (!["APPROVED", "REJECTED", "REVISION", "PENDING"].includes(status)) {
       throw new Error("Invalid status");
    }

    await prisma.post.update({
      where: { id },
      data: {
        status,
        feedback: feedback || null
      }
    });
    revalidatePath("/workspace/approval");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteApprovalRequest(id: string, userId: string) {
  try {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error("Not found");
    if (post.authorId !== userId) throw new Error("Forbidden");

    await prisma.post.delete({ where: { id } });
    revalidatePath("/workspace/approval");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
