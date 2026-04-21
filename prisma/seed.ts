import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. Tạo Pool (Phòng ban chung)
  const defaultPool = await prisma.pool.upsert({
    where: { id: 'pool-cdsch' },
    update: {},
    create: {
      id: 'pool-cdsch',
      name: 'Ban Truyền thông CĐS Chánh Hưng',
    },
  })

  // 2. Tạo User giả
  const longNguyen = await prisma.user.upsert({
    where: { email: 'long@chanhhung.vn' },
    update: {},
    create: {
      id: 'mock-auth-id-long',
      email: 'long@chanhhung.vn',
      name: 'Long Nguyễn',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKCH4lQt2pvvhQXMd70g14EuX1-tYMIcHwrV2xfedZPJ6CpUttSm9R60bizWt59xXlpI2lWqqzfyh4TcnCXuWElYCgU4d3Vm-LNPz1sU-S6WPtDbAMeD2I8I0eHaC1MWNxA1TuDJRmnYQGn2mlEgRgMaLeB2ZVa-_DCZGAGgHFSuXRKQGubypmXAYirHOTPNmBJJo8C_N8TWJOytWH5WZDxsH3PL6SYRlI2RiUKmNAiP0gTC1ei2LWi6f2dthS1QimlvGHHqQNsIs',
      poolId: defaultPool.id,
    },
  })

  const minhAnh = await prisma.user.upsert({
    where: { email: 'minhanh@chanhhung.vn' },
    update: {},
    create: {
      id: 'mock-auth-id-ma',
      email: 'minhanh@chanhhung.vn',
      name: 'Minh Anh',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnYTt_t1Kolr8leF0gB7-_OvPdNWMMT_43TGjzG3XPG9mrYYZiL447xd5wuPWn4HonyWC6unqdcFPZd1PlDGfWjYLF1Hs1A-0U4MIvQyzcKmMwfvgoDM7MnZCdjm9Q1eG2Ax-KFlUeA0CCjpR4OnZkLSuNELeIJjpEp2KE59uJ7lnMd8_VHLr5dkRWZbucxec2h8h4FK7cSsin-Mk4wKJr1HynGrwQETa0Ik2rXxLki3iJLVaKhDTdD9TpR0tZ2uMCjkLm3-57sYc',
      poolId: defaultPool.id,
    },
  })

  // 3. Tạo Tasks
  await prisma.task.create({
    data: {
      title: 'Thiết kế banner sự kiện khai giảng',
      status: 'TODO',
      priority: 'HIGH',
      poolId: defaultPool.id,
      assigneeId: longNguyen.id,
    }
  })

  await prisma.task.create({
    data: {
      title: 'Viết bài PR trên báo sinh viên',
      status: 'TODO',
      priority: 'MEDIUM',
      poolId: defaultPool.id,
      assigneeId: minhAnh.id,
    }
  })

  await prisma.task.create({
    data: {
      title: 'Dựng clip TikTok phỏng vấn',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      poolId: defaultPool.id,
      assigneeId: longNguyen.id,
    }
  })

  await prisma.task.create({
    data: {
      title: 'Lên ý tưởng concept chụp ảnh ban',
      status: 'DONE',
      priority: 'LOW',
      poolId: defaultPool.id,
      assigneeId: minhAnh.id,
    }
  })

  await prisma.task.create({
    data: {
      title: 'Khảo sát nền tảng CMS',
      status: 'DONE',
      priority: 'MEDIUM',
      poolId: defaultPool.id,
      assigneeId: longNguyen.id,
    }
  })

  console.log('Seed dữ liệu mẫu thành công! 🎉')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
