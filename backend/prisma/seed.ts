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


  // 6. Create Course: Introduction to Generative AI
  const courseIntroAI = await prisma.course.create({
    data: {
      title: "Introduction to Generative AI",
      slug: "intro-to-generative-ai",
      description: "Learn the foundational concepts of generative artificial intelligence, neural networks, large language models, and how to use them responsibly in your everyday projects.",
      shortDescription: "An introductory course to the concepts and structures behind generative AI models.",
      category: "generative_ai",
      subCategory: "AI Basics",
      level: "beginner",
      durationHours: 1.5,
      thumbnailUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485",
      instructorId: instructor.id,
      minPassScore: 70,
      status: "published",
      publishedAt: new Date(),
    },
  });
  console.log(`📚 Course created: ${courseIntroAI.title}`);

  // Module for Intro to GenAI
  const moduleIntroAI = await prisma.module.create({
    data: {
      courseId: courseIntroAI.id,
      title: "GenAI Foundations",
      order: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      courseId: courseIntroAI.id,
      moduleId: moduleIntroAI.id,
      title: "Generative AI vs. Discriminative AI",
      slug: "generative-vs-discriminative",
      contentType: "video",
      contentUrl: "https://www.youtube.com/watch?v=hfIUstzHs9o",
      durationSeconds: 180,
      order: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      courseId: courseIntroAI.id,
      moduleId: moduleIntroAI.id,
      title: "How Large Language Models Work",
      slug: "how-llms-work",
      contentType: "reading",
      textContent: `### The Backbone of GenAI: Transformers
      
Modern text generation models like GPT, Claude, and Gemini rely on an architecture called the **Transformer**.
Introduced in the 2017 paper "Attention Is All You Need", transformers use self-attention mechanisms to process sequence data.

Key ideas:
- **Tokenization**: Converting text into numbers/tokens.
- **Embeddings**: Representing words in a high-dimensional vector space.
- **Attention**: Dynamically weighting different parts of the input to generate the next token.`,
      durationSeconds: 300,
      order: 2,
    },
  });

  const introAIFinalQuiz = await prisma.quiz.create({
    data: {
      courseId: courseIntroAI.id,
      title: "Introduction to Generative AI Final Assessment",
      isFinal: true,
      timeLimitMinutes: 10,
    },
  });

  await prisma.question.createMany({
    data: [
      {
        quizId: introAIFinalQuiz.id,
        text: "What is generative AI?",
        type: "single_choice",
        optionsJson: JSON.stringify([
          "AI that generates new content based on patterns",
          "AI that only classifies existing data",
          "AI that performs physical automation only",
          "AI that cannot adapt to new training datasets"
        ]),
        correctAnswerJson: JSON.stringify("AI that generates new content based on patterns"),
        explanation: "Generative AI models learn the underlying patterns of data to generate brand new, realistic content.",
      },
      {
        quizId: introAIFinalQuiz.id,
        text: "Which model architecture is the foundation for ChatGPT and other modern LLMs?",
        type: "single_choice",
        optionsJson: JSON.stringify([
          "Convolutional Neural Network (CNN)",
          "Transformer",
          "Recurrent Neural Network (RNN)",
          "Support Vector Machine (SVM)"
        ]),
        correctAnswerJson: JSON.stringify("Transformer"),
        explanation: "Transformer architectures, utilizing self-attention, are the backbone of modern LLMs.",
      }
    ],
  });


  // 7. Create Course: Python for AI Beginners
  const coursePython = await prisma.course.create({
    data: {
      title: "Python for AI Beginners",
      slug: "python-for-ai-beginners",
      description: "Kickstart your programming journey with Python. Learn variables, data structures, loops, functions, and key libraries like NumPy and Pandas used in artificial intelligence.",
      shortDescription: "Learn the fundamentals of Python programming tailored for data analysis and AI applications.",
      category: "generative_ai",
      subCategory: "Programming",
      level: "beginner",
      durationHours: 5.0,
      thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5",
      instructorId: instructor.id,
      minPassScore: 70,
      status: "published",
      publishedAt: new Date(),
    },
  });
  console.log(`📚 Course created: ${coursePython.title}`);

  const modulePython1 = await prisma.module.create({
    data: {
      courseId: coursePython.id,
      title: "Python Syntax & Basics",
      order: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      courseId: coursePython.id,
      moduleId: modulePython1.id,
      title: "Why Python is the Language of AI",
      slug: "why-python-for-ai",
      contentType: "video",
      contentUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw",
      durationSeconds: 420,
      order: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      courseId: coursePython.id,
      moduleId: modulePython1.id,
      title: "Understanding Lists, Dictionaries, and Tuples",
      slug: "python-data-structures",
      contentType: "reading",
      textContent: `### Key Python Collections

Python provides robust built-in structures to manage lists of data:

1. **Lists**: Mutable, ordered sequences.
   \`\`\`python
   skills = ["Prompting", "Python", "SQL"]
   skills.append("Git")
   \`\`\`
2. **Dictionaries**: Key-value pairs.
   \`\`\`python
   student = {"name": "Aman", "score": 85}
   print(student["name"])
   \`\`\`
3. **Tuples**: Immutable, ordered sequences.
   \`\`\`python
   dimensions = (1920, 1080)
   \`\`\` `,
      durationSeconds: 600,
      order: 2,
    },
  });

  const pythonFinalQuiz = await prisma.quiz.create({
    data: {
      courseId: coursePython.id,
      title: "Python for AI Beginners Final Assessment",
      isFinal: true,
      timeLimitMinutes: 15,
    },
  });

  await prisma.question.createMany({
    data: [
      {
        quizId: pythonFinalQuiz.id,
        text: "Which Python data structure is mutable and defined with square brackets?",
        type: "single_choice",
        optionsJson: JSON.stringify([
          "List",
          "Tuple",
          "Set",
          "Dictionary"
        ]),
        correctAnswerJson: JSON.stringify("List"),
        explanation: "Lists are created using square brackets [ ] and can be modified (mutable).",
      },
      {
        quizId: pythonFinalQuiz.id,
        text: "What does the append() method do to a list?",
        type: "single_choice",
        optionsJson: JSON.stringify([
          "Adds an item to the end of the list",
          "Removes the last item",
          "Sorts the list alphabetically",
          "Creates a copy of the list"
        ]),
        correctAnswerJson: JSON.stringify("Adds an item to the end of the list"),
        explanation: "The append() method appends an element to the very end of an existing list.",
      }
    ],
  });


  // 8. Create Course: Communication Skills for Tech
  const courseComm = await prisma.course.create({
    data: {
      title: "Communication Skills & Soft Skills",
      slug: "communication-skills-for-tech",
      description: "Learn how to communicate technical concepts clearly, structure persuasive presentations, handle professional emails, and collaborate effectively in engineering teams.",
      shortDescription: "Develop essential soft skills, clear professional writing, and confident presentation strategies for tech environments.",
      category: "employability",
      subCategory: "Soft Skills",
      level: "beginner",
      durationHours: 3.0,
      thumbnailUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0",
      instructorId: instructor.id,
      minPassScore: 70,
      status: "published",
      publishedAt: new Date(),
    },
  });
  console.log(`📚 Course created: ${courseComm.title}`);

  const moduleComm1 = await prisma.module.create({
    data: {
      courseId: courseComm.id,
      title: "Clear Professional Communication",
      order: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      courseId: courseComm.id,
      moduleId: moduleComm1.id,
      title: "The Art of Active Listening in Teams",
      slug: "art-of-active-listening",
      contentType: "video",
      contentUrl: "https://www.youtube.com/watch?v=gCfzeONu3Mo",
      durationSeconds: 300,
      order: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      courseId: courseComm.id,
      moduleId: moduleComm1.id,
      title: "Email and Slack Etiquette",
      slug: "professional-slack-etiquette",
      contentType: "reading",
      textContent: `### Professional Writing Best Practices

In a distributed tech environment, written messages on Slack, Teams, or Email represent your work ethic:

1. **Be Direct & Concise**: Put the main action item or question in the very first 1-2 sentences.
2. **Use Clear Headers & Bullet Points**: Avoid walls of text.
3. **Keep Tone Constructive**: Avoid all-caps or ambiguous punctuation that could sound aggressive.
4. **State Deadline and Context**: Tell people when you need help and provide logs or code references.`,
      durationSeconds: 400,
      order: 2,
    },
  });

  const commFinalQuiz = await prisma.quiz.create({
    data: {
      courseId: courseComm.id,
      title: "Communication & Soft Skills Final Assessment",
      isFinal: true,
      timeLimitMinutes: 12,
    },
  });

  await prisma.question.createMany({
    data: [
      {
        quizId: commFinalQuiz.id,
        text: "What is a core practice of active listening?",
        type: "single_choice",
        optionsJson: JSON.stringify([
          "Formulating your rebuttal while the other person is speaking",
          "Clarifying, summarizing, and reflecting back what you heard",
          "Multitasking on code or writing notes continuously",
          "Nodding without actually processing the speaker's points"
        ]),
        correctAnswerJson: JSON.stringify("Clarifying, summarizing, and reflecting back what you heard"),
        explanation: "Active listening requires concentrating on the speaker, understanding, and validating their message.",
      },
      {
        quizId: commFinalQuiz.id,
        text: "Constructive feedback should be focused on behavior and actions, not character traits.",
        type: "true_false",
        optionsJson: JSON.stringify(["True", "False"]),
        correctAnswerJson: JSON.stringify("True"),
        explanation: "Feedback is most effective when it targets objective, changeable actions rather than personal traits.",
      }
    ],
  });


  // 9. Create Course: Resume & LinkedIn Mastery
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
