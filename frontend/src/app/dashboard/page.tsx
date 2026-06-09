"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Award, CheckCircle, Clock, GraduationCap, Download, ExternalLink, ShieldCheck, User as UserIcon, Briefcase, MessageSquare, Lock, Unlock, HelpCircle, Check, AlertCircle } from "lucide-react";
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

const INTERVIEW_QUESTIONS = {
  genai: [
    {
      id: "g1",
      text: "Explain the difference between zero-shot and few-shot prompting. When would you use each?",
      keywords: ["example", "context", "prompt", "demonstration", "tuning", "shots"],
    },
    {
      id: "g2",
      text: "How does Retrieval-Augmented Generation (RAG) help mitigate LLM hallucinations?",
      keywords: ["retrieval", "database", "context", "knowledge", "ground", "hallucination", "source"],
    },
    {
      id: "g3",
      text: "What are some best practices for designing system prompts for conversational AI agents?",
      keywords: ["persona", "instruction", "constraints", "role", "tone", "safety"],
    }
  ],
  placement: [
    {
      id: "p1",
      text: "Walk me through how you would tailor your resume for a job listing that highlights ATS compatibility.",
      keywords: ["keyword", "ats", "format", "match", "bullet", "scan", "description"],
    },
    {
      id: "p2",
      text: "How would you describe your experience with Generative AI tools on your LinkedIn profile to stand out to recruiters?",
      keywords: ["workflow", "productivity", "prompt", "impact", "certification", "skill"],
    },
    {
      id: "p3",
      text: "Tell me about a time when you had to solve a challenging technical problem. What was your approach?",
      keywords: ["star", "situation", "task", "action", "result", "solve", "debug"],
    }
  ]
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [enrollments, setEnrollments] = useState<ActiveEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState<"courses" | "jobs" | "interviews">("courses");

  // Jobs state
  const [jobs, setJobs] = useState<any[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [userCertificateCourseIds, setUserCertificateCourseIds] = useState<string[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  // Interview simulator state
  const [interviewTopic, setInterviewTopic] = useState<"genai" | "placement" | null>(null);
  const [interviewStep, setInterviewStep] = useState<"intro" | "qa" | "result">("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);

  async function loadJobsData() {
    setJobsLoading(true);
    try {
      const data = await fetchApi("/jobs");
      setJobs(data.jobs || []);
      setAppliedJobIds(data.appliedJobIds || []);
      setUserCertificateCourseIds(data.userCertificateCourseIds || []);
    } catch (err) {
      console.error("Failed to load jobs data", err);
    } finally {
      setJobsLoading(false);
    }
  }

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

        // Fetch Jobs
        await loadJobsData();
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

  const handleApplyToJob = async (jobId: string) => {
    setApplyingJobId(jobId);
    try {
      const res = await fetchApi(`/jobs/${jobId}/apply`, {
        method: "POST"
      });
      setAppliedJobIds(prev => [...prev, jobId]);
      alert(`Success! Applied with Certificate: ${res.certificateId}`);
    } catch (err: any) {
      alert(err.message || "Failed to submit application.");
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleNextQuestion = () => {
    if (!currentAnswer.trim()) {
      alert("Please write a response before submitting.");
      return;
    }
    const newAnswers = [...userAnswers, currentAnswer];
    setUserAnswers(newAnswers);
    setCurrentAnswer("");

    const topicQuestions = INTERVIEW_QUESTIONS[interviewTopic!];
    if (currentQuestionIndex < topicQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsEvaluating(true);
      setTimeout(() => {
        let totalScore = 0;
        topicQuestions.forEach((q, idx) => {
          const answer = newAnswers[idx].toLowerCase();
          const matchedKeywords = q.keywords.filter(kw => answer.includes(kw));
          let questionScore = 40;
          if (answer.length > 50) questionScore += 20;
          if (answer.length > 150) questionScore += 10;
          questionScore += Math.round((matchedKeywords.length / q.keywords.length) * 30);
          totalScore += Math.min(100, questionScore);
        });

        const finalScore = Math.round(totalScore / topicQuestions.length);
        let readiness = "Action Needed";
        if (finalScore >= 80) readiness = "High (Job-Ready)";
        else if (finalScore >= 60) readiness = "Medium (Developing)";

        setAiReport({
          score: finalScore,
          readiness,
          strengths: interviewTopic === "genai" 
            ? ["Clear understanding of LLM prompt constraints.", "Demonstrates practical knowledge of prompt patterns."]
            : ["Structured answer format.", "Good focus on key industry alignment (ATS/LinkedIn)."],
          suggestions: interviewTopic === "genai"
            ? ["Try to incorporate concrete examples of few-shot formatting in your answers.", "Elaborate more on safety parameters and RAG database sources."]
            : ["Use the STAR method (Situation, Task, Action, Result) to frame your technical problem answers.", "Mention specific tools or packages you utilized in your workflows."],
        });
        setIsEvaluating(false);
        setInterviewStep("result");
      }, 2000);
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

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-800 gap-6 mt-6">
          <button
            onClick={() => setActiveTab("courses")}
            className={`pb-4 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "courses" ? "border-amber-500 text-amber-500" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>My Learning & Credentials</span>
          </button>
          
          <button
            onClick={() => setActiveTab("jobs")}
            className={`pb-4 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "jobs" ? "border-amber-500 text-amber-500" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Career Bridge</span>
            {jobs.length > 0 && (
              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 text-[9px] rounded-full font-bold ml-1.5">
                {jobs.length} Jobs
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("interviews")}
            className={`pb-4 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "interviews" ? "border-amber-500 text-amber-500" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>AI Placement Coach</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="pt-2">
          {activeTab === "courses" && (
            <div className="space-y-10">
              {/* Enrolled Courses */}
              <section className="space-y-6">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-amber-500" />
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
                        className="glass rounded-xl border border-slate-800 p-6 flex flex-col md:flex-row gap-6 hover:border-slate-700/80 transition-all hover:shadow-lg hover:shadow-slate-950/20"
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
                              className="rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-amber-500 transition-all"
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
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                  <Award className="h-4 w-4 text-amber-500" />
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
                              className="rounded-lg border border-slate-850 bg-slate-900/40 hover:bg-slate-900 text-slate-300 py-2.5 text-center text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
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
            </div>
          )}

          {activeTab === "jobs" && (
            <div className="space-y-6">
              <div className="glass p-6 rounded-xl border border-slate-800/80 bg-slate-950/20 max-w-4xl">
                <h2 className="text-base font-bold text-slate-200">Employability Bridge</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Earned course certificates act as cryptographic access keys. Complete matching courses to satisfy partners' prerequisites and unlock direct application options.
                </p>
              </div>

              {jobsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                </div>
              ) : jobs.length === 0 ? (
                <div className="glass p-10 rounded-xl border border-slate-800 text-center max-w-4xl">
                  <p className="text-slate-400 text-xs">No corporate vacancies available at this moment. Check back soon!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl">
                  {jobs.map((job) => {
                    const isEligible = userCertificateCourseIds.includes(job.requiredCourseId);
                    const isApplied = appliedJobIds.includes(job.id);
                    
                    return (
                      <div
                        key={job.id}
                        className={`glass rounded-xl border p-6 flex flex-col justify-between space-y-5 transition-all relative overflow-hidden ${
                          isEligible ? "border-slate-800 hover:border-slate-700/80 shadow-md" : "border-slate-900/90 opacity-80"
                        }`}
                      >
                        {/* Status tag */}
                        <div className="absolute top-4 right-4 flex items-center space-x-1 text-[9px] font-bold uppercase tracking-wider">
                          {isApplied ? (
                            <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 px-2 py-0.5 rounded-full flex items-center space-x-1">
                              <Check className="h-3 w-3" />
                              <span>Applied</span>
                            </span>
                          ) : isEligible ? (
                            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded-full flex items-center space-x-1">
                              <Unlock className="h-3 w-3" />
                              <span>Eligible</span>
                            </span>
                          ) : (
                            <span className="bg-slate-900 text-slate-500 border border-slate-800/80 px-2 py-0.5 rounded-full flex items-center space-x-1">
                              <Lock className="h-3 w-3" />
                              <span>Locked</span>
                            </span>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                              {job.company}
                            </span>
                            <h3 className="text-base font-bold text-slate-200 mt-0.5">{job.title}</h3>
                            <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mt-1 font-semibold">
                              <span>📍 {job.location}</span>
                              <span>•</span>
                              <span>💼 {job.type}</span>
                              <span>•</span>
                              <span>💰 {job.salaryRange}</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                            {job.description}
                          </p>

                          {/* Prerequisites course requirement */}
                          <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-900 flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <p className="text-[9px] font-bold text-slate-500 uppercase">PREREQUISITE CERTIFICATION</p>
                              <p className="font-semibold text-slate-300 line-clamp-1">{job.requiredCourse?.title}</p>
                            </div>
                            {isEligible ? (
                              <ShieldCheck className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <Lock className="h-4 w-4 text-slate-600 flex-shrink-0" />
                            )}
                          </div>
                        </div>

                        {/* Apply CTA */}
                        <div>
                          {isApplied ? (
                            <button
                              disabled
                              className="w-full text-center py-2.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center space-x-1.5"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span>Application Pending Review</span>
                            </button>
                          ) : isEligible ? (
                            <button
                              onClick={() => handleApplyToJob(job.id)}
                              disabled={applyingJobId === job.id}
                              className="w-full text-center py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/5 hover:shadow-amber-500/10 cursor-pointer disabled:opacity-50"
                            >
                              <span>{applyingJobId === job.id ? "Submitting..." : "Apply Instantly"}</span>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <Link
                              href={`/courses/${job.requiredCourse?.slug}`}
                              className="w-full text-center py-2.5 rounded-lg text-xs font-bold bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-850 hover:border-slate-700 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                            >
                              <span>Unlock - Enrolled in Pathway</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "interviews" && (
            <div className="space-y-6 max-w-4xl">
              <div className="glass p-6 rounded-xl border border-slate-800/80 bg-slate-950/20">
                <h2 className="text-base font-bold text-slate-200">AI Placement Coach</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Practice job-ready interview questions tailored to your certified credentials. Receive instant scoring and detailed feedback reports from Kiri AI's recruiter model.
                </p>
              </div>

              {interviewStep === "intro" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Option 1: GenAI */}
                  <div className="glass p-6 rounded-xl border border-slate-800 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-bold text-slate-200">Generative AI Technical Prep</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Assessments covering zero-shot/few-shot prompts, RAG hallucination mitigation, safety constraints, and conversational agent workflows.
                      </p>
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-semibold pt-1">
                        <span>3 Questions</span>
                        <span>•</span>
                        <span>~5 Mins</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setInterviewTopic("genai");
                        setInterviewStep("qa");
                        setCurrentQuestionIndex(0);
                        setUserAnswers([]);
                        setCurrentAnswer("");
                      }}
                      className="w-full text-center py-2.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer"
                    >
                      Start Technical Simulation
                    </button>
                  </div>

                  {/* Option 2: Placement Mastery */}
                  <div className="glass p-6 rounded-xl border border-slate-800 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500">
                        <UserIcon className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-bold text-slate-200">Resume & LinkedIn Interview Prep</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Assessments for ATS layout compatibility optimization, strategic LinkedIn presence building, and formulating career story frameworks.
                      </p>
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-semibold pt-1">
                        <span>3 Questions</span>
                        <span>•</span>
                        <span>~5 Mins</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setInterviewTopic("placement");
                        setInterviewStep("qa");
                        setCurrentQuestionIndex(0);
                        setUserAnswers([]);
                        setCurrentAnswer("");
                      }}
                      className="w-full text-center py-2.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer"
                    >
                      Start Career Simulation
                    </button>
                  </div>
                </div>
              )}

              {interviewStep === "qa" && interviewTopic && (
                <div className="glass p-8 rounded-xl border border-slate-800/80 space-y-6 relative">
                  {/* Header */}
                  <div className="flex justify-between items-center pb-4 border-b border-slate-900">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-500 font-bold text-xs">
                        AI
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-300">Kiri Placement Coach</h3>
                        <p className="text-[10px] text-emerald-500 font-medium">Session Active</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 font-bold">
                      Question {currentQuestionIndex + 1} of 3
                    </span>
                  </div>

                  {/* Question Prompt */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Interview Question</p>
                    <p className="text-sm font-semibold text-slate-200 leading-relaxed bg-slate-950/40 p-4 rounded-lg border border-slate-900">
                      {INTERVIEW_QUESTIONS[interviewTopic][currentQuestionIndex].text}
                    </p>
                  </div>

                  {/* Textarea answer input */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <label className="text-slate-400">Your Response</label>
                      <span className={`${currentAnswer.length > 150 ? "text-emerald-500" : "text-slate-500"}`}>
                        {currentAnswer.length} chars (recommend &gt; 150)
                      </span>
                    </div>
                    <textarea
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      rows={5}
                      placeholder="Type your detailed response here. Use technical terms and outline actual scenarios where possible..."
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-200 focus:border-amber-500 focus:outline-none placeholder-slate-600 transition-colors"
                      disabled={isEvaluating}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-900">
                    <button
                      onClick={() => setInterviewStep("intro")}
                      disabled={isEvaluating}
                      className="text-xs text-slate-500 hover:text-slate-300 font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancel Session
                    </button>

                    <button
                      onClick={handleNextQuestion}
                      disabled={isEvaluating || !currentAnswer.trim()}
                      className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-2.5 text-xs font-bold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      {isEvaluating ? (
                        <>
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-slate-900"></div>
                          <span>Evaluating...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Answer</span>
                          <Check className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Evaluating Overlay */}
                  {isEvaluating && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center space-y-4">
                      <div className="relative flex items-center justify-center">
                        <div className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-amber-500 opacity-20"></div>
                        <div className="relative rounded-full h-10 w-10 bg-slate-900 border border-amber-500 flex items-center justify-center text-amber-500 font-extrabold text-sm">
                          AI
                        </div>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-xs font-bold text-slate-200">Evaluating Portfolio Performance...</p>
                        <p className="text-[10px] text-slate-500 max-w-xs px-4">
                          Checking answer length, semantic clarity, and verifying required domain keywords against corporate benchmarks.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {interviewStep === "result" && aiReport && (
                <div className="glass p-8 rounded-xl border border-slate-800/80 space-y-8">
                  {/* Top score banner */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-900">
                    <div className="space-y-1 text-center md:text-left">
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">EVALUATION COMPLETED</span>
                      <h3 className="text-lg font-bold text-slate-200">Placement Assessment Report</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Employability Index score computed using recruiter feedback guidelines.
                      </p>
                    </div>

                    {/* Circular Score display */}
                    <div className="flex items-center space-x-4">
                      <div className="relative h-20 w-20 flex items-center justify-center rounded-full bg-slate-950/60 border-2 border-slate-800">
                        <div className="absolute inset-0 rounded-full border-2 border-amber-500 border-t-transparent animate-spin-slow"></div>
                        <span className="text-xl font-black text-amber-500">{aiReport.score}%</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">JOB READINESS INDEX</p>
                        <p className={`text-sm font-bold mt-0.5 ${aiReport.score >= 80 ? "text-emerald-500" : "text-amber-500"}`}>
                          {aiReport.readiness}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-slate-950/40 rounded-lg border border-slate-900 space-y-3">
                      <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center space-x-1.5">
                        <Check className="h-4 w-4" />
                        <span>Key Strengths Identified</span>
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-400">
                        {aiReport.strengths.map((str: string, i: number) => (
                          <li key={i} className="flex items-start space-x-2">
                            <span className="text-emerald-500 mt-0.5">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-5 bg-slate-950/40 rounded-lg border border-slate-900 space-y-3">
                      <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center space-x-1.5">
                        <AlertCircle className="h-4 w-4" />
                        <span>Actionable Feedback</span>
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-400">
                        {aiReport.suggestions.map((sug: string, i: number) => (
                          <li key={i} className="flex items-start space-x-2">
                            <span className="text-amber-500 mt-0.5">•</span>
                            <span>{sug}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="flex justify-between pt-6 border-t border-slate-900">
                    <button
                      onClick={() => setInterviewStep("intro")}
                      className="rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/40 px-5 py-2.5 text-xs font-bold text-slate-350 transition-colors cursor-pointer"
                    >
                      Exit Simulator
                    </button>

                    <button
                      onClick={() => {
                        setInterviewStep("qa");
                        setCurrentQuestionIndex(0);
                        setUserAnswers([]);
                        setCurrentAnswer("");
                      }}
                      className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-2.5 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Retry Session
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
