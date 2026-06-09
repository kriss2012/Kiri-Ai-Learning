import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Clean existing data
  await prisma.certificateAuditLog.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.courseCompletion.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.job.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sponsor.deleteMany();

  // 2. Create Instructor
  const instructor = await prisma.user.create({
    data: {
      firebaseUid: "firebase-mock-instructor-uid-123",
      email: "dr.ramesh@kiriapp.com",
      displayName: "Dr. Ramesh Kumar",
      userType: "educator",
      college: "PICT Pune",
      city: "Pune",
      emailVerified: true,
    },
  });
  console.log(`👤 Instructor created: ${instructor.displayName}`);

  // 3. Create a Sponsor
  const sponsor = await prisma.sponsor.create({
    data: {
      name: "TechCorp India",
      logoUrl: "https://cdn.kiriapp.com/sponsors/techcorp.png",
      websiteUrl: "https://techcorp.in",
      description: "Empowering young developers with state of the art skills.",
      tier: "gold",
    },
  });
  console.log(`🏢 Sponsor created: ${sponsor.name}`);

  // 4. Create Course: Prompt Engineering Masterclass
  const coursePrompt = await prisma.course.create({
    data: {
      title: "Prompt Engineering Masterclass",
      slug: "prompt-engineering-masterclass",
      description: "Learn how to write effective prompts to unlock the potential of LLMs like ChatGPT, Claude, and Gemini. Master advanced prompt patterns, few-shot learning, and agents.",
      shortDescription: "Master the art of speaking to AI. Learn prompting techniques to automate coding, writing, and analytical workflows.",
      category: "generative_ai",
      subCategory: "Prompt Engineering",
      level: "intermediate",
      durationHours: 4.0,
      thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
      instructorId: instructor.id,
      minPassScore: 70,
      status: "published",
      publishedAt: new Date(),
      sponsors: {
        connect: { id: sponsor.id },
      },
    },
  });
  console.log(`📚 Course created: ${coursePrompt.title}`);

  // Module 1 of Prompt Course
  const module1Prompt = await prisma.module.create({
    data: {
      courseId: coursePrompt.id,
      title: "Foundations of Prompting",
      order: 1,
    },
  });

  // Lessons for Module 1
  const l1 = await prisma.lesson.create({
    data: {
      courseId: coursePrompt.id,
      moduleId: module1Prompt.id,
      title: "Introduction to Large Language Models",
      slug: "intro-to-llms",
      contentType: "video",
      contentUrl: "https://www.youtube.com/watch?v=zjkBMFhNj_g",
      durationSeconds: 300,
      order: 1,
    },
  });

  const l2 = await prisma.lesson.create({
    data: {
      courseId: coursePrompt.id,
      moduleId: module1Prompt.id,
      title: "Basic Prompting Components: Instruction, Context, Input, Output",
      slug: "basic-prompting-components",
      contentType: "reading",
      textContent: `### The 4 Pillars of a Prompt
      
A perfect prompt consists of these components:
1. **Instruction**: A specific task or action you want the model to perform.
2. **Context**: External information or background details that guide the model.
3. **Input Data**: The input or question we are interested to get a response for.
4. **Output Indicator**: The type or format of the output (e.g., JSON, bullet list).`,
      durationSeconds: 400,
      order: 2,
    },
  });

  // Module 1 Quiz
  const quiz1 = await prisma.quiz.create({
    data: {
      courseId: coursePrompt.id,
      moduleId: module1Prompt.id,
      title: "Basics of Prompting Quiz",
      isFinal: false,
      timeLimitMinutes: 10,
    },
  });

  await prisma.question.createMany({
    data: [
      {
        quizId: quiz1.id,
        text: "Which of the following is NOT one of the four main components of a prompt?",
        type: "single_choice",
        optionsJson: JSON.stringify([
          "Instruction",
          "Context",
          "API Token",
          "Output Indicator"
        ]),
        correctAnswerJson: JSON.stringify("API Token"),
        explanation: "API Token is used for backend authentication, not inside prompt structures.",
      },
      {
        quizId: quiz1.id,
        text: "Adding background context helps the LLM narrow its response scope.",
        type: "true_false",
        optionsJson: JSON.stringify(["True", "False"]),
        correctAnswerJson: JSON.stringify("True"),
        explanation: "Context grounds the LLM in specific facts and reduces hallucinations.",
      }
    ],
  });

  // Module 2 of Prompt Course (Final Module + Final Exam)
  const module2Prompt = await prisma.module.create({
    data: {
      courseId: coursePrompt.id,
      title: "Advanced Prompting Patterns",
      order: 2,
    },
  });

  const l3 = await prisma.lesson.create({
    data: {
      courseId: coursePrompt.id,
      moduleId: module2Prompt.id,
      title: "Few-Shot vs Zero-Shot Prompting",
      slug: "few-shot-vs-zero-shot",
      contentType: "video",
      contentUrl: "https://www.youtube.com/watch?v=jC4v5AS4YSg",
      durationSeconds: 450,
      order: 1,
    },
  });

  // Final Course Assessment Quiz
  const finalQuiz = await prisma.quiz.create({
    data: {
      courseId: coursePrompt.id,
      title: "Prompt Engineering Final Assessment",
      isFinal: true,
      timeLimitMinutes: 20,
    },
  });

  await prisma.question.createMany({
    data: [
      {
        quizId: finalQuiz.id,
        text: "What prompting technique asks the model to output its intermediate reasoning steps?",
        type: "single_choice",
        optionsJson: JSON.stringify([
          "Zero-Shot prompting",
          "Chain-of-Thought prompting",
          "Few-shot prompting",
          "System prompting"
        ]),
        correctAnswerJson: JSON.stringify("Chain-of-Thought prompting"),
        explanation: "Chain-of-Thought (CoT) prompting enables LLMs to decompose complex problems into multi-step reasoning.",
      },
      {
        quizId: finalQuiz.id,
        text: "Which technique is best for instructing an AI model to format its output exactly as valid JSON?",
        type: "single_choice",
        optionsJson: JSON.stringify([
          "Providing a few examples showing JSON format (Few-shot)",
          "Typing 'make JSON'",
          "Writing in capital letters",
          "Using a negative prompt"
        ]),
        correctAnswerJson: JSON.stringify("Providing a few examples showing JSON format (Few-shot)"),
        explanation: "Providing structural examples (Few-shot) or a schema definition is the most reliable way to enforce formatting.",
      }
    ],
  });


  // 5. Create Course: Resume & LinkedIn Mastery
  const courseResume = await prisma.course.create({
    data: {
      title: "Resume & LinkedIn Mastery",
      slug: "resume-linkedin-mastery",
      description: "Build an ATS-compliant resume and a highly discoverable LinkedIn profile to secure internships and placement interviews in tech and business domains.",
      shortDescription: "Craft a standout resume and optimize your LinkedIn presence to attract top recruiters.",
      category: "employability",
      subCategory: "Resume Building",
      level: "beginner",
      durationHours: 2.0,
      thumbnailUrl: "https://images.unsplash.com/photo-1586281380349-632531db7ed4",
      instructorId: instructor.id,
      minPassScore: 70,
      status: "published",
      publishedAt: new Date(),
    },
  });
  console.log(`📚 Course created: ${courseResume.title}`);

  // Module 1 for Resume
  const moduleResume1 = await prisma.module.create({
    data: {
      courseId: courseResume.id,
      title: "ATS Resume Secrets",
      order: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      courseId: courseResume.id,
      moduleId: moduleResume1.id,
      title: "What is an ATS and How it Filters Resumes",
      slug: "what-is-ats",
      contentType: "video",
      contentUrl: "https://www.youtube.com/watch?v=Tt08ipM5JzE",
      durationSeconds: 240,
      order: 1,
    },
  });

  const resumeFinalQuiz = await prisma.quiz.create({
    data: {
      courseId: courseResume.id,
      title: "Resume & LinkedIn Final Assessment",
      isFinal: true,
      timeLimitMinutes: 15,
    },
  });

  await prisma.question.create({
    data: {
      quizId: resumeFinalQuiz.id,
      text: "What does ATS stand for in hiring terminology?",
      type: "single_choice",
      optionsJson: JSON.stringify([
        "Applicant Tracking System",
        "Applied Tech Support",
        "Assessment Tracking Software",
        "Automated Talent Search"
      ]),
      correctAnswerJson: JSON.stringify("Applicant Tracking System"),
      explanation: "ATS stands for Applicant Tracking System, which scans and sorts applications.",
    },
  });

  // Create Jobs associated with the courses
  const job1 = await prisma.job.create({
    data: {
      title: "Generative AI Prompt Engineer Intern",
      companyName: "TechCorp India",
      logoUrl: "https://cdn.kiriapp.com/sponsors/techcorp.png",
      requiredCourseId: coursePrompt.id,
      salaryRange: "INR 25,000 - 35,000 / month",
      location: "Remote / Pune",
      description: "Design, evaluate, and refine prompt architectures to drive LLM integrations in our core enterprise products. Requires a verified Prompt Engineering Masterclass certificate from Kiri AI Learning.",
    },
  });
  console.log(`💼 Job created: ${job1.title}`);

  const job2 = await prisma.job.create({
    data: {
      title: "Associate Career Consultant",
      companyName: "Startup Hub",
      requiredCourseId: courseResume.id,
      salaryRange: "INR 30,000 - 45,000 / month",
      location: "Remote",
      description: "Provide expert guidance on career preparation, review applicant resumes, and help students optimize their LinkedIn profiles. Requires a verified Resume & LinkedIn Mastery certificate.",
    },
  });
  console.log(`💼 Job created: ${job2.title}`);

  console.log("🌱 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error while seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
