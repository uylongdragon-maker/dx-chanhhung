"use server";

import { prisma } from "@/utils/prisma";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/utils/supabase-admin";
import { createClient } from "@/utils/supabase/server";

// helper kiểm tra UUID
const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// Lấy authenticated user từ session (không nhận từ client)
async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const caller = await prisma.user.findUnique({ where: { id: user.id } });
  if (caller?.role !== "ADMIN") throw new Error("Forbidden: Không có quyền thực hiện thao tác này!");
  return caller;
}

// Đổi mật khẩu thành viên (God Mode)
export async function changeUserPassword(targetUserId: string, newPassword: string) {
  return await forceChangePassword(targetUserId, newPassword);
}

// Cấp lại mật khẩu cho thành viên (Chỉ dành cho Admin nòng cốt)
export async function forceChangePassword(targetUserId: string, newPassword: string) {
  try {
    await getAdminUser(); // Lấy từ session, không nhận adminId từ client
    
    if (!newPassword || newPassword.length < 8) {
      return { success: false, message: "Mật khẩu phải có ít nhất 8 ký tự." };
    }

    if (!isUUID(targetUserId)) {
      return { 
        success: false, 
        message: "Lỗi: ID người dùng không hợp lệ (Không phải UUID). Bạn không thể đổi mật khẩu cho tài khoản Mock." 
      };
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    );
    
    if (error) throw error;
    return { success: true, message: "Đã cấp lại mật khẩu thành công!" };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.startsWith("Forbidden")) {
      return { success: false, message: error.message };
    }
    console.error("[forceChangePassword]", error);
    return { success: false, message: "Đã xảy ra lỗi hệ thống." };
  }
}

// Cập nhật API Key mới cho AI
export async function updateGeminiKey(newKey: string) {
  return await updateSystemKey(newKey);
}

// Hàm cập nhật API Key hệ thống (Lưu vào SystemConfig)
export async function updateSystemKey(newKey: string) {
  try {
    await getAdminUser();
    await prisma.systemConfig.upsert({
      where: { key: "GEMINI_API_KEY" },
      update: { value: newKey },
      create: { key: "GEMINI_API_KEY", value: newKey }
    });
    
    revalidatePath("/workspace/admin");
    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.startsWith("Forbidden")) {
      return { success: false, message: error.message };
    }
    console.error("[updateSystemKey]", error);
    return { success: false };
  }
}

// Hàm Xóa thành viên
export async function deleteMember(targetUserId: string) {
  try {
    const admin = await getAdminUser();

    // Không cho phép tự xóa chính mình
    if (admin.id === targetUserId) {
      return { success: false, message: "Lỗi: Bạn không thể tự xóa chính mình!" };
    }
    
    // Nếu là UUID thật, xóa cả bên Auth
    if (isUUID(targetUserId)) {
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
        if (authError) console.error("Supabase Auth Delete Error (handled):", authError);
    }
    
    // Xóa user khỏi cơ sở dữ liệu Prisma
    await prisma.user.delete({ where: { id: targetUserId } });
    
    revalidatePath("/workspace/admin");
    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.startsWith("Forbidden")) {
      return { success: false, message: error.message };
    }
    console.error("[deleteMember]", error);
    return { 
      success: false, 
      message: "Lỗi: Không thể xóa thành viên này. Tài khoản có thể đang ràng buộc dữ liệu hoặc ID không hợp lệ." 
    };
  }
}

// Hàm Đổi Quyền
export async function updateMemberRole(targetUserId: string, newRole: string) {
  try {
    await getAdminUser();
    // Validate role
    if (!['ADMIN', 'EDITOR', 'MEMBER'].includes(newRole)) {
      return { success: false };
    }
    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole }
    });
    revalidatePath("/workspace/admin");
    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.startsWith("Forbidden")) {
      return { success: false };
    }
    console.error("[updateMemberRole]", error);
    return { success: false };
  }
}

// Phê duyệt tài khoản PENDING -> APPROVED
export async function approveUser(targetUserId: string) {
  try {
    await getAdminUser();
    
    await prisma.user.update({
      where: { id: targetUserId },
      data: { status: "APPROVED" }
    });
    
    revalidatePath("/workspace/admin");
    return { success: true, message: "Đã phê duyệt tài khoản thành công!" };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.startsWith("Forbidden")) {
      return { success: false, message: error.message };
    }
    console.error("[approveUser]", error);
    return { success: false, message: "Đã xảy ra lỗi hệ thống." };
  }
}

// Cập nhật Logo ứng dụng mới (Lưu vào SystemConfig)
export async function updateAppLogo(logoBase64: string) {
  try {
    await getAdminUser();
    // Validate base64 size (max ~2MB)
    if (logoBase64.length > 2_800_000) {
      return { success: false, message: "Logo quá lớn. Vui lòng chọn ảnh nhỏ hơn 2MB." };
    }
    await prisma.systemConfig.upsert({
      where: { key: "APP_LOGO" },
      update: { value: logoBase64 },
      create: { key: "APP_LOGO", value: logoBase64 }
    });
    revalidatePath("/workspace", "layout");
    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.startsWith("Forbidden")) {
      return { success: false, message: error.message };
    }
    console.error("[updateAppLogo]", error);
    return { success: false, message: "Đã xảy ra lỗi hệ thống." };
  }
}
