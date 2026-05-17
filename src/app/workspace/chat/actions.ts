"use server";

import { prisma } from "@/utils/prisma";
import { revalidatePath } from "next/cache";

// Legacy action kept for backward compatibility
export async function sendMessage(formData: FormData) {
  try {
    const content = formData.get("content") as string;
    const senderId = formData.get("senderId") as string;
    const roomId = formData.get("roomId") as string | undefined;

    if (!content || !senderId) {
      return { success: false, error: "Content is required." };
    }

    const pool = await prisma.pool.findFirst();
    if (!pool) return { success: false, error: "No pool found." };

    await prisma.message.create({
      data: {
        content,
        senderId,
        poolId: pool.id,
        roomId: roomId || null,
        type: "TEXT",
      },
    });

    revalidatePath("/workspace/chat");
    return { success: true };
  } catch (error) {
    console.error("Chat Error:", error);
    return { success: false, error: "System failed to deliver message." };
  }
}
