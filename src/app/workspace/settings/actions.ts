"use server";

import { prisma } from "@/utils/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const name = formData.get("name") as string;
    const avatarUrl = formData.get("avatarUrl") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const unit = formData.get("unit") as string;
    const position = formData.get("position") as string;
    const roles = formData.get("roles") as string;

    if (!userId) {
      return { success: false, error: "Không tìm thấy thông tin ID người dùng." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || null,
        avatarUrl: avatarUrl || null,
        phone: phone || null,
        address: address || null,
        unit: unit || null,
        position: position || "Thành viên",
        roles: roles || null,
      },
    });

    revalidatePath("/workspace/settings");
    revalidatePath("/workspace/team");
    revalidatePath("/workspace"); // Revalidate dashboard if it shows profile info
    
    return { success: true, message: "Cập nhật thông tin hồ sơ thành công! 🎉" };
  } catch (error: any) {
    console.error("Update profile error:", error);
    return { success: false, error: error.message };
  }
}

export async function completeOnboarding(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const name = formData.get("name") as string;
    const avatarUrl = formData.get("avatarUrl") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const unit = formData.get("unit") as string;
    const position = formData.get("position") as string;

    if (!userId) {
      return { success: false, error: "Không tìm thấy ID người dùng." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || null,
        avatarUrl: avatarUrl || null,
        phone: phone || null,
        address: address || null,
        unit: unit || null,
        position: position || "Thành viên",
        isOnboarded: true, // Đánh dấu đã onboarding thành công
      },
    });

    revalidatePath("/workspace");
    revalidatePath("/workspace/settings");
    revalidatePath("/workspace/team");
    
    return { success: true, message: "Hoàn tất khởi tạo tài khoản! 🎉" };
  } catch (error: any) {
    console.error("Complete onboarding error:", error);
    return { success: false, error: error.message };
  }
}
