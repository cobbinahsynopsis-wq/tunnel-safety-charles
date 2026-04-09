import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { TunnelBackground } from "@/components/TunnelBackground";

export function Layout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative">
          <TunnelBackground />
          <header className="h-10 flex items-center border-b border-border/50 bg-card/80 backdrop-blur-sm px-2 shrink-0 z-10">
            <SidebarTrigger className="ml-1" />
            <div className="ml-3 flex items-center gap-2">
              <span className="text-xs font-mono text-primary font-semibold tracking-wider"><span className="text-xs font-mono text-primary font-semibold tracking-wider">TVS</span></span>
              <span className="text-[10px] text-muted-foreground font-mono">SAFETY ANALYSIS</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary font-mono rounded-sm border border-primary/20">v1.0</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 z-10 relative">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
