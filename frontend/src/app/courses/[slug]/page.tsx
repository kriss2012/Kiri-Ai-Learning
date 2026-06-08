"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Clock, CheckCircle, PlayCircle, Lock, GraduationCap, Award } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { fetchApi, getUser, mockLogin } from "@/lib/api";

interface Lesson {
  id: string;
  title: string;
  slug: string;
  contentType: string;
  durationSeconds: number;
  order: number;
}

interface Quiz {
  id: string;
  title: string;
  isFinal: boolean;
  timeLimitMinutes: number;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
  quizzes: Quiz[];
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;
  level: string;
  durationHours: number;
  thumbnailUrl: string;
  instructor: {
    displayName: string;
    profilePhoto: string;
    college: string;
  };
  sponsors: Array<{
    name: string;
    logoUrl: string;
  }>;
  modules: Module[];
}

interface EnrollmentData {
  isEnrolled: boolean;
  progressPercent: number;
  completedLessons: string[];
  completedQuizzes: Record<string, { passed: boolean; scorePercent: number }>;
}

export default function CourseDetail() {
  const router = useRouter();
  const { slug } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    if (!slug) return;

    async function loadCourseDetails() {
      try {
        const data = await fetchApi(`/courses/${slug}`);
        setCourse(data.course);
        setEnrollment(data.enrollment);
      } catch (err) {
        console.error("Failed to load course details:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCourseDetails();
  }, [slug]);

  const handleEnroll = async () => {
    if (!course) return;

    // If not logged in, force mock login as student
    if (!user) {
      try {
        const loggedUser = await mockLogin("student");
        setUser(loggedUser);
        window.location.reload();
        return;
      } catch (e) {
        alert("Mock login failed");
        return;
      }
    }

    setSubmitting(true);
    try {
      await fetchApi(`/courses/${course.id}/enroll`, {
        method: "POST",
      });
      // Re-fetch details
      const data = await fetchApi(`/courses/${slug}`);
      setCourse(data.course);
      setEnrollment(data.enrollment);
    } catch (error: any) {
      alert(error.message || "Failed to enroll.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h2 className="text-xl font-bold text-rose-500 mb-4">Course Not Found</h2>
          <Link href="/" className="text-amber-500 hover:underline flex items-center justify-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const isEnrolled = enrollment?.isEnrolled || false;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col pb-16">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-8 flex-grow w-full">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-amber-500 mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Catalog</span>
        </Link>

        {/* Hero Banner Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start mb-12">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <span className="inline-block rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-500 uppercase">
              {course.category === "generative_ai" ? "Generative AI" : "Employability Skills"}
            </span>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-100">
              {course.title}
            </h1>

            <p className="text-sm text-slate-400 leading-relaxed">
              {course.description}
            </p>

            {/* Meta badges */}
            <div className="flex flex-wrap gap-6 text-xs text-slate-400 font-semibold border-y border-slate-800/60 py-4">
              <span className="flex items-center space-x-1.5">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>{course.durationHours} Hours duration</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <BookOpen className="h-4 w-4 text-amber-500" />
                <span>{totalLessons} Lectures</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <GraduationCap className="h-4 w-4 text-amber-500" />
                <span>{course.level.toUpperCase()} level</span>
              </span>
            </div>

            {/* Instructor Profile */}
            <div className="flex items-center space-x-4 bg-slate-900/20 p-4 rounded-xl border border-slate-800/40">
              {course.instructor.profilePhoto ? (
                <img src={course.instructor.profilePhoto} alt={course.instructor.displayName} className="h-10 w-10 rounded-full" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-sm font-bold text-amber-500">
                  {course.instructor.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400 font-medium">Instructor</p>
                <p className="text-sm font-bold text-slate-200">{course.instructor.displayName}</p>
                <p className="text-[10px] text-slate-500">{course.instructor.college}</p>
              </div>
            </div>
          </div>

          {/* Action Card / Sidebar */}
          <div className="glass p-6 rounded-xl border border-slate-800 flex flex-col space-y-6">
            <div className="relative aspect-video w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-900">
              <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
            </div>

            {isEnrolled ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400">Your Progress</span>
                  <span className="text-amber-500">{enrollment?.progressPercent || 0}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${enrollment?.progressPercent || 0}%` }}
                  ></div>
                </div>
                <Link
                  href={`/learn/${course.slug}`}
                  className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-center text-xs font-bold text-slate-950 hover:brightness-110 hover:shadow-lg hover:shadow-amber-500/15 transition-all flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <span>Go to Classroom</span>
                  <PlayCircle className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={submitting}
                className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-center text-xs font-bold text-slate-950 hover:brightness-110 hover:shadow-lg hover:shadow-amber-500/15 transition-all flex items-center justify-center space-x-1 disabled:opacity-50 cursor-pointer"
              >
                <span>{user ? "Enroll Now (Free)" : "Sign In & Enroll (Free)"}</span>
              </button>
            )}

            {/* Sponsor Badge */}
            {course.sponsors.length > 0 && (
              <div className="border-t border-slate-800/80 pt-4 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Supported by</p>
                <div className="flex justify-center items-center">
                  <span className="text-xs font-bold text-slate-300">{course.sponsors[0].name}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modules Tree */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-100 border-b border-slate-800 pb-3">Course Structure</h2>

          <div className="space-y-6">
            {course.modules.map((module) => (
              <div key={module.id} className="rounded-xl border border-slate-800 bg-slate-950/20 overflow-hidden">
                {/* Module Title */}
                <div className="bg-slate-900/40 px-6 py-4 border-b border-slate-800/60 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-200">
                    Module {module.order}: {module.title}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    {module.lessons.length} Lectures
                  </span>
                </div>

                {/* Lesson rows */}
                <div className="divide-y divide-slate-800/50">
                  {module.lessons.map((lesson) => {
                    const isCompleted = enrollment?.completedLessons.includes(lesson.id) || false;
                    
                    return (
                      <div key={lesson.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-900/10 transition-colors">
                        <div className="flex items-center space-x-3 max-w-xl">
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <PlayCircle className="h-4 w-4 text-slate-500 flex-shrink-0" />
                          )}
                          <span className="text-xs font-medium text-slate-300 line-clamp-1">{lesson.title}</span>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {Math.round(lesson.durationSeconds / 60)} mins
                          </span>
                          
                          {isEnrolled ? (
                            <Link
                              href={`/learn/${course.slug}?lesson=${lesson.id}`}
                              className="text-[10px] font-bold text-amber-500 hover:underline"
                            >
                              Start
                            </Link>
                          ) : (
                            <Lock className="h-3.5 w-3.5 text-slate-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Quizzes inside modules */}
                  {module.quizzes.map((quiz) => {
                    const quizResult = enrollment?.completedQuizzes[quiz.id];
                    const isCompleted = quizResult?.passed || false;

                    return (
                      <div key={quiz.id} className="px-6 py-4 flex items-center justify-between bg-slate-900/10 hover:bg-slate-900/20 transition-colors">
                        <div className="flex items-center space-x-3">
                          <GraduationCap className={`h-4 w-4 flex-shrink-0 ${isCompleted ? "text-emerald-500" : "text-amber-500"}`} />
                          <span className="text-xs font-bold text-slate-200">{quiz.title}</span>
                          {quizResult && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${quizResult.passed ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                              {quizResult.passed ? "PASSED" : "FAILED"} ({quizResult.scorePercent}%)
                            </span>
                          )}
                        </div>

                        {isEnrolled ? (
                          <Link
                            href={`/learn/${course.slug}?quiz=${quiz.id}`}
                            className="text-[10px] font-bold text-amber-500 hover:underline"
                          >
                            Take Quiz
                          </Link>
                        ) : (
                          <Lock className="h-3.5 w-3.5 text-slate-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
