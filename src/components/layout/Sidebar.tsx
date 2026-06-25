"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Users, Clock, CheckSquare, Calendar,
  Zap, BarChart2, Settings, ChevronLeft, ChevronRight, LogOut
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/employees", label: "Employees", icon: Users },
  { path: "/attendance", label: "Attendance", icon: Clock },
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/leave", label: "Leave", icon: Calendar },
  { path: "/automation", label: "Automation", icon: Zap },
  { path: "/reports", label: "Reports", icon: BarChart2 },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const location = usePathname();
  const { currentUser, logout } = useAuthContext();

  return (
    <aside
      data-testid="sidebar"
      className={cn(
        "flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out z-40 relative",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border min-h-[64px]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src="/agniit-logo.webp" alt="AgniIT" className="w-8 h-8 rounded-full object-contain flex-shrink-0" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-sidebar-foreground leading-tight">AgniIT</p>
              <p className="text-[10px] text-sidebar-foreground/50 leading-tight">CRM Portal</p>
            </div>
          </div>
        )}
        {collapsed && (
          <img src="/agniit-logo.webp" alt="AgniIT" className="w-8 h-8 rounded-full object-contain mx-auto" />
        )}
        <button
          data-testid="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors flex-shrink-0",
            collapsed && "absolute -right-3 top-4 bg-sidebar border border-sidebar-border shadow-sm"
          )}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location && (location === path || location.startsWith(path + "/"));
          return (
            <Link
              key={path}
              href={path}
              data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-primary text-white"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border px-2 py-3">
        {currentUser && (
          <div className={cn("flex items-center gap-3 px-2 py-2 rounded-lg", collapsed ? "justify-center" : "")}>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-sm font-semibold">
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground truncate">{currentUser.name}</p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate">{currentUser.position}</p>
              </div>
            )}
            {!collapsed && (
              <button
                data-testid="logout-button"
                onClick={logout}
                className="p-1.5 rounded hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        )}
        {collapsed && currentUser && (
          <button
            data-testid="logout-button-collapsed"
            onClick={logout}
            className="w-full flex justify-center p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors mt-1"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
