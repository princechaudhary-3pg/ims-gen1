import { useState } from "react";
import { Calendar, User, MapPin, Clock, Plus, Filter } from "lucide-react";

interface ServiceOrder {
  id: string;
  title: string;
  technician: string;
  type: "Internal" | "3rd Party";
  location: string;
  date: string;
  time: string;
  status: "Scheduled" | "In Progress" | "Completed";
  priority: "High" | "Medium" | "Low";
}

const mockOrders: ServiceOrder[] = [
  {
    id: "1",
    title: "Firmware Update - Router XR-5000",
    technician: "John Smith",
    type: "Internal",
    location: "Building A - Floor 3",
    date: "2026-02-17",
    time: "09:00 AM",
    status: "Scheduled",
    priority: "High"
  },
  {
    id: "2",
    title: "Hardware Replacement - Switch S-8200",
    technician: "Sarah Johnson",
    type: "3rd Party",
    location: "Data Center 1",
    date: "2026-02-17",
    time: "02:00 PM",
    status: "Scheduled",
    priority: "Medium"
  },
  {
    id: "3",
    title: "Routine Maintenance - Firewall DMZ",
    technician: "Mike Davis",
    type: "Internal",
    location: "Building B - Network Room",
    date: "2026-02-18",
    time: "10:30 AM",
    status: "Scheduled",
    priority: "Low"
  },
  {
    id: "4",
    title: "Security Patch Installation",
    technician: "Emily Chen",
    type: "Internal",
    location: "Data Center 2",
    date: "2026-02-16",
    time: "11:00 AM",
    status: "In Progress",
    priority: "High"
  },
  {
    id: "5",
    title: "Network Configuration Update",
    technician: "Robert Lee",
    type: "3rd Party",
    location: "Building C - Floor 2",
    date: "2026-02-15",
    time: "03:00 PM",
    status: "Completed",
    priority: "Medium"
  },
  {
    id: "6",
    title: "Access Point Installation",
    technician: "Amanda Wilson",
    type: "Internal",
    location: "Building A - Floor 5",
    date: "2026-02-19",
    time: "01:00 PM",
    status: "Scheduled",
    priority: "Medium"
  }
];

const statusColors = {
  Scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "In Progress": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
};

const priorityColors = {
  High: "border-l-red-500",
  Medium: "border-l-orange-500",
  Low: "border-l-blue-500"
};

export function AccountService() {
  const [viewMode, setViewMode] = useState<"kanban" | "calendar">("kanban");

  const scheduledOrders = mockOrders.filter(o => o.status === "Scheduled");
  const inProgressOrders = mockOrders.filter(o => o.status === "In Progress");
  const completedOrders = mockOrders.filter(o => o.status === "Completed");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl text-foreground mb-2">Account & Service Management</h2>
          <p className="text-muted-foreground">
            Schedule and track hardware/firmware service orders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                viewMode === "kanban"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                viewMode === "calendar"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Calendar
            </button>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors">
            <Plus className="w-4 h-4" />
            New Service Order
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
            {scheduledOrders.length}
          </div>
          <div className="text-sm text-muted-foreground">Scheduled</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
            {inProgressOrders.length}
          </div>
          <div className="text-sm text-muted-foreground">In Progress</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
            {completedOrders.length}
          </div>
          <div className="text-sm text-muted-foreground">Completed Today</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-semibold text-foreground">
            {mockOrders.filter(o => o.type === "Internal").length}
          </div>
          <div className="text-sm text-muted-foreground">Internal Technicians</div>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scheduled Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg text-foreground flex items-center gap-2">
                Scheduled
                <span className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-0.5 rounded-full">
                  {scheduledOrders.length}
                </span>
              </h3>
            </div>
            <div className="space-y-3">
              {scheduledOrders.map((order) => (
                <div
                  key={order.id}
                  className={`bg-card border border-border rounded-lg p-4 border-l-4 ${priorityColors[order.priority]} hover:shadow-md transition-shadow cursor-pointer`}
                >
                  <h4 className="text-sm font-medium text-foreground mb-3">{order.title}</h4>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5" />
                      <span>{order.technician}</span>
                      <span className={`ml-auto px-2 py-0.5 rounded-full ${
                        order.type === "Internal"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                          : "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400"
                      }`}>
                        {order.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{order.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{order.date} at {order.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg text-foreground flex items-center gap-2">
                In Progress
                <span className="text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 px-2 py-0.5 rounded-full">
                  {inProgressOrders.length}
                </span>
              </h3>
            </div>
            <div className="space-y-3">
              {inProgressOrders.map((order) => (
                <div
                  key={order.id}
                  className={`bg-card border border-border rounded-lg p-4 border-l-4 ${priorityColors[order.priority]} hover:shadow-md transition-shadow cursor-pointer`}
                >
                  <h4 className="text-sm font-medium text-foreground mb-3">{order.title}</h4>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5" />
                      <span>{order.technician}</span>
                      <span className={`ml-auto px-2 py-0.5 rounded-full ${
                        order.type === "Internal"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                          : "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400"
                      }`}>
                        {order.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{order.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{order.date} at {order.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg text-foreground flex items-center gap-2">
                Completed
                <span className="text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-0.5 rounded-full">
                  {completedOrders.length}
                </span>
              </h3>
            </div>
            <div className="space-y-3">
              {completedOrders.map((order) => (
                <div
                  key={order.id}
                  className={`bg-card border border-border rounded-lg p-4 border-l-4 ${priorityColors[order.priority]} hover:shadow-md transition-shadow cursor-pointer opacity-75`}
                >
                  <h4 className="text-sm font-medium text-foreground mb-3">{order.title}</h4>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5" />
                      <span>{order.technician}</span>
                      <span className={`ml-auto px-2 py-0.5 rounded-full ${
                        order.type === "Internal"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                          : "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400"
                      }`}>
                        {order.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{order.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{order.date} at {order.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg text-foreground">February 2026</h3>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-foreground">
              <Filter className="w-4 h-4" />
              Filter by Technician
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm text-muted-foreground py-2">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {Array.from({ length: 35 }, (_, i) => {
              const dayNum = i - 5; // Start from Feb 1 (Monday)
              const isCurrentMonth = dayNum > 0 && dayNum <= 28;
              const dateStr = `2026-02-${String(dayNum).padStart(2, '0')}`;
              const ordersForDay = mockOrders.filter(o => o.date === dateStr);

              return (
                <div
                  key={i}
                  className={`min-h-24 border border-border rounded-lg p-2 ${
                    isCurrentMonth ? "bg-card" : "bg-muted/50"
                  }`}
                >
                  {isCurrentMonth && (
                    <>
                      <div className="text-sm text-foreground mb-1">{dayNum}</div>
                      <div className="space-y-1">
                        {ordersForDay.map((order) => (
                          <div
                            key={order.id}
                            className={`text-xs p-1 rounded truncate ${statusColors[order.status]}`}
                            title={order.title}
                          >
                            {order.time.split(' ')[0]} - {order.title.substring(0, 20)}...
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
