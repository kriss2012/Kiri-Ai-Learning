import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Fix "Generative AI vs. Discriminative AI" video
  const r1 = await prisma.lesson.updateMany({
    where: { slug: "generative-vs-discriminative" },
    data: { contentUrl: "https://www.youtube.com/watch?v=G2ef2434-P4" },
  });
  console.log("generative-vs-discriminative updated:", r1.count);

  // Fix "Few-Shot vs Zero-Shot Prompting" video
  const r2 = await prisma.lesson.updateMany({
    where: { slug: "few-shot-vs-zero-shot" },
    data: { contentUrl: "https://www.youtube.com/watch?v=_ZvnD73m40o" },
  });
  console.log("few-shot-vs-zero-shot updated:", r2.count);

  // Fix "ATS" video
  const r3 = await prisma.lesson.updateMany({
    where: { slug: "what-is-ats" },
    data: { contentUrl: "https://www.youtube.com/watch?v=0XyHMkjc1m0" },
  });
  console.log("what-is-ats updated:", r3.count);

  // Show all video lessons
  const all = await prisma.lesson.findMany({
    where: { contentType: "video" },
    select: { slug: true, contentUrl: true },
  });
  all.forEach(l => console.log("  ->", l.slug, l.contentUrl));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
