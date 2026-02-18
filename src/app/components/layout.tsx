import { Outlet, Link, useLocation } from "react-router";
import {
  Package,
  Calendar,
  Download,
  Shield,
  BarChart3,
  Moon,
  Sun,
  LayoutDashboard,
  Menu,
  X
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Inventory & Assets", href: "/inventory", icon: Package },
  { name: "Account & Service", href: "/account-service", icon: Calendar },
  { name: "Deployment", href: "/deployment", icon: Download },
  { name: "Firmware Compliance", href: "/compliance", icon: Shield },
  { name: "Reporting & Analytics", href: "/analytics", icon: BarChart3 },
];

export function Layout() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar for desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-[#0f172a] border-r border-[#1e293b]">
        <div className="flex items-center justify-between h-16 px-6 border-b border-[#1e293b]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold text-lg">HLM Platform</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-[#2563eb] text-white"
                    : "text-[#94a3b8] hover:bg-[#1e293b] hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#1e293b]">
          <div className="flex items-center justify-between px-3 py-2 bg-[#1e293b] rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#2563eb] rounded-full flex items-center justify-center text-white text-sm">
                AD
              </div>
              <div>
                <div className="text-white text-sm">Admin User</div>
                <div className="text-[#64748b] text-xs">admin@platform.com</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0f172a] border-r border-[#1e293b]">
            <div className="flex items-center justify-between h-16 px-6 border-b border-[#1e293b]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-semibold text-lg">HLM Platform</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5 text-[#94a3b8]" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? "bg-[#2563eb] text-white"
                        : "text-[#94a3b8] hover:bg-[#1e293b] hover:text-white"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl text-foreground">
                {navigation.find(item => item.href === location.pathname)?.name || "Dashboard"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-foreground" />
              ) : (
                <Moon className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
