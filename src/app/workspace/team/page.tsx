import { prisma } from "@/utils/prisma";
import { createClient } from "@/utils/supabase/server";
import { syncUser } from "@/utils/sync-user";
import { redirect } from "next/navigation";
import TeamPageClient from "@/components/team/TeamPageClient";

// Auto-seed existing database records with info from the Excel mockup
async function initializeTeamData() {
  const seedData = [
    { name: "Abdul Kariem", phone: "0766875688", position: "Chủ nhiệm", roles: "Kỹ thuật truyền thông, Sự kiện, Nội dung", unit: "Bí thư chi đoàn KP23" },
    { name: "Phan Minh Khang", phone: "0373444137", position: "Phó Chủ nhiệm", roles: "Sự kiện, Nội dung, Ban kiểm tra", unit: "Bí thư Chi Đoàn KP81" },
    { name: "Lê Thị Thái Phụng", phone: "0963803443", position: "Phó Chủ nhiệm", roles: "Logistic, Tài chính, Hành chính văn thư", unit: "Bí thư chi đoàn KP60" },
    { name: "Nguyễn Hà Quỳnh Như", phone: "0765511307", position: "Thành viên", roles: "Logistic", unit: "Bí thư Chi Đoàn KP44" },
    { name: "Phạm Như Quỳnh", phone: "0931348947", position: "Thành viên", roles: "Biên tập viên", unit: "Bí thư chi đoàn KP29" },
    { name: "Lê Ngọc Anh Thư", phone: "0909923135", position: "Thành viên", roles: "Leader biên tập viên", unit: "bí thư chi đoàn KP18" },
    { name: "Đỗ Thị Thanh Trúc", phone: "", position: "Thành viên", roles: "Biên tập viên", unit: "Đoàn viên chi đoàn KP23" },
    { name: "Nguyễn Thị Kim Tuyền", phone: "", position: "Thành viên", roles: "Biên tập viên, MC Phát thanh viên", unit: "bí thư chi đoàn KP22" },
    { name: "Thạch Bảo Minh", phone: "0908855960", position: "Thành viên", roles: "Kỹ thuật truyền thông", unit: "Bí thư chi đoàn KP11" },
    { name: "Trương Thị Minh Anh", phone: "", position: "Thành viên", roles: "Kỹ thuật truyền thông", unit: "Bí thư Chi Đoàn KP24" },
    { name: "Huỳnh Quang Minh", phone: "0707798927", position: "Thành viên", roles: "Kỹ thuật truyền thông", unit: "Bí thư Chi Đoàn KP1" },
    { name: "Châu Huỳnh Lan Anh", phone: "0905718901", position: "Thành viên", roles: "Kỹ thuật truyền thông, Kiểm duyệt nội dung", unit: "Bí thư Chi Đoàn KP21" },
    { name: "Trường Huỳnh Gia Hân", phone: "0934113642", position: "Thành viên", roles: "Kỹ thuật truyền thông", unit: "Bí thư Chi Đoàn KP47" },
    { name: "Lê Trọng Phúc", phone: "0868061479", position: "CTV", roles: "Kỹ thuật truyền thông", unit: "Bí thư Chi Đoàn KP34" },
  ];

  try {
    for (const item of seedData) {
      // Find user matching name partially
      const user = await prisma.user.findFirst({
        where: {
          name: {
            contains: item.name,
            mode: 'insensitive'
          }
        }
      });

      if (user) {
        // Only update if properties are unpopulated or default to preserve modifications
        const shouldUpdate = 
          !user.phone || 
          !user.roles || 
          !user.unit ||
          (user.position === "Thành viên" && item.position !== "Thành viên");

        if (shouldUpdate) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              phone: user.phone || item.phone || null,
              position: user.position === "Thành viên" ? item.position : user.position,
              roles: user.roles || item.roles,
              unit: user.unit || item.unit
            }
          });
        }
      }
    }
  } catch (err) {
    console.error("Lỗi seeding đội hình:", err);
  }
}

export default async function TeamRosterPage() {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser) return redirect("/login");

  // Sync active user
  const currentUser = await syncUser(supabaseUser);

  // Trigger auto seed for users in database
  await initializeTeamData();

  // Fetch all users along with completed tasks with evaluations
  const members = await prisma.user.findMany({
    include: {
      tasks: {
        where: { status: "DONE" },
        orderBy: { completedAt: "desc" },
        select: {
          id: true,
          title: true,
          priority: true,
          completedAt: true,
          evaluationNotes: true,
        }
      }
    },
    orderBy: [
      { role: "asc" },
      { name: "asc" }
    ]
  });

  return (
    <TeamPageClient 
      initialMembers={members as any} 
      currentUser={currentUser || supabaseUser} 
    />
  );
}
