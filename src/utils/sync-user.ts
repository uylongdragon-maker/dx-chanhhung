import { prisma } from './prisma';
import { cache } from 'react';

// cache() memoizes per-request — so within a single render tree (layout + page)
// syncUser is only called ONCE even if imported by multiple components
export const syncUser = cache(async (supabaseUser: any) => {
  if (!supabaseUser) return null;

  // 1. Kiểm tra xem thành viên này đã có trong database hệ thống chưa
  const existingUser = await prisma.user.findUnique({
    where: { id: supabaseUser.id }
  });

  if (existingUser) return existingUser;

  // 2. Nếu chưa có (đăng nhập lần đầu), tự động tạo hồ sơ mới
  let pool = await prisma.pool.findFirst();
  if (!pool) {
    pool = await prisma.pool.create({
      data: { name: "Ban Truyền thông Chánh Hưng" }
    });
  }

  // 3. Tạo User mới và gắn vào Pool
  return await prisma.user.create({
    data: {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
      poolId: pool.id
    }
  });
});

