"use server";

import { prisma } from "@/utils/prisma";
import { revalidatePath } from "next/cache";

export async function saveMedia(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const url = formData.get("url") as string;
    const type = formData.get("type") as string;
    const size = formData.get("size") as string;
    const tag = formData.get("tag") as string;
    const uploaderId = formData.get("uploaderId") as string;

    await prisma.media.create({
      data: {
        name,
        url,
        type,
        size,
        tag,
        uploaderId,
      },
    });

    revalidatePath("/workspace/media");
    return { success: true };
  } catch (error: any) {
    console.error("Save media error:", error);
    return { success: false, error: error.message };
  }
}
