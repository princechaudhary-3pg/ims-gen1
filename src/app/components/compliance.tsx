import { CheckCircle, XCircle, Clock, AlertTriangle, Filter, FileCheck } from "lucide-react";

interface ComplianceItem {
  id: string;
  firmwareVersion: string;
  deviceModel: string;
  submittedBy: string;
  submittedDate: string;
  status: "Approved" | "Pending" | "Deprecated";
  certifications: string[];
  vulnerabilities: number;
  notes: string;
}

const mockCompliance: ComplianceItem[] = [
  {
    id: "1",
    firmwareVersion: "v2.4.1",
    deviceModel: "XR-5000",
    submittedBy: "John Smith",
    submittedDate: "2026-02-10",
    status: "Approved",
    certifications: ["ISO 27001", "SOC 2", "FCC"],
    vulnerabilities: 0,
    notes: "Passed all security scans. Production ready."
  },
  {
    id: "2",
    firmwareVersion: "v3.1.2",
    deviceModel: "S-8200",
    submittedBy: "Sarah Johnson",
    submittedDate: "2026-02-08",
    status: "Approved",
    certifications: ["ISO 27001", "CE"],
    vulnerabilities: 0,
    notes: "Approved for enterprise deployment."
  },
  {
    id: "3",
    firmwareVersion: "v2.3.9",
    deviceModel: "FW-7500",
    submittedBy: "Mike Davis",
    submittedDate: "2026-02-12",
    status: "Pending",
    certifications: ["ISO 27001"],
    vulnerabilities: 2,
    notes: "Awaiting final security review. 2 low-severity vulnerabilities identified."
  },
  {
    id: "4",
    firmwareVersion: "v1.9.4",
    deviceModel: "WAP-300",
    submittedBy: "Emily Chen",
    submittedDate: "2026-01-28",
    status: "Approved",
    certifications: ["FCC", "CE", "WiFi Alliance"],
    vulnerabilities: 0,
    notes: "All certifications current. No issues found."
  },
  {
    id: "5",
    firmwareVersion: "v2.2.8",
    deviceModel: "XR-5000",
    submittedBy: "Robert Lee",
    submittedDate: "2025-11-15",
    status: "Deprecated",
    certifications: ["ISO 27001", "FCC"],
    vulnerabilities: 5,
    notes: "Superseded by v2.4.1. Contains known vulnerabilities."
  },
  {
    id: "6",
    firmwareVersion: "v4.2.0",
    deviceModel: "NS-4000",
    submittedBy: "Amanda Wilson",
    submittedDate: "2026-02-05",
    status: "Approved",
    certifications: ["ISO 27001", "SOC 2", "HIPAA"],
    vulnerabilities: 0,
    notes: "Healthcare compliant. Approved for sensitive data handling."
  },
  {
    id: "7",
    firmwareVersion: "v1.8.2",
    deviceModel: "WAP-300",
    submittedBy: "Chris Brown",
    submittedDate: "2026-02-14",
    status: "Pending",
    certifications: ["FCC"],
    vulnerabilities: 1,
    notes: "Under review. Minor encryption update pending approval."
  },
  {
    id: "8",
    firmwareVersion: "v3.0.5",
    deviceModel: "S-8200",
    submittedBy: "Lisa Martinez",
    submittedDate: "2025-10-20",
    status: "Deprecated",
    certifications: ["ISO 27001"],
    vulnerabilities: 8,
    notes: "End of life. Multiple critical vulnerabilities. Upgrade required."
  }
];

const statusConfig = {
  Approved: {
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle,
    borderColor: "border-green-500"
  },
  Pending: {
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    icon: Clock,
    borderColor: "border-orange-500"
  },
  Deprecated: {
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: XCircle,
    borderColor: "border-red-500"
  }
};

export function Compliance() {
  const approvedCount = mockCompliance.filter(c => c.status === "Approved").length;
  const pendingCount = mockCompliance.filter(c => c.status === "Pending").length;
  const deprecatedCount = mockCompliance.filter(c => c.status === "Deprecated").length;
  const totalVulnerabilities = mockCompliance.reduce((acc, c) => acc + c.vulnerabilities, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl text-foreground mb-2">Firmware Compliance</h2>
          <p className="text-muted-foreground">
            Certification workflow and compliance status tracking
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors">
          <FileCheck className="w-4 h-4" />
          Submit for Review
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {approvedCount}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">Approved</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            <div className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
              {pendingCount}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">Pending Review</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
              {deprecatedCount}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">Deprecated</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            <div className="text-2xl font-semibold text-foreground">
              {totalVulnerabilities}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">Total Vulnerabilities</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg transition-colors">
            All Versions
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-foreground">
            Approved Only
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-foreground">
            Pending Review
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-foreground">
            Deprecated
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-foreground ml-auto">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>
      </div>

      {/* Compliance Cards */}
      <div className="grid grid-cols-1 gap-4">
        {mockCompliance.map((item) => {
          const config = statusConfig[item.status];
          const StatusIcon = config.icon;

          return (
            <div
              key={item.id}
              className={`bg-card border-l-4 ${config.borderColor} border-t border-r border-b border-border rounded-lg p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <StatusIcon className={`w-6 h-6 mt-1 ${
                      item.status === "Approved" ? "text-green-600 dark:text-green-400" :
                      item.status === "Pending" ? "text-orange-600 dark:text-orange-400" :
                      "text-red-600 dark:text-red-400"
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg text-foreground">
                          {item.deviceModel} - {item.firmwareVersion}
                        </h3>
                        <span className={`px-3 py-1 text-xs rounded-full ${config.color}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{item.notes}</p>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Submitted by:</span>
                          <span className="text-foreground ml-2">{item.submittedBy}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>
                          <span className="text-foreground ml-2">{item.submittedDate}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Vulnerabilities:</span>
                          <span className={`ml-2 font-medium ${
                            item.vulnerabilities === 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                          }`}>
                            {item.vulnerabilities}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section - Certifications */}
                <div className="lg:w-64">
                  <div className="text-sm text-muted-foreground mb-2">Certifications:</div>
                  <div className="flex flex-wrap gap-2">
                    {item.certifications.map((cert, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs rounded-full"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                  {item.status === "Pending" && (
                    <div className="mt-4 flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                        Approve
                      </button>
                      <button className="flex-1 px-3 py-2 border border-border text-foreground text-sm rounded-lg hover:bg-muted transition-colors">
                        Review
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compliance Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg text-foreground mb-4">Compliance Summary</h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground">Overall Compliance Rate</span>
              <span className="text-sm font-medium text-foreground">
                {Math.round((approvedCount / mockCompliance.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{ width: `${(approvedCount / mockCompliance.length) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground">Pending Reviews</span>
              <span className="text-sm font-medium text-foreground">
                {Math.round((pendingCount / mockCompliance.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500"
                style={{ width: `${(pendingCount / mockCompliance.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
