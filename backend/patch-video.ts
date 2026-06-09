import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const lessons = await prisma.lesson.findMany({
    where: { contentType: "video" },
    select: { id: true, title: true, contentUrl: true },
  });
  lessons.forEach(l => console.log(l.title, "->", l.contentUrl));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
