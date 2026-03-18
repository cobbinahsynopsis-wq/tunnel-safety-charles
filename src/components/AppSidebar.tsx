import { Disc3, TriangleAlert, Navigation, Flame, Zap, LayoutDashboard, BarChart3, Shield } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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
  Disc3,
  TriangleAlert,
  Navigation,
  Flame,
  Zap,
};

const systemItems = [
  { title: "Braking", subtitle: "Freinage", url: "/system/braking", icon: "Disc3" },
  { title: "Tilt Monitoring", subtitle: "Dévers", url: "/system/tilt", icon: "TriangleAlert" },
  { title: "Steering", subtitle: "Direction", url: "/system/steering", icon: "Navigation" },
  { title: "Fire System", subtitle: "Incendie", url: "/system/fire", icon: "Flame" },
  { title: "Propulsion", subtitle: "Translation", url: "/system/propulsion", icon: "Zap" },
];

const navItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard, end: true },
  { title: "FMEA Analysis", url: "/system/braking", icon: Shield },
  { title: "Power BI Dashboard", url: "/dashboard", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-primary">TSP/MSV</h1>
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
              {systemItems.map((item) => {
                const Icon = iconMap[item.icon];
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="hover:bg-sidebar-accent/50 transition-colors"
                        activeClassName="bg-primary/10 text-primary border-l-2 border-primary font-medium"
                      >
                        <Icon className="mr-2 h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <div className="flex flex-col">
                            <span className="text-sm leading-tight">{item.title}</span>
                            <span className="text-[9px] text-sidebar-foreground/40 font-mono">
                              {item.subtitle}
                            </span>
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
