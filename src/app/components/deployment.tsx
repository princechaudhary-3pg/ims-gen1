import { useState } from "react";
import { Download, Upload, Shield, Eye, Search, FileText } from "lucide-react";

interface FirmwareVersion {
  id: string;
  name: string;
  version: string;
  deviceModel: string;
  releaseDate: string;
  fileSize: string;
  checksum: string;
  status: "Approved" | "Pending" | "Deprecated";
  downloads: number;
}

interface AuditLog {
  id: string;
  user: string;
  action: string;
  firmware: string;
  timestamp: string;
  ipAddress: string;
  status: "Success" | "Failed";
}

const mockFirmware: FirmwareVersion[] = [
  {
    id: "1",
    name: "XR-5000 Enterprise Firmware",
    version: "v2.4.1",
    deviceModel: "XR-5000",
    releaseDate: "2026-02-10",
    fileSize: "245 MB",
    checksum: "a3f8c9d2e1b4...",
    status: "Approved",
    downloads: 127
  },
  {
    id: "2",
    name: "S-8200 Core Switch Firmware",
    version: "v3.1.2",
    deviceModel: "S-8200",
    releaseDate: "2026-02-08",
    fileSize: "189 MB",
    checksum: "b7e4a2f9c8d1...",
    status: "Approved",
    downloads: 94
  },
  {
    id: "3",
    name: "FW-7500 Security Patch",
    version: "v2.3.9",
    deviceModel: "FW-7500",
    releaseDate: "2026-02-12",
    fileSize: "312 MB",
    checksum: "c5d9e7f3a8b2...",
    status: "Pending",
    downloads: 0
  },
  {
    id: "4",
    name: "WAP-300 Access Point Update",
    version: "v1.9.4",
    deviceModel: "WAP-300",
    releaseDate: "2026-01-28",
    fileSize: "87 MB",
    checksum: "d8a3f6c9e2b1...",
    status: "Approved",
    downloads: 156
  },
  {
    id: "5",
    name: "NS-4000 Storage Controller",
    version: "v4.2.0",
    deviceModel: "NS-4000",
    releaseDate: "2026-02-05",
    fileSize: "423 MB",
    checksum: "e1b7c4d9f8a3...",
    status: "Approved",
    downloads: 68
  },
  {
    id: "6",
    name: "XR-5000 Legacy Firmware",
    version: "v2.2.8",
    deviceModel: "XR-5000",
    releaseDate: "2025-11-15",
    fileSize: "238 MB",
    checksum: "f9e2a8c7d3b4...",
    status: "Deprecated",
    downloads: 342
  }
];

const mockAuditLogs: AuditLog[] = [
  {
    id: "1",
    user: "john.smith@platform.com",
    action: "Downloaded",
    firmware: "XR-5000 v2.4.1",
    timestamp: "2026-02-16 14:23:45",
    ipAddress: "192.168.1.45",
    status: "Success"
  },
  {
    id: "2",
    user: "sarah.johnson@platform.com",
    action: "Downloaded",
    firmware: "S-8200 v3.1.2",
    timestamp: "2026-02-16 13:15:22",
    ipAddress: "192.168.1.67",
    status: "Success"
  },
  {
    id: "3",
    user: "mike.davis@platform.com",
    action: "Attempted Download",
    firmware: "FW-7500 v2.3.9",
    timestamp: "2026-02-16 12:48:10",
    ipAddress: "192.168.1.89",
    status: "Failed"
  },
  {
    id: "4",
    user: "emily.chen@platform.com",
    action: "Downloaded",
    firmware: "WAP-300 v1.9.4",
    timestamp: "2026-02-16 11:32:55",
    ipAddress: "192.168.1.123",
    status: "Success"
  },
  {
    id: "5",
    user: "robert.lee@contractor.com",
    action: "Downloaded",
    firmware: "NS-4000 v4.2.0",
    timestamp: "2026-02-16 10:17:33",
    ipAddress: "203.45.67.89",
    status: "Success"
  }
];

const statusColors = {
  Approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Pending: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Deprecated: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
};

export function Deployment() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState<"firmware" | "audit">("firmware");

  const filteredFirmware = mockFirmware.filter(fw =>
    fw.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fw.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fw.deviceModel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl text-foreground mb-2">Deployment & Orchestration</h2>
          <p className="text-muted-foreground">
            Secure firmware distribution with complete audit trail
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors">
          <Upload className="w-4 h-4" />
          Upload Firmware
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
            {mockFirmware.filter(f => f.status === "Approved").length}
          </div>
          <div className="text-sm text-muted-foreground">Approved Versions</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
            {mockFirmware.filter(f => f.status === "Pending").length}
          </div>
          <div className="text-sm text-muted-foreground">Pending Review</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-semibold text-foreground">
            {mockFirmware.reduce((acc, f) => acc + f.downloads, 0)}
          </div>
          <div className="text-sm text-muted-foreground">Total Downloads</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-semibold text-foreground">{mockAuditLogs.length}</div>
          <div className="text-sm text-muted-foreground">Recent Activities</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted rounded-lg p-1 w-fit">
        <button
          onClick={() => setSelectedTab("firmware")}
          className={`px-4 py-2 rounded-md text-sm transition-colors ${
            selectedTab === "firmware"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Firmware Versions
        </button>
        <button
          onClick={() => setSelectedTab("audit")}
          className={`px-4 py-2 rounded-md text-sm transition-colors ${
            selectedTab === "audit"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Audit Log
        </button>
      </div>

      {/* Firmware Versions Tab */}
      {selectedTab === "firmware" && (
        <>
          {/* Search */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search firmware by name, version, or device model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>
          </div>

          {/* Firmware Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredFirmware.map((firmware) => (
              <div key={firmware.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg text-foreground mb-1">{firmware.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-mono">{firmware.version}</span>
                      <span>•</span>
                      <span>{firmware.deviceModel}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full ${statusColors[firmware.status]}`}>
                    {firmware.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Release Date:</span>
                    <span className="text-foreground">{firmware.releaseDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">File Size:</span>
                    <span className="text-foreground">{firmware.fileSize}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Downloads:</span>
                    <span className="text-foreground">{firmware.downloads}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Checksum:</span>
                    <span className="text-foreground font-mono text-xs">{firmware.checksum}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {firmware.status === "Approved" && (
                    <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  )}
                  <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-foreground">
                    <Eye className="w-4 h-4" />
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Audit Log Tab */}
      {selectedTab === "audit" && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Firmware
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#2563eb] rounded-full flex items-center justify-center text-white text-xs">
                          {log.user.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm text-foreground">{log.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-foreground">{log.action}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-foreground font-mono">{log.firmware}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-muted-foreground">{log.timestamp}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-muted-foreground font-mono">{log.ipAddress}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        log.status === "Success"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {mockAuditLogs.length} recent activities
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-foreground">
              <FileText className="w-4 h-4" />
              Export Full Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
