import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VersionOps",
  description: "Fest Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 flex min-h-screen text-gray-900`}
      >
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 w-full max-w-6xl mx-auto">
            {children}
          </main>
          <footer className="bg-white border-t mt-auto">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
              © 2026 VersionOps. All rights reserved.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
