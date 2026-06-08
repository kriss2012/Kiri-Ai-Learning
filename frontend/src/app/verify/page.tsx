"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function VerifySearch() {
  const router = useRouter();
  const [certId, setCertId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim()) return;
    router.push(`/verify/${certId.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col pb-16">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 py-20 flex-grow w-full flex flex-col justify-center items-center text-center space-y-8">
        <div className="h-16 w-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
          <Award className="h-8 w-8" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">Kiri Verification Registry</h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Input a Certificate ID (e.g. KIRI-YYYY-XXXXXXXX) to inspect and authenticate digital credentials.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-md flex space-x-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
          <div className="relative flex-grow flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-500 absolute left-3" />
            <input
              type="text"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder="Enter Certificate ID..."
              className="w-full bg-transparent border-0 pl-7 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-0"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-xs font-bold transition-all cursor-pointer"
          >
            Verify
          </button>
        </form>

        <p className="text-[10px] text-slate-500">
          Tip: You can use <strong className="text-slate-400 font-semibold">KIRI-2026-MOCKDEMO</strong> to view a sample verified profile.
        </p>
      </main>
    </div>
  );
}
