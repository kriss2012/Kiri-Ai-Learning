"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Award, LayoutDashboard, LogOut, User as UserIcon, Menu, X, ShieldAlert, Sparkles } from "lucide-react";
import { getUser, logout, mockLogin, User } from "../lib/api";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Custom auth modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"preset" | "custom">("preset");
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customCollege, setCustomCollege] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [customRole, setCustomRole] = useState<"student" | "instructor" | "founder">("student");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setMounted(true);
  }, []);

  const handleMockLogin = async (role: "student" | "instructor" | "founder", isCustom = false) => {
    setAuthLoading(true);
    try {
      let loggedUser;
      if (isCustom) {
        if (!customName.trim() || !customEmail.trim()) {
          alert("Name and email are required to create a custom profile.");
          setAuthLoading(false);
          return;
        }
        loggedUser = await mockLogin(role, {
          displayName: customName.trim(),
          email: customEmail.trim(),
          college: customCollege.trim() || "Independent Learner",
          city: customCity.trim() || "India",
        });
      } else {
        loggedUser = await mockLogin(role as "student" | "instructor");
      }
      setUser(loggedUser);
      setShowAuthModal(false);
      window.location.reload(); // Refresh to sync active states
    } catch (e: any) {
      alert(e.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    window.location.href = "/";
  };

  if (!mounted) return null;

  return (
    <>
      <nav className="glass sticky top-0 z-40 w-full px-6 py-4 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Left: Brand & Links */}
          <div className="flex items-center space-x-12">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center space-x-2 text-xl font-extrabold tracking-wider text-slate-100">
              <span className="text-amber-500 font-bold">Kiri</span>
              <span className="text-slate-100 font-normal">AI Learning</span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
              <Link href="/" className="text-slate-300 hover:text-amber-400 transition-colors">
                Catalog
              </Link>
              {user && (
                <>
                  <Link href="/dashboard" className="flex items-center space-x-1 text-slate-300 hover:text-amber-400 transition-colors">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link href="/dashboard#certificates" className="flex items-center space-x-1 text-slate-300 hover:text-amber-400 transition-colors">
                    <Award className="h-4 w-4" />
                    <span>Certificates</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right: Auth Actions & Mobile Hamburger */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 rounded-full border border-amber-500/20 bg-slate-900/50 px-3 py-1.5 hover:bg-slate-900 transition-all cursor-pointer"
                >
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.displayName} className="h-6 w-6 rounded-full" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs text-amber-500">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-slate-200 md:block hidden">{user.displayName}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-800 bg-slate-950 p-2 shadow-2xl z-50">
                    <div className="px-3 py-2 border-b border-slate-905">
                      <p className="text-xs font-medium text-slate-400">Signed in as</p>
                      <p className="text-xs font-bold text-amber-500 capitalize">{user.userType}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center space-x-2 rounded-md px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 transition-colors mt-1 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-slate-950 hover:shadow-lg hover:shadow-amber-500/10 hover:brightness-110 transition-all cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Hamburger Menu (Mobile Only) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Links */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-slate-800/80 flex flex-col space-y-4 text-sm font-medium">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-amber-400 transition-colors"
            >
              Catalog
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 text-slate-300 hover:text-amber-400 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/dashboard#certificates"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 text-slate-300 hover:text-amber-400 transition-colors"
                >
                  <Award className="h-4 w-4" />
                  <span>Certificates</span>
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Auth Modal Backdrop & Container */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-[#0B0F19] p-6 shadow-2xl space-y-6">
            
            {/* Close trigger */}
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Title block */}
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <span>Kiri Learning Account</span>
              </h2>
              <p className="text-xs text-slate-400">
                Sign in to save your learning progress and earn verified certificates.
              </p>
            </div>

            {/* Tabs Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-900">
              <button
                onClick={() => setAuthMode("preset")}
                className={`py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                  authMode === "preset" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Demo Accounts
              </button>
              <button
                onClick={() => setAuthMode("custom")}
                className={`py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                  authMode === "custom" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Custom Profile
              </button>
            </div>

            {/* Tab content 1: Preset Roles */}
            {authMode === "preset" && (
              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Demo Profile</p>
                
                <button
                  onClick={() => handleMockLogin("student")}
                  disabled={authLoading}
                  className="w-full flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3 hover:bg-slate-900 transition-all text-left group cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
                      <UserIcon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Priya Sharma</p>
                      <p className="text-[10px] text-slate-400">Student · PICT Pune</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-500 group-hover:translate-x-0.5 transition-transform">Sign In &rarr;</span>
                </button>

                <button
                  onClick={() => handleMockLogin("instructor")}
                  disabled={authLoading}
                  className="w-full flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3 hover:bg-slate-900 transition-all text-left group cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
                      <BookOpen className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Dr. Ramesh Kumar</p>
                      <p className="text-[10px] text-slate-400">Educator · PICT Pune</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-500 group-hover:translate-x-0.5 transition-transform">Sign In &rarr;</span>
                </button>
              </div>
            )}

            {/* Tab content 2: Custom Profile form */}
            {authMode === "custom" && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Role Type</label>
                    <select
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="student">Student</option>
                      <option value="founder">Founder</option>
                      <option value="instructor">Instructor</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Gupta"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none placeholder-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. rahul@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none placeholder-slate-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">College / Org</label>
                    <input
                      type="text"
                      placeholder="IIT Bombay"
                      value={customCollege}
                      onChange={(e) => setCustomCollege(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none placeholder-slate-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">City</label>
                    <input
                      type="text"
                      placeholder="Mumbai"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none placeholder-slate-600"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleMockLogin(customRole, true)}
                  disabled={authLoading}
                  className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  {authLoading ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-slate-950"></div>
                  ) : (
                    <span>Create & Sign In</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
