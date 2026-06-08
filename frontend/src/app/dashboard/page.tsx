"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Award, CheckCircle, Clock, GraduationCap, Download, ExternalLink, ShieldCheck, User as UserIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import { fetchApi, getUser, User } from "@/lib/api";

interface Certificate {
  id: string;
  certificateId: string;
  courseTitleSnapshot: string;
  issuedAt: string;
  pdfUrl: string;
  scoreSnapshot: number;
  course: {
    title: string;
    thumbnailUrl: string;
  };
}

interface ActiveEnrollment {
  id: string;
  isActive: boolean;
  course: {
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    thumbnailUrl: string;
    durationHours: number;
    level: string;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [enrollments, setEnrollments] = useState<ActiveEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const activeUser = getUser();
    if (!activeUser) {
      router.push("/");
      return;
    }
    setUser(activeUser);

    async function loadDashboardData() {
      try {
        // Fetch User Certificates
        const certData = await fetchApi("/certificates");
        setCertificates(certData.certificates || []);

        // Fetch User Enrollments
        // Since we want to display active courses, we can pull all courses and check if the user is enrolled,
        // or query a user enrollments endpoint. Since our course listing already exposes course detail with enrollment,
        // we can fetch published courses, check which ones are active.
        const courseData = await fetchApi("/courses");
        const allCourses = courseData.courses || [];
        
        // Load details for each to check if enrolled (async map)
        const enrolledList: ActiveEnrollment[] = [];
        for (const c of allCourses) {
          const detail = await fetchApi(`/courses/${c.slug}`);
          if (detail.enrollment?.isEnrolled) {
            enrolledList.push({
              id: c.id,
              isActive: true,
              course: c,
            });
          }
        }
        setEnrollments(enrolledList);
      } catch (error) {
        console.error("Dashboard Load Error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleDownload = async (certId: string) => {
    setDownloadingId(certId);
    try {
      const token = localStorage.getItem("kiri_learning_token");
      const response = await fetch(`http://localhost:5000/v1/certificates/${certId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to download file.");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `${certId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      alert("Error downloading certificate PDF.");
    } finally {
      setDownloadingId(null);
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

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col pb-16">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10 flex-grow w-full space-y-10">
        {/* Profile Card */}
        <section className="glass p-8 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <UserIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-200">{user?.displayName}</h1>
              <p className="text-xs text-slate-400">{user?.email}</p>
              {user?.college && (
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  {user.college} ({user.city})
                </p>
              )}
            </div>
          </div>

          {/* Mini Statistics */}
          <div className="flex space-x-8 text-center bg-slate-950/40 border border-slate-900 rounded-lg p-4">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Enrolled</p>
              <p className="text-lg font-extrabold text-amber-500 mt-1">{enrollments.length}</p>
            </div>
            <div className="border-l border-slate-900 h-10"></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Earned</p>
              <p className="text-lg font-extrabold text-amber-500 mt-1">{certificates.length}</p>
            </div>
          </div>
        </section>

        {/* Enrolled Courses */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-slate-200 flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-amber-500" />
            <span>Active Courses</span>
          </h2>

          {enrollments.length === 0 ? (
            <div className="glass p-10 rounded-xl border border-slate-800 text-center space-y-4">
              <p className="text-slate-400 text-xs">You have not enrolled in any courses yet.</p>
              <Link
                href="/"
                className="inline-block rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
              >
                Explore Catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {enrollments.map((enrolled) => (
                <div
                  key={enrolled.id}
                  className="glass rounded-xl border border-slate-800 p-6 flex flex-col md:flex-row gap-6 hover:border-slate-700/80 transition-all"
                >
                  <div className="relative aspect-video w-full md:w-36 bg-slate-950 rounded-lg overflow-hidden flex-shrink-0 border border-slate-900">
                    <img src={enrolled.course.thumbnailUrl} alt={enrolled.course.title} className="h-full w-full object-cover" />
                  </div>
                  
                  <div className="flex flex-col flex-grow space-y-3">
                    <div>
                      <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wide">
                        {enrolled.course.level}
                      </span>
                      <h3 className="text-base font-bold text-slate-200 line-clamp-1">{enrolled.course.title}</h3>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{enrolled.course.shortDescription}</p>
                    
                    <div className="pt-2 flex justify-between items-center mt-auto">
                      <Link
                        href={`/learn/${enrolled.course.slug}`}
                        className="rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-850 px-4 py-2 text-xs font-bold text-amber-500 transition-colors"
                      >
                        Resume Course
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Certificates earned (PRD Section 13) */}
        <section id="certificates" className="space-y-6">
          <h2 className="text-xl font-bold text-slate-200 flex items-center space-x-2">
            <Award className="h-5 w-5 text-amber-500" />
            <span>Earned Credentials</span>
          </h2>

          {certificates.length === 0 ? (
            <div className="glass p-10 rounded-xl border border-slate-800 text-center">
              <p className="text-slate-400 text-xs">Complete all course material and pass final exams to unlock certificates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {certificates.map((cert) => (
                <div key={cert.id} className="glass rounded-xl border border-slate-800 overflow-hidden flex flex-col hover:border-slate-700/80 transition-all">
                  {/* Thumbnail / Header block */}
                  <div className="relative aspect-video w-full bg-slate-950 border-b border-slate-900">
                    <img src={cert.course.thumbnailUrl} alt={cert.courseTitleSnapshot} className="h-full w-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                      <ShieldCheck className="h-12 w-12 text-emerald-500 filter drop-shadow-md" />
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex flex-col flex-grow space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-300 line-clamp-1">{cert.courseTitleSnapshot}</h3>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-900/60 text-[9px] text-slate-400 space-y-1">
                      <p>ID: <strong className="text-slate-300 font-semibold">{cert.certificateId}</strong></p>
                      <p>Grade: <strong className="text-slate-300 font-semibold">{cert.scoreSnapshot}%</strong></p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <button
                        onClick={() => handleDownload(cert.certificateId)}
                        disabled={downloadingId === cert.certificateId}
                        className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 text-center text-xs font-bold transition-all flex items-center justify-center space-x-1 disabled:opacity-50 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{downloadingId === cert.certificateId ? "Saving..." : "PDF"}</span>
                      </button>
                      <Link
                        href={`/verify/${cert.certificateId}`}
                        className="rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-slate-300 py-2.5 text-center text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Verify Portal</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
