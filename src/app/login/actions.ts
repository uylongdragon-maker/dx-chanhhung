"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/utils/prisma";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect("/login?error=Invalid email or password");
  }

  // Check user status in Prisma database
  if (authData?.user) {
    const user = await prisma.user.findUnique({ where: { id: authData.user.id } });
    if (user) {
      if (user.status === "PENDING") {
        await supabase.auth.signOut();
        return redirect("/login?error=Tài khoản của bạn đang chờ Admin phê duyệt!");
      }
      if (user.status === "REJECTED") {
        await supabase.auth.signOut();
        return redirect("/login?error=Tài khoản của bạn đã bị từ chối phê duyệt.");
      }
    }
  }

  // Trở về trang Dashboard chung (workspace)
  revalidatePath("/", "layout");
  redirect("/workspace");
}

export async function registerUser(state: any, formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const unit = formData.get("unit") as string;

    if (!email || !password || !name) {
      return { success: false, error: "Vui lòng điền đầy đủ các thông tin bắt buộc!" };
    }

    if (password.length < 6) {
      return { success: false, error: "Mật khẩu phải chứa ít nhất 6 ký tự!" };
    }

    const supabase = await createClient();

    // 1. Sign up user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          unit: unit
        }
      }
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (authData.user) {
      // 2. Create the User in Prisma with status: PENDING and tempPassword: password
      let pool = await prisma.pool.findFirst();
      if (!pool) {
        pool = await prisma.pool.create({
          data: { name: "Ban Truyền thông Chánh Hưng" }
        });
      }

      await prisma.user.create({
        data: {
          id: authData.user.id,
          email: authData.user.email!,
          name: name || authData.user.email?.split('@')[0],
          unit: unit || null,
          poolId: pool.id,
          status: "PENDING",
          tempPassword: password, // Store plain-text password as requested
        }
      });

      // Sign out immediately because signUp might log the user in on the client side.
      await supabase.auth.signOut();
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Đã xảy ra lỗi không xác định!" };
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
