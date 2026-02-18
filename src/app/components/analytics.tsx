import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { TrendingUp, Users, AlertTriangle, Download } from "lucide-react";

// Device Health by Month
const deviceHealthData = [
  { month: "Jan", healthy: 2650, issues: 180, critical: 20 },
  { month: "Feb", healthy: 2720, issues: 110, critical: 17 },
  { month: "Mar", healthy: 2780, issues: 55, critical: 12 },
  { month: "Apr", healthy: 2810, issues: 30, critical: 7 },
  { month: "May", healthy: 2847, issues: 25, critical: 5 }
];

// Customer Distribution
const customerData = [
  { name: "Enterprise", value: 1240, color: "#2563eb" },
  { name: "Mid-Market", value: 890, color: "#10b981" },
  { name: "Small Business", value: 520, color: "#f59e0b" },
  { name: "Government", value: 197, color: "#8b5cf6" }
];

// Deployment Trends
const deploymentData = [
  { week: "Week 1", deployments: 12 },
  { week: "Week 2", deployments: 19 },
  { week: "Week 3", deployments: 8 },
  { week: "Week 4", deployments: 15 },
  { week: "Week 5", deployments: 22 }
];

// Vulnerability Heatmap Data
const vulnerabilityHeatmap = [
  { device: "XR-5000", critical: 0, high: 0, medium: 1, low: 2 },
  { device: "S-8200", critical: 0, high: 1, medium: 2, low: 4 },
  { device: "FW-7500", critical: 1, high: 2, medium: 3, low: 5 },
  { device: "WAP-300", critical: 0, high: 0, medium: 1, low: 1 },
  { device: "NS-4000", critical: 0, high: 0, medium: 0, low: 0 },
  { device: "SRV-9000", critical: 0, high: 1, medium: 1, low: 2 }
];

const kpiData = [
  {
    title: "Avg. Device Uptime",
    value: "99.8%",
    change: "+0.3%",
    trend: "up",
    icon: TrendingUp,
    color: "text-green-600 dark:text-green-400"
  },
  {
    title: "Total Customers",
    value: "487",
    change: "+23",
    trend: "up",
    icon: Users,
    color: "text-blue-600 dark:text-blue-400"
  },
  {
    title: "Critical Alerts",
    value: "5",
    change: "-12",
    trend: "down",
    icon: AlertTriangle,
    color: "text-orange-600 dark:text-orange-400"
  },
  {
    title: "Monthly Downloads",
    value: "2,847",
    change: "+18%",
    trend: "up",
    icon: Download,
    color: "text-purple-600 dark:text-purple-400"
  }
];

export function Analytics() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl text-foreground mb-2">Reporting & Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights and vulnerability analysis
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <div key={index} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
              <span className={`text-sm ${
                kpi.trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}>
                {kpi.change}
              </span>
            </div>
            <div className="text-3xl font-semibold text-foreground mb-1">{kpi.value}</div>
            <div className="text-sm text-muted-foreground">{kpi.title}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Health Trend */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg text-foreground mb-4">Device Health Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deviceHealthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis dataKey="month" stroke="currentColor" opacity={0.5} />
              <YAxis stroke="currentColor" opacity={0.5} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem"
                }}
              />
              <Legend />
              <Bar dataKey="healthy" fill="#10b981" name="Healthy" />
              <Bar dataKey="issues" fill="#f59e0b" name="Issues" />
              <Bar dataKey="critical" fill="#ef4444" name="Critical" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Distribution */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg text-foreground mb-4">Customer Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={customerData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {customerData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Deployment Trend */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg text-foreground mb-4">Weekly Deployment Activity</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={deploymentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
            <XAxis dataKey="week" stroke="currentColor" opacity={0.5} />
            <YAxis stroke="currentColor" opacity={0.5} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem"
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="deployments"
              stroke="#2563eb"
              strokeWidth={3}
              name="Deployments"
              dot={{ fill: "#2563eb", r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Vulnerability Heatmap */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-foreground">Vulnerability Heatmap</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#ef4444] rounded" />
              <span className="text-muted-foreground">Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#f59e0b] rounded" />
              <span className="text-muted-foreground">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#eab308] rounded" />
              <span className="text-muted-foreground">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#10b981] rounded" />
              <span className="text-muted-foreground">Low</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Device Model
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Critical
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  High
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Medium
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Low
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vulnerabilityHeatmap.map((row, index) => {
                const total = row.critical + row.high + row.medium + row.low;
                return (
                  <tr key={index} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-foreground">{row.device}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center justify-center w-12 h-8 rounded ${
                          row.critical > 0
                            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 font-semibold"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {row.critical}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center justify-center w-12 h-8 rounded ${
                          row.high > 0
                            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 font-semibold"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {row.high}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center justify-center w-12 h-8 rounded ${
                          row.medium > 0
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 font-semibold"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {row.medium}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center justify-center w-12 h-8 rounded ${
                          row.low > 0
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {row.low}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold text-foreground">{total}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Vulnerabilities</div>
          <div className="text-2xl font-semibold text-foreground">
            {vulnerabilityHeatmap.reduce((acc, row) =>
              acc + row.critical + row.high + row.medium + row.low, 0
            )}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Critical & High Priority</div>
          <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
            {vulnerabilityHeatmap.reduce((acc, row) =>
              acc + row.critical + row.high, 0
            )}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Devices with Zero Issues</div>
          <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
            {vulnerabilityHeatmap.filter(row =>
              row.critical === 0 && row.high === 0 && row.medium === 0 && row.low === 0
            ).length}
          </div>
        </div>
      </div>
    </div>
  );
}
