"use server";

import { prisma } from "@/utils/prisma";
import { revalidatePath } from "next/cache";

export async function sendMessage(formData: FormData) {
  try {
    const content = formData.get("content") as string;
    const senderId = formData.get("senderId") as string;
    const poolId = "pool-cdsch"; // Default pool for this prototype

    if (!content || !senderId) {
      return { success: false, error: "Content is required." };
    }

    await prisma.message.create({
      data: {
        content,
        senderId,
        poolId,
        type: "TEXT",
      },
    });

    // We don't necessarily need revalidatePath for realtime chat, 
    // as the client will listen to the stream, but it's good practice.
    revalidatePath("/workspace/chat");
    return { success: true };
  } catch (error) {
    console.error("Chat Error:", error);
    return { success: false, error: "System failed to deliver message." };
  }
}
