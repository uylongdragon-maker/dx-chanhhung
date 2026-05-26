const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to Database...");
  
  for (let i = 1; i <= 5; i++) {
    const start = Date.now();
    try {
      const count = await prisma.task.count();
      const end = Date.now();
      console.log(`Run ${i}: count = ${count}, time = ${end - start}ms`);
    } catch (err) {
      console.error(`Run ${i} error:`, err);
    }
  }
  
  await prisma.$disconnect();
}

main();
