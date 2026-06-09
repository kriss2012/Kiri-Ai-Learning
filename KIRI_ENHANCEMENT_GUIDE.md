# 🚀 Kiri AI Learning — Complete Enhancement Guide

> **Repository:** https://github.com/kriss2012/Kiri-Ai-Learning  
> **Stack:** Next.js 16 · React 19 · Express.js · TypeScript · Prisma · SQLite  
> **Guide Version:** 1.0 · June 2026

---

## Table of Contents

1. [Critical Logic Bugs to Fix First](#1-critical-logic-bugs-to-fix-first)
2. [Backend Architecture Enhancements](#2-backend-architecture-enhancements)
3. [Frontend UI/UX Enhancements](#3-frontend-uiux-enhancements)
4. [Course Content — Free Copyright-Free Resources](#4-course-content--free-copyright-free-resources)
5. [Video Content — Free & Embeddable Sources](#5-video-content--free--embeddable-sources)
6. [Document & Reading Material Sources](#6-document--reading-material-sources)
7. [Assessment Engine Fixes](#7-assessment-engine-fixes)
8. [Certificate System Enhancements](#8-certificate-system-enhancements)
9. [Progress Tracking Fixes](#9-progress-tracking-fixes)
10. [Security Hardening](#10-security-hardening)
11. [Performance Optimisations](#11-performance-optimisations)
12. [New Features to Add](#12-new-features-to-add)
13. [Implementation Roadmap](#13-implementation-roadmap)

---

## 1. Critical Logic Bugs to Fix First

These are the highest-priority issues — fix these before any UI work.

---

### 🔴 BUG-01: Anti-Skip Heartbeat Race Condition

**File:** `backend/src/controllers/lessonController.ts`

**Problem:** The wall-clock vs playhead comparison uses `Date.now()` on each heartbeat, but the `lastHeartbeatAt` timestamp is only written _after_ the current request completes. Under network latency, two simultaneous heartbeats from the same session can both pass the anti-skip check and double-count watch time.

**Fix:**

```typescript
// WRONG — current approach
const elapsed = (Date.now() - lesson.lastHeartbeatAt) / 1000;
if (playheadDelta > elapsed * 1.2) { /* skip detected */ }

// CORRECT — use atomic upsert with version lock
await prisma.$transaction(async (tx) => {
  const progress = await tx.lessonProgress.findUniqueOrThrow({
    where: { userId_lessonId: { userId, lessonId } },
  });
  
  const wallClockElapsed = (Date.now() - progress.lastHeartbeatAt.getTime()) / 1000;
  const playheadDelta = playheadPosition - progress.lastPosition;
  
  if (playheadDelta > wallClockElapsed * 1.25) {
    // Cap addition — don't reject, just don't credit the skip
    allowedDelta = wallClockElapsed;
  } else {
    allowedDelta = playheadDelta;
  }
  
  await tx.lessonProgress.update({
    where: { id: progress.id },
    data: {
      watchSeconds: { increment: Math.max(0, allowedDelta) },
      lastPosition: playheadPosition,
      lastHeartbeatAt: new Date(),
    },
  });
});
```

---

### 🔴 BUG-02: Course Completion Triggers on Client State Alone

**File:** `frontend/src/app/learn/[slug]/page.tsx`

**Problem:** The frontend calls `POST /v1/lessons/:id/complete` based on a client-side `videoEnded` event. A user can fire this manually via DevTools without watching the video.

**Fix (Backend):** The `/complete` endpoint must re-validate watch percentage from the DB, not trust the client:

```typescript
// In lessonController.ts — complete handler
export async function completeLesson(req, res) {
  const progress = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: req.user.id, lessonId: req.params.id } }
  });
  
  const lesson = await prisma.lesson.findUniqueOrThrow({ where: { id: req.params.id } });
  
  if (lesson.type === 'VIDEO') {
    const watchPercent = (progress?.watchSeconds ?? 0) / lesson.durationSeconds;
    if (watchPercent < 0.80) {
      return res.status(403).json({ 
        error: 'INSUFFICIENT_WATCH_TIME',
        message: `Must watch at least 80% of video. Current: ${Math.round(watchPercent * 100)}%`
      });
    }
  }
  
  // Only now mark complete
  await prisma.lessonProgress.upsert({ ... });
}
```

---

### 🔴 BUG-03: Final Assessment Retake Window Not Enforced

**File:** `backend/src/controllers/quizController.ts`

**Problem:** The PRD specifies a 24-hour cooldown and max 3 attempts per 7-day window for the Final Assessment, but the current implementation only checks attempt count without a time-based window.

**Fix:**

```typescript
export async function startQuiz(req, res) {
  const quiz = await prisma.quiz.findUniqueOrThrow({ where: { id: req.params.id } });
  
  if (quiz.type === 'FINAL_ASSESSMENT') {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId: req.user.id,
        quizId: quiz.id,
        startedAt: { gte: sevenDaysAgo },
      },
      orderBy: { startedAt: 'desc' },
    });
    
    if (recentAttempts.length >= 3) {
      return res.status(429).json({
        error: 'MAX_ATTEMPTS_REACHED',
        nextAvailableAt: new Date(recentAttempts[2].startedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
      });
    }
    
    const lastAttempt = recentAttempts[0];
    if (lastAttempt && !lastAttempt.passed) {
      const cooldownEnd = new Date(lastAttempt.submittedAt.getTime() + 24 * 60 * 60 * 1000);
      if (new Date() < cooldownEnd) {
        return res.status(429).json({ error: 'COOLDOWN_ACTIVE', cooldownEnd });
      }
    }
  }
  // Proceed to create attempt...
}
```

---

### 🔴 BUG-04: Certificate Issued Without Server-Side Completion Verification

**File:** `backend/src/services/certificateService.ts`

**Problem:** The certificate generation is triggered directly from the `/lessons/:id/complete` handler without independently re-checking all course completion criteria. If any upstream check fails silently, a certificate could be issued for a partially completed course.

**Fix — Separate verification step:**

```typescript
export async function verifyCourseCompletion(userId: string, courseId: string): Promise<VerificationResult> {
  const course = await prisma.course.findUniqueOrThrow({
    where: { id: courseId },
    include: {
      modules: {
        include: {
          lessons: true,
          quizzes: { where: { type: 'MODULE_QUIZ' } },
        },
      },
      finalAssessment: true,
    },
  });
  
  // Check 1: All lessons completed
  const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
  const completedLessons = await prisma.lessonProgress.findMany({
    where: { userId, lessonId: { in: allLessonIds }, status: 'COMPLETED' },
  });
  if (completedLessons.length < allLessonIds.length) {
    return { passed: false, reason: 'INCOMPLETE_LESSONS' };
  }
  
  // Check 2: Final assessment passed
  const finalAttempt = await prisma.quizAttempt.findFirst({
    where: { userId, quizId: course.finalAssessment.id, passed: true },
  });
  if (!finalAttempt) return { passed: false, reason: 'FINAL_ASSESSMENT_NOT_PASSED' };
  
  // Check 3: Email verified
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.emailVerified) return { passed: false, reason: 'EMAIL_NOT_VERIFIED' };
  
  // Check 4: Anti-fraud — minimum time (5% of course hours)
  const enrollment = await prisma.enrollment.findUniqueOrThrow({
    where: { userId_courseId: { userId, courseId } },
  });
  const minSeconds = course.durationHours * 3600 * 0.05;
  const totalWatchSeconds = completedLessons.reduce((sum, l) => sum + l.watchSeconds, 0);
  if (totalWatchSeconds < minSeconds) {
    return { passed: false, reason: 'MINIMUM_TIME_NOT_MET' };
  }
  
  return { passed: true };
}
```

---

### 🟡 BUG-05: Mock Login Available in Production Build

**File:** `backend/src/routes/authRoutes.ts`

**Problem:** `POST /v1/auth/mock-login` returns full JWT tokens for any role without authentication. This is exposed in the production build.

**Fix:**

```typescript
// authRoutes.ts
if (process.env.NODE_ENV === 'development' || process.env.ENABLE_MOCK_AUTH === 'true') {
  router.post('/mock-login', mockLoginHandler);
} else {
  router.post('/mock-login', (req, res) => res.status(404).json({ error: 'Not found' }));
}
```

---

### 🟡 BUG-06: SQLite → PostgreSQL Migration Needed for Production

**Current:** `DATABASE_URL="file:./dev.db"` — SQLite cannot handle concurrent writes in production.

**Action:** Migrate to PostgreSQL before any real users. The Prisma schema supports this with a one-line change.

```env
# .env — production
DATABASE_URL="postgresql://user:password@host:5432/kiri_learning"
```

Then run:
```bash
npx prisma migrate dev --name "init"
npx prisma db seed
```

---

## 2. Backend Architecture Enhancements

### 2.1 Add Redis Caching Layer

Install and configure Redis for course catalog and certificate verification caches:

```bash
npm install ioredis
```

```typescript
// src/lib/cache.ts
import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function getCached<T>(key: string, fetcher: () => Promise<T>, ttlSeconds = 300): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const fresh = await fetcher();
  await redis.setex(key, ttlSeconds, JSON.stringify(fresh));
  return fresh;
}

// Usage in courseController.ts
export async function getCourses(req, res) {
  const courses = await getCached('courses:published', () =>
    prisma.course.findMany({ where: { status: 'PUBLISHED' }, include: { instructor: true, sponsors: true } }),
    600 // 10 minutes
  );
  return res.json(courses);
}
```

### 2.2 Add Proper Error Handling Middleware

```typescript
// src/middleware/errorHandler.ts
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  
  // Log to monitoring (Sentry)
  if (statusCode >= 500) console.error('[ERROR]', err);
  
  return res.status(statusCode).json({
    error: err.code || 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred. Please try again.' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
```

### 2.3 Add Rate Limiting

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
export const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });

// Auth endpoints — stricter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many login attempts. Try again in 15 minutes.' },
});

// Heartbeat — generous (every 15s per user is fine)
export const heartbeatLimiter = rateLimit({ windowMs: 10 * 1000, max: 5 });
```

### 2.4 Input Validation with Zod

```bash
npm install zod
```

```typescript
// src/validators/lessonValidator.ts
import { z } from 'zod';

export const heartbeatSchema = z.object({
  playheadPosition: z.number().min(0).max(86400), // max 24h video
  sessionId: z.string().uuid(),
});

// Use in controller
const parsed = heartbeatSchema.safeParse(req.body);
if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT', issues: parsed.error.issues });
```

---

## 3. Frontend UI/UX Enhancements

### 3.1 Course Catalog Page (`/courses`)

**Current issues:** No loading states, no error handling, filters don't persist in URL.

**Enhancements:**

```tsx
// /app/courses/page.tsx
'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

// ✅ Persist filters in URL for shareability
export default function CoursesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const category = searchParams.get('category') || 'all';
  const level = searchParams.get('level') || 'all';
  const search = searchParams.get('q') || '';
  
  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    value === 'all' ? params.delete(key) : params.set(key, value);
    router.push(`/courses?${params.toString()}`);
  }
  
  return (
    <div className="min-h-screen bg-[#0B0F19]">
      {/* Search bar */}
      <input
        className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/50 
                   border border-white/20 focus:border-[#F59E0B] focus:outline-none"
        placeholder="Search courses..."
        defaultValue={search}
        onChange={(e) => updateFilter('q', e.target.value)}
      />
      
      {/* Category tabs */}
      <div className="flex gap-2 mt-4">
        {['all', 'generative_ai', 'employability'].map(cat => (
          <button
            key={cat}
            onClick={() => updateFilter('category', cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all
              ${category === cat 
                ? 'bg-[#F59E0B] text-black' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
          >
            {cat === 'all' ? 'All Courses' 
              : cat === 'generative_ai' ? '🤖 Generative AI' 
              : '💼 Employability'}
          </button>
        ))}
      </div>
      
      {/* Course grid with skeleton loading */}
      <Suspense fallback={<CourseGridSkeleton />}>
        <CourseGrid category={category} level={level} search={search} />
      </Suspense>
    </div>
  );
}

// Skeleton loader component
function CourseGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse bg-white/10 rounded-xl h-72" />
      ))}
    </div>
  );
}
```

---

### 3.2 Video Player Component

**Replace placeholder:** The current player uses a basic HTML5 element without progress tracking UI.

```tsx
// components/VideoPlayer.tsx
'use client';
import { useRef, useEffect, useCallback } from 'react';

interface VideoPlayerProps {
  lessonId: string;
  videoUrl: string;
  startPosition?: number;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
}

export function VideoPlayer({ lessonId, videoUrl, startPosition = 0, onProgress, onComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const heartbeatRef = useRef<NodeJS.Timeout>();
  const sessionId = useRef(crypto.randomUUID());
  
  // Send heartbeat every 15 seconds
  const sendHeartbeat = useCallback(async () => {
    if (!videoRef.current) return;
    const position = videoRef.current.currentTime;
    
    await fetch(`/api/lessons/${lessonId}/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playheadPosition: position, sessionId: sessionId.current }),
    }).catch(console.error);
  }, [lessonId]);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Restore last position
    video.currentTime = startPosition;
    
    const handlePlay = () => {
      heartbeatRef.current = setInterval(sendHeartbeat, 15000);
    };
    
    const handlePause = () => {
      clearInterval(heartbeatRef.current);
      sendHeartbeat(); // Send final position on pause
    };
    
    const handleTimeUpdate = () => {
      const percent = (video.currentTime / video.duration) * 100;
      onProgress?.(percent);
    };
    
    const handleEnded = async () => {
      clearInterval(heartbeatRef.current);
      await sendHeartbeat();
      
      // Let backend validate — don't assume completion
      const res = await fetch(`/api/lessons/${lessonId}/complete`, { method: 'POST' });
      if (res.ok) onComplete?.();
    };
    
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    
    return () => {
      clearInterval(heartbeatRef.current);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [lessonId, sendHeartbeat, startPosition, onProgress, onComplete]);
  
  return (
    <div className="relative w-full bg-black rounded-xl overflow-hidden aspect-video">
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        controlsList="nodownload"
        className="w-full h-full"
        playsInline
      />
    </div>
  );
}
```

---

### 3.3 Dashboard Page Enhancements

**Add learning streak, progress ring, and recent activity:**

```tsx
// components/LearningStreak.tsx
export function LearningStreak({ streak }: { streak: number }) {
  return (
    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 
                    rounded-full px-4 py-2">
      <span className="text-2xl">{streak > 0 ? '🔥' : '❄️'}</span>
      <div>
        <p className="text-amber-400 font-bold text-sm">{streak} day streak</p>
        <p className="text-white/50 text-xs">Keep learning daily!</p>
      </div>
    </div>
  );
}

// components/CircularProgress.tsx
export function CircularProgress({ percent, size = 80 }: { percent: number; size?: number }) {
  const r = (size / 2) - 8;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;
  
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="white" strokeOpacity={0.1} strokeWidth={6}/>
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="#F59E0B" strokeWidth={6}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
}
```

---

### 3.4 Certificate Verification Page

**Make it mobile-first and employer-ready:**

```tsx
// app/verify/[certId]/page.tsx
import type { Metadata } from 'next';

// Server-side OG tags for LinkedIn sharing
export async function generateMetadata({ params }): Promise<Metadata> {
  const cert = await getCertificate(params.certId);
  return {
    title: `${cert.learnerName} — ${cert.courseTitle} | Kiri AI Learning`,
    description: `Verified certificate issued by Kiri AI Learning on ${cert.issuedAt}.`,
    openGraph: {
      title: `Certificate: ${cert.courseTitle}`,
      description: `Issued to ${cert.learnerName} — Verified ✅`,
      images: [{ url: cert.ogImageUrl }],
    },
  };
}

export default async function VerifyPage({ params }) {
  const result = await verifyCertificate(params.certId);
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0B0F19] to-[#1a2035] px-4 py-8">
      {/* STATUS BANNER — must be above the fold on mobile */}
      <div className={`rounded-2xl p-5 mb-6 text-center
        ${result.valid ? 'bg-green-500/15 border-2 border-green-400' : 'bg-red-500/15 border-2 border-red-400'}`}>
        <span className="text-4xl">{result.valid ? '✅' : '❌'}</span>
        <h1 className={`text-xl font-bold mt-2 ${result.valid ? 'text-green-400' : 'text-red-400'}`}>
          {result.valid ? 'Certificate Verified — Authentic' : 'Certificate Not Found or Revoked'}
        </h1>
        <p className="text-white/50 text-sm mt-1">
          Verified on {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
        </p>
      </div>
      
      {result.valid && (
        <>
          {/* Learner & Course info */}
          <section className="bg-white/5 rounded-2xl p-6 mb-4">
            <p className="text-white/50 text-sm uppercase tracking-wide">Certificate issued to</p>
            <h2 className="text-2xl font-bold text-white mt-1">{result.cert.learnerName}</h2>
            <p className="text-[#F59E0B] text-lg mt-1">{result.cert.courseTitle}</p>
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div><p className="text-white/50">Issued</p><p className="text-white">{result.cert.issuedAt}</p></div>
              <div><p className="text-white/50">Score</p><p className="text-white">{result.cert.score}%</p></div>
              <div><p className="text-white/50">Level</p><p className="text-white">{result.cert.level}</p></div>
              <div><p className="text-white/50">Duration</p><p className="text-white">{result.cert.durationHours}h</p></div>
            </div>
          </section>
          
          {/* Social sharing */}
          <section className="flex gap-3 flex-wrap">
            <a href={getLinkedInShareUrl(result.cert)} target="_blank"
               className="flex-1 min-w-32 bg-[#0077B5] text-white rounded-xl py-3 px-4 text-center 
                          text-sm font-medium hover:bg-[#005a8a] transition-colors">
              Add to LinkedIn
            </a>
            <button onClick={() => navigator.share?.({ url: window.location.href })}
               className="flex-1 min-w-32 bg-white/10 text-white rounded-xl py-3 px-4 text-center 
                          text-sm font-medium hover:bg-white/20 transition-colors">
              Share Certificate
            </button>
          </section>
        </>
      )}
    </main>
  );
}
```

---

### 3.5 Global UI Improvements Checklist

| Issue | Fix |
|-------|-----|
| No loading spinners | Add `<Suspense>` boundaries + skeleton screens on all async pages |
| No toast notifications | Install `react-hot-toast` — show on enroll, complete, certificate ready |
| No empty states | Add illustrated empty states for "no courses", "no certificates" |
| No 404 page | Create `app/not-found.tsx` with brand styling |
| No error boundary | Create `app/error.tsx` with recovery button |
| Mobile nav overflow | Add hamburger menu for screens < 768px |
| No back navigation in /learn | Add "← Back to course" breadcrumb in lesson view |
| No keyboard accessibility | Add `tabIndex`, `aria-label`, focus rings to all interactive elements |

---

## 4. Course Content — Free Copyright-Free Resources

All resources below are **openly licensed** (CC BY, CC0, or MIT). You may embed, use, and adapt them freely.

---

### 4.1 Generative AI Courses

#### Course 1: Introduction to Generative AI

**Official Free Resources:**

| Resource | URL | License | Use As |
|----------|-----|---------|--------|
| Google — Introduction to Generative AI | https://www.cloudskillsboost.google/course_templates/536 | Free (Google) | Reference curriculum |
| AWS — Generative AI Fundamentals | https://explore.skillbuilder.aws/learn/course/external/view/elearning/17763/generative-ai-fundamentals | Free (AWS) | Reference curriculum |
| Stanford CS324 — LLMs (lecture notes) | https://stanford-cs324.github.io/winter2022/lectures/ | CC BY 4.0 | Reading material PDFs |
| fast.ai — Practical Deep Learning | https://course.fast.ai | Apache 2.0 | Embed/reference |
| 3Blue1Brown — Neural Networks series | https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi | Free (YouTube) | Embed in lessons |

**Copyright-Free Datasets for Examples:**

| Resource | URL | License |
|----------|-----|---------|
| Common Crawl | https://commoncrawl.org | CC0 |
| The Pile (EleutherAI) | https://pile.eleuther.ai | MIT |
| Wikipedia Dumps | https://dumps.wikimedia.org | CC BY-SA |

---

#### Course 2: Prompt Engineering Masterclass

**Free Guides & Documents:**

| Resource | URL | License |
|----------|-----|---------|
| Anthropic Prompt Engineering Guide | https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview | Free public docs |
| OpenAI Prompt Engineering Guide | https://platform.openai.com/docs/guides/prompt-engineering | Free public docs |
| DAIR.AI Prompt Engineering Guide (GitHub) | https://github.com/dair-ai/Prompt-Engineering-Guide | MIT License |
| Learn Prompting | https://learnprompting.org | MIT License |

**Embed Directly in Lessons (MIT):**
```
https://raw.githubusercontent.com/dair-ai/Prompt-Engineering-Guide/main/README.md
```

---

#### Course 3: Python for AI Beginners

**Free Video Content (CC / Free):**

| Resource | URL | License |
|----------|-----|---------|
| Python.org Official Tutorials | https://docs.python.org/3/tutorial/ | PSF (free) |
| CS50P — Harvard Python (YouTube) | https://www.youtube.com/playlist?list=PLhQjrBD2T381eVGMte0GzdLx85WQHPpJp | Free |
| freeCodeCamp Python Full Course | https://www.youtube.com/watch?v=rfscVS0vtbw | Free |
| Kaggle Python Course | https://www.kaggle.com/learn/python | Free |
| Python Exercises (exercism.io) | https://exercism.org/tracks/python | MIT |

---

#### Course 4: Large Language Models Explained

**Free Academic Resources:**

| Resource | URL | License |
|----------|-----|---------|
| Attention Is All You Need (paper) | https://arxiv.org/abs/1706.03762 | arXiv (free) |
| Illustrated Transformer (Jay Alammar) | https://jalammar.github.io/illustrated-transformer/ | CC BY-NC-SA |
| Hugging Face NLP Course | https://huggingface.co/learn/nlp-course | Apache 2.0 |
| Understanding Large Language Models | https://arxiv.org/abs/2307.05782 | arXiv (free) |

---

#### Course 5: AI Ethics & Responsible Use

**Free Resources:**

| Resource | URL | License |
|----------|-----|---------|
| UNESCO AI Ethics Recommendation | https://www.unesco.org/en/artificial-intelligence/recommendation-ethics | CC BY-SA 3.0 |
| EU AI Act Summary (Euractiv) | https://www.europarl.europa.eu/topics/en/article/20230601STO93804/eu-ai-act | Free public |
| MIT AI Ethics course | https://ocw.mit.edu | CC BY-NC-SA 4.0 |
| Partnership on AI resources | https://partnershiponai.org/resources/ | CC BY 4.0 |

---

### 4.2 Employability Courses

#### Course 6: Resume & LinkedIn Mastery

**Free Resources:**

| Resource | URL | License |
|----------|-----|---------|
| Harvard Resume Guide | https://ocs.fas.harvard.edu/files/ocs/files/hes-resume-cover-letter-guide.pdf | Free public |
| LinkedIn Official Guide | https://business.linkedin.com/talent-solutions/resources | Free |
| NU Resume Template (CC0) | https://resumake.io | MIT |
| ATS Resume Checker | https://www.jobscan.co (free tier) | Free tier |

---

#### Course 7: Communication Skills

**Free Video & Text:**

| Resource | URL | License |
|----------|-----|---------|
| Yale "Science of Well-Being" (Coursera free audit) | https://www.coursera.org/learn/the-science-of-well-being | Free audit |
| TED Talks on Communication | https://www.ted.com/topics/communication | Free embed |
| Toastmasters Speech Guides | https://www.toastmasters.org/resources | Free public |
| Business Writing Tips (Purdue OWL) | https://owl.purdue.edu/owl/subject_specific_writing/professional_technical_writing/ | Free public |

---

## 5. Video Content — Free & Embeddable Sources

### 5.1 Directly Embeddable YouTube Playlists (Education/CC)

Use the YouTube embed API: `https://www.youtube.com/embed/{videoId}?rel=0&modestbranding=1`

| Topic | Playlist/Video | Channel |
|-------|---------------|---------|
| Intro to AI | https://youtube.com/playlist?list=PLoROMvodv4rOca_Ovz1DvdtWuz8BfSWL2 | Stanford |
| ML for Beginners | https://youtube.com/playlist?list=PLblh5JKOoLUICTaGLRoHQDuF_7q2GfuJF | StatQuest |
| Neural Networks | https://youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi | 3Blue1Brown |
| Python Basics | https://youtube.com/playlist?list=PL-osiE80TeTskrapNbzXhwoFUiLCjGgY7 | Corey Schafer |
| NLP with HuggingFace | https://youtube.com/playlist?list=PLo2EIpI_JMQuQ_0Dy-HnTkYiRKa83XkBG | HuggingFace |
| ChatGPT Tutorials | https://www.youtube.com/@TechWithTim | Tech With Tim |
| Prompt Engineering | https://www.youtube.com/watch?v=_ZvnD73m40o | DeepLearning.AI |

### 5.2 How to Embed Properly in the App

```tsx
// components/ExternalVideoLesson.tsx
// For YouTube-hosted free educational content
export function YoutubeEmbed({ videoId, startAt }: { videoId: string; startAt?: number }) {
  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?start=${startAt || 0}&rel=0&modestbranding=1`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
        title="Lesson Video"
      />
    </div>
  );
}

// Note: For YouTube embeds, you cannot use the heartbeat progress tracking.
// Use a "Mark as Watched" button the user clicks after finishing.
// Only self-hosted videos should use the heartbeat system.
```

### 5.3 Free Video Hosting for Self-Hosted Course Videos

| Platform | Free Tier | Best For |
|----------|-----------|---------|
| Cloudflare Stream | $5/1000 min | Production — HLS streaming |
| Bunny.net | $0.005/GB | Budget option — CDN+HLS |
| Mux.com | Free dev tier | Dev/testing — great API |
| Vimeo Free | 5GB total | Small courses |
| Archive.org | Unlimited | Public domain content only |

---

## 6. Document & Reading Material Sources

### 6.1 Free Reading Materials (Directly Usable)

**AI & Machine Learning Textbooks (Free Online):**

| Book | URL | License |
|------|-----|---------|
| Deep Learning (Goodfellow et al.) | https://www.deeplearningbook.org | Free online |
| Dive into Deep Learning | https://d2l.ai | CC BY-SA 4.0 |
| Neural Networks and Deep Learning (Nielsen) | http://neuralnetworksanddeeplearning.com | CC BY-NC 3.0 |
| Mathematics for Machine Learning | https://mml-book.github.io | CC BY-NC-SA 4.0 |
| Probabilistic ML (Murphy) | https://probml.github.io/pml-book/ | Free for non-commercial |
| The StatQuest Illustrated Guide | https://statquest.org | Free videos |

**Career Development (Free):**

| Book/Guide | URL | License |
|-----------|-----|---------|
| What Color Is Your Parachute | Library version | Copyright (borrow only) |
| Getting to Yes (Fisher & Ury) | Library | Copyright |
| Harvard Negotiation Materials | https://www.pon.harvard.edu/free-resources | Free articles |
| India Startup Handbook | https://nasscom.in/reports | Free download |

### 6.2 How to Serve PDFs in Lessons

```typescript
// backend: watermark user email on PDF download
import PDFLib from 'pdf-lib';

export async function watermarkPdf(pdfBytes: Uint8Array, userEmail: string): Promise<Uint8Array> {
  const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  
  for (const page of pages) {
    const { width, height } = page.getSize();
    page.drawText(`Downloaded by: ${userEmail}`, {
      x: width / 4,
      y: height / 2,
      size: 16,
      color: PDFLib.rgb(0.8, 0.8, 0.8),
      opacity: 0.3,
      rotate: PDFLib.degrees(45),
    });
  }
  
  return pdfDoc.save();
}
```

---

## 7. Assessment Engine Fixes

### 7.1 Question Shuffling (Currently Missing)

```typescript
// quizController.ts
export async function getQuiz(req, res) {
  const quiz = await prisma.quiz.findUniqueOrThrow({
    where: { id: req.params.id },
    include: { questions: { include: { options: true } } },
  });
  
  // ✅ Shuffle questions and options per request
  const shuffled = {
    ...quiz,
    questions: shuffleArray(quiz.questions).map(q => ({
      ...q,
      options: shuffleArray(q.options).map(o => ({
        id: o.id,
        text: o.text,
        // ✅ NEVER send isCorrect to client
      })),
    })),
  };
  
  return res.json(shuffled);
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
```

### 7.2 Quiz Timer Component (Frontend)

```tsx
// components/QuizTimer.tsx
'use client';
import { useEffect, useState } from 'react';

export function QuizTimer({ durationSeconds, onExpire }: { durationSeconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(durationSeconds);
  
  useEffect(() => {
    if (remaining <= 0) { onExpire(); return; }
    const timer = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, onExpire]);
  
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isUrgent = remaining < 120; // last 2 minutes
  
  return (
    <div className={`flex items-center gap-2 font-mono text-lg font-bold px-4 py-2 rounded-full
      ${isUrgent ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/10 text-white'}`}>
      ⏱ {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}
```

### 7.3 Answer Explanation UI (Currently Missing)

After quiz submission, show explanation for each answer:

```tsx
// components/QuizResults.tsx
export function QuizResults({ attempt, questions }) {
  return (
    <div className="space-y-4">
      {/* Score summary */}
      <div className="text-center p-6 bg-white/5 rounded-2xl">
        <p className="text-5xl font-bold text-[#F59E0B]">{attempt.scorePercent}%</p>
        <p className="text-white/70 mt-2">
          {attempt.passed ? '🎉 Passed!' : '❌ Not passed — review and retry'}
        </p>
      </div>
      
      {/* Per-question breakdown */}
      {questions.map((q, i) => {
        const userAnswer = attempt.answers[q.id];
        const correct = q.options.find(o => o.isCorrect);
        const isRight = userAnswer === correct?.id;
        
        return (
          <div key={q.id} className={`p-4 rounded-xl border ${isRight ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
            <p className="text-white font-medium">{i + 1}. {q.text}</p>
            <div className="mt-2 space-y-1">
              {q.options.map(o => (
                <div key={o.id} className={`px-3 py-2 rounded-lg text-sm
                  ${o.isCorrect ? 'bg-green-500/20 text-green-300' 
                    : o.id === userAnswer ? 'bg-red-500/20 text-red-300' 
                    : 'text-white/50'}`}>
                  {o.isCorrect ? '✓ ' : o.id === userAnswer ? '✗ ' : '  '}{o.text}
                </div>
              ))}
            </div>
            {q.explanation && (
              <p className="mt-3 text-sm text-white/60 bg-white/5 rounded-lg p-3">
                💡 {q.explanation}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

---

## 8. Certificate System Enhancements

### 8.1 Improve PDF Certificate Design

```typescript
// backend/src/services/certificateService.ts
// Enhanced PDFKit certificate with proper branding

import PDFDocument from 'pdfkit';

export async function generateCertificatePdf(cert: CertificateData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const buffers: Buffer[] = [];
    
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
    
    const W = 841.89, H = 595.28; // A4 landscape points
    
    // Background
    doc.rect(0, 0, W, H).fill('#0B0F19');
    
    // Gold border
    doc.rect(20, 20, W - 40, H - 40).lineWidth(2).strokeColor('#F59E0B').stroke();
    doc.rect(25, 25, W - 50, H - 50).lineWidth(0.5).strokeColor('#F59E0B').opacity(0.4).stroke();
    doc.opacity(1);
    
    // Header: Platform name
    doc.fontSize(14).fillColor('#F59E0B').font('Helvetica-Bold')
       .text('KIRI AI LEARNING', 0, 50, { align: 'center' });
    
    // Title
    doc.fontSize(28).fillColor('#FFFFFF').font('Helvetica-Bold')
       .text('CERTIFICATE OF COMPLETION', 0, 80, { align: 'center' });
    
    // Divider
    doc.moveTo(W/2 - 150, 120).lineTo(W/2 + 150, 120)
       .strokeColor('#F59E0B').lineWidth(1).stroke();
    
    // Body
    doc.fontSize(12).fillColor('rgba(255,255,255,0.7)').font('Helvetica')
       .text('This is to certify that', 0, 140, { align: 'center' });
    
    doc.fontSize(32).fillColor('#FFFFFF').font('Helvetica-Bold')
       .text(cert.learnerName, 0, 165, { align: 'center' });
    
    doc.fontSize(12).fillColor('rgba(255,255,255,0.7)').font('Helvetica')
       .text('has successfully completed the course', 0, 215, { align: 'center' });
    
    doc.fontSize(20).fillColor('#F59E0B').font('Helvetica-Bold')
       .text(cert.courseTitle, 0, 240, { align: 'center' });
    
    // Meta row
    const metaY = 295;
    doc.fontSize(11).fillColor('rgba(255,255,255,0.6)').font('Helvetica');
    doc.text(`Score: ${cert.score}%`, 100, metaY);
    doc.text(`Level: ${cert.level}`, 280, metaY);
    doc.text(`Duration: ${cert.durationHours}h`, 460, metaY);
    doc.text(`Date: ${cert.issuedDate}`, 610, metaY);
    
    // Footer: Certificate ID + QR placeholder
    doc.fontSize(9).fillColor('rgba(255,255,255,0.4)')
       .text(`Certificate ID: ${cert.certificateId}`, 60, H - 70);
    doc.text(`Verify: verify.kiriapp.com/cert/${cert.certificateId}`, 60, H - 55);
    
    // QR code (pre-generated as PNG buffer)
    if (cert.qrBuffer) {
      doc.image(cert.qrBuffer, W - 130, H - 140, { width: 90, height: 90 });
    }
    
    doc.end();
  });
}
```

### 8.2 Certificate Download with Presigned URL

```typescript
// certificateController.ts
import { createPresignedUrl } from '../lib/storage';

export async function downloadCertificate(req, res) {
  const cert = await prisma.certificate.findFirst({
    where: { certificateId: req.params.certId, userId: req.user.id, status: 'ACTIVE' },
  });
  
  if (!cert) return res.status(404).json({ error: 'Certificate not found' });
  
  // Generate 1-hour presigned URL
  const downloadUrl = await createPresignedUrl(cert.pdfStoragePath, 3600);
  
  // Log download
  await prisma.certificateAuditLog.create({
    data: { certificateId: cert.id, event: 'DOWNLOADED', ipHash: hashIp(req.ip) },
  });
  
  return res.json({ downloadUrl, expiresIn: 3600 });
}
```

---

## 9. Progress Tracking Fixes

### 9.1 Add Lesson State Persistence Across Devices

```typescript
// The lessonProgress table needs a lastPositionSeconds column (add via migration)
// backend: always return lastPositionSeconds in lesson API

export async function getLessonProgress(req, res) {
  const progress = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: req.user.id, lessonId: req.params.id } },
  });
  
  return res.json({
    status: progress?.status || 'NOT_STARTED',
    watchPercent: progress ? (progress.watchSeconds / req.lesson.durationSeconds) * 100 : 0,
    lastPosition: progress?.lastPositionSeconds || 0,
    completedAt: progress?.completedAt,
  });
}
```

### 9.2 Learning Streak Calculation

```typescript
// backend/src/services/streakService.ts
export async function calculateStreak(userId: string): Promise<number> {
  const activities = await prisma.lessonProgress.findMany({
    where: { userId, status: 'COMPLETED' },
    select: { completedAt: true },
    orderBy: { completedAt: 'desc' },
  });
  
  if (activities.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const uniqueDays = new Set(
    activities.map(a => {
      const d = new Date(a.completedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );
  
  let streak = 0;
  let checkDate = today.getTime();
  
  while (uniqueDays.has(checkDate) || uniqueDays.has(checkDate - 86400000)) {
    if (uniqueDays.has(checkDate)) streak++;
    checkDate -= 86400000;
    if (streak > 365) break; // safety
  }
  
  return streak;
}
```

---

## 10. Security Hardening

### 10.1 Add Security Headers (Helmet.js)

```bash
npm install helmet
```

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'nonce-{nonce}'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://cdn.kiriapp.com"],
      frameSrc: ["'self'", "https://www.youtube.com"],
      connectSrc: ["'self'", "https://api.kirilearning.com"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));
```

### 10.2 Remove Mock Login from Production

```typescript
// backend/src/routes/authRoutes.ts
const isDev = process.env.NODE_ENV !== 'production';

if (isDev) {
  router.post('/mock-login', mockLoginController);
  console.warn('[WARNING] Mock login endpoint is ENABLED — ensure NODE_ENV=production in deployment');
}
```

### 10.3 Audit Log All Certificate Events

```typescript
// Middleware to auto-log certificate verifications
export async function logCertVerification(req, res, next) {
  const original = res.json.bind(res);
  res.json = (body) => {
    prisma.certificateAuditLog.create({
      data: {
        certificateId: req.params.certId,
        event: 'QR_SCANNED',
        ipHash: crypto.createHash('sha256').update(req.ip).digest('hex'),
        userAgentHash: crypto.createHash('sha256').update(req.headers['user-agent'] || '').digest('hex'),
      },
    }).catch(console.error); // non-blocking
    return original(body);
  };
  next();
}
```

---

## 11. Performance Optimisations

### 11.1 Frontend: Image Optimisation

```tsx
// Always use Next.js Image component — never raw <img>
import Image from 'next/image';

// Course thumbnail
<Image
  src={course.thumbnailUrl}
  alt={course.title}
  width={640}
  height={360}
  className="rounded-xl w-full object-cover"
  placeholder="blur"
  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIi8+"
  priority={index < 3} // prioritise above-fold images
/>
```

### 11.2 API: Add Pagination to Course Lists

```typescript
// GET /v1/courses?page=1&limit=12&category=generative_ai
export async function getCourses(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 12);
  const skip = (page - 1) * limit;
  
  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where: { status: 'PUBLISHED', ...(req.query.category && { category: req.query.category }) },
      skip,
      take: limit,
      select: { id: true, title: true, slug: true, thumbnailUrl: true, level: true, durationHours: true, category: true },
    }),
    prisma.course.count({ where: { status: 'PUBLISHED' } }),
  ]);
  
  return res.json({
    data: courses,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
```

### 11.3 Database: Add Missing Indexes

```prisma
// schema.prisma — add these indexes
model LessonProgress {
  @@index([userId, courseId])
  @@index([userId, status])
}

model Certificate {
  @@index([certificateId])
  @@index([userId])
}

model QuizAttempt {
  @@index([userId, quizId])
  @@index([userId, courseId, startedAt])
}
```

Run: `npx prisma migrate dev --name "add_indexes"`

---

## 12. New Features to Add

### 12.1 Course Bookmarking

```typescript
// schema.prisma
model Bookmark {
  id        String   @id @default(cuid())
  userId    String
  courseId  String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  course    Course   @relation(fields: [courseId], references: [id])
  @@unique([userId, courseId])
}

// POST /v1/courses/:id/bookmark
// DELETE /v1/courses/:id/bookmark
// GET /v1/me/bookmarks
```

### 12.2 In-Lesson Notes

```typescript
model LessonNote {
  id              String   @id @default(cuid())
  userId          String
  lessonId        String
  content         String
  videoTimestamp  Int?     // seconds
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### 12.3 Course Ratings & Reviews

```typescript
model CourseReview {
  id        String   @id @default(cuid())
  userId    String
  courseId  String
  rating    Int      // 1–5
  comment   String?
  createdAt DateTime @default(now())
  @@unique([userId, courseId]) // one review per user per course
}
```

### 12.4 Email Notifications on Completion

```typescript
// Add to certificateService.ts after issuance
import nodemailer from 'nodemailer';

export async function sendCertificateEmail(user: User, cert: Certificate, downloadUrl: string) {
  const transporter = nodemailer.createTransport({ /* SMTP config from env */ });
  
  await transporter.sendMail({
    from: '"Kiri AI Learning" <noreply@kiriapp.com>',
    to: user.email,
    subject: `🎓 Your certificate for "${cert.courseTitleSnapshot}" is ready!`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #0B0F19; color: white; padding: 40px;">
        <h1 style="color: #F59E0B;">Congratulations, ${user.displayName}! 🎉</h1>
        <p>You've successfully completed <strong>${cert.courseTitleSnapshot}</strong>.</p>
        <p>Your score: <strong>${cert.scoreSnapshot}%</strong></p>
        <a href="${downloadUrl}" style="
          display: inline-block; background: #F59E0B; color: black;
          padding: 12px 24px; border-radius: 8px; text-decoration: none;
          font-weight: bold; margin-top: 16px;">
          Download Certificate
        </a>
        <p style="margin-top: 24px; color: #999;">
          Verify at: <a href="${cert.verifyUrl}" style="color: #F59E0B;">${cert.verifyUrl}</a>
        </p>
      </div>
    `,
  });
}
```

---

## 13. Implementation Roadmap

### Sprint 1 — Critical Fixes (Week 1–2)

| Priority | Task | Files Affected |
|----------|------|----------------|
| 🔴 P0 | Fix heartbeat race condition (BUG-01) | `lessonController.ts` |
| 🔴 P0 | Fix client-side completion trigger (BUG-02) | `lessonController.ts`, `VideoPlayer.tsx` |
| 🔴 P0 | Disable mock login in production (BUG-05) | `authRoutes.ts` |
| 🟡 P1 | Fix quiz retake window enforcement (BUG-03) | `quizController.ts` |
| 🟡 P1 | Add server-side completion verification (BUG-04) | `certificateService.ts` |
| 🟡 P1 | Add security headers (Helmet.js) | `app.ts` |

### Sprint 2 — Core UI Fixes (Week 3–4)

| Priority | Task | Files Affected |
|----------|------|----------------|
| 🟡 P1 | Add loading skeletons to all pages | `courses/page.tsx`, `dashboard/page.tsx` |
| 🟡 P1 | Fix video player with proper heartbeat | `components/VideoPlayer.tsx` (new) |
| 🟡 P1 | Add quiz timer and answer explanations | `components/QuizTimer.tsx` (new) |
| 🟢 P2 | Add toast notifications | All pages |
| 🟢 P2 | Fix mobile navigation | `components/Nav.tsx` |
| 🟢 P2 | Persist URL filters on courses page | `courses/page.tsx` |

### Sprint 3 — Content & Assessments (Week 5–6)

| Priority | Task |
|----------|------|
| 🟡 P1 | Populate DB seed with 5 real courses using free resources |
| 🟡 P1 | Add question shuffling to quiz engine |
| 🟡 P1 | Add per-question explanations to quiz results |
| 🟢 P2 | Embed YouTube videos for GenAI courses |
| 🟢 P2 | Add PDF reading lessons from open-license sources |

### Sprint 4 — Certificate & Verification Polish (Week 7–8)

| Priority | Task |
|----------|------|
| 🟡 P1 | Redesign certificate PDF with new layout |
| 🟡 P1 | Make verification page mobile-first |
| 🟡 P1 | Add OpenGraph tags to verification page |
| 🟢 P2 | Add LinkedIn share button |
| 🟢 P2 | Email notification on certificate issuance |

### Sprint 5 — New Features (Week 9–10)

| Priority | Task |
|----------|------|
| 🟢 P2 | Course bookmarking |
| 🟢 P2 | Learning streak display |
| 🟢 P2 | Course ratings & reviews |
| 🟢 P2 | In-lesson notes with timestamp |
| 🔵 P3 | Admin analytics dashboard |

---

## Quick Setup Reference

### Environment Variables (add these missing ones)

```env
# backend/.env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="kiri-ai-learning-local-dev-jwt-secret-key-32-chars-long"
FIREBASE_PROJECT_ID="kiri-app-development"

# NEW — add these
NODE_ENV="development"
REDIS_URL="redis://localhost:6379"
SMTP_HOST="smtp.resend.com"
SMTP_PORT=465
SMTP_USER="resend"
SMTP_PASS="your_resend_api_key"
CERT_PRIVATE_KEY_PATH="./keys/cert_private.pem"
CERT_PUBLIC_KEY_PATH="./keys/cert_public.pem"
STORAGE_BUCKET="kiri-learning-dev"
```

### Generate RSA Keys for Certificate Signing

```bash
mkdir -p backend/keys
openssl genrsa -out backend/keys/cert_private.pem 2048
openssl rsa -in backend/keys/cert_private.pem -pubout -out backend/keys/cert_public.pem
# Add both to .gitignore!
echo "backend/keys/" >> .gitignore
```

---

*Guide prepared June 2026 — covers repository state at github.com/kriss2012/Kiri-Ai-Learning*
