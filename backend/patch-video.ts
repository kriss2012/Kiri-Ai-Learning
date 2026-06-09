import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.lesson.updateMany({
    where: { contentUrl: { contains: "8L4mR2xVz9A" } },
    data: { contentUrl: "https://www.youtube.com/watch?v=G2ef2434-P4" },
  });
  console.log("Updated lessons:", result.count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
