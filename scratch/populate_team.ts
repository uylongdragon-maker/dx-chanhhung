import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const teamMembers = [
  { name: "Phạm Như Quỳnh", unit: "Bí thư chi Đoàn KP29", role: "Nội dung", email: "quynh.pn@chanhhung.vn" },
  { name: "Đỗ Nguyễn Thanh Trúc", unit: "Đoàn viên chi Đoàn KP23", role: "Nội dung", email: "truc.dnt@chanhhung.vn" },
  { name: "Abdul Kariem", unit: "Bí thư chi đoàn KP23", role: "Thiết kế", email: "kariem.a@chanhhung.vn" },
  { name: "Lê Ngọc Anh Thư", unit: "bí thư chi đoàn KP18", role: "Nội dung", email: "thu.lna@chanhhung.vn" },
  { name: "Nguyễn Thị Kim Tuyền", unit: "bí thư chi đoàn KP22", role: "Nội dung", email: "tuyen.ntk@chanhhung.vn" },
  { name: "Thạnh Bảo Minh", unit: "Bí thư chi đoàn KP11", role: "Quay- dựng", email: "minh.tb@chanhhung.vn" },
  { name: "Lê Thị Thái Phụng", unit: "Bí thư chi đoàn KP60", role: "Hậu cần - Nội dung", email: "phung.ltt@chanhhung.vn" },
  { name: "Trương Ngọc Thanh Vân", unit: "Bí Thư Chi Đoàn KP13", role: "Quay- dựng", email: "van.tnt@chanhhung.vn" },
  { name: "Trương Thị Minh Anh", unit: "Bí thư Chi Đoàn KP24", role: "Quay- dựng", email: "anh.ttm@chanhhung.vn" },
  { name: "Châu Thị Lan Anh", unit: "Bí thư Chi Đoàn KP20", role: "Nội dung", email: "anh.ctl@chanhhung.vn" },
  { name: "Huỳnh Quang Minh", unit: "Bí thư Chi Đoàn KP1", role: "Quay- dựng", email: "minh.hq@chanhhung.vn" },
  { name: "Phan Minh Khang", unit: "Bí thư Chi Đoàn KP81", role: "Quay- dựng", email: "khang.pm@chanhhung.vn" },
  { name: "Nguyễn Hà Quỳnh Như", unit: "Bí thư Chi Đoàn KP44", role: "Hậu cần - Kỹ thuật", email: "nhu.nhq@chanhhung.vn" },
]

async function main() {
  const poolId = "pool-cdsch" // ID from seed.ts

  for (const member of teamMembers) {
    await prisma.user.upsert({
      where: { email: member.email },
      update: {
        name: member.name,
        unit: member.unit,
        role: member.role,
      },
      create: {
        id: `user-${member.email.split('@')[0]}`, // Placeholder ID for mock testing
        email: member.email,
        name: member.name,
        unit: member.unit,
        role: member.role,
        poolId: poolId,
      },
    })
  }

  console.log(`Successfully populated ${teamMembers.length} team members. 🎉`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
