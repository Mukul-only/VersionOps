import { ReactNode, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { GlobalSearch } from "../GlobalSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { Maximize2, Minimize2, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isLeaderboard = location.pathname === "/leaderboard";
  const showSidebar = !isLeaderboard || !sidebarCollapsed;

  return (
    <div className="flex min-h-screen w-full">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          isMobile
            ? "fixed inset-y-0 left-0 z-50 transition-transform duration-200"
            : "shrink-0 transition-all duration-300 overflow-hidden",
          isMobile && !sidebarOpen && "-translate-x-full",
          !isMobile && !showSidebar && "w-0 opacity-0"
        )}
      >
        <AppSidebar onClose={isMobile ? () => setSidebarOpen(false) : undefined} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        {isMobile && (
          <header className="h-12 flex items-center border-b px-4 bg-card">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-accent"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="ml-3 text-sm font-bold">Version'26</span>
          </header>
        )}
        
        {/* Desktop Collapse Toggle (only on Leaderboard) */}
        {!isMobile && isLeaderboard && (
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-full bg-card border shadow-md hover:bg-accent transition-colors text-[#6A0DAD]"
              title={sidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
            >
              {sidebarCollapsed ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
          </div>
        )}

        <main className={cn(
          "flex-1 p-6 transition-all duration-300",
          !isMobile && !showSidebar && "p-10"
        )}>
          {children}
        </main>
      </div>
      <GlobalSearch />
    </div>
  );
}
