import { ReactNode, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { GlobalSearch } from "../GlobalSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { Maximize2, Minimize2, Menu, Command, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isLeaderboard = location.pathname === "/leaderboard";
  const isParticipant = user?.role === "PARTICIPANT";
  const isGuest = !user;
  const showSidebar = !isGuest && !isParticipant && (!isLeaderboard || !sidebarCollapsed);

  return (
    <div
      className="flex min-h-screen w-full font-sans overflow-x-hidden"
      style={{
        background: "#0d0d0d",
        color: "#e3e3e3",
      }}
    >
      {/* ── Guest top navbar ── */}
      {isGuest && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-13 py-3"
          style={{
            background: "rgba(13,13,13,0.9)",
            borderBottom: "1px solid #1e1e20",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg" style={{ background: "#fff", padding: 5, width: 28, height: 28 }}>
              <Command className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm" style={{ color: "#e3e3e3", letterSpacing: "-0.02em" }}>Version 26</span>
            <div className="h-3 w-px" style={{ background: "#222224" }} />
            <span className="font-bold" style={{ fontSize: 10, color: "#5ecfba", letterSpacing: "0.12em", textTransform: "uppercase" }}>Cognix</span>
          </div>
          <div className="flex items-center gap-5">
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-150"
              style={{ background: "#1a3d37", color: "#7cebd6", border: "1px solid #5ecfba25" }}
            >
              <LogIn className="h-3.5 w-3.5" /> Sign in
            </Link>
          </div>
        </div>
      )}

      {/* ── Mobile overlay — glassmorphism ── */}
      {isMobile && sidebarOpen && !isParticipant && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setSidebarOpen(false)}
          style={{ background: "rgba(4, 4, 4, 0.75)", backdropFilter: "blur(8px)" }}
        />
      )}

      {/* ── Sidebar ── */}
      {!isParticipant && !isGuest && (
        <AppSidebar onClose={isMobile ? () => setSidebarOpen(false) : undefined} />
      )}

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* ── Mobile header — Wizardly glassmorphism pill ── */}
        {isMobile && !isParticipant && !isGuest && (
          <header
            className="h-14 flex items-center px-4 sticky top-0 z-30"
            style={{
              background: "rgba(13, 13, 13, 0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid #1e1e20",
            }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg transition-colors duration-150"
              style={{ color: "#6b7280" }}
            >
              <Menu className="h-4 w-4" />
            </button>
            
            <div className="ml-4 flex items-center gap-2.5">
              {/* Mini brand badge */}
              <div
                className="flex items-center justify-center rounded-md"
                style={{ background: "#ffffff", padding: 4, width: 22, height: 22 }}
              >
                <Command className="h-3 w-3 text-black" strokeWidth={2.5} />
              </div>
              <span
                className="font-bold text-sm tracking-tight"
                style={{ color: "#e3e3e3", letterSpacing: "-0.02em" }}
              >
                Version 26
              </span>
              <div
                className="h-3 w-px mx-1"
                style={{ background: "#2e2e34" }}
              />
              <span
                className="font-bold"
                style={{
                  fontSize: 10,
                  color: "#5ecfba",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Cognix
              </span>
            </div>
          </header>
        )}

        {/* ── Desktop Collapse Toggle (only on Leaderboard) ── */}
        {!isMobile && isLeaderboard && !isParticipant && !isGuest && (
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg transition-all duration-150"
              style={{
                background: "#111113",
                border: "1px solid #222224",
                color: "#6b7280",
              }}
              title={sidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
            >
              {sidebarCollapsed ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        )}

        {/* ── Page Content ── */}
        <main
          className={cn(
            "flex-1 p-6 md:p-10 transition-all duration-300",
            !isMobile && !isParticipant && !isGuest && "ml-64",
            isGuest && "pt-24 md:pt-28"
          )}
          style={{
            width: !isMobile && !isParticipant && !isGuest ? 'calc(100vw - 16rem)' : '100%',
            maxWidth: !isMobile && !isParticipant && !isGuest ? 'calc(100vw - 16rem)' : '100%'
          }}
        >
          {children}
        </main>
      </div>
      <GlobalSearch />
    </div>
  );
}
