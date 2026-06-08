"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Award, LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import { getUser, logout, mockLogin, User } from "../lib/api";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setMounted(true);
  }, []);

  const handleMockLogin = async (role: "student" | "instructor") => {
    try {
      const loggedUser = await mockLogin(role);
      setUser(loggedUser);
      setDropdownOpen(false);
      window.location.reload(); // Refresh to sync active states
    } catch (e) {
      alert("Mock login failed.");
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    window.location.href = "/";
  };

  if (!mounted) return null;

  return (
    <nav className="glass sticky top-0 z-50 w-full px-6 py-4 shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2 text-xl font-extrabold tracking-wider text-slate-100">
          <span className="text-amber-500 font-bold">Kiri</span>
          <span className="text-slate-100 font-normal">AI Learning</span>
        </Link>

        {/* Links */}
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

        {/* Auth Actions */}
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
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-800 bg-slate-950 p-2 shadow-2xl">
                  <div className="px-3 py-2 border-b border-slate-900">
                    <p className="text-xs font-medium text-slate-400">Signed in as</p>
                    <p className="text-xs font-bold text-amber-500 capitalize">{user.userType}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center space-x-2 rounded-md px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 transition-colors mt-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-slate-950 hover:shadow-lg hover:shadow-amber-500/10 hover:brightness-110 transition-all cursor-pointer"
              >
                Sign In (Mock)
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-800 bg-slate-950 p-2 shadow-2xl">
                  <p className="px-3 py-2 text-left text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Select Test Role
                  </p>
                  <button
                    onClick={() => handleMockLogin("student")}
                    className="flex w-full items-center space-x-2 rounded-md px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-900 transition-colors"
                  >
                    <UserIcon className="h-4 w-4 text-amber-500" />
                    <div className="flex flex-col">
                      <span className="font-bold">Student Profile</span>
                      <span className="text-[10px] text-slate-400">Priya Sharma</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleMockLogin("instructor")}
                    className="flex w-full items-center space-x-2 rounded-md px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-900 transition-colors"
                  >
                    <BookOpen className="h-4 w-4 text-amber-500" />
                    <div className="flex flex-col">
                      <span className="font-bold">Educator Profile</span>
                      <span className="text-[10px] text-slate-400">Dr. Ramesh Kumar</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
