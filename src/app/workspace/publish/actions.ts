"use server";

import { prisma } from "@/utils/prisma";
import { revalidatePath } from "next/cache";

export async function savePost(formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const authorId = formData.get("authorId") as string;
    const postId = formData.get("postId") as string;

    if (!title || !authorId) {
      return { success: false, error: "Title and Author are required." };
    }

    if (postId) {
      // Update
      await prisma.post.update({
        where: { id: postId },
        data: { title, content },
      });
    } else {
      // Create
      await prisma.post.create({
        data: {
          title,
          content,
          authorId,
          status: "DRAFT",
        },
      });
    }

    revalidatePath("/workspace/publish");
    return { success: true };
  } catch (error) {
    console.error("Failed to save post:", error);
    return { success: false, error: "Database error." };
  }
}

export async function publishToBridge(postId: string) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: true },
    });

    if (!post) return { success: false, error: "Post not found." };

    // Update status to PENDING or PUBLISHED in our DB
    await prisma.post.update({
      where: { id: postId },
      data: { status: "PUBLISHED" },
    });

    // SIMULATED BRIDGE TO FIREBASE
    console.log(`[Publishing Bridge] Syncing post "${post.title}" to Tuoi Tre So (Firebase)...`);
    
    // In real implementation, this would be a fetch() to our own bridge route
    // or a direct Firebase Admin SDK call.
    
    revalidatePath("/workspace/publish");
    return { success: true, message: "Bài viết đã được đẩy lên Tuổi Trẻ Số thành công!" };
  } catch (error) {
    console.error("Bridge Error:", error);
    return { success: false, error: "Bridge connection failed." };
  }
}

export async function optimizePostWithAI(title: string, content: string) {
  try {
    const optimizedTitle = `[HẤP DẪN] ${title}`;
    const strippedContent = content.replace(/<[^>]*>/g, "");
    const optimizedContent = `${content}<p><em><strong>Gợi ý từ AI:</strong> Nội dung bài viết này rất phù hợp với xu hướng chuyển đổi số hiện nay của giới trẻ.</em></p>`;

    return { 
      success: true, 
      optimizedTitle, 
      optimizedContent,
      suggestion: "Tui đã tối ưu tiêu đề và thêm phần nhận định AI vào cuối bài."
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
