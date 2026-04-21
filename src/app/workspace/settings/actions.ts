"use server";

import { prisma } from "@/utils/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const name = formData.get("name") as string;
    const avatarUrl = formData.get("avatarUrl") as string;

    if (!userId) {
      return { success: false, error: "User ID is required." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        avatarUrl,
      },
    });

    revalidatePath("/workspace/settings");
    revalidatePath("/workspace"); // Revalidate dashboard if it shows profile info
    return { success: true, message: "Cập nhật hồ sơ thành công! 🎉" };
  } catch (error: any) {
    console.error("Update profile error:", error);
    return { success: false, error: error.message };
  }
}
