import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { GlobalSearch } from "../GlobalSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            : "shrink-0",
          isMobile && !sidebarOpen && "-translate-x-full"
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
            <span className="ml-3 text-sm font-bold">Fest Control</span>
          </header>
        )}
        <main className="flex-1 p-6">{children}</main>
      </div>
      <GlobalSearch />
    </div>
  );
}
