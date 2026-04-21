import { prisma } from './prisma'

export async function syncUser(supabaseUser: any) {
  if (!supabaseUser) return null;

  // 1. Kiểm tra xem thành viên này đã có trong database hệ thống chưa
  const existingUser = await prisma.user.findUnique({
    where: { id: supabaseUser.id }
  });

  if (existingUser) return existingUser;

  // 2. Nếu chưa có (đăng nhập lần đầu), tự động tạo hồ sơ mới
  // Tìm hoặc tạo Pool mặc định cho Ban Truyền thông Chánh Hưng
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
}
