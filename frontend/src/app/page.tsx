"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, ShieldAlert, Award, Star, Compass } from "lucide-react";
import Navbar from "@/components/Navbar";
import { fetchApi } from "@/lib/api";

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

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams?.get("category") || "all";

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(categoryParam);

  useEffect(() => {
    setActiveTab(categoryParam);
  }, [categoryParam]);

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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "all") {
      router.push("/");
    } else {
      router.push(`/?category=${tab}`);
    }
  };

  const filteredCourses = courses.filter((c) => {
    if (activeTab === "all") return true;
    return c.category === activeTab;
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col pb-12">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative w-full px-6 py-20 md:py-32 flex flex-col items-center text-center overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-amber-500/8 blur-[140px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-500/6 blur-[140px] pointer-events-none" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent pointer-events-none" />

        {/* Grid background */}
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />

        <div className="max-w-4xl mx-auto z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 rounded-full border border-amber-500/25 bg-amber-500/8 px-4 py-1.5 text-xs font-semibold text-amber-400">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>100% Free Credentials · India&apos;s AI Learning Platform</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight" style={{fontFamily: 'var(--font-outfit)'}}>
            Master Generative AI &amp;<br />
            <span className="gradient-text">Employability Skills</span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Earn employer-recognized certificates in AI, prompt engineering, and career skills.
            Structured lessons, real assessments — completely free.
          </p>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
            <Link
              href="#catalog"
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <span>Explore Courses</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/verify/mock"
              className="btn-ghost flex items-center justify-center space-x-2"
            >
              <span>Verify a Certificate</span>
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
            {[
              { value: "5+", label: "Courses" },
              { value: "100%", label: "Free" },
              { value: "QR", label: "Verified Certs" },
              { value: "∞", label: "Retakes" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-extrabold gradient-text" style={{fontFamily: 'var(--font-outfit)'}}>{stat.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
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
              onClick={() => handleTabChange("all")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "all" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Courses
            </button>
            <button
              onClick={() => handleTabChange("generative_ai")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "generative_ai" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Generative AI
            </button>
            <button
              onClick={() => handleTabChange("employability")}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="rounded-xl border border-white/5 overflow-hidden h-[340px] skeleton" />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20 glass rounded-xl border border-white/5">
            <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-sm font-medium">No courses in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="glass-card rounded-xl overflow-hidden flex flex-col h-full cursor-pointer group"
              >
                {/* Thumbnail */}
                <div className="relative h-44 w-full overflow-hidden bg-black">
                  <img
                    src={course.thumbnailUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"}
                    alt={course.title}
                    className="h-full w-full object-cover opacity-75 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="badge badge-amber">{course.level}</span>
                  </div>
                  <div className="absolute bottom-3 right-3 text-[10px] text-white/70 font-semibold bg-black/50 px-2 py-0.5 rounded">
                    {course.durationHours}h
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <span className="text-[10px] font-bold tracking-wider text-amber-500 uppercase mb-1.5 block">
                    {course.category === "generative_ai" ? "🤖 Generative AI" : "💼 Employability"}
                  </span>
                  <h3 className="text-base font-bold text-slate-100 line-clamp-2 mb-2 leading-snug" style={{fontFamily: 'var(--font-outfit)'}}>
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-grow">
                    {course.shortDescription}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <span className="text-[11px] text-slate-500">
                      by <span className="text-slate-400 font-medium">{course.instructor.displayName}</span>
                    </span>
                    <span className="text-[11px] font-semibold text-amber-500 flex items-center space-x-1 group-hover:gap-1 transition-all">
                      <span>Start</span>
                      <ArrowRight className="h-3 w-3" />
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

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
