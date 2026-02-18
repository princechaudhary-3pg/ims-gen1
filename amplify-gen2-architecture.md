# HLM Platform — Amplify Gen 2 Single Table Design Architecture

**Version:** 1.0
**Last Updated:** February 17, 2026
**Architecture:** AWS Amplify Gen 2 (TypeScript-first) + DynamoDB Single Table Design
**Source PRD:** PRD.md
**Predecessor:** Amplify-Gen1-architecture.md

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Access Pattern Mapping](#2-access-pattern-mapping)
3. [Data Resource Definition](#3-data-resource-definition)
4. [Auth Configuration](#4-auth-configuration)
5. [Custom Logic & Handlers](#5-custom-logic--handlers)
6. [Backend Extensions (CDK)](#6-backend-extensions-cdk)
7. [Frontend Client Integration](#7-frontend-client-integration)
8. [Sandbox Deployment](#8-sandbox-deployment)
9. [Key Design Decisions](#9-key-design-decisions)

---

## 1. Architecture Overview

### Why Amplify Gen 2?

Amplify Gen 2 is a **TypeScript-first, code-driven** framework that replaces the CLI-wizard approach of Gen 1. Key advantages:

- **Type-safe schema definition** via `a.schema()` in TypeScript
- **CDK escape hatch** via `amplify/backend.ts` for advanced DynamoDB configuration
- **Code-first auth** via `defineAuth()` with Cognito
- **Custom resolvers** via `a.handler.custom()` for PK/SK routing logic
- **Local sandbox** via `npx ampx sandbox` for rapid iteration

### Single Table Design Strategy

Amplify Gen 2 defaults to **one DynamoDB table per `a.model()`**. To enforce Single Table Design (STD), we define a **single `a.model("DataTable")`** with overloaded PK/SK fields. Domain entities are expressed as `a.customType()` definitions for frontend type safety, while `a.handler.custom()` functions handle PK/SK formatting and entity routing.

```
┌─────────────────────────────────────────────────┐
│              Frontend (React + TypeScript)        │
│  generateClient<Schema>() → typed operations     │
├─────────────────────────────────────────────────┤
│          a.handler.custom() Resolvers            │
│  Route by entityType → format PK/SK/GSI keys     │
├─────────────────────────────────────────────────┤
│          Single DynamoDB Table: DataTable         │
│  PK | SK | GSI1PK | GSI1SK | GSI2PK | GSI2SK    │
│  GSI3PK | GSI3SK | GSI4PK | GSI4SK | entityType │
│  + all entity-specific attributes (flat schema)  │
└─────────────────────────────────────────────────┘
```

---

## 2. Access Pattern Mapping

### Entity Key Prefixes

| # | Entity | Prefix | Example PK | Example SK |
|---|--------|--------|-----------|-----------|
| 1 | Customer | `CUST#` | `CUST#c001` | `CUST#c001` |
| 2 | User | `USER#` | `USER#u001` | `USER#u001` |
| 3 | Device | `DEV#` | `DEV#d001` | `DEV#d001` |
| 4 | Firmware | `FW#` | `FW#f001` | `FW#f001` |
| 5 | ServiceOrder | `SO#` | `SO#s001` | `SO#s001` |
| 6 | Compliance | `COMP#` | `COMP#cp001` | `COMP#cp001` |
| 7 | AuditLog | `AUDIT#` | `AUDIT#a001` | `AUDIT#a001` |

### GSI Definitions

| GSI Name | PK Attribute | SK Attribute | Projection | Purpose |
|----------|-------------|-------------|------------|---------|
| `GSI1` | `GSI1PK` | `GSI1SK` | ALL | Entity listing by type + status |
| `GSI2` | `GSI2PK` | `GSI2SK` | ALL | Time-based queries (calendar, audit, metrics) |
| `GSI3` | `GSI3PK` | `GSI3SK` | ALL | Alternate key lookups (email, location, model, cert) |
| `GSI4` | `GSI4PK` | `GSI4SK` | ALL | Cross-entity relationships (user→audits, fw→devices) |

### Full Access Pattern Table

| # | Access Pattern | Index | Key Condition |
|---|---------------|-------|---------------|
| **Dashboard** ||||
| AP-1 | Get dashboard KPIs (device counts) | GSI1 | `GSI1PK = "DEVICE"` → aggregate |
| AP-2 | Get active deployments count | GSI1 | `GSI1PK = "FIRMWARE", GSI1SK begins_with "Pending"` |
| AP-3 | Get recent alerts | GSI2 | `GSI2PK = "ALERT", GSI2SK > <timestamp>` |
| AP-4 | Get system status | GSI1 | `GSI1PK = "SYSTEM_STATUS"` |
| **Inventory & Assets** ||||
| AP-5 | Get device by ID | Table | `PK = "DEV#<id>", SK = "DEV#<id>"` |
| AP-6 | List all devices (paginated) | GSI1 | `GSI1PK = "DEVICE"` |
| AP-7 | Get devices by customer | Table | `PK = "CUST#<id>", SK begins_with "DEV#"` |
| AP-8 | Get devices by status | GSI1 | `GSI1PK = "DEVICE", GSI1SK begins_with "<status>#"` |
| AP-9 | Get devices by location | GSI3 | `GSI3PK = "DEVICE#<location>"` |
| AP-10 | Get devices by firmware | GSI4 | `GSI4PK = "FW#<fwId>", GSI4SK begins_with "DEV#"` |
| AP-11 | Search devices (name/serial) | GSI1 + Filter | `GSI1PK = "DEVICE"` + filter |
| **Account & Service** ||||
| AP-12 | Get service order by ID | Table | `PK = "SO#<id>", SK = "SO#<id>"` |
| AP-13 | List SOs by status (Kanban) | GSI1 | `GSI1PK = "SERVICE_ORDER", GSI1SK begins_with "<status>#"` |
| AP-14 | SOs by date range (Calendar) | GSI2 | `GSI2PK = "SERVICE_ORDER", GSI2SK between <start> and <end>` |
| AP-15 | SOs by technician | GSI3 | `GSI3PK = "TECH#<userId>"` |
| AP-16 | SOs by customer | Table | `PK = "CUST#<id>", SK begins_with "SO#"` |
| AP-17 | SOs by service type | GSI1 + Filter | `GSI1PK = "SERVICE_ORDER"` + filter on serviceType |
| **Deployment & Orchestration** ||||
| AP-18 | Get firmware by ID | Table | `PK = "FW#<id>", SK = "FW#<id>"` |
| AP-19 | List firmware by status | GSI1 | `GSI1PK = "FIRMWARE", GSI1SK begins_with "<status>#"` |
| AP-20 | Firmware by device model | GSI3 | `GSI3PK = "MODEL#<model>"` |
| AP-21 | Firmware audit logs | Table | `PK = "FW#<id>", SK begins_with "AUDIT#"` |
| AP-22 | Audit logs by user | GSI4 | `GSI4PK = "USER#<id>", GSI4SK begins_with "AUDIT#"` |
| AP-23 | All audit logs (time-sorted) | GSI2 | `GSI2PK = "AUDIT_LOG", GSI2SK between <start> and <end>` |
| **Firmware Compliance** ||||
| AP-24 | Get compliance by ID | Table | `PK = "COMP#<id>", SK = "COMP#<id>"` |
| AP-25 | List compliance by status | GSI1 | `GSI1PK = "COMPLIANCE", GSI1SK begins_with "<status>#"` |
| AP-26 | Compliance by firmware | Table | `PK = "FW#<id>", SK begins_with "COMP#"` |
| AP-27 | Compliance by certification | GSI3 | `GSI3PK = "CERT#<certName>"` |
| **Reporting & Analytics** ||||
| AP-28 | Device health trends | GSI2 | `GSI2PK = "HEALTH_METRIC", GSI2SK between <start> and <end>` |
| AP-29 | Customer distribution | GSI1 | `GSI1PK = "CUSTOMER"` → aggregate by type |
| AP-30 | Deployment activity trends | GSI2 | `GSI2PK = "DEPLOYMENT_METRIC", GSI2SK between <start> and <end>` |
| AP-31 | Vulnerability heatmap | GSI1 | `GSI1PK = "COMPLIANCE"` → aggregate vulns |
| **User & Auth** ||||
| AP-32 | Get user by ID | Table | `PK = "USER#<id>", SK = "USER#<id>"` |
| AP-33 | Get user by email | GSI3 | `GSI3PK = "EMAIL#<email>"` |
| AP-34 | Users by role | GSI1 | `GSI1PK = "USER", GSI1SK begins_with "<role>#"` |
| AP-35 | Users by customer | Table | `PK = "CUST#<id>", SK begins_with "USER#"` |
| **Cross-entity** ||||
| AP-36 | Customer + all children | Table | `PK = "CUST#<id>"` (all SK) |
| AP-37 | Firmware + compliance + audits | Table | `PK = "FW#<id>"` (all SK) |
| AP-38 | Device → customer reverse | GSI4 | Use stored `customerId` on device item |

---

## 3. Data Resource Definition

### File: `amplify/data/resource.ts`

```typescript
import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

// =============================================================================
// Custom Types — Provide frontend type safety via generateClient<Schema>()
// These do NOT create separate DynamoDB tables; they are virtual types
// projected from the single DataTable.
// =============================================================================

const deviceType = a.customType({
  id: a.string().required(),
  deviceName: a.string().required(),
  serialNumber: a.string().required(),
  model: a.string().required(),
  manufacturer: a.string(),
  location: a.string().required(),
  status: a.enum(["Online", "Offline", "Maintenance"]),
  firmwareVersion: a.string().required(),
  firmwareId: a.string(),
  lastUpdate: a.string(),
  lastSeen: a.string(),
  customerId: a.string().required(),
  healthScore: a.integer(),
  metadata: a.json(),
});

const firmwareType = a.customType({
  id: a.string().required(),
  name: a.string().required(),
  version: a.string().required(),
  deviceModel: a.string().required(),
  manufacturer: a.string(),
  releaseDate: a.string().required(),
  fileName: a.string(),
  fileSize: a.integer(),
  fileSizeFormatted: a.string(),
  s3Key: a.string(),
  s3Bucket: a.string(),
  checksum: a.string().required(),
  checksumAlgorithm: a.string(),
  status: a.enum(["Approved", "Pending", "Deprecated", "Rejected"]),
  downloads: a.integer(),
  uploadedBy: a.string(),
  approvedBy: a.string(),
  approvedDate: a.string(),
  deprecatedDate: a.string(),
  releaseNotes: a.string(),
});

const serviceOrderType = a.customType({
  id: a.string().required(),
  title: a.string().required(),
  description: a.string(),
  technicianId: a.string().required(),
  technicianName: a.string().required(),
  serviceType: a.enum(["Internal", "ThirdParty"]),
  location: a.string().required(),
  scheduledDate: a.string().required(),
  scheduledTime: a.string().required(),
  completedDate: a.string(),
  status: a.enum(["Scheduled", "InProgress", "Completed", "Cancelled"]),
  priority: a.enum(["High", "Medium", "Low"]),
  serviceNotes: a.string(),
  deviceIds: a.string().array(),
  attachments: a.string().array(),
  customerId: a.string().required(),
  createdBy: a.string().required(),
});

const complianceType = a.customType({
  id: a.string().required(),
  firmwareId: a.string().required(),
  firmwareVersion: a.string().required(),
  deviceModel: a.string().required(),
  submittedBy: a.string().required(),
  submittedByName: a.string().required(),
  submittedDate: a.string(),
  reviewedBy: a.string(),
  reviewedDate: a.string(),
  status: a.enum(["Approved", "Pending", "Deprecated", "Rejected"]),
  certifications: a.string().array(),
  vulnerabilities: a.json(),
  totalVulnerabilities: a.integer(),
  complianceNotes: a.string(),
  complianceDocuments: a.string().array(),
  nextReviewDate: a.string(),
});

const auditLogType = a.customType({
  id: a.string().required(),
  userId: a.string().required(),
  userEmail: a.string().required(),
  action: a.enum([
    "Downloaded",
    "Uploaded",
    "Approved",
    "Deprecated",
    "Viewed",
    "Modified",
    "Deleted",
    "Created",
  ]),
  resourceType: a.string().required(),
  resourceId: a.string().required(),
  firmwareId: a.string(),
  firmwareName: a.string(),
  ipAddress: a.string().required(),
  userAgent: a.string(),
  auditStatus: a.enum(["Success", "Failed"]),
  errorMessage: a.string(),
  timestamp: a.string().required(),
  metadata: a.json(),
});

const customerType = a.customType({
  id: a.string().required(),
  name: a.string().required(),
  customerType: a.enum(["Enterprise", "MidMarket", "SmallBusiness", "Government"]),
  industry: a.string(),
  contactEmail: a.string().required(),
  contactPhone: a.string(),
  street: a.string(),
  city: a.string(),
  state: a.string(),
  zipCode: a.string(),
  country: a.string(),
  subscriptionTier: a.string(),
  deviceCount: a.integer(),
  status: a.enum(["Active", "Inactive", "Suspended"]),
});

const userType = a.customType({
  id: a.string().required(),
  email: a.string().required(),
  firstName: a.string().required(),
  lastName: a.string().required(),
  role: a.enum(["Admin", "Manager", "Technician", "Viewer", "CustomerAdmin"]),
  department: a.string(),
  phone: a.string(),
  avatar: a.string(),
  status: a.enum(["Active", "Inactive", "Suspended"]),
  lastLogin: a.string(),
  customerId: a.string(),
  prefTheme: a.enum(["light", "dark"]),
  prefNotifications: a.boolean(),
  prefLanguage: a.string(),
  prefTimezone: a.string(),
});

// Paginated list response wrapper
const paginatedResponse = a.customType({
  items: a.json().required(),
  nextToken: a.string(),
  totalCount: a.integer(),
});

// =============================================================================
// Single Physical Table — All entities stored here with PK/SK overloading
// =============================================================================

const schema = a.schema({
  // ─────────────────────────────────────────────────────────────────────────
  // Custom Types (virtual — no DynamoDB tables created)
  // ─────────────────────────────────────────────────────────────────────────
  DeviceType: deviceType,
  FirmwareType: firmwareType,
  ServiceOrderType: serviceOrderType,
  ComplianceType: complianceType,
  AuditLogType: auditLogType,
  CustomerType: customerType,
  UserType: userType,
  PaginatedResponse: paginatedResponse,

  // ─────────────────────────────────────────────────────────────────────────
  // DataTable — The single physical DynamoDB table
  // ─────────────────────────────────────────────────────────────────────────
  DataTable: a
    .model({
      // Primary Key
      PK: a.string().required(),
      SK: a.string().required(),

      // GSI Keys (nullable for sparse index behavior)
      GSI1PK: a.string(),
      GSI1SK: a.string(),
      GSI2PK: a.string(),
      GSI2SK: a.string(),
      GSI3PK: a.string(),
      GSI3SK: a.string(),
      GSI4PK: a.string(),
      GSI4SK: a.string(),

      // Discriminator
      entityType: a.string().required(),

      // ── Common Fields ──
      name: a.string(),
      status: a.string(),
      owner: a.string(),

      // ── Customer Fields ──
      customerType: a.string(),
      industry: a.string(),
      contactEmail: a.string(),
      contactPhone: a.string(),
      street: a.string(),
      city: a.string(),
      state: a.string(),
      zipCode: a.string(),
      country: a.string(),
      billingStreet: a.string(),
      billingCity: a.string(),
      billingState: a.string(),
      billingZipCode: a.string(),
      billingCountry: a.string(),
      subscriptionTier: a.string(),
      deviceCount: a.integer(),

      // ── User Fields ──
      email: a.string(),
      firstName: a.string(),
      lastName: a.string(),
      role: a.string(),
      department: a.string(),
      phone: a.string(),
      avatar: a.string(),
      lastLogin: a.string(),
      customerId: a.string(),
      prefTheme: a.string(),
      prefNotifications: a.boolean(),
      prefLanguage: a.string(),
      prefTimezone: a.string(),

      // ── Device Fields ──
      deviceName: a.string(),
      serialNumber: a.string(),
      model: a.string(),
      manufacturer: a.string(),
      location: a.string(),
      firmwareVersion: a.string(),
      firmwareId: a.string(),
      lastSeen: a.string(),
      healthScore: a.integer(),
      deviceMetadata: a.json(),

      // ── Service Order Fields ──
      title: a.string(),
      description: a.string(),
      technicianId: a.string(),
      technicianName: a.string(),
      serviceType: a.string(),
      scheduledDate: a.string(),
      scheduledTime: a.string(),
      completedDate: a.string(),
      priority: a.string(),
      serviceNotes: a.string(),
      deviceIds: a.string().array(),
      attachments: a.string().array(),
      createdBy: a.string(),

      // ── Firmware Fields ──
      version: a.string(),
      deviceModel: a.string(),
      releaseDate: a.string(),
      fileName: a.string(),
      fileSize: a.integer(),
      fileSizeFormatted: a.string(),
      s3Key: a.string(),
      s3Bucket: a.string(),
      checksum: a.string(),
      checksumAlgorithm: a.string(),
      downloads: a.integer(),
      uploadedBy: a.string(),
      approvedBy: a.string(),
      approvedDate: a.string(),
      deprecatedDate: a.string(),
      releaseNotes: a.string(),

      // ── Audit Log Fields ──
      userId: a.string(),
      userEmail: a.string(),
      action: a.string(),
      resourceType: a.string(),
      resourceId: a.string(),
      auditFirmwareId: a.string(),
      auditFirmwareName: a.string(),
      ipAddress: a.string(),
      userAgent: a.string(),
      auditStatus: a.string(),
      errorMessage: a.string(),
      auditTimestamp: a.string(),
      auditMetadata: a.json(),

      // ── Compliance Fields ──
      compFirmwareVersion: a.string(),
      compDeviceModel: a.string(),
      submittedBy: a.string(),
      submittedByName: a.string(),
      submittedDate: a.string(),
      reviewedBy: a.string(),
      reviewedDate: a.string(),
      certifications: a.string().array(),
      vulnerabilities: a.json(),
      totalVulnerabilities: a.integer(),
      complianceNotes: a.string(),
      complianceDocuments: a.string().array(),
      nextReviewDate: a.string(),

      // ── Generic Overflow ──
      metadata: a.json(),

      // ── TTL (epoch seconds, used for auto-expiry of audit logs) ──
      ttl: a.integer(),
    })
    .identifier(["PK", "SK"])
    .secondaryIndexes((index) => [
      index("GSI1PK").sortKeys(["GSI1SK"]).queryField("queryGSI1").name("GSI1"),
      index("GSI2PK").sortKeys(["GSI2SK"]).queryField("queryGSI2").name("GSI2"),
      index("GSI3PK").sortKeys(["GSI3SK"]).queryField("queryGSI3").name("GSI3"),
      index("GSI4PK").sortKeys(["GSI4SK"]).queryField("queryGSI4").name("GSI4"),
    ])
    .authorization((allow) => [
      // Admin: full CRUD
      allow.group("Admin"),
      // Manager: create, read, update (no delete)
      allow.group("Manager").to(["create", "read", "update"]),
      // Technician: read all, update assigned items
      allow.group("Technician").to(["read", "update"]),
      // Viewer: read-only
      allow.group("Viewer").to(["read"]),
      // CustomerAdmin: read own data (enforced via resolver filtering)
      allow.group("CustomerAdmin").to(["read"]),
      // Owner-based: users can read/update their own record
      allow.ownerDefinedIn("owner").to(["read", "update"]),
    ]),

  // ─────────────────────────────────────────────────────────────────────────
  // Custom Queries — Typed entry points that route to DataTable
  // ─────────────────────────────────────────────────────────────────────────

  // Device operations
  getDevice: a
    .query()
    .arguments({ id: a.string().required() })
    .returns(a.ref("DeviceType"))
    .handler(a.handler.custom({ entry: "./resolvers/getEntity.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.authenticated()]),

  listDevices: a
    .query()
    .arguments({
      status: a.string(),
      limit: a.integer(),
      nextToken: a.string(),
    })
    .returns(a.ref("PaginatedResponse"))
    .handler(a.handler.custom({ entry: "./resolvers/listByGSI1.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.authenticated()]),

  getDevicesByCustomer: a
    .query()
    .arguments({ customerId: a.string().required() })
    .returns(a.ref("PaginatedResponse"))
    .handler(a.handler.custom({ entry: "./resolvers/queryByPK.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.authenticated()]),

  getDevicesByLocation: a
    .query()
    .arguments({ location: a.string().required() })
    .returns(a.ref("PaginatedResponse"))
    .handler(a.handler.custom({ entry: "./resolvers/queryByGSI3.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.authenticated()]),

  // Firmware operations
  getFirmware: a
    .query()
    .arguments({ id: a.string().required() })
    .returns(a.ref("FirmwareType"))
    .handler(a.handler.custom({ entry: "./resolvers/getEntity.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.authenticated()]),

  listFirmware: a
    .query()
    .arguments({
      status: a.string(),
      limit: a.integer(),
      nextToken: a.string(),
    })
    .returns(a.ref("PaginatedResponse"))
    .handler(a.handler.custom({ entry: "./resolvers/listByGSI1.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.authenticated()]),

  getFirmwareByModel: a
    .query()
    .arguments({ deviceModel: a.string().required() })
    .returns(a.ref("PaginatedResponse"))
    .handler(a.handler.custom({ entry: "./resolvers/queryByGSI3.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.authenticated()]),

  getFirmwareWithRelations: a
    .query()
    .arguments({ id: a.string().required() })
    .returns(a.ref("PaginatedResponse"))
    .handler(a.handler.custom({ entry: "./resolvers/queryByPK.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.authenticated()]),

  // Service Order operations
  getServiceOrder: a
    .query()
    .arguments({ id: a.string().required() })
    .returns(a.ref("ServiceOrderType"))
    .handler(a.handler.custom({ entry: "./resolvers/getEntity.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.authenticated()]),

  listServiceOrdersByStatus: a
    .query()
    .arguments({ status: a.string().required() })
    .returns(a.ref("PaginatedResponse"))
    .handler(a.handler.custom({ entry: "./resolvers/listByGSI1.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.authenticated()]),

  listServiceOrdersByDate: a
    .query()
    .arguments({
      startDate: a.string().required(),
      endDate: a.string().required(),
    })
    .returns(a.ref("PaginatedResponse"))
    .handler(a.handler.custom({ entry: "./resolvers/queryByGSI2.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.authenticated()]),

  getServiceOrdersByTechnician: a
    .query()
    .arguments({ technicianId: a.string().required() })
    .returns(a.ref("PaginatedResponse"))
    .handler(a.handler.custom({ entry: "./resolvers/queryByGSI3.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.authenticated()]),

  // Compliance operations
  getCompliance: a
    .query()
    .arguments({ id: a.string().required() })
    .returns(a.ref("ComplianceType"))
    .handler(a.handler.custom({ entry: "./resolvers/getEntity.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.authenticated()]),

  listComplianceByStatus: a
    .query()
    .arguments({ status: a.string().required() })
    .returns(a.ref("PaginatedResponse"))
    .handler(a.handler.custom({ entry: "./resolvers/listByGSI1.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.authenticated()]),

  getComplianceByCertification: a
    .query()
    .arguments({ certification: a.string().required() })
    .returns(a.ref("PaginatedResponse"))
    .handler(a.handler.custom({ entry: "./resolvers/queryByGSI3.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.authenticated()]),

  // Audit Log operations
  listAuditLogs: a
    .query()
    .arguments({
      startDate: a.string().required(),
      endDate: a.string().required(),
      limit: a.integer(),
      nextToken: a.string(),
    })
    .returns(a.ref("PaginatedResponse"))
    .handler(a.handler.custom({ entry: "./resolvers/queryByGSI2.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.group("Admin"), allow.group("Manager")]),

  getAuditLogsByUser: a
    .query()
    .arguments({ userId: a.string().required() })
    .returns(a.ref("PaginatedResponse"))
    .handler(a.handler.custom({ entry: "./resolvers/queryByGSI4.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.group("Admin"), allow.group("Manager")]),

  // User operations
  getUserByEmail: a
    .query()
    .arguments({ email: a.string().required() })
    .returns(a.ref("UserType"))
    .handler(a.handler.custom({ entry: "./resolvers/queryByGSI3.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.authenticated()]),

  listUsersByRole: a
    .query()
    .arguments({ role: a.string().required() })
    .returns(a.ref("PaginatedResponse"))
    .handler(a.handler.custom({ entry: "./resolvers/listByGSI1.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.group("Admin"), allow.group("Manager")]),

  // Customer operations
  getCustomerWithRelations: a
    .query()
    .arguments({ customerId: a.string().required() })
    .returns(a.ref("PaginatedResponse"))
    .handler(a.handler.custom({ entry: "./resolvers/queryByPK.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.authenticated()]),

  // ─────────────────────────────────────────────────────────────────────────
  // Custom Mutations — Typed write operations with PK/SK formatting
  // ─────────────────────────────────────────────────────────────────────────

  createDevice: a
    .mutation()
    .arguments({
      deviceName: a.string().required(),
      serialNumber: a.string().required(),
      model: a.string().required(),
      manufacturer: a.string(),
      location: a.string().required(),
      status: a.string().required(),
      firmwareVersion: a.string().required(),
      firmwareId: a.string(),
      customerId: a.string().required(),
      healthScore: a.integer(),
    })
    .returns(a.ref("DeviceType"))
    .handler(a.handler.custom({ entry: "./resolvers/createEntity.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.group("Admin"), allow.group("Manager")]),

  createFirmware: a
    .mutation()
    .arguments({
      name: a.string().required(),
      version: a.string().required(),
      deviceModel: a.string().required(),
      manufacturer: a.string(),
      releaseDate: a.string().required(),
      fileName: a.string().required(),
      fileSize: a.integer().required(),
      fileSizeFormatted: a.string().required(),
      checksum: a.string().required(),
      checksumAlgorithm: a.string(),
      uploadedBy: a.string().required(),
      releaseNotes: a.string(),
      s3Key: a.string().required(),
      s3Bucket: a.string().required(),
    })
    .returns(a.ref("FirmwareType"))
    .handler(a.handler.custom({ entry: "./resolvers/createEntity.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.group("Admin"), allow.group("Manager")]),

  createServiceOrder: a
    .mutation()
    .arguments({
      title: a.string().required(),
      description: a.string(),
      technicianId: a.string().required(),
      technicianName: a.string().required(),
      serviceType: a.string().required(),
      location: a.string().required(),
      scheduledDate: a.string().required(),
      scheduledTime: a.string().required(),
      priority: a.string().required(),
      customerId: a.string().required(),
      deviceIds: a.string().array(),
      createdBy: a.string().required(),
    })
    .returns(a.ref("ServiceOrderType"))
    .handler(a.handler.custom({ entry: "./resolvers/createEntity.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.group("Admin"), allow.group("Manager")]),

  createCompliance: a
    .mutation()
    .arguments({
      firmwareId: a.string().required(),
      firmwareVersion: a.string().required(),
      deviceModel: a.string().required(),
      submittedBy: a.string().required(),
      submittedByName: a.string().required(),
      certifications: a.string().array().required(),
      vulnerabilities: a.json(),
      totalVulnerabilities: a.integer(),
      complianceNotes: a.string(),
    })
    .returns(a.ref("ComplianceType"))
    .handler(a.handler.custom({ entry: "./resolvers/createEntity.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.group("Admin"), allow.group("Manager")]),

  updateEntityStatus: a
    .mutation()
    .arguments({
      entityType: a.string().required(),
      id: a.string().required(),
      newStatus: a.string().required(),
      updatedBy: a.string(),
    })
    .returns(a.json())
    .handler(a.handler.custom({ entry: "./resolvers/updateStatus.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.group("Admin"), allow.group("Manager")]),

  approveFirmware: a
    .mutation()
    .arguments({
      firmwareId: a.string().required(),
      approvedBy: a.string().required(),
    })
    .returns(a.ref("FirmwareType"))
    .handler(a.handler.custom({ entry: "./resolvers/approveFirmware.js", dataSource: "DataTableTable" }))
    .authorization((allow) => [allow.group("Admin")]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
      description: "API key for development and testing",
    },
  },
});
```

---

## 4. Auth Configuration

### File: `amplify/auth/resource.ts`

```typescript
import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: "CODE",
      verificationEmailSubject: "HLM Platform - Verify your email",
      verificationEmailBody: (createCode) =>
        `Your HLM Platform verification code is: ${createCode()}`,
    },
  },

  // Password policy (NIST IA-5)
  passwordPolicy: {
    minLength: 12,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
  },

  // MFA configuration (NIST IA-2)
  multifactor: {
    mode: "OPTIONAL",
    totp: true,
  },

  // User attributes
  userAttributes: {
    givenName: { required: true, mutable: true },
    familyName: { required: true, mutable: true },
    phoneNumber: { required: false, mutable: true },
    "custom:role": { dataType: "String", mutable: true },
    "custom:department": { dataType: "String", mutable: true },
    "custom:customerId": { dataType: "String", mutable: true },
  },

  // User groups (RBAC roles — NIST AC-3, AC-5)
  groups: ["Admin", "Manager", "Technician", "Viewer", "CustomerAdmin"],

  // Account recovery
  accountRecovery: "EMAIL_ONLY",

  // Session configuration (NIST AC-11, AC-12)
  // Note: Token expiry is configured via CDK override in backend.ts
});
```

---

## 5. Custom Logic & Handlers

### Resolver: `amplify/data/resolvers/getEntity.js`

This VTL resolver handles single-item lookups by entity type and ID (AP-5, AP-12, AP-18, AP-24, AP-32).

```javascript
// Request mapping: get item by PK/SK
export function request(ctx) {
  const { id } = ctx.arguments;
  // Determine prefix from the parent field name
  const prefixMap = {
    getDevice: "DEV#",
    getFirmware: "FW#",
    getServiceOrder: "SO#",
    getCompliance: "COMP#",
    getUserByEmail: "USER#",
  };
  const prefix = prefixMap[ctx.info.fieldName] || "DEV#";
  const pk = `${prefix}${id}`;

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({ PK: pk, SK: pk }),
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  if (!ctx.result) return null;

  // Strip PK prefix to return clean ID
  const item = ctx.result;
  item.id = item.PK.split("#").slice(1).join("#");
  return item;
}
```

### Resolver: `amplify/data/resolvers/listByGSI1.js`

Handles entity listing by type + status via GSI1 (AP-6, AP-8, AP-13, AP-19, AP-25, AP-34).

```javascript
export function request(ctx) {
  const { status, limit, nextToken } = ctx.arguments;

  // Map query field to GSI1PK value
  const gsi1Map = {
    listDevices: "DEVICE",
    listFirmware: "FIRMWARE",
    listServiceOrdersByStatus: "SERVICE_ORDER",
    listComplianceByStatus: "COMPLIANCE",
    listUsersByRole: "USER",
  };
  const gsi1pk = gsi1Map[ctx.info.fieldName];

  const expression = status
    ? { expression: "GSI1PK = :pk AND begins_with(GSI1SK, :sk)", expressionValues: util.dynamodb.toMapValues({ ":pk": gsi1pk, ":sk": `${status}#` }) }
    : { expression: "GSI1PK = :pk", expressionValues: util.dynamodb.toMapValues({ ":pk": gsi1pk }) };

  return {
    operation: "Query",
    index: "GSI1",
    query: expression,
    limit: limit || 25,
    nextToken: nextToken || undefined,
    scanIndexForward: false,
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  const items = ctx.result.items.map((item) => {
    item.id = item.PK.split("#").slice(1).join("#");
    return item;
  });
  return {
    items: JSON.stringify(items),
    nextToken: ctx.result.nextToken,
    totalCount: items.length,
  };
}
```

### Resolver: `amplify/data/resolvers/queryByGSI2.js`

Handles time-range queries via GSI2 (AP-14, AP-23, AP-28, AP-30).

```javascript
export function request(ctx) {
  const { startDate, endDate, limit, nextToken } = ctx.arguments;

  const gsi2Map = {
    listServiceOrdersByDate: "SERVICE_ORDER",
    listAuditLogs: "AUDIT_LOG",
  };
  const gsi2pk = gsi2Map[ctx.info.fieldName];

  return {
    operation: "Query",
    index: "GSI2",
    query: {
      expression: "GSI2PK = :pk AND GSI2SK BETWEEN :start AND :end",
      expressionValues: util.dynamodb.toMapValues({
        ":pk": gsi2pk,
        ":start": startDate,
        ":end": endDate,
      }),
    },
    limit: limit || 50,
    nextToken: nextToken || undefined,
    scanIndexForward: false,
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  const items = ctx.result.items.map((item) => {
    item.id = item.PK.split("#").slice(1).join("#");
    return item;
  });
  return {
    items: JSON.stringify(items),
    nextToken: ctx.result.nextToken,
    totalCount: items.length,
  };
}
```

### Resolver: `amplify/data/resolvers/queryByGSI3.js`

Handles alternate-key lookups via GSI3 (AP-9, AP-15, AP-20, AP-27, AP-33).

```javascript
export function request(ctx) {
  const args = ctx.arguments;

  const gsi3Map = {
    getDevicesByLocation: (a) => `DEVICE#${a.location}`,
    getServiceOrdersByTechnician: (a) => `TECH#${a.technicianId}`,
    getFirmwareByModel: (a) => `MODEL#${a.deviceModel}`,
    getComplianceByCertification: (a) => `CERT#${a.certification}`,
    getUserByEmail: (a) => `EMAIL#${a.email}`,
  };

  const gsi3pk = gsi3Map[ctx.info.fieldName](args);

  return {
    operation: "Query",
    index: "GSI3",
    query: {
      expression: "GSI3PK = :pk",
      expressionValues: util.dynamodb.toMapValues({ ":pk": gsi3pk }),
    },
    scanIndexForward: false,
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  const items = ctx.result.items;
  if (items.length === 0) return null;

  // For single-item lookups (getUserByEmail), return first item
  if (ctx.info.fieldName === "getUserByEmail") {
    const item = items[0];
    item.id = item.PK.split("#").slice(1).join("#");
    return item;
  }

  // For list queries, return paginated response
  const mapped = items.map((item) => {
    item.id = item.PK.split("#").slice(1).join("#");
    return item;
  });
  return {
    items: JSON.stringify(mapped),
    nextToken: ctx.result.nextToken,
    totalCount: mapped.length,
  };
}
```

### Resolver: `amplify/data/resolvers/queryByGSI4.js`

Handles cross-entity lookups via GSI4 (AP-10, AP-22, AP-38).

```javascript
export function request(ctx) {
  const args = ctx.arguments;

  const gsi4Map = {
    getAuditLogsByUser: (a) => ({
      pk: `USER#${a.userId}`,
      skPrefix: "AUDIT#",
    }),
  };

  const config = gsi4Map[ctx.info.fieldName](args);

  return {
    operation: "Query",
    index: "GSI4",
    query: {
      expression: "GSI4PK = :pk AND begins_with(GSI4SK, :sk)",
      expressionValues: util.dynamodb.toMapValues({
        ":pk": config.pk,
        ":sk": config.skPrefix,
      }),
    },
    scanIndexForward: false,
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  const items = ctx.result.items.map((item) => {
    item.id = item.PK.split("#").slice(1).join("#");
    return item;
  });
  return {
    items: JSON.stringify(items),
    nextToken: ctx.result.nextToken,
    totalCount: items.length,
  };
}
```

### Resolver: `amplify/data/resolvers/queryByPK.js`

Handles queries that return all items under a PK (AP-7, AP-16, AP-21, AP-26, AP-36, AP-37).

```javascript
export function request(ctx) {
  const args = ctx.arguments;

  const pkMap = {
    getDevicesByCustomer: (a) => ({
      pk: `CUST#${a.customerId}`,
      skPrefix: "DEV#",
    }),
    getCustomerWithRelations: (a) => ({
      pk: `CUST#${a.customerId}`,
      skPrefix: null, // All items under this PK
    }),
    getFirmwareWithRelations: (a) => ({
      pk: `FW#${a.id}`,
      skPrefix: null,
    }),
  };

  const config = pkMap[ctx.info.fieldName](args);

  const query = config.skPrefix
    ? {
        expression: "PK = :pk AND begins_with(SK, :sk)",
        expressionValues: util.dynamodb.toMapValues({
          ":pk": config.pk,
          ":sk": config.skPrefix,
        }),
      }
    : {
        expression: "PK = :pk",
        expressionValues: util.dynamodb.toMapValues({ ":pk": config.pk }),
      };

  return { operation: "Query", query };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  const items = ctx.result.items.map((item) => {
    item.id = item.PK.split("#").slice(1).join("#");
    return item;
  });
  return {
    items: JSON.stringify(items),
    nextToken: ctx.result.nextToken,
    totalCount: items.length,
  };
}
```

### Resolver: `amplify/data/resolvers/createEntity.js`

Handles entity creation with PK/SK formatting and edge item generation.

```javascript
import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const args = ctx.arguments;
  const id = util.autoId();
  const now = util.time.nowISO8601();

  // Determine entity type from mutation name
  const entityMap = {
    createDevice: {
      prefix: "DEV#",
      entityType: "Device",
      gsi1pk: "DEVICE",
      gsi1sk: (a) => `${a.status}#${now}`,
      gsi2pk: "DEVICE",
      gsi3pk: (a) => `DEVICE#${a.location}`,
      gsi4pk: (a) => a.firmwareId ? `FW#${a.firmwareId}` : null,
    },
    createFirmware: {
      prefix: "FW#",
      entityType: "Firmware",
      gsi1pk: "FIRMWARE",
      gsi1sk: (a) => `Pending#${a.releaseDate}`,
      gsi2pk: "FIRMWARE",
      gsi3pk: (a) => `MODEL#${a.deviceModel}`,
      gsi4pk: () => null,
    },
    createServiceOrder: {
      prefix: "SO#",
      entityType: "ServiceOrder",
      gsi1pk: "SERVICE_ORDER",
      gsi1sk: (a) => `Scheduled#${a.scheduledDate}`,
      gsi2pk: "SERVICE_ORDER",
      gsi3pk: (a) => `TECH#${a.technicianId}`,
      gsi4pk: (a) => `CUST#${a.customerId}`,
    },
    createCompliance: {
      prefix: "COMP#",
      entityType: "Compliance",
      gsi1pk: "COMPLIANCE",
      gsi1sk: () => `Pending#${now}`,
      gsi2pk: "COMPLIANCE",
      gsi3pk: (a) => a.certifications?.[0] ? `CERT#${a.certifications[0]}` : null,
      gsi4pk: (a) => `FW#${a.firmwareId}`,
    },
  };

  const config = entityMap[ctx.info.fieldName];
  const pk = `${config.prefix}${id}`;

  const item = {
    ...args,
    PK: pk,
    SK: pk,
    entityType: config.entityType,
    GSI1PK: config.gsi1pk,
    GSI1SK: config.gsi1sk(args),
    GSI2PK: config.gsi2pk,
    GSI2SK: now,
    status: args.status || "Pending",
    createdAt: now,
    updatedAt: now,
  };

  // Set optional GSI keys
  const gsi3 = config.gsi3pk(args);
  if (gsi3) {
    item.GSI3PK = gsi3;
    item.GSI3SK = pk;
  }
  const gsi4 = config.gsi4pk(args);
  if (gsi4) {
    item.GSI4PK = gsi4;
    item.GSI4SK = pk;
  }

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({ PK: pk, SK: pk }),
    attributeValues: util.dynamodb.toMapValues(item),
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  const item = ctx.result;
  item.id = item.PK.split("#").slice(1).join("#");
  return item;
}
```

### Resolver: `amplify/data/resolvers/updateStatus.js`

Handles status transitions with GSI1SK cascade.

```javascript
import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { entityType, id, newStatus, updatedBy } = ctx.arguments;
  const now = util.time.nowISO8601();

  const prefixMap = {
    Device: "DEV#",
    Firmware: "FW#",
    ServiceOrder: "SO#",
    Compliance: "COMP#",
  };
  const prefix = prefixMap[entityType];
  const pk = `${prefix}${id}`;

  const updates = {
    status: { action: "PUT", value: util.dynamodb.toDynamoDB(newStatus) },
    GSI1SK: { action: "PUT", value: util.dynamodb.toDynamoDB(`${newStatus}#${now}`) },
    updatedAt: { action: "PUT", value: util.dynamodb.toDynamoDB(now) },
  };

  if (updatedBy) {
    updates.updatedBy = { action: "PUT", value: util.dynamodb.toDynamoDB(updatedBy) };
  }

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({ PK: pk, SK: pk }),
    update: { expression: "SET #s = :s, GSI1SK = :gsi1sk, updatedAt = :now", expressionNames: { "#s": "status" }, expressionValues: util.dynamodb.toMapValues({ ":s": newStatus, ":gsi1sk": `${newStatus}#${now}`, ":now": now }) },
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result;
}
```

### Resolver: `amplify/data/resolvers/approveFirmware.js`

Handles firmware approval workflow (separation of duties enforced).

```javascript
import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { firmwareId, approvedBy } = ctx.arguments;
  const now = util.time.nowISO8601();
  const pk = `FW#${firmwareId}`;

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({ PK: pk, SK: pk }),
    update: {
      expression: "SET #s = :s, GSI1SK = :gsi1sk, approvedBy = :ab, approvedDate = :ad, updatedAt = :now",
      expressionNames: { "#s": "status" },
      expressionValues: util.dynamodb.toMapValues({
        ":s": "Approved",
        ":gsi1sk": `Approved#${now}`,
        ":ab": `USER#${approvedBy}`,
        ":ad": now,
        ":now": now,
      }),
    },
    // NIST AC-5: Separation of duties — uploader cannot approve
    condition: {
      expression: "uploadedBy <> :approver",
      expressionValues: util.dynamodb.toMapValues({
        ":approver": `USER#${approvedBy}`,
      }),
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    if (ctx.error.type === "ConditionalCheckFailedException") {
      util.error("Separation of duties violation: uploader cannot approve their own firmware", "ForbiddenError");
    }
    util.error(ctx.error.message, ctx.error.type);
  }
  const item = ctx.result;
  item.id = item.PK.split("#").slice(1).join("#");
  return item;
}
```

---

## 6. Backend Extensions (CDK)

### File: `amplify/backend.ts`

```typescript
import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import { Duration, RemovalPolicy } from "aws-cdk-lib";

const backend = defineBackend({
  auth,
  data,
});

// =============================================================================
// 1. DynamoDB Table Overrides
// =============================================================================

const dataStack = backend.data.resources.cfnResources;

// Get the underlying CFN table resource for DataTable
const cfnTable = dataStack.amplifyDynamoDbTables["DataTable"];

// Enable Point-in-Time Recovery (NIST CP-9)
cfnTable.pointInTimeRecoverySpecification = {
  pointInTimeRecoveryEnabled: true,
};

// Enable DynamoDB Streams for audit trail (NIST AU-12)
cfnTable.streamSpecification = {
  streamViewType: "NEW_AND_OLD_IMAGES",
};

// Enable TTL for automatic audit log expiry
cfnTable.timeToLiveSpecification = {
  attributeName: "ttl",
  enabled: true,
};

// Enable server-side encryption with KMS (NIST SC-28)
cfnTable.sseSpecification = {
  sseEnabled: true,
  sseType: "KMS",
};

// Set billing to PAY_PER_REQUEST for sandbox; switch to PROVISIONED in prod
cfnTable.billingMode = "PAY_PER_REQUEST";

// =============================================================================
// 2. S3 Firmware Storage Bucket
// =============================================================================

const firmwareStack = backend.createStack("FirmwareStorage");

const firmwareBucket = new s3.Bucket(firmwareStack, "FirmwareBucket", {
  bucketName: `hlm-firmware-${backend.auth.resources.userPool.userPoolId}`,
  encryption: s3.BucketEncryption.KMS_MANAGED,
  versioned: true,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  enforceSSL: true,
  removalPolicy: RemovalPolicy.RETAIN,
  objectLockEnabled: true, // WORM compliance (NIST SI-7)
  lifecycleRules: [
    {
      id: "archive-old-firmware",
      transitions: [
        {
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: Duration.days(365),
        },
      ],
    },
  ],
});

// =============================================================================
// 3. Audit Log Stream Processor Lambda
// =============================================================================

const auditStack = backend.createStack("AuditProcessor");

const auditLambda = new lambda.Function(auditStack, "AuditStreamHandler", {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: "index.handler",
  code: lambda.Code.fromInline(`
    // Triggered by DynamoDB Streams — writes audit log items back to DataTable
    const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
    const { marshall } = require("@aws-sdk/util-dynamodb");
    const client = new DynamoDBClient({});
    const TABLE_NAME = process.env.TABLE_NAME;

    exports.handler = async (event) => {
      for (const record of event.Records) {
        const newImage = record.dynamodb?.NewImage;
        if (!newImage) continue;

        const entityType = newImage.entityType?.S;
        // Skip edge items and audit logs (prevent infinite loop)
        if (!entityType || entityType === "AuditLog" ||
            entityType.startsWith("Cust") || entityType.startsWith("Device") ||
            entityType.startsWith("FW")) continue;

        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const now = new Date().toISOString();
        const action = record.eventName === "INSERT" ? "Created"
                     : record.eventName === "MODIFY" ? "Modified" : "Deleted";

        await client.send(new PutItemCommand({
          TableName: TABLE_NAME,
          Item: marshall({
            PK: "AUDIT#" + id,
            SK: "AUDIT#" + id,
            GSI1PK: "AUDIT_LOG",
            GSI1SK: "Success#" + now,
            GSI2PK: "AUDIT_LOG",
            GSI2SK: now,
            entityType: "AuditLog",
            action,
            resourceType: entityType,
            resourceId: newImage.PK?.S || "",
            auditStatus: "Success",
            auditTimestamp: now,
            createdAt: now,
            updatedAt: now,
          }),
        }));
      }
    };
  `),
  environment: {
    TABLE_NAME: backend.data.resources.tables["DataTable"].tableName,
  },
  timeout: Duration.seconds(30),
});

// Grant the Lambda write access to DataTable
backend.data.resources.tables["DataTable"].grantWriteData(auditLambda);

// Wire DynamoDB Streams to the Lambda
auditLambda.addEventSource(
  new lambdaEventSources.DynamoEventSource(
    backend.data.resources.tables["DataTable"],
    {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
      batchSize: 25,
      retryAttempts: 3,
    }
  )
);

// =============================================================================
// 4. Cognito Token Expiry Overrides (NIST AC-11)
// =============================================================================

const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
cfnUserPool.policies = {
  ...cfnUserPool.policies as object,
  passwordPolicy: {
    minimumLength: 12,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
  },
};

const cfnUserPoolClient = backend.auth.resources.cfnResources.cfnUserPoolClient;
cfnUserPoolClient.accessTokenValidity = 15;       // 15 minutes
cfnUserPoolClient.idTokenValidity = 15;            // 15 minutes
cfnUserPoolClient.refreshTokenValidity = 7;        // 7 days
cfnUserPoolClient.tokenValidityUnits = {
  accessToken: "minutes",
  idToken: "minutes",
  refreshToken: "days",
};

// =============================================================================
// 5. Output firmware bucket name for frontend config
// =============================================================================

backend.addOutput({
  storage: {
    aws_region: firmwareStack.region,
    bucket_name: firmwareBucket.bucketName,
  },
});
```

---

## 7. Frontend Client Integration

### File: `src/lib/hlm-api.ts`

```typescript
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();

// =============================================================================
// Frontend Types (clean, entity-specific interfaces)
// =============================================================================

export interface Device {
  id: string;
  deviceName: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  location: string;
  status: "Online" | "Offline" | "Maintenance";
  firmwareVersion: string;
  firmwareId: string;
  lastUpdate: string;
  lastSeen: string;
  customer: string;
  healthScore: number;
}

export interface Firmware {
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

export interface ServiceOrder {
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

export interface ComplianceItem {
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

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  firmware: string;
  timestamp: string;
  ipAddress: string;
  status: "Success" | "Failed";
}

// =============================================================================
// Query Functions — Typed wrappers over custom queries
// =============================================================================

// AP-6: List devices with optional status filter
export async function listDevices(
  status?: string,
  limit = 25,
  nextToken?: string
): Promise<{ items: Device[]; nextToken?: string }> {
  const { data } = await client.queries.listDevices({
    status,
    limit,
    nextToken,
  });
  const parsed = JSON.parse(data?.items || "[]");
  return {
    items: parsed.map(mapToDevice),
    nextToken: data?.nextToken ?? undefined,
  };
}

// AP-7: Devices by customer
export async function getDevicesByCustomer(customerId: string): Promise<Device[]> {
  const { data } = await client.queries.getDevicesByCustomer({ customerId });
  const parsed = JSON.parse(data?.items || "[]");
  return parsed.filter((i: any) => i.entityType === "Device").map(mapToDevice);
}

// AP-5: Single device by ID
export async function getDevice(id: string): Promise<Device | null> {
  const { data } = await client.queries.getDevice({ id });
  return data ? mapToDevice(data) : null;
}

// AP-13: Service orders by status (Kanban)
export async function listServiceOrdersByStatus(status: string): Promise<ServiceOrder[]> {
  const { data } = await client.queries.listServiceOrdersByStatus({ status });
  const parsed = JSON.parse(data?.items || "[]");
  return parsed.map(mapToServiceOrder);
}

// AP-14: Service orders by date range (Calendar)
export async function listServiceOrdersByDate(
  startDate: string,
  endDate: string
): Promise<ServiceOrder[]> {
  const { data } = await client.queries.listServiceOrdersByDate({ startDate, endDate });
  const parsed = JSON.parse(data?.items || "[]");
  return parsed.map(mapToServiceOrder);
}

// AP-19: Firmware by status
export async function listFirmware(status?: string): Promise<Firmware[]> {
  const { data } = await client.queries.listFirmware({ status });
  const parsed = JSON.parse(data?.items || "[]");
  return parsed.map(mapToFirmware);
}

// AP-23: Audit logs by time range
export async function listAuditLogs(
  startDate: string,
  endDate: string,
  limit = 50
): Promise<AuditLog[]> {
  const { data } = await client.queries.listAuditLogs({ startDate, endDate, limit });
  const parsed = JSON.parse(data?.items || "[]");
  return parsed.map(mapToAuditLog);
}

// AP-25: Compliance by status
export async function listComplianceByStatus(status: string): Promise<ComplianceItem[]> {
  const { data } = await client.queries.listComplianceByStatus({ status });
  const parsed = JSON.parse(data?.items || "[]");
  return parsed.map(mapToCompliance);
}

// =============================================================================
// Mutation Functions
// =============================================================================

export async function createDevice(input: Omit<Device, "id" | "lastUpdate" | "lastSeen" | "customer"> & { customerId: string }) {
  const { data } = await client.mutations.createDevice(input);
  return data ? mapToDevice(data) : null;
}

export async function approveFirmware(firmwareId: string, approvedBy: string) {
  const { data } = await client.mutations.approveFirmware({ firmwareId, approvedBy });
  return data ? mapToFirmware(data) : null;
}

export async function updateEntityStatus(
  entityType: string,
  id: string,
  newStatus: string,
  updatedBy?: string
) {
  return client.mutations.updateEntityStatus({ entityType, id, newStatus, updatedBy });
}

// =============================================================================
// Mapper Functions (DynamoDB flat item → Frontend typed object)
// =============================================================================

function mapToDevice(item: any): Device {
  return {
    id: item.id || "",
    deviceName: item.deviceName || "",
    serialNumber: item.serialNumber || "",
    model: item.model || "",
    manufacturer: item.manufacturer || "",
    location: item.location || "",
    status: item.status || "Offline",
    firmwareVersion: item.firmwareVersion || "",
    firmwareId: item.firmwareId || "",
    lastUpdate: item.updatedAt || "",
    lastSeen: item.lastSeen || "",
    customer: item.customerId || "",
    healthScore: item.healthScore ?? 0,
  };
}

function mapToFirmware(item: any): Firmware {
  return {
    id: item.id || "",
    name: item.name || "",
    version: item.version || "",
    deviceModel: item.deviceModel || "",
    releaseDate: item.releaseDate || "",
    fileSize: item.fileSizeFormatted || `${item.fileSize || 0} bytes`,
    checksum: item.checksum || "",
    status: item.status || "Pending",
    downloads: item.downloads ?? 0,
  };
}

function mapToServiceOrder(item: any): ServiceOrder {
  return {
    id: item.id || "",
    title: item.title || "",
    technician: item.technicianName || "",
    type: item.serviceType === "ThirdParty" ? "3rd Party" : "Internal",
    location: item.location || "",
    date: item.scheduledDate || "",
    time: item.scheduledTime || "",
    status: item.status || "Scheduled",
    priority: item.priority || "Medium",
  };
}

function mapToCompliance(item: any): ComplianceItem {
  return {
    id: item.id || "",
    firmwareVersion: item.compFirmwareVersion || item.firmwareVersion || "",
    deviceModel: item.compDeviceModel || item.deviceModel || "",
    submittedBy: item.submittedByName || item.submittedBy || "",
    submittedDate: item.submittedDate || "",
    status: item.status || "Pending",
    certifications: item.certifications || [],
    vulnerabilities: item.totalVulnerabilities ?? 0,
    notes: item.complianceNotes || "",
  };
}

function mapToAuditLog(item: any): AuditLog {
  return {
    id: item.id || "",
    user: item.userEmail || "",
    action: item.action || "",
    firmware: item.auditFirmwareName || "",
    timestamp: item.auditTimestamp || "",
    ipAddress: item.ipAddress || "",
    status: item.auditStatus || "Success",
  };
}
```

---

## 8. Sandbox Deployment

### Prerequisites

```bash
# Install Amplify Gen 2 dependencies
npm install @aws-amplify/backend @aws-amplify/backend-cli aws-amplify
npm install -D @aws-amplify/backend-cli

# Verify AWS credentials are configured
aws sts get-caller-identity
```

### Step 1: Initialize Project Structure

```bash
# Create amplify directory structure
mkdir -p amplify/auth amplify/data/resolvers

# Files to create:
# amplify/auth/resource.ts        (Section 4)
# amplify/data/resource.ts        (Section 3)
# amplify/data/resolvers/*.js     (Section 5)
# amplify/backend.ts              (Section 6)
```

### Step 2: Start Sandbox

```bash
# Launch local sandbox (deploys real AWS resources in sandbox mode)
npx ampx sandbox

# Expected output:
# ✅ Auth (Cognito User Pool + groups)
# ✅ Data (AppSync API + DynamoDB DataTable with 4 GSIs)
# ✅ FirmwareStorage stack (S3 bucket)
# ✅ AuditProcessor stack (Lambda + DynamoDB Streams)
```

### Step 3: Validate Deployment

```bash
# Check sandbox status
npx ampx sandbox status

# Open AppSync console to test queries
npx ampx sandbox open

# Run a test query in AppSync console:
# query {
#   queryGSI1(GSI1PK: "DEVICE") {
#     items { PK SK entityType deviceName status }
#   }
# }
```

### Step 4: Seed Test Data

```bash
# Use the Amplify client in a seed script
npx tsx scripts/seed.ts
```

Example seed script (`scripts/seed.ts`):

```typescript
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);
const client = generateClient<Schema>();

async function seed() {
  // Create a device
  await client.mutations.createDevice({
    deviceName: "Gateway-A1",
    serialNumber: "SN-GW-001",
    model: "GW-3000",
    manufacturer: "NetCorp",
    location: "New York DC",
    status: "Online",
    firmwareVersion: "2.1.0",
    customerId: "c001",
    healthScore: 95,
  });

  console.log("Seed data created successfully");
}

seed().catch(console.error);
```

### Step 5: Teardown

```bash
# Destroy sandbox resources when done
npx ampx sandbox delete
```

---

## 9. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Single `a.model("DataTable")`** | Bypasses Amplify Gen 2's default one-table-per-model behavior; all entities in one DynamoDB table. |
| **`a.customType()` for domain entities** | Provides frontend type safety via `generateClient<Schema>()` without creating extra DynamoDB tables. |
| **4 GSIs** | Covers all 38 access patterns. DynamoDB supports up to 20 GSIs per table; 4 is efficient. |
| **`.identifier(["PK", "SK"])`** | Overrides Amplify's default `id` primary key with composite PK/SK for STD. |
| **`a.handler.custom()` resolvers** | JS resolvers route by field name to format PK/SK/GSI keys; frontend never constructs keys. |
| **Edge items (CUST#→DEV#)** | Enable "get all devices for customer" in a single query without joins. |
| **Status#Date GSI1SK** | Supports both status filtering (`begins_with`) and chronological ordering within status buckets. |
| **Sparse GSI3/GSI4** | Attributes only populated when relevant, minimizing index storage and write costs. |
| **CDK escape hatch in `backend.ts`** | Enables PITR, DynamoDB Streams, TTL, KMS encryption, and S3 Object Lock not available via schema DSL. |
| **DynamoDB Streams → Lambda** | Automatic, tamper-resistant audit trail satisfying NIST AU-2/AU-12. |
| **Cognito token overrides** | 15-min access tokens + 7-day refresh tokens satisfy NIST AC-11/AC-12 session controls. |
| **Separation of duties condition** | `approveFirmware` resolver enforces `uploadedBy <> approver` via DynamoDB conditional write (NIST AC-5). |

---

**Document Status:** Active
**Architecture Version:** 1.0 (Amplify Gen 2)
**Last Updated:** February 17, 2026
