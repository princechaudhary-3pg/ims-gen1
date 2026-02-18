import { useState } from "react";
import { Search, Filter, Download, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";

interface Device {
  id: string;
  deviceName: string;
  serialNumber: string;
  model: string;
  location: string;
  status: "Online" | "Offline" | "Maintenance";
  firmwareVersion: string;
  lastUpdate: string;
  customer: string;
}

const mockDevices: Device[] = [
  {
    id: "1",
    deviceName: "Router-WAN-01",
    serialNumber: "SN-2847291847",
    model: "XR-5000",
    location: "Building A - Floor 3",
    status: "Online",
    firmwareVersion: "v2.4.1",
    lastUpdate: "2026-02-10",
    customer: "Acme Corp"
  },
  {
    id: "2",
    deviceName: "Switch-CORE-01",
    serialNumber: "SN-8472938472",
    model: "S-8200",
    location: "Data Center 1",
    status: "Online",
    firmwareVersion: "v3.1.2",
    lastUpdate: "2026-02-14",
    customer: "TechCo Industries"
  },
  {
    id: "3",
    deviceName: "Firewall-DMZ-02",
    serialNumber: "SN-1928374650",
    model: "FW-7500",
    location: "Building B - Network Room",
    status: "Maintenance",
    firmwareVersion: "v2.3.8",
    lastUpdate: "2026-02-05",
    customer: "Global Systems"
  },
  {
    id: "4",
    deviceName: "AP-OFFICE-15",
    serialNumber: "SN-5647382910",
    model: "WAP-300",
    location: "Building A - Floor 5",
    status: "Online",
    firmwareVersion: "v1.9.4",
    lastUpdate: "2026-02-12",
    customer: "Acme Corp"
  },
  {
    id: "5",
    deviceName: "Storage-NAS-01",
    serialNumber: "SN-9182736450",
    model: "NS-4000",
    location: "Data Center 2",
    status: "Online",
    firmwareVersion: "v4.2.0",
    lastUpdate: "2026-02-15",
    customer: "DataVault LLC"
  },
  {
    id: "6",
    deviceName: "Server-APP-03",
    serialNumber: "SN-3746582910",
    model: "SRV-9000",
    location: "Data Center 1 - Rack 14",
    status: "Online",
    firmwareVersion: "v5.1.3",
    lastUpdate: "2026-02-13",
    customer: "CloudFirst Inc"
  },
  {
    id: "7",
    deviceName: "Switch-ACCESS-22",
    serialNumber: "SN-6547829103",
    model: "S-2400",
    location: "Building C - Floor 2",
    status: "Offline",
    firmwareVersion: "v2.8.1",
    lastUpdate: "2026-01-28",
    customer: "TechCo Industries"
  },
  {
    id: "8",
    deviceName: "UPS-POWER-05",
    serialNumber: "SN-8374651920",
    model: "UPS-5000",
    location: "Data Center 2",
    status: "Online",
    firmwareVersion: "v1.4.2",
    lastUpdate: "2026-02-11",
    customer: "DataVault LLC"
  }
];

const statusColors = {
  Online: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Offline: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Maintenance: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
};

export function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredDevices = mockDevices.filter(device =>
    device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedDevices = filteredDevices.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl text-foreground mb-2">Inventory & Asset Management</h2>
          <p className="text-muted-foreground">
            Real-time device status and software lineage tracking
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors">
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-semibold text-foreground">{mockDevices.length}</div>
          <div className="text-sm text-muted-foreground">Total Devices</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
            {mockDevices.filter(d => d.status === "Online").length}
          </div>
          <div className="text-sm text-muted-foreground">Online</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
            {mockDevices.filter(d => d.status === "Maintenance").length}
          </div>
          <div className="text-sm text-muted-foreground">In Maintenance</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
            {mockDevices.filter(d => d.status === "Offline").length}
          </div>
          <div className="text-sm text-muted-foreground">Offline</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by device name, serial number, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            />
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-foreground">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Device Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Serial Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Firmware
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayedDevices.map((device) => (
                <tr key={device.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{device.deviceName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted-foreground font-mono">{device.serialNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{device.model}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted-foreground">{device.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${statusColors[device.status]}`}>
                      {device.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{device.firmwareVersion}</div>
                    <div className="text-xs text-muted-foreground">{device.lastUpdate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{device.customer}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="p-1 hover:bg-muted rounded transition-colors">
                      <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredDevices.length)} of {filteredDevices.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <span className="text-sm text-foreground px-3">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
