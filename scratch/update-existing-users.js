const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting to update existing users...");
  try {
    const result = await prisma.user.updateMany({
      data: {
        isOnboarded: true,
      },
    });
    console.log(`Successfully updated ${result.count} existing users to isOnboarded: true! 🎉`);
  } catch (error) {
    console.error("Error updating users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
