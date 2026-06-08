# 🌟 Kiri AI Learning Platform

Kiri AI is a state-of-the-art educational platform designed to deliver and cryptographically verify student certifications. It employs an advanced anti-fraud progress-tracking framework and RSA-signed verifiable credentials to ensure academic integrity.

---

## 🛠️ Tech Stack & Architecture

*   **Frontend**: Next.js 16 (App Router), Tailwind CSS, Lucide icons, TypeScript.
*   **Backend**: Node.js, Express, TypeScript, Prisma ORM, SQLite database.
*   **Cryptography**: RSA-2048 digital signature generator (SHA-256 integrity checks).
*   **PDF Generation**: Vector-rendered documents via PDFKit embedded with verification QR codes.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have Node.js (v18+) and npm installed.

### 2. Setting Up the Database & Backend
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Generate Prisma clients and build migrations
npx prisma generate
npx prisma db push

# Seed database with courses, modules, lessons, and questions
npx prisma db seed

# Run local development API gateway (runs on http://localhost:5000)
npm run dev
```

### 3. Setting Up the Web Client
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Start Next.js development server (runs on http://localhost:3000)
npm run dev
```

---

## 🛡️ Anti-Fraud Completion Checks

To block users from skipping lectures or spoofing credentials, Kiri AI implements strict backend security controls:

### 1. Video Watch Pacing Heartbeats
*   **Mechanism**: The client player sends heartbeat requests (`POST /v1/lessons/:id/heartbeat`) every 15 seconds containing the current playhead position.
*   **Security Guard**: The backend calculates the difference in wall-clock time between requests and the user's video position delta. If the user skips ahead or hacks the API payload to advance their progress instantenously, the watch timer is capped to the actual elapsed wall-clock seconds.
*   **Completion Condition**: A lecture is marked complete only if the total verified watch time is $\ge 80\%$ of the lesson duration.

### 2. Milestone Passing Enforcement
*   **Checkpoints Requirement**: A course cannot be finished unless **all** module quizzes and the final exam have been completed with passing scores ($\ge 70\%$).
*   **Time-limit checks**: Quiz sessions are tracked with start timestamps. Submissions exceeding the quiz duration limit are automatically disqualified and graded 0%.

### 3. Course Enrollment Duration
*   **Anti-Spam Verification**: The backend requires that the duration between a user's enrollment date and their completion request is at least 5% of the total course hours (e.g., at least 12 minutes for a 4-hour masterclass). Developer/mock user accounts are exempted from this constraint to facilitate debugging.

---

## 🔑 Cryptographic Verifiable Credentials

1. **RSA-2048 Cryptography**: Upon course completion, the backend signs a payload containing the student's name, grade, course title, and completion date using an RSA-2048 private key.
2. **Signature Verification Registry**: The public verification route (`/verify/:cert_id?sig={signature}`) validates the digital signature using the corresponding public key. Any tampering with URL payloads triggers an immediate "Integrity Check Failed" warning banner.
3. **QR Code Verification**: The generated PDF contains a QR code referencing the registry verification URL, allowing anyone (recruiters, sponsors, colleges) to instantly verify authenticity offline.

---

## 📚 Technical References

*   [Prisma Schema](file:///d:/Kiri-Ai-Learning/backend/prisma/schema.prisma) - Relational structure for tracking enrollments, attempts, and certificates.
*   [Crypto Service](file:///d:/Kiri-Ai-Learning/backend/src/services/crypto.service.ts) - Keypair handling and signature verification routines.
*   [Pacing Controller](file:///d:/Kiri-Ai-Learning/backend/src/controllers/lesson.controller.ts) - Heartbeat tracking controls.
