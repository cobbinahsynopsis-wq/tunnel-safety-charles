import { Disc3, TriangleAlert, Navigation, Flame, Zap, LayoutDashboard, BarChart3 } from "lucide-react";
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

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        {!collapsed ? (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-sidebar-foreground/50">
              ISO 12100 / 13849
            </p>
            <h1 className="text-sm font-semibold text-sidebar-accent-foreground mt-0.5">
              TSP Risk Analysis
            </h1>
          </div>
        ) : (
          <p className="text-xs font-mono font-bold text-sidebar-primary text-center">TSP</p>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/"
                    end
                    className="hover:bg-sidebar-accent/50"
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Overview</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/dashboard"
                    className="hover:bg-sidebar-accent/50"
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Power BI Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest">
            Systems
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
                        className="hover:bg-sidebar-accent/50"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <Icon className="mr-2 h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <div className="flex flex-col">
                            <span className="text-sm leading-tight">{item.title}</span>
                            <span className="text-[10px] text-sidebar-foreground/50 font-mono">
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
