import { Link } from "react-router";
import {
  Package,
  Calendar,
  Download,
  Shield,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Server
} from "lucide-react";

const stats = [
  { name: "Total Devices", value: "2,847", change: "+12%", icon: Package, color: "text-blue-600 dark:text-blue-400" },
  { name: "Active Deployments", value: "34", change: "+5%", icon: Download, color: "text-green-600 dark:text-green-400" },
  { name: "Pending Approvals", value: "8", change: "-2%", icon: Shield, color: "text-orange-600 dark:text-orange-400" },
  { name: "Health Score", value: "94.2%", change: "+1.2%", icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
];

const quickActions = [
  { name: "View Inventory", href: "/inventory", icon: Package, description: "Manage device assets" },
  { name: "Schedule Service", href: "/account-service", icon: Calendar, description: "Plan technician visits" },
  { name: "Deploy Firmware", href: "/deployment", icon: Download, description: "Upload & distribute" },
  { name: "Check Compliance", href: "/compliance", icon: Shield, description: "Review certifications" },
];

const recentAlerts = [
  { type: "warning", message: "3 devices require firmware updates", time: "10 minutes ago" },
  { type: "info", message: "New firmware version 2.4.1 approved", time: "1 hour ago" },
  { type: "success", message: "Deployment to Site A completed", time: "3 hours ago" },
];

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl text-foreground mb-2">Welcome back, Admin</h2>
        <p className="text-muted-foreground">
          Here's what's happening with your hardware lifecycle today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <span className="text-sm text-green-600 dark:text-green-400">{stat.change}</span>
            </div>
            <div className="text-3xl font-semibold text-foreground mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.name}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="bg-card border border-border rounded-lg p-6 hover:border-[#2563eb] transition-colors group"
            >
              <action.icon className="w-10 h-10 text-[#2563eb] mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-base text-foreground mb-1">{action.name}</div>
              <div className="text-sm text-muted-foreground">{action.description}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg text-foreground">Recent Alerts</h3>
            <Link to="/analytics" className="text-sm text-[#2563eb] hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentAlerts.map((alert, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                {alert.type === "warning" && (
                  <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                )}
                {alert.type === "info" && (
                  <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                )}
                {alert.type === "success" && (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="text-sm text-foreground">{alert.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">{alert.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg text-foreground mb-4">System Status</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">Deployment Service</span>
                <span className="text-sm text-green-600 dark:text-green-400">Operational</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: "100%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">Compliance Engine</span>
                <span className="text-sm text-green-600 dark:text-green-400">Operational</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: "100%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">Asset Database</span>
                <span className="text-sm text-green-600 dark:text-green-400">Operational</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: "100%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">Analytics Platform</span>
                <span className="text-sm text-orange-600 dark:text-orange-400">Maintenance</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-orange-500" style={{ width: "85%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
