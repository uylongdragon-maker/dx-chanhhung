"use server";

import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/utils/prisma";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function adminCreateMember(data: {
  name: string;
  email: string;
  password: string;
  unit: string;
  phone: string;
  position: string;
  roles: string;
}) {
  try {
    // 1. Create user in Supabase Auth via Admin Client (bypass verification)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.name,
        unit: data.unit,
      },
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: "Không thể tạo tài khoản xác thực." };
    }

    // 2. Fetch default pool
    let pool = await prisma.pool.findFirst();
    if (!pool) {
      pool = await prisma.pool.create({
        data: { name: "Ban Truyền thông Chánh Hưng" },
      });
    }

    // 3. Create user in PostgreSQL database via Prisma
    await prisma.user.create({
      data: {
        id: authData.user.id,
        email: authData.user.email!,
        name: data.name,
        unit: data.unit || null,
        phone: data.phone || null,
        position: data.position || "Thành viên",
        roles: data.roles || null,
        poolId: pool.id,
        status: "APPROVED",
        tempPassword: data.password,
        scoreQuickness: 80,
        scoreFlexibility: 80,
        scoreExpertise: 80,
        scoreProblemSolving: 80,
        scoreCreativity: 80,
        scoreResponsibility: 80,
      },
    });

    revalidatePath("/workspace/team");
    revalidatePath("/workspace");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserProfile(
  userId: string,
  data: {
    unit?: string | null;
    phone?: string | null;
    position?: string | null;
    roles?: string | null;
    scoreQuickness?: number;
    scoreFlexibility?: number;
    scoreExpertise?: number;
    scoreProblemSolving?: number;
    scoreCreativity?: number;
    scoreResponsibility?: number;
    leaderEvaluation?: string | null;
  }
) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        unit: data.unit,
        phone: data.phone,
        position: data.position,
        roles: data.roles,
        scoreQuickness: data.scoreQuickness,
        scoreFlexibility: data.scoreFlexibility,
        scoreExpertise: data.scoreExpertise,
        scoreProblemSolving: data.scoreProblemSolving,
        scoreCreativity: data.scoreCreativity,
        scoreResponsibility: data.scoreResponsibility,
        leaderEvaluation: data.leaderEvaluation,
      },
    });

    revalidatePath("/workspace/team");
    revalidatePath("/workspace");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
