"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, ShieldAlert, Award, Star, Compass } from "lucide-react";
import Navbar from "../components/Navbar";
import { fetchApi } from "../lib/api";

interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  category: string;
  level: string;
  durationHours: number;
  thumbnailUrl: string;
  instructor: {
    displayName: string;
  };
  sponsors: Array<{
    name: string;
    logoUrl: string;
    tier: string;
  }>;
}

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await fetchApi("/courses");
        setCourses(data.courses || []);
      } catch (err: any) {
        console.error("Failed to load courses:", err);
        setError("Could not load courses from the backend. Make sure the server is running.");
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  const filteredCourses = courses.filter((c) => {
    if (activeTab === "all") return true;
    return c.category === activeTab;
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col pb-12">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative w-full px-6 py-20 md:py-32 flex flex-col items-center text-center overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/20 blur-[120px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto z-10">
          <div className="inline-flex items-center space-x-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-xs font-semibold text-amber-400 mb-6">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>100% Free Credentials in India</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Master Generative AI & <br />
            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Employability Skills
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Boost your career with verified, employer-recognized credentials. Learn prompt engineering,
            resume optimization, startup pitching, and AI workflows for free.
          </p>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
            <Link
              href="#catalog"
              className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 font-bold text-slate-950 hover:brightness-110 hover:shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Explore Courses</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/verify/mock"
              className="rounded-lg border border-slate-700 bg-slate-900/30 px-6 py-3 font-bold text-slate-300 hover:bg-slate-900 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Verify a Certificate</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Integrity Showcase */}
      <section className="w-full max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass p-6 rounded-xl border border-slate-800/80 flex flex-col space-y-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100">QR-Verifiable Badges</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every certificate has a unique QR code pointing to a live validation portal containing course completion details.
            </p>
          </div>

          <div className="glass p-6 rounded-xl border border-slate-800/80 flex flex-col space-y-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Cryptographically Signed</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Metadata payloads are cryptographically signed using platform RSA keys to prevent fraud and alterations.
            </p>
          </div>

          <div className="glass p-6 rounded-xl border border-slate-800/80 flex flex-col space-y-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Sponsor Backed</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Collaborations with leading corporate partners fund the courses, assuring relevance to modern employment.
            </p>
          </div>
        </div>
      </section>

      {/* Course Catalog Tabbed Grid */}
      <section id="catalog" className="w-full max-w-7xl mx-auto px-6 py-16 flex-grow">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 mb-2">Curriculum Catalog</h2>
            <p className="text-sm text-slate-400">Structured lessons to take you from fundamentals to practical execution.</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-slate-900/50 p-1.5 rounded-lg border border-slate-800 mt-6 md:mt-0 max-w-max">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "all" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Courses
            </button>
            <button
              onClick={() => setActiveTab("generative_ai")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "generative_ai" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Generative AI
            </button>
            <button
              onClick={() => setActiveTab("employability")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "employability" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Employability
            </button>
          </div>
        </div>

        {/* Backend offline warning banner */}
        {error && (
          <div className="mb-8 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-slate-300 text-xs flex items-center space-x-3">
            <ShieldAlert className="h-5 w-5 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loader skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass rounded-xl border border-slate-800 overflow-hidden h-[360px] relative shimmer"></div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16 glass rounded-xl border border-slate-800">
            <p className="text-slate-400 text-sm">No courses currently published in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="glass rounded-xl border border-slate-800/80 overflow-hidden hover-card-trigger flex flex-col h-full cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                  <img
                    src={course.thumbnailUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"}
                    alt={course.title}
                    className="h-full w-full object-cover opacity-85 hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 rounded-full bg-slate-950/80 border border-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-amber-500 uppercase">
                    {course.level}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <span className="text-[10px] font-bold tracking-wider text-amber-500 uppercase mb-2 block">
                    {course.category === "generative_ai" ? "Generative AI" : "Employability Skills"}
                  </span>
                  
                  <h3 className="text-lg font-bold text-slate-100 line-clamp-1 mb-2">
                    {course.title}
                  </h3>
                  
                  <p className="text-xs text-slate-400 line-clamp-3 mb-6 flex-grow">
                    {course.shortDescription}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-800/50 pt-4 mt-auto">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Duration: <strong className="text-slate-300 font-semibold">{course.durationHours} hrs</strong>
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium hover:text-amber-400 flex items-center space-x-1">
                      <span>Begin Lesson</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Partners / Sponsor Banner */}
      <section className="w-full border-t border-slate-800/80 py-16 mt-16 bg-slate-950/20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-8">
            Empowered by Corporate Course Partners
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-40 hover:opacity-75 transition-opacity duration-300">
            {/* TechCorp Logo */}
            <div className="flex items-center space-x-2 filter grayscale brightness-200">
              <span className="font-sans font-extrabold text-2xl tracking-tighter text-slate-100">TECHCORP</span>
              <span className="font-sans font-medium text-xs border border-slate-400 px-1 py-0.5 rounded text-slate-400">INDIA</span>
            </div>
            {/* Mock partners */}
            <div className="font-extrabold text-2xl tracking-tight text-slate-300 font-serif">
              STARTUP HUB
            </div>
            <div className="font-bold text-xl tracking-widest text-slate-400">
              PICT FOUNDATION
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
