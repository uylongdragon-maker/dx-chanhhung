import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrate() {
  console.log("Migrating IN_PROGRESS tasks to DOING...");
  const result = await prisma.task.updateMany({
    where: { status: "IN_PROGRESS" },
    data: { status: "DOING" },
  });
  console.log(`Success! Updated ${result.count} tasks.`);
}

migrate()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
