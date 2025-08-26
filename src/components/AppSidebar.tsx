
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Wrench,
  MessageSquare,
  DollarSign,
  CheckSquare,
  Calendar,
  Package,
  Truck,
  UserCheck,
  Calculator,
  UserPlus,
  UserCog,
  HardDrive,
  Search,
  Menu,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Employees", url: "/admin/employees", icon: Users },
  { title: "Customers", url: "/admin/customers", icon: Users },
  { title: "Customer Management", url: "/admin/customer-management", icon: UserCog },
  { title: "Services", url: "/admin/services", icon: Wrench },
  { title: "Feedback", url: "/admin/feedback", icon: MessageSquare },
  { title: "Revenue", url: "/admin/revenue", icon: DollarSign },
  { title: "Tasks", url: "/admin/tasks", icon: CheckSquare },
  { title: "Attendance", url: "/admin/attendance", icon: Calendar },
  { title: "Salary", url: "/admin/salary", icon: DollarSign },
  { title: "Stocks", url: "/admin/stocks", icon: Package },
  { title: "Vendors", url: "/admin/vendors", icon: Truck },
  { title: "Sub-Contractors", url: "/admin/sub-contractors", icon: UserCheck },
  { title: "Manpower", url: "/admin/manpower", icon: UserPlus },
  { title: "Assets", url: "/admin/assets", icon: HardDrive },
  { title: "Accounts", url: "/admin/accounts", icon: Calculator },
  { title: "Inspection", url: "/admin/inspection", icon: Search },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/admin") {
      return currentPath === "/admin";
    }
    return currentPath.startsWith(path);
  };

  const getNavClasses = (path: string) => {
    return isActive(path)
      ? "bg-primary text-primary-foreground font-medium"
      : "hover:bg-secondary/50";
  };

  const handleNavClick = () => {
    // Close mobile sidebar when navigation item is clicked
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <div className="p-4 border-b">
        {!isCollapsed ? (
          <h1 className="text-xl font-bold">Admin Panel</h1>
        ) : (
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs font-bold">
            A
          </div>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/admin"}
                      className={getNavClasses(item.url)}
                      onClick={handleNavClick}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
