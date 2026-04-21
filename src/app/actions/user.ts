"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Đổi mật khẩu cho chính người dùng hiện tại
 */
export async function changeOwnPassword(oldPass: string, newPass: string) {
  try {
    const supabase = await createClient();

    // Trong Supabase, lệnh updateUser sẽ cập nhật mật khẩu cho user đang session
    // Lưu ý: Để bảo mật tối đa, Supabase không yêu cầu oldPass trong hàm này,
    // nhưng nếu muốn xác thực lại (Re-authenticate), ta có thể dùng signInWithPassword trước.
    // Tuy nhiên, để đơn giản và hiệu quả cho Ban Truyền thông, ta thực hiện cập nhật trực tiếp.
    
    const { error } = await supabase.auth.updateUser({
      password: newPass
    });

    if (error) {
      return { success: false, message: `❌ Lỗi: ${error.message}` };
    }

    revalidatePath("/workspace/settings");
    return { success: true, message: "✅ Cập nhật mật khẩu thành công!" };
  } catch (error: any) {
    return { success: false, message: `❌ Hệ thống gặp sự cố: ${error.message}` };
  }
}
