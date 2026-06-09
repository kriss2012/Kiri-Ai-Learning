import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const lesson = await prisma.lesson.findFirst({
    where: { slug: "generative-vs-discriminative" },
    select: { id: true, contentUrl: true, updatedAt: true },
  });
  console.log("DB record:", JSON.stringify(lesson, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
