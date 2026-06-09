import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kiri AI Learning | Master Generative AI & Employability",
  description: "Boost your career with verified, employer-recognized credentials. Learn prompt engineering, resume optimization, startup pitching, and AI workflows for free.",
  keywords: "generative AI, prompt engineering, employability, free courses, certificate, India",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#0D1321",
              color: "#F1F5F9",
              border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: "0.75rem",
              fontSize: "0.8125rem",
              fontWeight: "500",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            },
            success: {
              iconTheme: { primary: "#10B981", secondary: "#0D1321" },
            },
            error: {
              iconTheme: { primary: "#F43F5E", secondary: "#0D1321" },
            },
          }}
        />
      </body>
    </html>
  );
}
