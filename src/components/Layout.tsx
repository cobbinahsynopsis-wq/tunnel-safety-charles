import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-10 flex items-center border-b bg-card px-2 shrink-0">
            <SidebarTrigger className="ml-1" />
            <div className="ml-3 flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">TSP TUNNEL TRANSPORT VEHICLE</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary font-mono rounded-sm">v1.0</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
