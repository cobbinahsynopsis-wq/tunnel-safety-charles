import { Disc3, TriangleAlert, Navigation, Flame, Zap, LayoutDashboard, BarChart3, Shield } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useSystems } from "@/context/SystemsContext";
import { AddSystemDialog } from "@/components/AddSystemDialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const iconMap: Record<string, React.ElementType> = {
  Disc3, TriangleAlert, Navigation, Flame, Zap,
};

const navItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard, end: true },
  { title: "Power BI Dashboard", url: "/dashboard", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { systems } = useSystems();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-primary"><h1 className="text-sm font-bold text-primary">TVS</h1></h1>
              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-sidebar-foreground/50">
                Safety Analysis
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-7 h-7 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Shield className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className="hover:bg-sidebar-accent/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary border-l-2 border-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px] uppercase tracking-widest text-sidebar-foreground/40 font-mono">
            Subsystems
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systems.map((system) => {
                const Icon = iconMap[system.icon] ?? Zap;
                return (
                  <SidebarMenuItem key={system.id}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={`/system/${system.id}`}
                        className="hover:bg-sidebar-accent/50 transition-colors"
                        activeClassName="bg-primary/10 text-primary border-l-2 border-primary font-medium"
                      >
                        <Icon className="mr-2 h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <div className="flex flex-col">
                            <span className="text-sm leading-tight">{system.name}</span>
                            <span className="text-[9px] text-sidebar-foreground/40 font-mono">
                              {system.nameFr}
                            </span>
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {!collapsed && (
                <SidebarMenuItem>
                  <div className="px-2 py-1">
                    <AddSystemDialog />
                  </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
