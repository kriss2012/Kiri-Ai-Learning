"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle, PlayCircle, Award, Hourglass, HelpCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { fetchApi } from "@/lib/api";

function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function LearningWorkspace() {
  const { slug } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Active state
  const activeLessonId = searchParams.get("lesson");
  const activeQuizId = searchParams.get("quiz");

  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Lesson view state
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [completingLesson, setCompletingLesson] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isYouTube, setIsYouTube] = useState(false);
  const [ytVideoId, setYtVideoId] = useState<string | null>(null);
  const ytPlayheadRef = useRef<number>(0);

  // Quiz state
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [quizAttempt, setQuizAttempt] = useState<any>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load course layout
  async function loadWorkspaceData() {
    try {
      const data = await fetchApi(`/courses/${slug}`);
      setCourse(data.course);
      setEnrollment(data.enrollment);
      return data;
    } catch (err) {
      console.error("Workspace load error:", err);
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (slug) {
      loadWorkspaceData();
    }
  }, [slug]);

  // Sync active item when query params change
  useEffect(() => {
    if (!course) return;

    if (activeLessonId) {
      // Find lesson in modules
      let foundLesson = null;
      for (const m of course.modules) {
        const l = m.lessons.find((les: any) => les.id === activeLessonId);
        if (l) {
          foundLesson = l;
          break;
        }
      }
      setActiveLesson(foundLesson);
      setActiveQuiz(null);
      setQuizAttempt(null);
      setQuizResult(null);
      setSelectedAnswers({});
    } else if (activeQuizId) {
      // Find quiz in modules
      let foundQuiz = null;
      for (const m of course.modules) {
        const q = m.quizzes.find((qz: any) => qz.id === activeQuizId);
        if (q) {
          foundQuiz = q;
          break;
        }
      }
      if (foundQuiz) {
        loadQuizDetails(activeQuizId);
      }
      setActiveLesson(null);
    } else {
      // Set first lesson as default
      const firstLesson = course.modules[0]?.lessons[0];
      if (firstLesson) {
        router.push(`/learn/${slug}?lesson=${firstLesson.id}`);
      }
    }
  }, [activeLessonId, activeQuizId, course]);

  // Handle Video progress heartbeat
  useEffect(() => {
    if (activeLesson && activeLesson.contentType === "video") {
      const isYt = activeLesson.contentUrl.includes("youtube.com") || activeLesson.contentUrl.includes("youtu.be");
      
      // Start lesson on backend
      fetchApi(`/lessons/${activeLesson.id}/start`, { method: "POST" }).catch(() => {});

      if (isYt) {
        const ytId = getYouTubeId(activeLesson.contentUrl);
        setIsYouTube(true);
        setYtVideoId(ytId);
        ytPlayheadRef.current = 0;
        // YouTube embeds do not use progress heartbeats; complete is manual on video completion/button click.
        return () => {};
      }
      } else {
        setIsYouTube(false);
        setYtVideoId(null);

        // Setup HTML5 video heartbeat
        let checkInterval: NodeJS.Timeout | null = null;
        
        const setupHtml5Heartbeat = () => {
          if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = setInterval(() => {
            if (videoRef.current) {
              const currentTime = Math.round(videoRef.current.currentTime);
              fetchApi(`/lessons/${activeLesson.id}/heartbeat`, {
                method: "POST",
                body: JSON.stringify({ lastPositionSeconds: currentTime }),
              }).catch(() => {});
            }
          }, 15000);
        };

        if (videoRef.current) {
          setupHtml5Heartbeat();
        } else {
          // Retry setup if video ref isn't immediately bound
          let attempts = 0;
          checkInterval = setInterval(() => {
            attempts++;
            if (videoRef.current) {
              if (checkInterval) clearInterval(checkInterval);
              setupHtml5Heartbeat();
            }
            if (attempts > 10) {
              if (checkInterval) clearInterval(checkInterval);
            }
          }, 1000);
        }

        return () => {
          if (checkInterval) clearInterval(checkInterval);
          if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        };
      }
    }

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [activeLesson]);

  // Quiz handlers
  const loadQuizDetails = async (quizId: string) => {
    setQuizLoading(true);
    try {
      const data = await fetchApi(`/quizzes/${quizId}`);
      setActiveQuiz(data.quiz);
    } catch (e) {
      console.error(e);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!activeQuiz) return;
    try {
      const data = await fetchApi(`/quizzes/${activeQuiz.id}/start`, { method: "POST" });
      setQuizAttempt(data);
      setQuizResult(null);
      setSelectedAnswers({});
      setTimerRemaining(data.timeLimitMinutes * 60);
      toast.success("Quiz session started! Good luck.");

      // Start Countdown Timer
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      toast.error(e.message || "Failed to start quiz session. Make sure any cooldown window is complete.");
    }
  };

  const handleAutoSubmit = () => {
    toast.error("Time limit expired! Submitting answers automatically.");
    handleSubmitQuiz();
  };

  const handleSubmitQuiz = async () => {
    if (!quizAttempt || !activeQuiz) return;

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    setQuizLoading(true);
    try {
      const data = await fetchApi(`/quizzes/${activeQuiz.id}/submit`, {
        method: "POST",
        body: JSON.stringify({
          attemptId: quizAttempt.attemptId,
          sessionToken: quizAttempt.sessionToken,
          answers: selectedAnswers,
        }),
      });

      setQuizResult(data);
      
      if (data.passed) {
        toast.success(`You passed the assessment with ${data.scorePercent}%!`);
      } else {
        toast.error(`Assessment failed with ${data.scorePercent}%. Minimum required is ${data.minPassScore}%.`);
      }

      // If passed final assessment, blow confetti!
      if (activeQuiz.isFinal && data.passed) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
      }

      // Sync progress sidebar
      await loadWorkspaceData();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit answers.");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleCompleteLesson = async () => {
    if (!activeLesson) return;
    setCompletingLesson(true);
    try {
      await fetchApi(`/lessons/${activeLesson.id}/complete`, { method: "POST" });
      toast.success("Lesson completed successfully!");
      // Re-load sidebar
      const updatedData = await loadWorkspaceData();
      
      // Auto-advance to next lesson if available
      goToNextItem(updatedData.course);
    } catch (error: any) {
      toast.error(error.message || "Failed to complete lesson. Make sure you watched the video.");
    } finally {
      setCompletingLesson(false);
    }
  };

  const goToNextItem = (currentCourse: any) => {
    // Flatten all items (lessons and quizzes)
    const flatItems: any[] = [];
    currentCourse.modules.forEach((m: any) => {
      m.lessons.forEach((l: any) => flatItems.push({ type: "lesson", id: l.id }));
      m.quizzes.forEach((q: any) => flatItems.push({ type: "quiz", id: q.id }));
    });

    const currentIndex = flatItems.findIndex(
      (item) => item.id === (activeLessonId || activeQuizId)
    );

    if (currentIndex !== -1 && currentIndex < flatItems.length - 1) {
      const nextItem = flatItems[currentIndex + 1];
      if (nextItem.type === "lesson") {
        router.push(`/learn/${slug}?lesson=${nextItem.id}`);
      } else {
        router.push(`/learn/${slug}?quiz=${nextItem.id}`);
      }
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

  // Calculate progress percentage
  const totalLessons = course?.modules.reduce((acc: number, m: any) => acc + m.lessons.length, 0) || 0;
  const totalQuizzes = course?.modules.reduce((acc: number, m: any) => acc + m.quizzes.length, 0) || 0;
  const completedLessonsCount = enrollment?.completedLessons.length || 0;
  const completedQuizzesCount = Object.keys(enrollment?.completedQuizzes || {}).filter(
    (qId) => enrollment.completedQuizzes[qId]?.passed
  ).length || 0;
  const totalItems = totalLessons + totalQuizzes;
  const completedItems = completedLessonsCount + completedQuizzesCount;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const totalLessonSeconds = course?.modules.reduce(
    (acc: number, m: any) => acc + m.lessons.reduce((lAcc: number, l: any) => lAcc + l.durationSeconds, 0),
    0
  ) || 0;

  const completedLessonSeconds = course?.modules.reduce(
    (acc: number, m: any) => acc + m.lessons.reduce((lAcc: number, l: any) => {
      const isCompleted = enrollment?.completedLessons.includes(l.id);
      return lAcc + (isCompleted ? l.durationSeconds : 0);
    }, 0),
    0
  ) || 0;

  const remainingSeconds = Math.max(0, totalLessonSeconds - completedLessonSeconds);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col h-screen overflow-hidden">
      <Navbar />

      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 border-r border-slate-800/80 bg-slate-950/40 flex flex-col overflow-y-auto hidden md:flex">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60">
            <Link href={`/courses/${slug}`} className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-amber-500 font-bold transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Overview</span>
            </Link>
            <h2 className="text-sm font-extrabold text-slate-200 mt-3 line-clamp-1">{course?.title}</h2>

            {enrollment?.certificateId && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">🎓 Course Completed!</p>
                <Link
                  href={`/verify/${enrollment.certificateId}`}
                  className="w-full inline-flex items-center justify-center space-x-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2 text-[10px] font-extrabold text-slate-100 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <Award className="h-3.5 w-3.5" />
                  <span>Claim Certificate</span>
                </Link>
              </div>
            )}
            
            {/* Progress bar in sidebar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-400">YOUR PATHWAY PROGRESS</span>
                <span className="text-amber-500">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800/60 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-bold mt-1.5">
                <span>Completed: {formatDuration(completedLessonSeconds)}</span>
                <span>Remaining: {formatDuration(remainingSeconds)}</span>
            </div>
          </div>
        </div>

        <div className="flex-grow p-4 space-y-6">
            {course?.modules.map((module: any) => (
              <div key={module.id} className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Mod {module.order}: {module.title}
                </h3>
                
                <div className="space-y-1">
                  {module.lessons.map((lesson: any) => {
                    const isCompleted = enrollment?.completedLessons.includes(lesson.id) || false;
                    const isActive = activeLessonId === lesson.id;
                    
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => router.push(`/learn/${slug}?lesson=${lesson.id}`)}
                        className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                          isActive ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center space-x-2 max-w-[190px]">
                          {isCompleted ? (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <PlayCircle className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        <span className="text-[9px] text-slate-500">{Math.round(lesson.durationSeconds / 60)}m</span>
                      </button>
                    );
                  })}

                  {module.quizzes.map((quiz: any) => {
                    const quizResultState = enrollment?.completedQuizzes[quiz.id];
                    const isCompleted = quizResultState?.passed || false;
                    const isActive = activeQuizId === quiz.id;

                    return (
                      <button
                        key={quiz.id}
                        onClick={() => router.push(`/learn/${slug}?quiz=${quiz.id}`)}
                        className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                          isActive ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Award className={`h-3.5 w-3.5 ${isCompleted ? "text-emerald-500" : "text-amber-500"}`} />
                          <span className="font-semibold truncate">{quiz.title}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Content Workspace */}
        <main className="flex-grow flex flex-col bg-slate-950/20 overflow-y-auto">
          {/* Active Lesson View */}
          {activeLesson && (
            <div className="flex flex-col h-full">
              {/* Header Bar */}
              <div className="px-8 py-4 border-b border-slate-800/80 bg-slate-950/30 flex justify-between items-center flex-shrink-0">
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">{activeLesson.contentType} Lesson</span>
                <h2 className="text-sm font-bold text-slate-200">{activeLesson.title}</h2>
              </div>

              {/* Lesson body container */}
              <div className="p-8 space-y-6 flex-grow">
                {activeLesson.contentType === "video" ? (
                  <div className="aspect-video w-full max-w-4xl mx-auto bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative">
                    {isYouTube && ytVideoId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=1&rel=0`}
                        title={activeLesson.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        ref={videoRef}
                        src={activeLesson.contentUrl}
                        controls
                        controlsList="nodownload"
                        className="w-full h-full"
                      />
                    )}
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto glass p-8 rounded-xl border border-slate-800 prose prose-invert">
                    <div className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                      {activeLesson.textContent}
                    </div>
                  </div>
                )}

                {/* Bottom Complete Bar */}
                <div className="flex justify-center pt-8 border-t border-slate-900 max-w-4xl mx-auto">
                  <button
                    onClick={handleCompleteLesson}
                    disabled={completingLesson}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-8 py-3 text-xs font-bold text-slate-100 hover:shadow-lg hover:shadow-emerald-500/10 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    <span>{completingLesson ? "Processing..." : "Complete & Continue"}</span>
                    <CheckCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Quiz View */}
          {activeQuizId && activeQuiz && (
            <div className="p-8 max-w-3xl mx-auto w-full space-y-8">
              <div className="glass p-6 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-100">{activeQuiz.title}</h2>
                  <span className="text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded">
                    {activeQuiz.isFinal ? "Final Course Exam" : "Module Checkpoint"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Test your comprehension of the concepts covered in this segment. You require a score of{" "}
                  <strong>{activeQuiz.isFinal ? course?.minPassScore : 70}%</strong> or higher to pass.
                </p>
              </div>

              {/* Start Trigger */}
              {!quizAttempt && !quizResult && (
                <div className="flex flex-col items-center justify-center p-12 glass rounded-xl border border-slate-800 space-y-6">
                  <HelpCircle className="h-16 w-16 text-amber-500/40" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-200">Ready to take the test?</p>
                    <p className="text-xs text-slate-500 mt-1">Time Limit: {activeQuiz.timeLimitMinutes} minutes</p>
                  </div>
                  <button
                    onClick={handleStartQuiz}
                    className="rounded-lg bg-amber-500 hover:bg-amber-400 px-6 py-2.5 text-xs font-bold text-slate-950 transition-all cursor-pointer"
                  >
                    Start Quiz Session
                  </button>
                </div>
              )}

              {/* Active Quiz Sheet */}
              {quizAttempt && !quizResult && (
                <div className="space-y-6">
                  {/* Timer */}
                  {timerRemaining !== null && (
                    <div className="sticky top-0 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 flex items-center justify-between z-20">
                      <span className="text-xs text-slate-400">Remaining Session Time</span>
                      <span className={`text-sm font-bold flex items-center space-x-1.5 ${timerRemaining < 60 ? "text-rose-500 animate-pulse" : "text-amber-500"}`}>
                        <Hourglass className="h-4 w-4" />
                        <span>{formatTime(timerRemaining)}</span>
                      </span>
                    </div>
                  )}

                  {/* Question Sheet */}
                  <div className="space-y-6">
                    {activeQuiz.questions.map((question: any, qIndex: number) => {
                      const options: string[] = JSON.parse(question.optionsJson);
                      return (
                        <div key={question.id} className="glass p-6 rounded-xl border border-slate-800 space-y-4">
                          <p className="text-sm font-bold text-slate-200">
                            Question {qIndex + 1}: {question.text}
                          </p>
                          
                          <div className="grid grid-cols-1 gap-3">
                            {options.map((option, optIdx) => {
                              const isChecked = selectedAnswers[question.id] === option;
                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => setSelectedAnswers({ ...selectedAnswers, [question.id]: option })}
                                  className={`w-full text-left rounded-lg p-3 text-xs transition-all flex items-center space-x-3 cursor-pointer ${
                                    isChecked
                                      ? "bg-amber-500/10 border border-amber-500/40 text-slate-100"
                                      : "bg-slate-950 border border-slate-900 text-slate-400 hover:bg-slate-900/40"
                                  }`}
                                >
                                  <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                    isChecked ? "border-amber-500" : "border-slate-800"
                                  }`}>
                                    {isChecked && <div className="h-2 w-2 rounded-full bg-amber-500"></div>}
                                  </div>
                                  <span>{option}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Submission triggers */}
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={quizLoading}
                      className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 text-xs font-bold text-slate-950 hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {quizLoading ? "Evaluating..." : "Submit Exam"}
                    </button>
                  </div>
                </div>
              )}

              {/* Quiz Results Panel */}
              {quizResult && (
                <div className="space-y-8">
                  <div className={`glass p-8 rounded-xl border flex flex-col items-center text-center space-y-4 ${
                    quizResult.passed ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"
                  }`}>
                    <span className={`text-4xl font-extrabold ${quizResult.passed ? "text-emerald-500" : "text-rose-400"}`}>
                      {quizResult.scorePercent}%
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">
                        {quizResult.passed ? "You Passed!" : "Exam Failed"}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Passing Score Required: {quizResult.minPassScore}%
                      </p>
                    </div>

                    {quizResult.passed && quizResult.completion?.certificateId && (
                      <div className="pt-2">
                        <Link
                          href={`/verify/${quizResult.completion.certificateId}`}
                          className="inline-flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-slate-100 hover:bg-emerald-500 transition-all cursor-pointer"
                        >
                          <Award className="h-4 w-4" />
                          <span>View Your Certificate</span>
                        </Link>
                      </div>
                    )}

                    {!quizResult.passed && (
                      <button
                        onClick={handleStartQuiz}
                        className="rounded-lg border border-slate-700 bg-slate-900/40 px-6 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-900 transition-all cursor-pointer"
                      >
                        Try Again
                      </button>
                    )}
                  </div>

                  {/* Question Answers Review */}
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-slate-200">Answers Review</h3>
                    <div className="space-y-4">
                      {quizResult.results.map((res: any, idx: number) => (
                        <div key={res.questionId} className={`glass p-6 rounded-xl border ${
                          res.isCorrect ? "border-emerald-500/10" : "border-rose-500/10"
                        }`}>
                          <div className="flex items-start justify-between space-x-4">
                            <p className="text-xs font-semibold text-slate-300">
                              {idx + 1}. {res.text}
                            </p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 ${
                              res.isCorrect ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-400"
                            }`}>
                              {res.isCorrect ? "Correct" : "Incorrect"}
                            </span>
                          </div>
                          
                          <div className="mt-4 space-y-2 text-xs text-slate-400">
                            <p>Your Answer: <strong className={res.isCorrect ? "text-emerald-500" : "text-rose-400"}>{res.userAnswer || "None"}</strong></p>
                            {!res.isCorrect && <p>Correct Answer: <strong className="text-emerald-500">{res.correctAnswer}</strong></p>}
                            {res.explanation && (
                              <p className="bg-slate-950 p-3 rounded-lg border border-slate-900 text-slate-500 italic mt-2">
                                <strong>Explanation:</strong> {res.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
