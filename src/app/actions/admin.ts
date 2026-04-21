"use server";

import { prisma } from "@/utils/prisma";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/utils/supabase-admin";

// helper kiểm tra UUID
const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// Hàm kiểm tra quyền Admin lõi
async function checkAdminStatus(callerId: string) {
  const caller = await prisma.user.findUnique({ where: { id: callerId } });
  if (caller?.role !== "ADMIN") {
    throw new Error("Cảnh báo bảo mật: Bạn không có quyền thực hiện thao tác này!");
  }
}

// Đổi mật khẩu thành viên (God Mode)
export async function changeUserPassword(callerId: string, targetUserId: string, newPassword: string) {
  return await forceChangePassword(callerId, targetUserId, newPassword);
}

// Cấp lại mật khẩu cho thành viên (Chỉ dành cho Admin nòng cốt)
export async function forceChangePassword(adminId: string, targetUserId: string, newPassword: string) {
  try {
    await checkAdminStatus(adminId);
    
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
    return { success: false, message: error.message || "Lỗi hệ thống!" };
  }
}

// Cập nhật API Key mới cho AI
export async function updateGeminiKey(callerId: string, newKey: string) {
  return await updateSystemKey(callerId, newKey);
}

// Hàm cập nhật API Key hệ thống (Lưu vào SystemConfig)
export async function updateSystemKey(adminId: string, newKey: string) {
  try {
    await checkAdminStatus(adminId);
    // Lưu vào database (bảng SystemConfig đã tạo)
    await prisma.systemConfig.upsert({
      where: { key: "GEMINI_API_KEY" },
      update: { value: newKey },
      create: { key: "GEMINI_API_KEY", value: newKey }
    });
    
    revalidatePath("/workspace/admin");
    return { success: true };
  } catch (error) {
    console.error("Update System Key Error:", error);
    return { success: false };
  }
}

// Hàm Xóa thành viên
export async function deleteMember(callerId: string, targetUserId: string) {
  try {
    await checkAdminStatus(callerId);

    // Không cho phép tự xóa chính mình
    if (callerId === targetUserId) {
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
    console.error("Delete Member Error:", error);
    return { 
      success: false, 
      message: "Lỗi: Không thể xóa thành viên này. Tài khoản có thể đang ràng buộc dữ liệu hoặc ID không hợp lệ." 
    };
  }
}

// Hàm Đổi Quyền (Ví dụ: Từ MEMBER lên EDITOR)
export async function updateMemberRole(callerId: string, targetUserId: string, newRole: string) {
  try {
    await checkAdminStatus(callerId);
    
    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole }
    });
    revalidatePath("/workspace/admin");
    return { success: true };
  } catch (error) {
    console.error("Update Role Error:", error);
    return { success: false };
  }
}
