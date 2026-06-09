import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const lessons = await prisma.lesson.findMany({
    where: { slug: "generative-vs-discriminative" },
    select: { id: true, contentUrl: true, moduleId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  console.log("All records:", JSON.stringify(lessons, null, 2));

  if (lessons.length > 1) {
    // Delete the old one (first created), keep the latest
    const toDelete = lessons.slice(0, lessons.length - 1).map(l => l.id);
    const deleted = await prisma.lesson.deleteMany({ where: { id: { in: toDelete } } });
    console.log("Deleted old duplicates:", deleted.count);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
