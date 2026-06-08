# 📘 Kiri AI Learning Platform — Product Requirements Document (PRD)

**Document Version:** 1.0.0
**Platform Name:** Kiri AI Learning (`kiri-ai-learning`)
**Parent Ecosystem:** Kiri App — Student Development Platform
**Repository:** https://github.com/kriss2012/KiriApp
**Document Date:** June 2026
**Status:** Draft — Ready for Engineering Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vision & Mission](#2-vision--mission)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Target Audience](#4-target-audience)
5. [System Architecture Overview](#5-system-architecture-overview)
6. [KiriApp Integration (SSO & Ecosystem)](#6-kiriapp-integration-sso--ecosystem)
7. [User Roles & Permissions](#7-user-roles--permissions)
8. [Authentication & Account Management](#8-authentication--account-management)
9. [Course Management System](#9-course-management-system)
10. [Course Catalog — GenAI & Employability](#10-course-catalog--genai--employability)
11. [Learning Experience Engine](#11-learning-experience-engine)
12. [Assessment & Quiz Engine](#12-assessment--quiz-engine)
13. [Certificate Generation System](#13-certificate-generation-system)
14. [QR Code Verification System](#14-qr-code-verification-system)
15. [Certificate Verification Web Page](#15-certificate-verification-web-page)
16. [Sponsor Management Module](#16-sponsor-management-module)
17. [Admin Dashboard](#17-admin-dashboard)
18. [Progress Tracking & Analytics](#18-progress-tracking--analytics)
19. [Notification System](#19-notification-system)
20. [Security Requirements](#20-security-requirements)
21. [API Design & KiriApp REST Contracts](#21-api-design--kiriapp-rest-contracts)
22. [Database Schema](#22-database-schema)
23. [UI/UX Requirements](#23-uiux-requirements)
24. [Non-Functional Requirements](#24-non-functional-requirements)
25. [Infrastructure & Deployment](#25-infrastructure--deployment)
26. [Testing Requirements](#26-testing-requirements)
27. [Future Roadmap](#27-future-roadmap)
28. [Appendix — Certificate Field Specification](#28-appendix--certificate-field-specification)

---

## 1. Executive Summary

Kiri AI Learning is a **free, certificate-granting eLearning platform** built as a dedicated sub-product of the Kiri App ecosystem. Inspired by the model of LinkedIn Learning, it delivers structured, high-quality online courses focused on **Generative AI** and **Employability Development** — two of the highest-demand skill areas for students, founders, and early-career professionals in India and beyond.

Every learner who completes a course receives a **digitally signed, tamper-proof certificate** embedded with a **unique QR code**. Scanning the QR code opens a live verification page on the Kiri AI Learning website that displays full completion details, course metadata, sponsor logos, and the learner's credential — allowing employers, institutions, and peers to instantly verify authenticity.

The platform integrates deeply with the **existing KiriApp Android ecosystem** (Kotlin + Firebase stack), using shared authentication, unified user profiles, and cross-platform notifications, while also operating as a standalone web platform accessible via browser.

---

## 2. Vision & Mission

**Vision:**
To become India's most trusted free learning platform for AI literacy and career readiness, empowering students, founders, and early-career professionals with verifiable, employer-recognized credentials.

**Mission:**
Deliver free, structured, world-class courses on Generative AI and Employability that are accessible to any student with a Kiri account, and back every certificate with a publicly verifiable, QR-authenticated credential that earns trust with employers, investors, and institutions.

---

## 3. Goals & Success Metrics

### 3.1 Product Goals

| # | Goal | Description |
|---|------|-------------|
| G1 | Free Access | All courses are 100% free. No paywalls, no premium tiers for learners |
| G2 | Verified Credentials | Every certificate is cryptographically signed and QR-verifiable |
| G3 | Ecosystem Integration | Single sign-on (SSO) with existing KiriApp accounts |
| G4 | Course Quality | Structured curriculum with quizzes, projects, and assessments |
| G5 | Security First | End-to-end secure architecture with anti-fraud certificate controls |
| G6 | Sponsor Visibility | Proper sponsor branding on certificates and course pages |

### 3.2 Key Success Metrics (KPIs)

| Metric | Target (6 months post-launch) |
|--------|-------------------------------|
| Registered Learners | 10,000+ |
| Courses Published | 20+ |
| Certificates Issued | 5,000+ |
| Course Completion Rate | ≥ 60% |
| Certificate Verification Scans | 2,000+/month |
| NPS Score | ≥ 50 |
| Platform Uptime | ≥ 99.5% |

---

## 4. Target Audience

### 4.1 Primary Users

**Students**
- College and university students (UG/PG level)
- Students preparing for placements or internships
- Students exploring AI/tech as a career path

**Founders & Entrepreneurs**
- Early-stage startup founders looking to leverage GenAI
- Non-technical founders who want AI literacy without coding depth
- Innovation lab and incubator participants

**Early-Career Professionals**
- Fresh graduates entering the job market
- Career switchers upskilling into AI/tech domains

### 4.2 Secondary Users

- **Faculty & Educators** — recommend courses to students, track cohort progress
- **Placement Coordinators** — use verified certificates in placement drives
- **Sponsors & Partners** — companies/organizations funding course creation
- **Platform Admins** — manage content, users, certificates, sponsors

### 4.3 Persona Summary

| Persona | Name | Age | Goal | Pain Point |
|---------|------|-----|------|------------|
| Engineering Student | Priya | 20 | Build an AI portfolio for placements | No free, credible AI courses in India |
| Startup Founder | Arjun | 24 | Use AI tools to grow his startup | Doesn't know where to start with GenAI |
| MBA Graduate | Sneha | 23 | Add AI skills to her resume | Paid courses are too expensive |
| College Faculty | Dr. Ramesh | 38 | Recommend structured AI courses | No platform designed for Indian students |

---

## 5. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        KIRI AI LEARNING PLATFORM                    │
│                                                                     │
│  ┌──────────────┐   ┌──────────────────┐   ┌────────────────────┐  │
│  │  WEB PORTAL  │   │  KIRIAPP ANDROID  │   │ CERTIFICATE VERIFY │  │
│  │  (Next.js)   │   │  (Kotlin + XML)   │   │  PAGE (Public URL) │  │
│  └──────┬───────┘   └────────┬─────────┘   └────────┬───────────┘  │
│         │                    │                        │             │
│  ┌──────▼────────────────────▼────────────────────────▼──────────┐ │
│  │                     API GATEWAY (REST / GraphQL)               │ │
│  │                    Auth Middleware + Rate Limiting              │ │
│  └──────────────────────────┬──────────────────────────────────┘  │
│                              │                                      │
│  ┌───────────────────────────▼────────────────────────────────┐   │
│  │                     BACKEND SERVICES                        │   │
│  │                                                             │   │
│  │  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────┐ │   │
│  │  │ Auth Service│ │Course Service│ │ Certificate Service  │ │   │
│  │  └─────────────┘ └──────────────┘ └─────────────────────┘ │   │
│  │  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────┐ │   │
│  │  │ User Service│ │ Quiz Service │ │  QR + Verify Service │ │   │
│  │  └─────────────┘ └──────────────┘ └─────────────────────┘ │   │
│  │  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────┐ │   │
│  │  │Admin Service│ │Notif. Service│ │   Sponsor Service    │ │   │
│  │  └─────────────┘ └──────────────┘ └─────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────────┐  │
│  │  Firebase    │  │  PostgreSQL   │  │  Firebase Storage /    │  │
│  │  Auth (SSO)  │  │  (Platform DB)│  │  CDN (Videos, PDFs)    │  │
│  └──────────────┘  └───────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.1 Technology Stack

#### Web Frontend
| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| State Management | Zustand / React Query |
| Video Player | Video.js or custom HTML5 |
| QR Code Rendering | `qrcode.react` |
| Certificate PDF | `react-pdf` + Puppeteer (server-side) |
| Animations | Framer Motion |

#### Backend
| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ (TypeScript) |
| Framework | Express.js / Fastify |
| ORM | Prisma |
| Primary Database | PostgreSQL 15+ |
| Cache | Redis |
| File Storage | Firebase Storage (existing) + Cloudflare R2 |
| Background Jobs | BullMQ (Redis) |
| Certificate Signing | Node.js crypto (RSA-2048) |
| Email | Resend or Nodemailer (SMTP) |

#### KiriApp Android Integration
| Layer | Technology |
|-------|------------|
| Language | Kotlin (existing) |
| Auth Bridge | Firebase Auth (shared UID) |
| API Communication | Retrofit (existing) |
| Deep Links | Android App Links |
| Notifications | Firebase Cloud Messaging (existing) |

#### Infrastructure
| Layer | Technology |
|-------|------------|
| Hosting | Render.com (existing in repo) / Vercel |
| CI/CD | GitHub Actions |
| Containerization | Docker (Dockerfile exists in repo) |
| Monitoring | Sentry + Uptime Robot |
| SSL | Let's Encrypt / Cloudflare |

---

## 6. KiriApp Integration (SSO & Ecosystem)

Kiri AI Learning is **not a standalone silo** — it is a fully integrated module of the Kiri ecosystem. Learners use their existing KiriApp accounts to access the learning platform with zero friction.

### 6.1 Single Sign-On (SSO) Flow

```
KiriApp User (Firebase UID)
        │
        ▼
   Firebase Auth Token  ──────►  Kiri AI Learning Backend
        │                              │
        │                       Verify Firebase Token
        │                              │
        │                       Create / Sync Learning Profile
        │                              │
        ▼                              ▼
   User enters Learning          JWT Session Issued
   Platform with full KiriApp    (Kiri AI Learning)
   identity preserved
```

**Requirements:**
- FR-INT-001: Platform MUST accept Firebase ID tokens from KiriApp as valid authentication.
- FR-INT-002: On first login via KiriApp SSO, a Learning Profile MUST be auto-created using KiriApp display name, email, profile photo, and user type (student/founder/etc.).
- FR-INT-003: Users MUST NOT be required to re-register separately for Kiri AI Learning if they already have a KiriApp account.
- FR-INT-004: New users who arrive at the web platform directly MUST be redirected to KiriApp registration flow OR offered web-based registration that creates a unified account.
- FR-INT-005: Earned certificates MUST sync back to the user's KiriApp profile under an "Achievements" or "Certifications" section.
- FR-INT-006: Course progress and completions MUST be surfaced as activity items in the KiriApp community feed (opt-in by user).
- FR-INT-007: Push notifications for course milestones, new course launches, and certificate availability MUST be delivered via Firebase Cloud Messaging to the KiriApp Android app.

### 6.2 Unified User Identity Model

```
KiriApp Account (Firebase UID: master identity)
├── kiri_uid: firebase_uid_string
├── display_name
├── email
├── profile_photo_url
├── user_type: [student | founder | educator | admin]
├── college / organization
├── city / state
│
├── KiriApp Features (existing)
│   ├── Community Posts
│   ├── Chat
│   └── Resource Sharing
│
└── Kiri AI Learning (new module)
    ├── enrolled_courses[]
    ├── completed_courses[]
    ├── certificates[]
    ├── total_learning_hours
    └── badges[]
```

---

## 7. User Roles & Permissions

| Role | Description | Key Capabilities |
|------|-------------|-----------------|
| **Learner** | Student, founder, or any registered KiriApp user | Enroll in courses, watch videos, take quizzes, earn certificates |
| **Instructor** | Content creator assigned by admin | Create/manage course content, upload videos, view learner analytics |
| **Sponsor Admin** | Representative of a sponsoring organization | View their branding on certificates, access sponsor analytics dashboard |
| **Platform Admin** | Kiri team member with full access | All CRUD operations, user management, certificate management, sponsor management |
| **Super Admin** | Core Kiri team (1-2 persons) | Role assignment, platform configuration, security logs, system overrides |

### 7.1 Permissions Matrix

| Feature | Learner | Instructor | Sponsor Admin | Admin | Super Admin |
|---------|---------|------------|---------------|-------|-------------|
| View Courses | ✅ | ✅ | ✅ | ✅ | ✅ |
| Enroll in Courses | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Courses | ❌ | ✅ | ❌ | ✅ | ✅ |
| Publish Courses | ❌ | ❌ | ❌ | ✅ | ✅ |
| Issue Certificates | ❌ | ❌ | ❌ | ✅ | ✅ |
| Revoke Certificates | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage Sponsors | ❌ | ❌ | ❌ | ✅ | ✅ |
| View All Users | ❌ | ❌ | ❌ | ✅ | ✅ |
| View Sponsor Analytics | ❌ | ❌ | ✅ | ✅ | ✅ |
| Access Security Logs | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 8. Authentication & Account Management

### 8.1 Registration Flow

**Path A — Existing KiriApp User (Preferred)**
1. User opens Kiri AI Learning web portal or in-app section.
2. "Continue with Kiri Account" button triggers Firebase OAuth flow.
3. Firebase ID token passed to backend.
4. Backend verifies token, creates/syncs Learning Profile.
5. User lands on personalized learning dashboard.

**Path B — New User via Web**
1. User arrives at `learn.kiriapp.com` without an account.
2. Registration form: Full Name, Email, Password, User Type, College/Organization (optional).
3. OTP email verification required before activation.
4. Account created in Firebase Auth + Learning DB simultaneously.
5. User prompted to download KiriApp for the full ecosystem experience.

### 8.2 Authentication Requirements

- FR-AUTH-001: All sessions MUST use JWT tokens with a 24-hour expiry and refresh token rotation.
- FR-AUTH-002: Firebase ID Token verification MUST use Firebase Admin SDK server-side — never trust client-only auth.
- FR-AUTH-003: All API endpoints (except public certificate verification) MUST require a valid session token.
- FR-AUTH-004: Failed login attempts MUST be rate-limited: max 5 attempts per IP per 15 minutes.
- FR-AUTH-005: Passwords (for web-registered users) MUST be hashed with bcrypt (salt rounds ≥ 12).
- FR-AUTH-006: Email verification MUST be mandatory before a user can enroll in or complete courses.
- FR-AUTH-007: Accounts MUST support deactivation (soft-delete). Certificates remain verifiable post-deactivation.
- FR-AUTH-008: Two-Factor Authentication (2FA) MUST be supported (optional for learners, mandatory for Admin/Super Admin).

---

## 9. Course Management System

### 9.1 Course Structure

A course on Kiri AI Learning follows a hierarchical structure:

```
Course
├── Course Metadata (title, description, category, level, duration, thumbnail)
├── Instructor Profile
├── Sponsor(s)
├── Module 1 (Section)
│   ├── Lesson 1.1 — Video Lecture
│   ├── Lesson 1.2 — Reading Material (PDF/HTML)
│   ├── Lesson 1.3 — Video Lecture
│   └── Quiz 1 — Module Assessment
├── Module 2
│   ├── ...
│   └── Quiz 2
├── ...
├── Module N
│   ├── ...
│   └── Quiz N
└── Final Assessment (required for certificate)
```

### 9.2 Course Metadata Requirements

Every course MUST have:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `course_id` | UUID | ✅ | Auto-generated, permanent |
| `title` | String (max 100) | ✅ | |
| `slug` | String | ✅ | URL-friendly, unique |
| `description` | Text (max 2000) | ✅ | |
| `short_description` | String (max 300) | ✅ | For cards/previews |
| `category` | Enum | ✅ | `generative_ai` or `employability` |
| `sub_category` | String | ✅ | e.g., "Prompt Engineering" |
| `level` | Enum | ✅ | `beginner`, `intermediate`, `advanced` |
| `duration_hours` | Float | ✅ | Estimated total time |
| `language` | String | ✅ | Default: English |
| `thumbnail_url` | URL | ✅ | Min 1280x720 |
| `preview_video_url` | URL | ❌ | Optional free preview |
| `instructor_id` | UUID | ✅ | FK to users |
| `sponsor_ids` | UUID[] | ❌ | Array of sponsor references |
| `tags` | String[] | ❌ | For search/filtering |
| `prerequisites` | String[] | ❌ | |
| `what_you_will_learn` | String[] | ✅ | Min 4 bullet points |
| `certificate_eligible` | Boolean | ✅ | Default: true |
| `min_pass_score` | Integer | ✅ | Default: 70 (percent) |
| `status` | Enum | ✅ | `draft`, `review`, `published`, `archived` |
| `published_at` | DateTime | ❌ | Set when published |
| `created_at` | DateTime | ✅ | Auto |
| `updated_at` | DateTime | ✅ | Auto |

### 9.3 Lesson Types

| Lesson Type | Description | Requirements |
|-------------|-------------|-------------|
| **Video** | Recorded lecture | MP4/WebM, max 4K, auto-transcoded to adaptive streaming (HLS/DASH) |
| **Reading** | Text + embedded images | Rich text editor (Markdown/HTML), PDF embed support |
| **PDF Resource** | Downloadable material | PDF upload, max 50MB, watermarked with user email on download |
| **Interactive** | Embedded code sandbox, quiz, or exercise | Iframe embed or custom component |
| **External Link** | Curated external resource | URL with description, opens in new tab |

### 9.4 Course Creation Workflow (Admin/Instructor)

```
Draft ──► Under Review ──► Approved ──► Published
  │                           │
  └── Rejected with notes ────┘
        (back to Draft)
```

- FR-CMS-001: Only Admin/Super Admin can publish a course.
- FR-CMS-002: Instructors can create and submit for review but cannot self-publish.
- FR-CMS-003: Courses MUST have at least 1 module, 3 lessons, and 1 final assessment before being submitted for review.
- FR-CMS-004: Videos MUST be processed through the backend transcoding pipeline before a lesson can be published.
- FR-CMS-005: Course content MUST be versioned. Edits to a published course create a new version; enrolled users stay on the version they enrolled in unless they opt in to the update.

### 9.5 Enrollment

- FR-ENR-001: All courses are free. Enrollment requires only a verified account.
- FR-ENR-002: There is no enrollment limit per user. A user can be enrolled in multiple courses simultaneously.
- FR-ENR-003: Enrollment creates a `CourseEnrollment` record with `enrolled_at` timestamp.
- FR-ENR-004: Learners can unenroll at any time. Progress is preserved for 12 months in case they re-enroll.
- FR-ENR-005: Instructors and Admins are auto-enrolled in all courses they create.

---

## 10. Course Catalog — GenAI & Employability

All courses MUST fall into one of two top-level categories:

### 10.1 Category A — Generative AI

These courses build AI literacy and practical skills:

| Course Title | Level | Duration | Description |
|-------------|-------|----------|-------------|
| Introduction to Generative AI | Beginner | 3h | What GenAI is, how it works, major models, real-world applications |
| Prompt Engineering Masterclass | Beginner–Intermediate | 4h | Crafting prompts, chain-of-thought, few-shot learning, advanced techniques |
| Building AI Workflows with No-Code Tools | Beginner | 3h | Zapier AI, Make.com, ChatGPT plugins, Notion AI |
| Large Language Models Explained | Intermediate | 5h | Architecture of GPT, Claude, Gemini; tokenization, embeddings, fine-tuning basics |
| AI for Entrepreneurs | Beginner | 4h | Using AI to build, validate, and grow a startup |
| Generative AI for Content Creation | Beginner | 3h | AI-assisted writing, design (Midjourney, DALL-E), video, and social media |
| AI Ethics & Responsible Use | Beginner | 2h | Bias, hallucination, privacy, policy, responsible deployment |
| RAG Systems & Vector Databases | Intermediate | 5h | Retrieval Augmented Generation, Pinecone, LangChain basics |
| Python for AI Beginners | Intermediate | 6h | Python fundamentals with an AI focus, using OpenAI API, HuggingFace |
| Building Chatbots with LLMs | Intermediate–Advanced | 5h | From design to deployment: chatbot architecture, API integration, UI |

### 10.2 Category B — Employability Development

These courses prepare learners for career success:

| Course Title | Level | Duration | Description |
|-------------|-------|----------|-------------|
| Resume & LinkedIn Mastery | Beginner | 2h | Crafting ATS-ready resumes, optimizing LinkedIn, personal branding |
| Cracking Campus Placements | Beginner | 4h | GD/PI preparation, aptitude, HR rounds, offer negotiation |
| Communication Skills for Professionals | Beginner | 3h | Business writing, email etiquette, presentations, active listening |
| Startup Pitch & Fundraising 101 | Intermediate | 3h | Pitch deck structure, investor mindset, how to approach VCs and angels |
| Personal Finance for Students & Founders | Beginner | 2h | Budgeting, banking, taxes, investments for young Indians |
| Design Thinking & Problem Solving | Beginner–Intermediate | 4h | Human-centered design, ideation, prototyping, case studies |
| Leadership & Team Management | Intermediate | 3h | Team dynamics, conflict resolution, remote work leadership |
| Freelancing & Gig Economy Skills | Beginner | 3h | Building a freelance profile, proposals, Upwork/Fiverr, client management |
| Public Speaking & Confidence Building | Beginner | 2.5h | Overcoming fear, structuring talks, stage presence, vocal delivery |
| Networking & Community Building | Beginner | 2h | Building meaningful connections, LinkedIn networking, events, community ROI |

### 10.3 Course Categorization Rules

- FR-CAT-001: Every course MUST be tagged with exactly one primary category (`generative_ai` or `employability`) and one sub-category.
- FR-CAT-002: Courses MAY have a "Combined" designation if they meaningfully span both categories (e.g., "AI for Entrepreneurs").
- FR-CAT-003: The platform MUST support filtering, sorting, and searching by category, level, duration, and tags.

---

## 11. Learning Experience Engine

### 11.1 Video Playback

- FR-VID-001: Video player MUST support adaptive bitrate streaming (HLS) for variable connection speeds.
- FR-VID-002: Player MUST support playback speed control: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x.
- FR-VID-003: Player MUST support auto-generated or admin-uploaded captions/subtitles (English default).
- FR-VID-004: Player MUST save last-watched timestamp per lesson, resuming from where the user left off.
- FR-VID-005: Videos MUST NOT be downloadable by learners. Streaming only.
- FR-VID-006: Player MUST track watch percentage per lesson. A lesson is marked "complete" when ≥ 80% of the video is watched.
- FR-VID-007: Player MUST prevent automated completion: no marking lessons complete if seek jumps exceed 90% of unwatched content without corresponding watch time.

### 11.2 Progress Tracking (Per Learner)

- FR-PROG-001: The system MUST track progress at the lesson level (not_started / in_progress / completed).
- FR-PROG-002: Module-level progress MUST be calculated as: `(completed_lessons / total_lessons) * 100`.
- FR-PROG-003: Course-level progress MUST be displayed as a percentage with a visual progress bar.
- FR-PROG-004: Progress data MUST persist across devices (web and KiriApp Android).
- FR-PROG-005: Learning streaks MUST be tracked and displayed (consecutive days of activity).
- FR-PROG-006: Total learning hours MUST be computed and displayed on the learner's profile.

### 11.3 Course Completion Criteria

A course is considered **complete** when ALL of the following conditions are met:

1. ✅ All lessons marked as completed (≥ 80% video watch per video lesson).
2. ✅ All module quizzes attempted (regardless of score).
3. ✅ Final Assessment passed with a score ≥ `min_pass_score` (default 70%).
4. ✅ User account has a verified email address.

- FR-COMP-001: The system MUST verify all completion criteria server-side before triggering certificate generation. Client-side state alone MUST NOT trigger a certificate.
- FR-COMP-002: If a learner fails the Final Assessment, they MUST be allowed to retake it after a 24-hour cooldown (max 3 attempts per 7-day window).
- FR-COMP-003: On successful completion, a `CourseCompletion` record MUST be created with a UTC timestamp.

---

## 12. Assessment & Quiz Engine

### 12.1 Quiz Types

| Type | Description | When Used |
|------|-------------|-----------|
| **Module Quiz** | 5–10 multiple-choice questions after each module | After each module |
| **Final Assessment** | 20–30 questions, mixed types | At the end of the course |
| **Knowledge Check** | 2–3 quick questions mid-lesson | Optional, embedded in lessons |

### 12.2 Question Types

- Multiple Choice (single correct answer)
- Multiple Select (multiple correct answers)
- True/False
- Short Answer (evaluated via keyword matching or admin review)
- Scenario-Based (paragraph + 4 options)

### 12.3 Assessment Requirements

- FR-QUIZ-001: All quiz answers MUST be stored server-side. The correct answers MUST NEVER be sent to the client.
- FR-QUIZ-002: Questions MUST be shuffled per attempt to reduce copying.
- FR-QUIZ-003: Answer options MUST be shuffled per attempt.
- FR-QUIZ-004: Module quizzes MUST NOT block progression (informational).
- FR-QUIZ-005: Final Assessment MUST block certificate issuance until passed.
- FR-QUIZ-006: After each quiz attempt, the learner MUST see: score, correct/incorrect per question, and explanation for each answer.
- FR-QUIZ-007: Quiz results MUST be stored with timestamps, score, and individual question responses for audit purposes.
- FR-QUIZ-008: Admins MUST be able to create, edit, and delete questions via the Admin Dashboard.

---

## 13. Certificate Generation System

This is a core differentiator of Kiri AI Learning. Certificates must be beautiful, professional, secure, and verifiable.

### 13.1 Certificate Trigger

```
Completion Criteria Met (server-verified)
            │
            ▼
    Certificate Job Queued (BullMQ)
            │
            ▼
    Generate Unique Certificate ID
    (Format: KIRI-YYYY-XXXXXXXX)
            │
            ▼
    Embed Metadata (see Section 28)
            │
            ▼
    Generate QR Code pointing to
    https://verify.kiriapp.com/cert/{certificate_id}
            │
            ▼
    Render Certificate as PDF
    (Puppeteer + HTML template)
            │
            ▼
    Sign Certificate with RSA Private Key
    (SHA-256 hash of certificate data)
            │
            ▼
    Store PDF in Firebase Storage /
    certificates/{certificate_id}.pdf
            │
            ▼
    Store Certificate Record in DB
            │
            ▼
    Notify User (Email + FCM Push)
    with download link
```

### 13.2 Certificate Design Requirements

The certificate is a single-page PDF (A4 landscape, 297mm × 210mm):

**Layout Zones:**

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Kiri AI Learning Logo (left) | Sponsor Logos (right)   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│           "CERTIFICATE OF COMPLETION"  (title)                   │
│                                                                   │
│                  "This certifies that"                           │
│                                                                   │
│              ██████ LEARNER FULL NAME ██████                     │
│                                                                   │
│         "has successfully completed the course"                  │
│                                                                   │
│              ██████ COURSE TITLE ██████                          │
│                                                                   │
│      Issued by Kiri AI Learning, a division of Kiri App         │
│                                                                   │
│   Date: DD MMM YYYY        Duration: X hours                     │
│                                                                   │
│   Score Achieved: XX%      Level: Beginner/Intermediate/Advanced │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│  Instructor Signature + Name    │  QR CODE  │  Cert ID           │
│  Kiri AI Learning Seal          │  (large)  │  KIRI-YYYY-XXXXXX  │
│                                 │           │                    │
│  Admin/Director Signature       │ "Scan to  │  [Verification     │
│                                 │  Verify"  │   URL printed]     │
├─────────────────────────────────────────────────────────────────┤
│  FOOTER: "Sponsored by: [Sponsor Names/Logos]"                   │
│  "Powered by Kiri AI Learning | kiriapp.com"                    │
└─────────────────────────────────────────────────────────────────┘
```

### 13.3 Certificate Fields (Mandatory)

| Field | Example | Source |
|-------|---------|--------|
| Learner Full Name | Priya Sharma | User profile |
| Course Title | Prompt Engineering Masterclass | Course metadata |
| Certificate ID | KIRI-2026-A7F3D291 | System generated |
| Issue Date | 08 June 2026 | Completion timestamp |
| Course Duration | 4 hours | Course metadata |
| Score Achieved | 87% | Final assessment record |
| Course Level | Intermediate | Course metadata |
| Instructor Name | John Doe | Instructor profile |
| Platform Branding | Kiri AI Learning | Static |
| Sponsor Names & Logos | TechCorp, StartupHub | Sponsor module |
| QR Code | (see Section 14) | System generated |
| Verification URL | verify.kiriapp.com/cert/... | System generated |
| Digital Signature Hash | SHA256:abc123... | Crypto service |

### 13.4 Certificate Security Requirements

- FR-CERT-001: Each certificate MUST have a globally unique Certificate ID (UUID-based, prefixed `KIRI-`).
- FR-CERT-002: The certificate metadata MUST be signed with the platform's RSA-2048 private key. The signature MUST be stored in the DB and embedded in QR metadata.
- FR-CERT-003: Certificates MUST be immutable once issued. No edits. Only revocation is possible.
- FR-CERT-004: Certificate PDFs MUST be watermarked with the learner's email (subtle, diagonal, semi-transparent).
- FR-CERT-005: Certificate download links MUST be time-limited presigned URLs (valid 1 hour). Users can regenerate from their dashboard.
- FR-CERT-006: The system MUST maintain a complete audit log: issued_at, downloaded_at, verified_at (via QR).
- FR-CERT-007: Bulk certificate generation (for cohorts) MUST be supported via Admin Dashboard.
- FR-CERT-008: Revoked certificates MUST still show on the verification page with a clear "REVOKED" status and reason.

---

## 14. QR Code Verification System

Every certificate has a **unique, permanent QR code** embedded on the certificate.

### 14.1 QR Code Specification

| Property | Value |
|----------|-------|
| Format | QR Code (ISO 18004:2015) |
| Error Correction Level | H (30% recovery) |
| Version | Auto (based on data length) |
| Encoded URL | `https://verify.kiriapp.com/cert/{certificate_id}?sig={signature_hash}` |
| Size on Certificate | 4cm × 4cm minimum (printed) |
| Color | Dark on light background (no decorative QR codes — legibility is mandatory) |
| Border | Minimum 1-module quiet zone all sides |

### 14.2 QR Code Contents

The URL encoded in the QR code:

```
https://verify.kiriapp.com/cert/KIRI-2026-A7F3D291?sig=sha256:abc123def456
```

Parameters:
- `cert_id` (path param): The unique certificate identifier
- `sig` (query param): SHA-256 signature of certificate data (for tamper detection)

### 14.3 QR Code Security Requirements

- FR-QR-001: QR codes MUST encode HTTPS URLs only.
- FR-QR-002: QR codes MUST NOT expire. They must remain scannable indefinitely as long as the verification server is live.
- FR-QR-003: Each scan of the QR code MUST be logged (timestamp, IP, user-agent) for audit purposes.
- FR-QR-004: The verification backend MUST validate the `sig` parameter on every scan and flag tampered certificates.
- FR-QR-005: QR codes MUST be generated server-side only, never in the browser client.

---

## 15. Certificate Verification Web Page

The verification page is a **public-facing webpage** at `https://verify.kiriapp.com/cert/{certificate_id}`. No login is required to view it. This page is what opens when someone scans the QR code on a certificate.

### 15.1 Page Sections

**Section 1 — Verification Status Banner**
- Large, prominent banner: ✅ "Certificate Verified — Authentic" (green) or ❌ "Certificate Not Found / Revoked" (red).
- Verification timestamp shown: "Verified on [today's date]"

**Section 2 — Certificate Overview**
- Learner Name (large, prominent)
- Course Title
- Certificate ID
- Issue Date
- "This certificate was issued by Kiri AI Learning"

**Section 3 — Learner Details**
- Learner Profile Photo (avatar)
- Full Name
- User Type (Student / Founder / Professional)
- College / Organization (if shared in profile)

**Section 4 — Course Details**
- Course Title
- Category (Generative AI / Employability Development)
- Level (Beginner / Intermediate / Advanced)
- Duration
- Score Achieved (e.g., 87%)
- Completion Date
- Instructor Name and Title

**Section 5 — Kiri AI Learning Branding**
- Platform Name: **Kiri AI Learning**
- Tagline
- Link to platform homepage
- Platform logo

**Section 6 — Sponsor Showcase**
- "This course was made possible by:"
- Sponsor logos (high-res, linked to sponsor website)
- Sponsor names and descriptions (if provided)

**Section 7 — Digital Integrity**
- Certificate ID shown
- Digital Signature Hash (abbreviated, with expand option)
- Signed by Kiri AI Learning
- "This certificate's authenticity has been cryptographically verified"

**Section 8 — Social Sharing**
- Share buttons: LinkedIn (with OpenGraph card), Twitter/X, WhatsApp
- "Add to LinkedIn Profile" direct link
- Copy verification URL button
- Download button for the original PDF (requires same presigned URL mechanism)

### 15.2 Verification Page Technical Requirements

- FR-VER-001: Page MUST load in < 2 seconds (P95) globally.
- FR-VER-002: Page MUST be fully responsive — optimized for mobile (since it's scanned from a phone).
- FR-VER-003: Page MUST have proper OpenGraph meta tags so sharing on LinkedIn/Twitter shows a rich preview card.
- FR-VER-004: Verification MUST be performed server-side (SSR) before the page renders, not via client-side fetch.
- FR-VER-005: If `certificate_id` does not exist, page MUST show a clear "No certificate found" state.
- FR-VER-006: Page MUST NOT require a login or cookie to view.
- FR-VER-007: All scan events MUST be logged with the certificate_id, IP hash, and timestamp.
- FR-VER-008: Page MUST be indexed by search engines (for LinkedIn "add credential" flows).

---

## 16. Sponsor Management Module

Sponsors are organizations, companies, or institutions that support course creation and are featured on certificates and the platform.

### 16.1 Sponsor Profile

| Field | Type | Required |
|-------|------|----------|
| `sponsor_id` | UUID | ✅ |
| `name` | String | ✅ |
| `logo_url` | URL | ✅ (SVG/PNG, transparent bg) |
| `website_url` | URL | ❌ |
| `description` | Text | ❌ |
| `tier` | Enum: `platinum`, `gold`, `silver`, `community` | ✅ |
| `courses_sponsored` | UUID[] | ✅ |
| `show_on_certificate` | Boolean | ✅ |
| `show_on_verification_page` | Boolean | ✅ |
| `active` | Boolean | ✅ |

### 16.2 Sponsor Display Rules

| Tier | Certificate Logo Size | Verification Page | Platform Homepage |
|------|-----------------------|-------------------|-------------------|
| Platinum | Large (primary) | Prominent section | Hero banner |
| Gold | Medium | Standard section | Partners section |
| Silver | Small | Listed | Partners section |
| Community | Name-only | Listed | Footer |

### 16.3 Sponsor Requirements

- FR-SPON-001: Sponsor branding MUST be maintained on all certificates issued under their sponsored courses, even after the sponsorship period ends.
- FR-SPON-002: Sponsor logos MUST be uploaded in SVG or PNG format (transparent background, min 400px width).
- FR-SPON-003: Sponsors MUST be associated with specific courses — not the platform globally (unless a Platform Sponsor tier exists).
- FR-SPON-004: Sponsor admins MUST have read-only access to: total learners for their sponsored courses, certificates issued, and QR scan counts.
- FR-SPON-005: Adding or removing a sponsor from a course MUST NOT invalidate already-issued certificates. The snapshot at time of issue is permanent.

---

## 17. Admin Dashboard

### 17.1 Dashboard Overview Panel

- Total registered users (with trend graph)
- Active enrollments today / this week / this month
- Certificates issued (cumulative + trend)
- QR verification scans
- Course completion rates per course
- Revenue (if monetization is ever added — reserved field)

### 17.2 User Management

- FR-ADMIN-USR-001: Admins MUST be able to search users by name, email, and user type.
- FR-ADMIN-USR-002: Admins MUST be able to view a user's complete learning history (enrollments, completions, certificates).
- FR-ADMIN-USR-003: Admins MUST be able to deactivate/reactivate user accounts.
- FR-ADMIN-USR-004: Admins MUST be able to manually assign or revoke roles.
- FR-ADMIN-USR-005: Bulk user export (CSV) MUST be supported with fields: name, email, enrollments, completions, certificates.

### 17.3 Course Management

- FR-ADMIN-CRS-001: Admins MUST be able to create, edit, publish, and archive courses.
- FR-ADMIN-CRS-002: Admins MUST be able to reorder modules and lessons via drag-and-drop.
- FR-ADMIN-CRS-003: Admins MUST be able to preview any course as a learner before publishing.
- FR-ADMIN-CRS-004: Admins MUST be able to view completion analytics per course (completion rate, average score, drop-off points).

### 17.4 Certificate Management

- FR-ADMIN-CERT-001: Admins MUST be able to view all issued certificates with filters (course, date range, user).
- FR-ADMIN-CERT-002: Admins MUST be able to revoke a certificate with a mandatory reason field.
- FR-ADMIN-CERT-003: Admins MUST be able to bulk-issue certificates for a course cohort.
- FR-ADMIN-CERT-004: Admins MUST be able to re-issue a certificate (new PDF, same Certificate ID) in case of template errors.
- FR-ADMIN-CERT-005: Certificate audit log MUST be accessible: issued_at, downloads, QR scans.

### 17.5 Content Moderation

- FR-ADMIN-MOD-001: Admins MUST review and approve all new course submissions before publishing.
- FR-ADMIN-MOD-002: Any learner-reported issue with course content MUST create a ticket in the admin panel.

---

## 18. Progress Tracking & Analytics

### 18.1 Learner-Facing Analytics (Dashboard)

Each learner sees on their personal dashboard:

- **Enrolled Courses** — list with progress bars
- **Completed Courses** — with certificate download buttons
- **Learning Streak** — consecutive days of activity (visual flame icon)
- **Total Learning Hours** — accumulated
- **Certificates Earned** — grid of certificate thumbnails
- **Skill Tags Earned** — based on completed courses (e.g., "Prompt Engineering", "Resume Building")
- **Leaderboard Position** (optional, within cohort/college)

### 18.2 Platform Analytics (Admin)

- Course funnel analysis: enrolled → started → 50% → completed
- Average time to completion per course
- Most-enrolled courses
- Most-abandoned lessons (video drop-off heatmap)
- QR scan geolocation (country/state level, anonymized)
- Certificate download rates
- KiriApp SSO vs web registration ratio

---

## 19. Notification System

### 19.1 Notification Events

| Event | Web (Email) | KiriApp (FCM Push) | In-App |
|-------|------------|-------------------|--------|
| Account verified | ✅ | ❌ | ✅ |
| Course enrollment | ✅ | ✅ | ✅ |
| Module completed | ❌ | ✅ | ✅ |
| Final Assessment passed | ✅ | ✅ | ✅ |
| Certificate ready | ✅ | ✅ | ✅ |
| Certificate downloaded | ✅ | ❌ | ✅ |
| New course published | ✅ | ✅ | ✅ |
| Streak reminder | ❌ | ✅ | ✅ |
| Account deactivated | ✅ | ✅ | ✅ |

### 19.2 Notification Requirements

- FR-NOTIF-001: All email notifications MUST use branded HTML email templates (Kiri AI Learning header/footer).
- FR-NOTIF-002: FCM push notifications MUST be sent via the existing KiriApp FCM pipeline to avoid separate keys.
- FR-NOTIF-003: Users MUST be able to manage notification preferences (opt-out of marketing but not transactional).
- FR-NOTIF-004: Certificate-ready email MUST contain: certificate preview image, secure download link (1-hour presigned), and verification URL.

---

## 20. Security Requirements

Security is a first-class concern given the value of digital certificates. All requirements below are MANDATORY.

### 20.1 Application Security

| ID | Requirement |
|----|-------------|
| SEC-001 | All data in transit MUST use TLS 1.2+ (TLS 1.3 preferred). No HTTP. |
| SEC-002 | All data at rest MUST be encrypted (AES-256 for DB, Firebase Storage encryption enabled). |
| SEC-003 | API inputs MUST be validated and sanitized server-side. All user inputs treated as untrusted. |
| SEC-004 | SQL injection prevention MUST be enforced via parameterized queries (Prisma handles this). |
| SEC-005 | XSS prevention MUST be enforced via output encoding and Content Security Policy (CSP) headers. |
| SEC-006 | CSRF protection MUST be implemented for all state-changing API endpoints. |
| SEC-007 | Rate limiting MUST be applied at the API Gateway level (per IP, per user). |
| SEC-008 | All admin endpoints MUST require 2FA-verified sessions. |
| SEC-009 | Security headers MUST be set: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`. |
| SEC-010 | Dependency vulnerabilities MUST be scanned via `npm audit` / Snyk in CI/CD pipeline. |

### 20.2 Certificate Integrity

| ID | Requirement |
|----|-------------|
| SEC-CERT-001 | Every certificate MUST be signed with a 2048-bit RSA private key held only by the backend. |
| SEC-CERT-002 | The signing private key MUST be stored in environment secrets (never in source code or version control). |
| SEC-CERT-003 | The corresponding public key MUST be published at `https://verify.kiriapp.com/.well-known/cert-pubkey.pem` for independent verification. |
| SEC-CERT-004 | Certificate data fields MUST be hashed (SHA-256) prior to signing. |
| SEC-CERT-005 | The QR verification endpoint MUST recompute and validate the signature on every scan. |
| SEC-CERT-006 | Any mismatch in QR signature MUST display "Certificate data has been tampered" on the verification page. |

### 20.3 Access Control

| ID | Requirement |
|----|-------------|
| SEC-AC-001 | The principle of least privilege MUST be applied to all roles. |
| SEC-AC-002 | Learners MUST NEVER be able to access another learner's quiz answers, progress, or certificates. |
| SEC-AC-003 | Admin APIs MUST enforce role checks server-side on every request. Role decorators on the client are for UX only. |
| SEC-AC-004 | Instructor accounts MUST only access courses they are assigned to. |

### 20.4 Anti-Fraud Controls

| ID | Requirement |
|----|-------------|
| SEC-FRAUD-001 | The completion verification check MUST run entirely server-side. No completion can be triggered by a client-side API call alone. |
| SEC-FRAUD-002 | Quiz answers must be submitted with a server-issued session token that includes the quiz start time. Submissions older than quiz_time_limit + 5 minutes MUST be rejected. |
| SEC-FRAUD-003 | Video watch-time MUST be tracked on the backend (periodic heartbeat every 30 seconds) and not solely from client reports. |
| SEC-FRAUD-004 | Multiple simultaneous sessions from different IPs MUST trigger a security alert for admin review. |
| SEC-FRAUD-005 | Accounts that complete a course in under 10% of the expected duration MUST be flagged for review. |

### 20.5 Data Privacy (DPDP Act 2023 Compliance — India)

| ID | Requirement |
|----|-------------|
| SEC-PRIV-001 | Platform MUST comply with India's Digital Personal Data Protection Act (DPDP), 2023. |
| SEC-PRIV-002 | A clear Privacy Policy and Terms of Service MUST be presented at registration. |
| SEC-PRIV-003 | Users MUST be able to request data export (all their data in JSON/CSV) within 30 days. |
| SEC-PRIV-004 | Users MUST be able to request account deletion. Upon deletion, PII is anonymized but certificate records are preserved (regulatory requirement). |
| SEC-PRIV-005 | QR scan logs MUST store only hashed IPs and anonymized user-agents. |

---

## 21. API Design & KiriApp REST Contracts

### 21.1 Base URL

```
Production: https://api.kirilearning.com/v1
Staging:    https://staging-api.kirilearning.com/v1
```

### 21.2 Authentication Header

```
Authorization: Bearer <jwt_token>
X-Kiri-App-Version: 1.0.0
```

### 21.3 Core Endpoints

**Auth**
```
POST   /auth/firebase-login        # Exchange Firebase token for Kiri JWT
POST   /auth/register              # Web registration
POST   /auth/refresh               # Refresh JWT
POST   /auth/logout
```

**Courses**
```
GET    /courses                    # List courses (with filters)
GET    /courses/:slug              # Course detail
GET    /courses/:id/modules        # List modules + lessons
POST   /courses/:id/enroll         # Enroll in course
DELETE /courses/:id/enroll         # Unenroll
GET    /courses/:id/progress       # My progress in this course
```

**Lessons**
```
POST   /lessons/:id/start          # Mark lesson started
POST   /lessons/:id/heartbeat      # Watch-time heartbeat (every 30s)
POST   /lessons/:id/complete       # Mark lesson complete (server validates)
```

**Quizzes**
```
GET    /quizzes/:id                # Get quiz (no answers)
POST   /quizzes/:id/start          # Start a quiz session (get session token)
POST   /quizzes/:id/submit         # Submit answers
GET    /quizzes/:id/results/:attempt_id  # Get results
```

**Certificates**
```
GET    /certificates               # My certificates
GET    /certificates/:cert_id      # Certificate detail
GET    /certificates/:cert_id/download  # Presigned download URL (1 hour)
POST   /certificates/:cert_id/share    # Generate share card
```

**Verification (Public — No Auth)**
```
GET    /verify/:cert_id            # Certificate verification data
GET    /verify/:cert_id/signature  # Signature validation
```

**Admin**
```
# Prefixed with /admin/ — requires Admin role
GET    /admin/users
GET    /admin/users/:id
PATCH  /admin/users/:id/status
GET    /admin/courses
POST   /admin/courses
PATCH  /admin/courses/:id
DELETE /admin/courses/:id
GET    /admin/certificates
POST   /admin/certificates/:id/revoke
GET    /admin/analytics/overview
GET    /admin/sponsors
POST   /admin/sponsors
```

### 21.4 KiriApp Android SDK Contract

The KiriApp Android codebase (Kotlin) MUST implement these deep-link handlers:

```kotlin
// Deep link: kiriapp://learning/course/{course_slug}
// Opens learning course detail screen in Android app

// Deep link: kiriapp://learning/certificate/{cert_id}
// Opens certificate viewer screen in Android app

// Firebase notification payload for certificate ready:
{
  "notification": {
    "title": "🎓 Certificate Ready!",
    "body": "Your certificate for [Course Name] is ready to download."
  },
  "data": {
    "type": "certificate_ready",
    "cert_id": "KIRI-2026-A7F3D291",
    "course_title": "Prompt Engineering Masterclass",
    "deep_link": "kiriapp://learning/certificate/KIRI-2026-A7F3D291"
  }
}
```

---

## 22. Database Schema

### 22.1 Core Tables (PostgreSQL)

```sql
-- Users (synced from Firebase)
Table users {
  id               UUID PK default gen_random_uuid()
  firebase_uid     VARCHAR(128) UNIQUE NOT NULL
  email            VARCHAR(255) UNIQUE NOT NULL
  display_name     VARCHAR(100) NOT NULL
  profile_photo    TEXT
  user_type        ENUM('student','founder','educator','admin','super_admin')
  college          VARCHAR(200)
  city             VARCHAR(100)
  email_verified   BOOLEAN DEFAULT FALSE
  is_active        BOOLEAN DEFAULT TRUE
  created_at       TIMESTAMPTZ DEFAULT NOW()
  updated_at       TIMESTAMPTZ DEFAULT NOW()
}

-- Courses
Table courses {
  id               UUID PK
  title            VARCHAR(100) NOT NULL
  slug             VARCHAR(120) UNIQUE NOT NULL
  description      TEXT
  short_description VARCHAR(300)
  category         ENUM('generative_ai','employability')
  sub_category     VARCHAR(100)
  level            ENUM('beginner','intermediate','advanced')
  duration_hours   FLOAT
  thumbnail_url    TEXT
  preview_video_url TEXT
  instructor_id    UUID FK(users.id)
  min_pass_score   INTEGER DEFAULT 70
  certificate_eligible BOOLEAN DEFAULT TRUE
  status           ENUM('draft','review','published','archived')
  published_at     TIMESTAMPTZ
  created_at       TIMESTAMPTZ DEFAULT NOW()
  updated_at       TIMESTAMPTZ DEFAULT NOW()
}

-- Enrollments
Table enrollments {
  id               UUID PK
  user_id          UUID FK(users.id)
  course_id        UUID FK(courses.id)
  enrolled_at      TIMESTAMPTZ DEFAULT NOW()
  unenrolled_at    TIMESTAMPTZ
  is_active        BOOLEAN DEFAULT TRUE
  UNIQUE(user_id, course_id)
}

-- Lesson Progress
Table lesson_progress {
  id               UUID PK
  user_id          UUID FK(users.id)
  lesson_id        UUID FK(lessons.id)
  course_id        UUID FK(courses.id)
  status           ENUM('not_started','in_progress','completed')
  watch_seconds    INTEGER DEFAULT 0
  last_position_seconds INTEGER DEFAULT 0
  completed_at     TIMESTAMPTZ
  updated_at       TIMESTAMPTZ DEFAULT NOW()
}

-- Quiz Attempts
Table quiz_attempts {
  id               UUID PK
  user_id          UUID FK(users.id)
  quiz_id          UUID FK(quizzes.id)
  course_id        UUID FK(courses.id)
  session_token    VARCHAR(256) NOT NULL
  started_at       TIMESTAMPTZ DEFAULT NOW()
  submitted_at     TIMESTAMPTZ
  score_percent    FLOAT
  passed           BOOLEAN
  answers_json     JSONB  -- {question_id: selected_option_id}
}

-- Course Completions
Table course_completions {
  id               UUID PK
  user_id          UUID FK(users.id)
  course_id        UUID FK(courses.id)
  completed_at     TIMESTAMPTZ DEFAULT NOW()
  final_score_percent FLOAT NOT NULL
  UNIQUE(user_id, course_id)
}

-- Certificates
Table certificates {
  id               UUID PK
  certificate_id   VARCHAR(20) UNIQUE NOT NULL  -- KIRI-YYYY-XXXXXXXX
  user_id          UUID FK(users.id)
  course_id        UUID FK(courses.id)
  completion_id    UUID FK(course_completions.id)
  issued_at        TIMESTAMPTZ DEFAULT NOW()
  learner_name_snapshot VARCHAR(100) NOT NULL
  course_title_snapshot VARCHAR(100) NOT NULL
  score_snapshot   FLOAT NOT NULL
  instructor_name_snapshot VARCHAR(100)
  sponsor_ids_snapshot UUID[]  -- Snapshot at time of issue
  pdf_url          TEXT NOT NULL
  signature_hash   TEXT NOT NULL  -- RSA signature hex
  status           ENUM('active','revoked') DEFAULT 'active'
  revoked_at       TIMESTAMPTZ
  revoked_reason   TEXT
  revoked_by       UUID FK(users.id)
  created_at       TIMESTAMPTZ DEFAULT NOW()
}

-- Certificate Audit Log
Table certificate_audit_log {
  id               UUID PK
  certificate_id   UUID FK(certificates.id)
  event            ENUM('issued','downloaded','qr_scanned','revoked','re_issued')
  ip_hash          VARCHAR(64)
  user_agent_hash  VARCHAR(64)
  created_at       TIMESTAMPTZ DEFAULT NOW()
}

-- Sponsors
Table sponsors {
  id               UUID PK
  name             VARCHAR(100) NOT NULL
  logo_url         TEXT NOT NULL
  website_url      TEXT
  description      TEXT
  tier             ENUM('platinum','gold','silver','community')
  show_on_certificate BOOLEAN DEFAULT TRUE
  is_active        BOOLEAN DEFAULT TRUE
  created_at       TIMESTAMPTZ DEFAULT NOW()
}
```

---

## 23. UI/UX Requirements

### 23.1 Design Principles

- **Mobile-First**: All pages must work flawlessly on mobile (360px+), especially the certificate verification page which is opened by scanning QR from a phone.
- **Fast Loading**: Core content above-the-fold must be visible within 1.5 seconds on 4G.
- **Accessible**: WCAG 2.1 Level AA compliance minimum.
- **KiriApp-Consistent**: Use the same brand colors, typography, and design language established in the KiriApp Android app (Material Design 3 base, Kiri brand layer on top).

### 23.2 Key Screens

**Web Platform:**
- `/` — Landing page (courses showcase, value prop, sponsor logos)
- `/courses` — Course catalog with filters
- `/courses/:slug` — Course detail page
- `/learn/:slug` — In-course learning UI (video + sidebar)
- `/dashboard` — Learner dashboard (progress, certificates)
- `/certificates` — My certificates gallery
- `/verify/:cert_id` — Public certificate verification page (no auth)
- `/admin/*` — Admin dashboard

**KiriApp Android (New Screens):**
- Learning section (new tab in KiriApp nav)
- Course list screen
- Course detail screen
- Video lesson screen
- Quiz screen
- Certificate viewer screen
- Achievements screen (all earned certificates)

### 23.3 Certificate Verification Page — Mobile UX Requirements

Since this page is primarily accessed via phone camera QR scan:
- Page MUST load without any JavaScript-blocking resources in the critical path.
- "Certificate Verified" status banner MUST be visible without any scrolling (hero position).
- All sponsor logos MUST be optimized for Retina/HiDPI screens.
- "Add to LinkedIn" button MUST be prominent and accessible.
- Text MUST be minimum 16px for legibility without zooming.

---

## 24. Non-Functional Requirements

### 24.1 Performance

| Metric | Target |
|--------|--------|
| Web page LCP (Largest Contentful Paint) | < 2.5s (P75) |
| API response time (p50) | < 200ms |
| API response time (p95) | < 800ms |
| Certificate PDF generation time | < 10s |
| QR verification page load | < 1.5s |
| Video start time (time-to-first-frame) | < 3s on 4G |

### 24.2 Scalability

- System MUST support 10,000 concurrent users without degradation.
- Certificate generation MUST be async (job queue) and not block API responses.
- Database MUST use read replicas for analytics queries.
- Video streaming MUST use a CDN, not direct server streaming.

### 24.3 Availability

- Platform uptime target: **99.5%** (excluding scheduled maintenance).
- Scheduled maintenance MUST happen during low-traffic windows (Sunday 2–4 AM IST).
- Certificate verification endpoint MUST have its own availability target of **99.9%** (it is used by employers independently).

### 24.4 Internationalisation

- All text strings MUST be externalized (i18n) to support future translations.
- Default language: English.
- Date formats MUST use ISO 8601 internally and locale-appropriate display format.
- Certificates MUST support Indian name characters (UTF-8).

---

## 25. Infrastructure & Deployment

### 25.1 Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| Development | Local dev | `localhost:3000` |
| Staging | QA and UAT | `staging.kirilearning.com` |
| Production | Live users | `kirilearning.com` / `learn.kiriapp.com` |
| Verify (Production) | Certificate verification (separate deployment) | `verify.kiriapp.com` |

### 25.2 CI/CD Pipeline (GitHub Actions)

```
Push to main branch
       │
       ▼
Run Tests (unit + integration)
       │
  Pass / Fail
       │ Pass
       ▼
Build Docker Image
       │
       ▼
Push to Container Registry
       │
       ▼
Deploy to Staging (auto)
       │
Manual Approval (Admin)
       │
       ▼
Deploy to Production
       │
       ▼
Run smoke tests
       │
Notify team on Slack/WhatsApp
```

### 25.3 Infrastructure (using existing render.yaml in repo)

- **Web Service**: Next.js on Render.com (existing setup)
- **API Service**: Node.js/Express on Render.com
- **Database**: PostgreSQL on Render.com (managed)
- **Cache**: Redis on Render.com
- **File Storage**: Firebase Storage (existing) + Cloudflare R2 for large video files
- **Video CDN**: Cloudflare Stream or Bunny.net for HLS video delivery
- **Verification Service**: Separate Render service (dedicated instance for SLA)

### 25.4 Secrets Management

- All secrets (DB URL, Firebase keys, RSA private key, JWT secret) MUST be stored in environment variables.
- NEVER committed to source code or `.env` files in version control.
- RSA certificate signing key MUST be stored separately and backed up securely.

---

## 26. Testing Requirements

### 26.1 Test Levels

| Level | Coverage Target | Tools |
|-------|----------------|-------|
| Unit Tests | 80% of business logic | Jest / Vitest |
| Integration Tests | All API endpoints | Supertest |
| E2E Tests | Critical user journeys | Playwright |
| Security Tests | OWASP Top 10 | OWASP ZAP / manual pentesting |
| Load Tests | 1000 concurrent users | k6 |

### 26.2 Critical E2E Journeys to Test

1. **Happy Path**: Register → Enroll → Complete all lessons → Pass final assessment → Receive certificate → Verify via QR.
2. **SSO Flow**: KiriApp login → landing on learning dashboard with correct profile.
3. **Certificate Verification**: Scan QR → verification page loads with correct data → signature validates.
4. **Fraud Prevention**: Attempt to skip to final assessment without completing lessons → system blocks.
5. **Admin Certificate Revocation**: Admin revokes cert → verification page shows REVOKED status.
6. **Sponsor Display**: Sponsor added to course → sponsor logo appears on certificate and verification page.

---

## 27. Future Roadmap

| Phase | Feature | Priority |
|-------|---------|----------|
| v1.1 | KiriApp Android in-app learning tab (native) | High |
| v1.2 | Leaderboards & cohort rankings | Medium |
| v1.3 | Live webinar / cohort-based learning | Medium |
| v1.4 | Course bookmarking and notes-taking | Medium |
| v2.0 | AI-powered personalized learning path recommendations | High |
| v2.0 | Kiri AI Tutor (chatbot powered by LLM inside courses) | High |
| v2.1 | Skill endorsement system (peers endorse earned skills) | Low |
| v2.2 | Corporate/Placement partner portal (recruiters verify at scale) | High |
| v2.3 | Instructor application portal (open to external educators) | Medium |
| v2.4 | Multilingual courses (Hindi, Marathi, Tamil) | Medium |
| v3.0 | Accredited partner certifications (tie-up with colleges) | High |

---

## 28. Appendix — Certificate Field Specification

Below is the complete field specification snapshot that MUST be stored in the `certificates` table and rendered on the certificate PDF and verification page.

```json
{
  "certificate_id": "KIRI-2026-A7F3D291",
  "issued_by": "Kiri AI Learning",
  "issued_by_tagline": "A division of Kiri App — Student Development Platform",
  "platform_url": "https://kiriapp.com",
  "verify_url": "https://verify.kiriapp.com/cert/KIRI-2026-A7F3D291",

  "learner": {
    "full_name": "Priya Sharma",
    "user_type": "Student",
    "college": "Pune Institute of Computer Technology",
    "city": "Pune, Maharashtra"
  },

  "course": {
    "title": "Prompt Engineering Masterclass",
    "category": "Generative AI",
    "sub_category": "Prompt Engineering",
    "level": "Intermediate",
    "duration_hours": 4,
    "instructor_name": "John Doe",
    "instructor_title": "AI Research Lead"
  },

  "completion": {
    "completed_at": "2026-06-08T14:32:00Z",
    "final_score_percent": 87,
    "passed": true
  },

  "sponsors": [
    {
      "name": "TechCorp India",
      "logo_url": "https://cdn.kiriapp.com/sponsors/techcorp.svg",
      "tier": "gold",
      "website": "https://techcorp.in"
    }
  ],

  "integrity": {
    "signature_algorithm": "RSA-SHA256",
    "signature_hash": "3046022100e3b0c4429...truncated",
    "public_key_url": "https://verify.kiriapp.com/.well-known/cert-pubkey.pem",
    "signed_at": "2026-06-08T14:32:05Z"
  }
}
```

---

*End of Document*

**Document maintained by:** Kiri App Core Team
**Next Review Date:** August 2026
**Feedback:** support@kiriapp.com | github.com/kriss2012/KiriApp

---
> Kiri AI Learning — Free. Verifiable. Trusted. 🎓
