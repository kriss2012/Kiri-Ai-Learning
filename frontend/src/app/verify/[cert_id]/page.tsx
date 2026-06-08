"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, Award, Calendar, Clock, Download, ExternalLink, RefreshCw, GraduationCap } from "lucide-react";
import Navbar from "@/components/Navbar";

interface VerificationPayload {
  verified: boolean;
  status: "AUTHENTIC" | "TAMPERED" | "REVOKED" | "NOT_FOUND";
  message: string;
  verificationDate?: string;
  revocationDetails?: {
    revokedAt: string;
    reason: string;
  };
  certificateDetails?: {
    certificateId: string;
    issuedAt: string;
    pdfUrl: string;
    grade: number;
    instructorName: string;
  };
  learner?: {
    fullName: string;
    profilePhoto: string | null;
    userType: string;
    college: string | null;
    city: string | null;
  };
  course?: {
    title: string;
    category: string;
    level: string;
    durationHours: number;
  };
  sponsors?: Array<{
    name: string;
    logoUrl: string | null;
    websiteUrl: string | null;
    tier: string;
  }>;
  integrity?: {
    algorithm: string;
    signatureHash: string;
    signedAt: string;
  };
}

export default function VerifyPortal() {
  const { cert_id } = useParams();
  const searchParams = useSearchParams();
  const signatureFromUrl = searchParams.get("sig");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerificationPayload | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function performVerification() {
    setLoading(true);
    
    // Developer Mock Path
    if (cert_id === "mock" || cert_id === "KIRI-2026-MOCKDEMO") {
      setTimeout(() => {
        setData({
          verified: true,
          status: "AUTHENTIC",
          message: "Mock Verification successful.",
          verificationDate: new Date().toISOString(),
          certificateDetails: {
            certificateId: "KIRI-2026-MOCKDEMO",
            issuedAt: new Date().toISOString(),
            pdfUrl: "/certificates/mock.pdf",
            grade: 95,
            instructorName: "Dr. Ramesh Kumar",
          },
          learner: {
            fullName: "Priya Sharma",
            profilePhoto: null,
            userType: "student",
            college: "Pune Institute of Computer Technology",
            city: "Pune",
          },
          course: {
            title: "Prompt Engineering Masterclass",
            category: "generative_ai",
            level: "intermediate",
            durationHours: 4,
          },
          sponsors: [
            {
              name: "TechCorp India",
              logoUrl: null,
              websiteUrl: "https://techcorp.in",
              tier: "gold",
            },
          ],
          integrity: {
            algorithm: "RSA-SHA256",
            signatureHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            signedAt: new Date().toISOString(),
          },
        });
        setLoading(false);
      }, 800);
      return;
    }

    try {
      const url = signatureFromUrl
        ? `http://localhost:5000/v1/verify/cert/${cert_id}?sig=${signatureFromUrl}`
        : `http://localhost:5000/v1/verify/cert/${cert_id}`;
        
      const response = await fetch(url);
      const resJson = await response.json();
      setData(resJson);
    } catch (error) {
      console.error(error);
      setData({
        verified: false,
        status: "NOT_FOUND",
        message: "Failed to connect to verification server. Make sure backend is running.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (cert_id) {
      performVerification();
    }
  }, [cert_id]);

  const handlePdfDownload = async () => {
    if (!data?.certificateDetails?.certificateId) return;
    setDownloading(true);
    try {
      // In verify mode, PDF is public, we can fetch directly from server public directory or API
      const response = await fetch(`http://localhost:5000/certificates/${data.certificateDetails.certificateId}.pdf`);
      if (!response.ok) throw new Error("PDF not generated yet.");
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `${data.certificateDetails.certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      alert("Certificate PDF is not accessible. Try downloading from dashboard.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="animate-spin h-8 w-8 text-amber-500" />
          <p className="text-xs text-slate-400 font-medium">Validating cryptographic checksums...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col pb-16">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10 flex-grow w-full space-y-8">
        {/* Status Panel */}
        {data?.status === "AUTHENTIC" ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-lg font-extrabold text-slate-100">Credential Verified & Authentic</h1>
                <p className="text-xs text-slate-400 mt-0.5">This certificate was generated by the Kiri AI Authority.</p>
              </div>
            </div>
            
            <button
              onClick={handlePdfDownload}
              disabled={downloading}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-100 flex items-center space-x-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>{downloading ? "Downloading..." : "Get Signed PDF"}</span>
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 flex items-center space-x-4 shadow-2xl">
            <div className="h-12 w-12 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-500">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-100">
                {data?.status === "TAMPERED" 
                  ? "Integrity Check Failed" 
                  : data?.status === "REVOKED" 
                  ? "Certificate Revoked" 
                  : "Invalid Certificate ID"}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">{data?.message}</p>
              {data?.revocationDetails && (
                <p className="text-xs text-rose-400/90 mt-2 font-medium">
                  Reason: {data.revocationDetails.reason} (Revoked on {new Date(data.revocationDetails.revokedAt).toLocaleDateString()})
                </p>
              )}
            </div>
          </div>
        )}

        {/* Detailed Info (Only if status is Authentic or Revoked/Tampered contains metadata) */}
        {data && (data.status === "AUTHENTIC" || data.learner) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Left Column: Student Details */}
            <div className="md:col-span-1 space-y-6">
              <div className="glass p-6 rounded-xl border border-slate-800 space-y-4 text-center">
                <div className="mx-auto h-20 w-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <span className="text-2xl font-bold">{data.learner?.fullName.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Recipient</p>
                  <h3 className="text-base font-extrabold text-slate-200 mt-1">{data.learner?.fullName}</h3>
                </div>
                {data.learner?.college && (
                  <div className="border-t border-slate-900 pt-3 text-xs text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-300">{data.learner.college}</p>
                    <p className="text-[10px] text-slate-500">{data.learner.city}</p>
                  </div>
                )}
              </div>

              {/* Integrity Panel */}
              <div className="glass p-6 rounded-xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Security & Encryption</h4>
                <div className="text-[10px] text-slate-400 space-y-3 leading-relaxed">
                  <div>
                    <p className="text-slate-500 font-bold">ALGORITHM</p>
                    <p className="font-mono mt-0.5">{data.integrity?.algorithm || "RSA-SHA256"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-bold">DIGITAL SIGNATURE</p>
                    <p className="font-mono break-all mt-0.5 bg-slate-950 p-2 rounded-lg border border-slate-900/60">
                      {data.integrity?.signatureHash}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Course & Sponsors */}
            <div className="md:col-span-2 space-y-6">
              {/* Course details */}
              <div className="glass p-6 rounded-xl border border-slate-800 space-y-6">
                <div>
                  <span className="inline-block rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[9px] font-bold text-amber-500 uppercase">
                    {data.course?.category === "generative_ai" ? "Generative AI" : "Employability Skills"}
                  </span>
                  <h2 className="text-xl font-bold text-slate-200 mt-3">{data.course?.title}</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold border-t border-slate-900 pt-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase">Duration</p>
                    <p className="text-slate-300 flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span>{data.course?.durationHours} Hours</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase">Difficulty</p>
                    <p className="text-slate-300 flex items-center space-x-1">
                      <GraduationCap className="h-4 w-4 text-amber-500" />
                      <span className="capitalize">{data.course?.level}</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase">Instructor</p>
                    <p className="text-slate-300">{data.certificateDetails?.instructorName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase">Grade Achieved</p>
                    <p className="text-slate-300">{data.certificateDetails?.grade}%</p>
                  </div>
                </div>
              </div>

              {/* Sponsor Showcase */}
              {data.sponsors && data.sponsors.length > 0 && (
                <div className="glass p-6 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Sponsored By</h4>
                  <div className="flex flex-wrap items-center gap-6">
                    {data.sponsors.map((s, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <div className="rounded-lg bg-slate-950 border border-slate-900 px-3 py-2 text-xs font-bold text-slate-300">
                          {s.name}
                        </div>
                        {s.websiteUrl && (
                          <a href={s.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-amber-500">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
