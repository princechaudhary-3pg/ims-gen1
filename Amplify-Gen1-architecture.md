# HLM Platform — Single Table Design for AWS Amplify Gen 1

**Version:** 1.0
**Last Updated:** February 17, 2026
**Architecture:** AWS Amplify Gen 1 + DynamoDB Single Table Design
**Source PRD:** PRD.md

---

## Table of Contents

1. [Access Pattern Mapping Table](#1-access-pattern-mapping-table)
2. [DynamoDB Table Visual Representation](#2-dynamodb-table-visual-representation)
3. [Comprehensive schema.graphql](#3-comprehensive-schemagraphql)
4. [CLI Implementation Guide](#4-cli-implementation-guide)
5. [Resolver Logic](#5-resolver-logic)
6. [Summary: Key Design Decisions](#summary-key-design-decisions)

---

## 1. Access Pattern Mapping Table

### Entity Identification (from PRD)

| # | Entity | Prefix | Example PK | Example SK |
|---|--------|--------|-----------|-----------|
| 1 | Customer | `CUST#` | `CUST#c001` | `CUST#c001` |
| 2 | User | `USER#` | `USER#u001` | `USER#u001` |
| 3 | Device | `DEV#` | `DEV#d001` | `DEV#d001` |
| 4 | Firmware | `FW#` | `FW#f001` | `FW#f001` |
| 5 | ServiceOrder | `SO#` | `SO#s001` | `SO#s001` |
| 6 | Compliance | `COMP#` | `COMP#cp001` | `COMP#cp001` |
| 7 | AuditLog | `AUDIT#` | `AUDIT#a001` | `AUDIT#a001` |

### Access Pattern -> Index Mapping

| # | Access Pattern (User Story) | Index Used | Key Condition |
|---|---------------------------|------------|---------------|
| **Dashboard** ||||
| AP-1 | Get dashboard KPIs (device counts, health) | GSI1 | `GSI1PK = "DEVICE"` -> aggregate |
| AP-2 | Get active deployments count | GSI1 | `GSI1PK = "FIRMWARE", GSI1SK begins_with "Pending"` |
| AP-3 | Get recent alerts | GSI2 | `GSI2PK = "ALERT", GSI2SK > <timestamp>` |
| AP-4 | Get system status | GSI1 | `GSI1PK = "SYSTEM_STATUS"` |
| **Inventory & Assets** ||||
| AP-5 | Get device by ID | Table | `PK = "DEV#<id>", SK = "DEV#<id>"` |
| AP-6 | List all devices (paginated) | GSI1 | `GSI1PK = "DEVICE", GSI1SK begins_with <status>` |
| AP-7 | Get devices by customer | Table | `PK = "CUST#<id>", SK begins_with "DEV#"` |
| AP-8 | Get devices by status | GSI1 | `GSI1PK = "DEVICE", GSI1SK begins_with "<status>#"` |
| AP-9 | Get devices by location | GSI3 | `GSI3PK = "DEVICE#<location>"` |
| AP-10 | Get devices by firmware version | GSI4 | `GSI4PK = "FW#<fwId>", GSI4SK begins_with "DEV#"` |
| AP-11 | Search devices (name/serial) | GSI1 + Filter | `GSI1PK = "DEVICE"` + filter expression |
| **Account & Service Management** ||||
| AP-12 | Get service order by ID | Table | `PK = "SO#<id>", SK = "SO#<id>"` |
| AP-13 | List service orders by status (Kanban) | GSI1 | `GSI1PK = "SERVICE_ORDER", GSI1SK begins_with "<status>#"` |
| AP-14 | Get service orders by date (Calendar) | GSI2 | `GSI2PK = "SERVICE_ORDER", GSI2SK between <start> and <end>` |
| AP-15 | Get service orders by technician | GSI3 | `GSI3PK = "TECH#<userId>"` |
| AP-16 | Get service orders by customer | Table | `PK = "CUST#<id>", SK begins_with "SO#"` |
| AP-17 | Get service orders by type | GSI1 + Filter | `GSI1PK = "SERVICE_ORDER"` + filter on `serviceType` |
| **Deployment & Orchestration** ||||
| AP-18 | Get firmware by ID | Table | `PK = "FW#<id>", SK = "FW#<id>"` |
| AP-19 | List firmware by status | GSI1 | `GSI1PK = "FIRMWARE", GSI1SK begins_with "<status>#"` |
| AP-20 | Get firmware by device model | GSI3 | `GSI3PK = "MODEL#<model>"` |
| AP-21 | Get firmware audit logs | Table | `PK = "FW#<id>", SK begins_with "AUDIT#"` |
| AP-22 | Get audit logs by user | GSI4 | `GSI4PK = "USER#<id>", GSI4SK begins_with "AUDIT#"` |
| AP-23 | Get all audit logs (time-sorted) | GSI2 | `GSI2PK = "AUDIT_LOG", GSI2SK between <start> and <end>` |
| **Firmware Compliance** ||||
| AP-24 | Get compliance by ID | Table | `PK = "COMP#<id>", SK = "COMP#<id>"` |
| AP-25 | List compliance by status | GSI1 | `GSI1PK = "COMPLIANCE", GSI1SK begins_with "<status>#"` |
| AP-26 | Get compliance by firmware | Table | `PK = "FW#<id>", SK begins_with "COMP#"` |
| AP-27 | Get compliance by certification | GSI3 | `GSI3PK = "CERT#<certName>"` |
| **Reporting & Analytics** ||||
| AP-28 | Get device health trends | GSI2 | `GSI2PK = "HEALTH_METRIC", GSI2SK between <start> and <end>` |
| AP-29 | Get customer distribution | GSI1 | `GSI1PK = "CUSTOMER"` -> aggregate by type |
| AP-30 | Get deployment activity trends | GSI2 | `GSI2PK = "DEPLOYMENT_METRIC", GSI2SK between <start> and <end>` |
| AP-31 | Get vulnerability heatmap | GSI1 | `GSI1PK = "COMPLIANCE"` -> aggregate vulns |
| **User & Auth** ||||
| AP-32 | Get user by ID | Table | `PK = "USER#<id>", SK = "USER#<id>"` |
| AP-33 | Get user by email | GSI3 | `GSI3PK = "EMAIL#<email>"` |
| AP-34 | Get users by role | GSI1 | `GSI1PK = "USER", GSI1SK begins_with "<role>#"` |
| AP-35 | Get users by customer | Table | `PK = "CUST#<id>", SK begins_with "USER#"` |
| **Cross-entity** ||||
| AP-36 | Get customer with all children | Table | `PK = "CUST#<id>"` (all SK) |
| AP-37 | Get firmware with compliance + audits | Table | `PK = "FW#<id>"` (all SK) |
| AP-38 | Get device -> customer (reverse lookup) | GSI4 | Use stored `customerId` on device item |

---

## 2. DynamoDB Table Visual Representation

### Key Schema

| Key | Attribute | Type |
|-----|-----------|------|
| Partition Key | `PK` | String |
| Sort Key | `SK` | String |

### GSI Definitions

| GSI Name | PK Attribute | SK Attribute | Projection | Purpose |
|----------|-------------|-------------|------------|---------|
| `GSI1` | `GSI1PK` | `GSI1SK` | ALL | Entity listing by type + status |
| `GSI2` | `GSI2PK` | `GSI2SK` | ALL | Time-based queries (calendar, audit, metrics) |
| `GSI3` | `GSI3PK` | `GSI3SK` | ALL | Lookup by alternate key (email, location, model, cert) |
| `GSI4` | `GSI4PK` | `GSI4SK` | ALL | Cross-entity relationships (user->audits, fw->devices) |

### Sample Rows

#### Customer Entities

| PK | SK | GSI1PK | GSI1SK | GSI2PK | GSI2SK | entityType | Key Attributes |
|----|-----|--------|--------|--------|--------|------------|----------------|
| `CUST#c001` | `CUST#c001` | `CUSTOMER` | `Active#2025-01-15` | `CUSTOMER` | `2025-01-15T00:00:00Z` | Customer | name=Acme Corp, type=Enterprise, contactEmail=admin@acme.com |
| `CUST#c001` | `DEV#d001` | — | — | — | — | CustDevice | (edge item: customerId, deviceId only) |
| `CUST#c001` | `DEV#d002` | — | — | — | — | CustDevice | (edge item) |
| `CUST#c001` | `SO#s001` | — | — | — | — | CustSO | (edge item: customerId, soId only) |
| `CUST#c001` | `USER#u003` | — | — | — | — | CustUser | (edge item: customerId, userId only) |

#### User Entities

| PK | SK | GSI1PK | GSI1SK | GSI3PK | GSI3SK | GSI4PK | GSI4SK | entityType | Key Attributes |
|----|-----|--------|--------|--------|--------|--------|--------|------------|----------------|
| `USER#u001` | `USER#u001` | `USER` | `Admin#2025-01-10` | `EMAIL#admin@hlm.com` | `USER#u001` | `CUST#c001` | `USER#u001` | User | email=admin@hlm.com, role=Admin, dept=IT |
| `USER#u002` | `USER#u002` | `USER` | `Technician#2025-02-01` | `EMAIL#tech@hlm.com` | `USER#u002` | — | — | User | email=tech@hlm.com, role=Technician |

#### Device Entities

| PK | SK | GSI1PK | GSI1SK | GSI3PK | GSI3SK | GSI4PK | GSI4SK | entityType | Key Attributes |
|----|-----|--------|--------|--------|--------|--------|--------|------------|----------------|
| `DEV#d001` | `DEV#d001` | `DEVICE` | `Online#2025-06-15` | `DEVICE#New York DC` | `DEV#d001` | `FW#f001` | `DEV#d001` | Device | deviceName=Gateway-A1, serial=SN-001, model=GW-3000, status=Online, healthScore=95 |
| `DEV#d001` | `SO#s001` | — | — | — | — | — | — | DeviceSO | (edge item) |
| `DEV#d002` | `DEV#d002` | `DEVICE` | `Offline#2025-06-14` | `DEVICE#Chicago DC` | `DEV#d002` | `FW#f002` | `DEV#d002` | Device | deviceName=Switch-B2, serial=SN-002, model=SW-5000, status=Offline |

#### Firmware Entities

| PK | SK | GSI1PK | GSI1SK | GSI3PK | GSI3SK | entityType | Key Attributes |
|----|-----|--------|--------|--------|--------|------------|----------------|
| `FW#f001` | `FW#f001` | `FIRMWARE` | `Approved#2025-05-20` | `MODEL#GW-3000` | `FW#f001` | Firmware | name=GW-3000 Firmware, version=2.1.0, downloads=142 |
| `FW#f001` | `COMP#cp001` | — | — | — | — | FWComp | (edge item: firmwareId, complianceId) |
| `FW#f001` | `AUDIT#2025-06-15T10:00:00Z#a001` | — | — | — | — | FWAudit | (edge item: action, userEmail, timestamp) |

#### Service Order Entities

| PK | SK | GSI1PK | GSI1SK | GSI2PK | GSI2SK | GSI3PK | GSI3SK | GSI4PK | GSI4SK | entityType | Key Attributes |
|----|-----|--------|--------|--------|--------|--------|--------|--------|--------|------------|----------------|
| `SO#s001` | `SO#s001` | `SERVICE_ORDER` | `Scheduled#2025-06-20` | `SERVICE_ORDER` | `2025-06-20T09:00:00Z` | `TECH#u002` | `2025-06-20T09:00:00Z` | `CUST#c001` | `SO#s001` | ServiceOrder | title=Router Maintenance, priority=High |

#### Compliance Entities

| PK | SK | GSI1PK | GSI1SK | GSI3PK | GSI3SK | GSI4PK | GSI4SK | entityType | Key Attributes |
|----|-----|--------|--------|--------|--------|--------|--------|------------|----------------|
| `COMP#cp001` | `COMP#cp001` | `COMPLIANCE` | `Approved#2025-05-25` | `CERT#ISO 27001` | `COMP#cp001` | `FW#f001` | `COMP#cp001` | Compliance | certifications=[ISO 27001, SOC 2], vulnerabilities=2 |

#### Audit Log Entities

| PK | SK | GSI1PK | GSI1SK | GSI2PK | GSI2SK | GSI4PK | GSI4SK | entityType | Key Attributes |
|----|-----|--------|--------|--------|--------|--------|--------|------------|----------------|
| `AUDIT#a001` | `AUDIT#a001` | `AUDIT_LOG` | `Success#2025-06-15` | `AUDIT_LOG` | `2025-06-15T10:00:00Z` | `USER#u002` | `AUDIT#2025-06-15T10:00:00Z#a001` | AuditLog | action=Downloaded, firmware=GW-3000 FW v2.1.0, ip=10.0.1.55 |

### GSI Usage Summary

| GSI | PK Pattern | SK Pattern | Serves Access Patterns |
|-----|-----------|-----------|----------------------|
| **GSI1** | `entityType` (e.g., `DEVICE`, `FIRMWARE`) | `status#date` | AP-1,2,6,8,11,13,17,19,25,29,31,34 |
| **GSI2** | `entityType` or time-series bucket | `ISO-8601 timestamp` | AP-3,14,21,23,28,30 |
| **GSI3** | Alternate key (e.g., `EMAIL#x`, `TECH#x`, `MODEL#x`, `CERT#x`, `DEVICE#loc`) | Varies | AP-9,15,20,27,33 |
| **GSI4** | Cross-entity ref (e.g., `FW#<id>`, `USER#<id>`, `CUST#<id>`) | Entity ref + timestamp | AP-10,16,22,35,38 |

---

## 3. Comprehensive `schema.graphql`

```graphql
# =============================================================================
# HLM Platform - Single Table Design Schema (Amplify Gen 1)
# =============================================================================
# Table: HLMStore
# Strategy: Single Table Design with GSI Overloading
# All entities share one DynamoDB table; entity type is encoded in PK/SK prefixes.
# =============================================================================

type HLMStore
  @model(timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" })
  @key(fields: ["PK", "SK"])
  @key(
    name: "GSI1"
    fields: ["GSI1PK", "GSI1SK"]
    queryField: "queryByEntityTypeAndStatus"
  )
  @key(
    name: "GSI2"
    fields: ["GSI2PK", "GSI2SK"]
    queryField: "queryByEntityTypeAndDate"
  )
  @key(
    name: "GSI3"
    fields: ["GSI3PK", "GSI3SK"]
    queryField: "queryByAlternateKey"
  )
  @key(
    name: "GSI4"
    fields: ["GSI4PK", "GSI4SK"]
    queryField: "queryByCrossEntityRef"
  )
  @auth(rules: [
    # Admin: full CRUD on everything
    { allow: groups, groups: ["Admin"], operations: [create, read, update, delete] }
    # Manager: create, read, update (no delete)
    { allow: groups, groups: ["Manager"], operations: [create, read, update] }
    # Technician: read all, update service orders + devices they're assigned to
    { allow: groups, groups: ["Technician"], operations: [read, update] }
    # Viewer: read-only
    { allow: groups, groups: ["Viewer"], operations: [read] }
    # CustomerAdmin: read own customer's data (enforced via resolver-level filtering)
    { allow: groups, groups: ["CustomerAdmin"], operations: [read] }
    # Owner-based: users can read/update their own User record
    { allow: owner, ownerField: "owner", operations: [read, update] }
  ])
{
  # ─────────────────────────────────────────────────────────────
  # PRIMARY KEY
  # ─────────────────────────────────────────────────────────────
  PK: String!                         # e.g., "CUST#c001", "DEV#d001", "FW#f001"
  SK: String!                         # e.g., "CUST#c001", "DEV#d001", "AUDIT#<ts>#<id>"

  # ─────────────────────────────────────────────────────────────
  # GSI KEYS (all nullable for sparse index behavior)
  # ─────────────────────────────────────────────────────────────
  GSI1PK: String                      # Entity type: "DEVICE", "FIRMWARE", "SERVICE_ORDER", etc.
  GSI1SK: String                      # Status#Date: "Online#2025-06-15", "Approved#2025-05-20"

  GSI2PK: String                      # Entity type or time-series bucket
  GSI2SK: String                      # ISO-8601 timestamp for time-range queries

  GSI3PK: String                      # Alternate key: "EMAIL#x", "TECH#x", "MODEL#x", "CERT#x"
  GSI3SK: String                      # Secondary sort value

  GSI4PK: String                      # Cross-entity reference: "FW#f001", "USER#u001", "CUST#c001"
  GSI4SK: String                      # Entity ref + timestamp

  # ─────────────────────────────────────────────────────────────
  # DISCRIMINATOR
  # ─────────────────────────────────────────────────────────────
  entityType: String!                 # "Customer", "User", "Device", "Firmware",
                                      # "ServiceOrder", "Compliance", "AuditLog",
                                      # "CustDevice", "CustSO", "CustUser",
                                      # "DeviceSO", "FWComp", "FWAudit"

  # ─────────────────────────────────────────────────────────────
  # COMMON FIELDS (shared across entities)
  # ─────────────────────────────────────────────────────────────
  name: String                        # Display name (device, firmware, customer)
  status: String                      # Entity status (Online, Approved, Scheduled, etc.)
  owner: String                       # Cognito username (for owner-based auth)

  # ─────────────────────────────────────────────────────────────
  # CUSTOMER FIELDS
  # ─────────────────────────────────────────────────────────────
  customerType: String                # Enterprise, Mid-Market, Small Business, Government
  industry: String
  contactEmail: String
  contactPhone: String
  street: String
  city: String
  state: String
  zipCode: String
  country: String
  billingStreet: String
  billingCity: String
  billingState: String
  billingZipCode: String
  billingCountry: String
  subscriptionTier: String
  deviceCount: Int

  # ─────────────────────────────────────────────────────────────
  # USER FIELDS
  # ─────────────────────────────────────────────────────────────
  email: String
  firstName: String
  lastName: String
  role: String                        # Admin, Manager, Technician, Viewer, CustomerAdmin
  department: String
  phone: String
  avatar: String                      # S3 URL
  lastLogin: String                   # ISO-8601
  customerId: String                  # FK: "CUST#<id>"
  prefTheme: String                   # light | dark
  prefNotifications: Boolean
  prefLanguage: String
  prefTimezone: String

  # ─────────────────────────────────────────────────────────────
  # DEVICE FIELDS
  # ─────────────────────────────────────────────────────────────
  deviceName: String
  serialNumber: String
  model: String
  manufacturer: String
  location: String
  firmwareVersion: String
  firmwareId: String                  # FK: "FW#<id>"
  lastSeen: String                    # ISO-8601
  healthScore: Int                    # 0-100
  deviceMetadata: AWSJSON             # Flexible key-value metadata

  # ─────────────────────────────────────────────────────────────
  # SERVICE ORDER FIELDS
  # ─────────────────────────────────────────────────────────────
  title: String
  description: String
  technicianId: String                # FK: "USER#<id>"
  technicianName: String              # Cached for display
  serviceType: String                 # Internal, 3rd Party
  scheduledDate: String               # ISO-8601
  scheduledTime: String               # HH:mm
  completedDate: String               # ISO-8601
  priority: String                    # High, Medium, Low
  serviceNotes: String
  deviceIds: [String]                 # Array of "DEV#<id>"
  attachments: [String]               # S3 URLs
  createdBy: String                   # FK: "USER#<id>"

  # ─────────────────────────────────────────────────────────────
  # FIRMWARE FIELDS
  # ─────────────────────────────────────────────────────────────
  version: String                     # Semantic version
  deviceModel: String                 # Compatible device model
  releaseDate: String                 # ISO-8601
  fileName: String
  fileSize: Int                       # Bytes
  fileSizeFormatted: String           # Human-readable
  s3Key: String
  s3Bucket: String
  checksum: String                    # SHA-256
  checksumAlgorithm: String
  downloads: Int
  uploadedBy: String                  # FK: "USER#<id>"
  approvedBy: String                  # FK: "USER#<id>"
  approvedDate: String                # ISO-8601
  deprecatedDate: String              # ISO-8601
  releaseNotes: String                # Markdown

  # ─────────────────────────────────────────────────────────────
  # AUDIT LOG FIELDS
  # ─────────────────────────────────────────────────────────────
  userId: String                      # FK: "USER#<id>"
  userEmail: String                   # Cached
  action: String                      # Downloaded, Uploaded, Approved, etc.
  resourceType: String                # Device, Firmware, Compliance, etc.
  resourceId: String                  # ID of affected resource
  auditFirmwareId: String             # FK: "FW#<id>" (if applicable)
  auditFirmwareName: String           # Cached
  ipAddress: String
  userAgent: String
  auditStatus: String                 # Success, Failed
  errorMessage: String
  auditTimestamp: String              # ISO-8601 (canonical timestamp)
  auditMetadata: AWSJSON

  # ─────────────────────────────────────────────────────────────
  # COMPLIANCE FIELDS
  # ─────────────────────────────────────────────────────────────
  compFirmwareVersion: String
  compDeviceModel: String
  submittedBy: String                 # FK: "USER#<id>"
  submittedByName: String             # Cached
  submittedDate: String               # ISO-8601
  reviewedBy: String                  # FK: "USER#<id>"
  reviewedDate: String                # ISO-8601
  certifications: [String]            # ["ISO 27001", "SOC 2", "FCC"]
  vulnerabilities: AWSJSON            # Array of {id, cveId, severity, description, ...}
  totalVulnerabilities: Int
  complianceNotes: String
  complianceDocuments: [String]       # S3 URLs
  nextReviewDate: String              # ISO-8601

  # ─────────────────────────────────────────────────────────────
  # GENERIC METADATA
  # ─────────────────────────────────────────────────────────────
  metadata: AWSJSON                   # Overflow for any entity-specific data
}
```

---

## 4. CLI Implementation Guide

### Step 1: Initialize Amplify Project

```bash
# Initialize Amplify in the existing React project
cd /path/to/ims-1
amplify init

# Answers:
#   Project name: hlm-platform
#   Environment: dev
#   Default editor: Visual Studio Code
#   App type: javascript
#   Framework: react
#   Source directory: src
#   Distribution directory: dist  (Vite output)
#   Build command: npm run build
#   Start command: npm run dev
```

### Step 2: Add Authentication (Cognito)

```bash
amplify add auth

# Select: Manual configuration
# Select: User Sign-Up & Sign-In (Cognito User Pools)
# Configure:
#   - Sign-in: Email
#   - MFA: ON (Optional per user, required for Admin/Manager)
#   - Password policy: Min 12 chars, uppercase, lowercase, number, special
#   - User groups: Admin, Manager, Technician, Viewer, CustomerAdmin
#   - Account recovery: Email
#   - Advanced: Enable token expiration (15 min access, 7 day refresh)
```

### Step 3: Add API (GraphQL with Single Table)

```bash
amplify add api

# Select: GraphQL
# Authorization: Amazon Cognito User Pool (default)
# Additional auth: API Key (for dev/testing)
# Schema template: Blank (we'll paste our schema)
# Conflict detection: Auto Merge
```

Then replace `amplify/backend/api/<apiName>/schema.graphql` with the schema from Section 3 above.

### Step 4: Configure DynamoDB Overrides (Single Table Optimizations)

Create `amplify/backend/api/<apiName>/override.ts`:

```typescript
import { AmplifyApiGraphQlResourceStackTemplate } from "@aws-amplify/cli-extensibility-helper";

export function override(resources: AmplifyApiGraphQlResourceStackTemplate) {
  const table = resources.models["HLMStore"];

  // Set billing mode to PAY_PER_REQUEST for unpredictable workloads
  // Switch to PROVISIONED with auto-scaling in production
  table.modelDDBTable.billingMode = "PAY_PER_REQUEST";

  // Enable Point-in-Time Recovery (NIST CP-9)
  table.modelDDBTable.pointInTimeRecoverySpecification = {
    pointInTimeRecoveryEnabled: true,
  };

  // Enable server-side encryption with AWS-managed key
  // Upgrade to customer-managed CMK (KMS) in production
  table.modelDDBTable.sseSpecification = {
    sseEnabled: true,
    sseType: "KMS",
  };

  // Enable DynamoDB Streams for audit/event-driven processing
  table.modelDDBTable.streamSpecification = {
    streamViewType: "NEW_AND_OLD_IMAGES",
  };
}
```

### Step 5: Add Storage (S3 for Firmware Files)

```bash
amplify add storage

# Select: Content (Images, audio, video, etc.)
# Resource name: hlmFirmwareStorage
# Bucket name: hlm-firmware-<env>
# Access:
#   - Auth users: create/read/update/delete
#   - Guest users: No access
# Lambda trigger: Yes (for checksum validation + malware scanning)
```

### Step 6: Add Lambda Functions (Business Logic)

```bash
# Pre-processing resolver for PK/SK formatting
amplify add function
# Name: hlmPreProcessor
# Runtime: NodeJS
# Template: Hello World
# Access: API (HLMStore table)

# Audit log writer (triggered by DynamoDB Streams)
amplify add function
# Name: hlmAuditWriter
# Runtime: NodeJS
# Template: Trigger (DynamoDB Stream)
# Table: HLMStore

# Firmware integrity checker (triggered by S3 upload)
amplify add function
# Name: hlmFirmwareValidator
# Runtime: NodeJS
# Template: Trigger (S3)
# Bucket: hlmFirmwareStorage
```

### Step 7: Push and Deploy

```bash
# Validate configuration
amplify status

# Push to AWS (creates all resources)
amplify push

# After push, generate TypeScript types for the frontend
amplify codegen

# Verify in AWS Console
amplify console
```

### Step 8: Environment Promotion

```bash
# Create staging environment
amplify env add staging

# Create production environment
amplify env add prod

# Switch between environments
amplify env checkout dev
amplify env checkout staging
amplify env checkout prod
```

---

## 5. Resolver Logic

### Architecture Overview

All writes go through a **pre-processing layer** that formats the PK/SK/GSI keys before the item reaches DynamoDB. In Amplify Gen 1, this is done via **Lambda resolvers** that intercept mutations.

### Lambda Pre-Processor

**File:** `amplify/backend/function/hlmPreProcessor/src/index.ts`

```typescript
// =============================================================================
// HLM Pre-Processor Lambda
// Formats PK/SK/GSI keys before writing to DynamoDB Single Table
// =============================================================================

import { v4 as uuidv4 } from "uuid";

// --- Entity Type Constants ---------------------------------------------------

const ENTITY = {
  CUSTOMER: "Customer",
  USER: "User",
  DEVICE: "Device",
  FIRMWARE: "Firmware",
  SERVICE_ORDER: "ServiceOrder",
  COMPLIANCE: "Compliance",
  AUDIT_LOG: "AuditLog",
  // Edge types (relationship items)
  CUST_DEVICE: "CustDevice",
  CUST_SO: "CustSO",
  CUST_USER: "CustUser",
  DEVICE_SO: "DeviceSO",
  FW_COMP: "FWComp",
  FW_AUDIT: "FWAudit",
} as const;

// --- Prefix Constants --------------------------------------------------------

const PREFIX = {
  CUSTOMER: "CUST#",
  USER: "USER#",
  DEVICE: "DEV#",
  FIRMWARE: "FW#",
  SERVICE_ORDER: "SO#",
  COMPLIANCE: "COMP#",
  AUDIT: "AUDIT#",
  EMAIL: "EMAIL#",
  TECH: "TECH#",
  MODEL: "MODEL#",
  CERT: "CERT#",
  DEVICE_LOC: "DEVICE#",
} as const;

// --- GSI1PK Values (Entity Type Buckets) -------------------------------------

const GSI1_TYPE = {
  CUSTOMER: "CUSTOMER",
  USER: "USER",
  DEVICE: "DEVICE",
  FIRMWARE: "FIRMWARE",
  SERVICE_ORDER: "SERVICE_ORDER",
  COMPLIANCE: "COMPLIANCE",
  AUDIT_LOG: "AUDIT_LOG",
} as const;

// --- Interfaces --------------------------------------------------------------

interface CreateCustomerInput {
  name: string;
  customerType: string;
  industry?: string;
  contactEmail: string;
  contactPhone?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  subscriptionTier?: string;
  status?: string;
}

interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  phone?: string;
  customerId?: string;
  status?: string;
}

interface CreateDeviceInput {
  deviceName: string;
  serialNumber: string;
  model: string;
  manufacturer?: string;
  location: string;
  status: string;
  firmwareVersion: string;
  firmwareId?: string;
  customerId: string;
  healthScore?: number;
}

interface CreateFirmwareInput {
  name: string;
  version: string;
  deviceModel: string;
  manufacturer?: string;
  releaseDate: string;
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  checksum: string;
  checksumAlgorithm?: string;
  uploadedBy: string;
  releaseNotes?: string;
  s3Key: string;
  s3Bucket: string;
  status?: string;
}

interface CreateServiceOrderInput {
  title: string;
  description?: string;
  technicianId: string;
  technicianName: string;
  serviceType: string;
  location: string;
  scheduledDate: string;
  scheduledTime: string;
  priority: string;
  customerId: string;
  deviceIds?: string[];
  createdBy: string;
  status?: string;
}

interface CreateComplianceInput {
  firmwareId: string;
  compFirmwareVersion: string;
  compDeviceModel: string;
  submittedBy: string;
  submittedByName: string;
  certifications: string[];
  vulnerabilities?: string;
  totalVulnerabilities?: number;
  complianceNotes?: string;
  status?: string;
}

interface CreateAuditLogInput {
  userId: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  auditFirmwareId?: string;
  auditFirmwareName?: string;
  ipAddress: string;
  userAgent?: string;
  auditStatus: string;
  errorMessage?: string;
}

// --- Key Formatters ----------------------------------------------------------

export function formatCustomerKeys(input: CreateCustomerInput) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const status = input.status || "Active";

  return {
    ...input,
    PK: `${PREFIX.CUSTOMER}${id}`,
    SK: `${PREFIX.CUSTOMER}${id}`,
    GSI1PK: GSI1_TYPE.CUSTOMER,
    GSI1SK: `${status}#${now}`,
    GSI2PK: GSI1_TYPE.CUSTOMER,
    GSI2SK: now,
    entityType: ENTITY.CUSTOMER,
    status,
    deviceCount: 0,
  };
}

export function formatUserKeys(input: CreateUserInput) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const status = input.status || "Active";

  const item: Record<string, any> = {
    ...input,
    PK: `${PREFIX.USER}${id}`,
    SK: `${PREFIX.USER}${id}`,
    GSI1PK: GSI1_TYPE.USER,
    GSI1SK: `${input.role}#${now}`,
    GSI2PK: GSI1_TYPE.USER,
    GSI2SK: now,
    GSI3PK: `${PREFIX.EMAIL}${input.email}`,
    GSI3SK: `${PREFIX.USER}${id}`,
    entityType: ENTITY.USER,
    status,
    owner: id,
  };

  // If user belongs to a customer, set GSI4 for cross-entity lookup
  if (input.customerId) {
    item.GSI4PK = `${PREFIX.CUSTOMER}${input.customerId}`;
    item.GSI4SK = `${PREFIX.USER}${id}`;
  }

  return item;
}

export function formatDeviceKeys(input: CreateDeviceInput) {
  const id = uuidv4();
  const now = new Date().toISOString();

  const item: Record<string, any> = {
    ...input,
    PK: `${PREFIX.DEVICE}${id}`,
    SK: `${PREFIX.DEVICE}${id}`,
    GSI1PK: GSI1_TYPE.DEVICE,
    GSI1SK: `${input.status}#${now}`,
    GSI2PK: GSI1_TYPE.DEVICE,
    GSI2SK: now,
    GSI3PK: `${PREFIX.DEVICE_LOC}${input.location}`,
    GSI3SK: `${PREFIX.DEVICE}${id}`,
    entityType: ENTITY.DEVICE,
    lastSeen: now,
    healthScore: input.healthScore ?? 100,
  };

  // Cross-entity: firmware -> device lookup
  if (input.firmwareId) {
    item.GSI4PK = `${PREFIX.FIRMWARE}${input.firmwareId}`;
    item.GSI4SK = `${PREFIX.DEVICE}${id}`;
  }

  return { entityItem: item, edgeItems: buildDeviceEdges(id, input, now) };
}

function buildDeviceEdges(
  deviceId: string,
  input: CreateDeviceInput,
  now: string
) {
  const edges: Record<string, any>[] = [];

  // Customer -> Device edge
  if (input.customerId) {
    edges.push({
      PK: `${PREFIX.CUSTOMER}${input.customerId}`,
      SK: `${PREFIX.DEVICE}${deviceId}`,
      entityType: ENTITY.CUST_DEVICE,
      deviceName: input.deviceName,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    });
  }

  return edges;
}

export function formatFirmwareKeys(input: CreateFirmwareInput) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const status = input.status || "Pending";

  return {
    ...input,
    PK: `${PREFIX.FIRMWARE}${id}`,
    SK: `${PREFIX.FIRMWARE}${id}`,
    GSI1PK: GSI1_TYPE.FIRMWARE,
    GSI1SK: `${status}#${input.releaseDate}`,
    GSI2PK: GSI1_TYPE.FIRMWARE,
    GSI2SK: input.releaseDate,
    GSI3PK: `${PREFIX.MODEL}${input.deviceModel}`,
    GSI3SK: `${PREFIX.FIRMWARE}${id}`,
    entityType: ENTITY.FIRMWARE,
    status,
    downloads: 0,
    checksumAlgorithm: input.checksumAlgorithm || "SHA-256",
  };
}

export function formatServiceOrderKeys(input: CreateServiceOrderInput) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const status = input.status || "Scheduled";

  const item: Record<string, any> = {
    ...input,
    PK: `${PREFIX.SERVICE_ORDER}${id}`,
    SK: `${PREFIX.SERVICE_ORDER}${id}`,
    GSI1PK: GSI1_TYPE.SERVICE_ORDER,
    GSI1SK: `${status}#${input.scheduledDate}`,
    GSI2PK: GSI1_TYPE.SERVICE_ORDER,
    GSI2SK: `${input.scheduledDate}T${input.scheduledTime}:00Z`,
    GSI3PK: `${PREFIX.TECH}${input.technicianId}`,
    GSI3SK: `${input.scheduledDate}T${input.scheduledTime}:00Z`,
    GSI4PK: `${PREFIX.CUSTOMER}${input.customerId}`,
    GSI4SK: `${PREFIX.SERVICE_ORDER}${id}`,
    entityType: ENTITY.SERVICE_ORDER,
    status,
  };

  const edges: Record<string, any>[] = [];

  // Customer -> ServiceOrder edge
  edges.push({
    PK: `${PREFIX.CUSTOMER}${input.customerId}`,
    SK: `${PREFIX.SERVICE_ORDER}${id}`,
    entityType: ENTITY.CUST_SO,
    title: input.title,
    status,
    scheduledDate: input.scheduledDate,
    createdAt: now,
    updatedAt: now,
  });

  // Device -> ServiceOrder edges
  if (input.deviceIds) {
    for (const devId of input.deviceIds) {
      edges.push({
        PK: `${PREFIX.DEVICE}${devId}`,
        SK: `${PREFIX.SERVICE_ORDER}${id}`,
        entityType: ENTITY.DEVICE_SO,
        title: input.title,
        status,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return { entityItem: item, edgeItems: edges };
}

export function formatComplianceKeys(input: CreateComplianceInput) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const status = input.status || "Pending";

  const item: Record<string, any> = {
    ...input,
    PK: `${PREFIX.COMPLIANCE}${id}`,
    SK: `${PREFIX.COMPLIANCE}${id}`,
    GSI1PK: GSI1_TYPE.COMPLIANCE,
    GSI1SK: `${status}#${now}`,
    GSI2PK: GSI1_TYPE.COMPLIANCE,
    GSI2SK: now,
    GSI4PK: `${PREFIX.FIRMWARE}${input.firmwareId}`,
    GSI4SK: `${PREFIX.COMPLIANCE}${id}`,
    entityType: ENTITY.COMPLIANCE,
    status,
    submittedDate: now,
    totalVulnerabilities: input.totalVulnerabilities ?? 0,
  };

  // Set GSI3 for the first certification (sparse index for cert-based lookup)
  if (input.certifications && input.certifications.length > 0) {
    item.GSI3PK = `${PREFIX.CERT}${input.certifications[0]}`;
    item.GSI3SK = `${PREFIX.COMPLIANCE}${id}`;
  }

  const edges: Record<string, any>[] = [];

  // Firmware -> Compliance edge
  edges.push({
    PK: `${PREFIX.FIRMWARE}${input.firmwareId}`,
    SK: `${PREFIX.COMPLIANCE}${id}`,
    entityType: ENTITY.FW_COMP,
    status,
    compFirmwareVersion: input.compFirmwareVersion,
    createdAt: now,
    updatedAt: now,
  });

  return { entityItem: item, edgeItems: edges };
}

export function formatAuditLogKeys(input: CreateAuditLogInput) {
  const id = uuidv4();
  const now = new Date().toISOString();

  const item: Record<string, any> = {
    ...input,
    PK: `${PREFIX.AUDIT}${id}`,
    SK: `${PREFIX.AUDIT}${id}`,
    GSI1PK: GSI1_TYPE.AUDIT_LOG,
    GSI1SK: `${input.auditStatus}#${now}`,
    GSI2PK: GSI1_TYPE.AUDIT_LOG,
    GSI2SK: now,
    GSI4PK: `${PREFIX.USER}${input.userId}`,
    GSI4SK: `${PREFIX.AUDIT}${now}#${id}`,
    entityType: ENTITY.AUDIT_LOG,
    auditTimestamp: now,
  };

  const edges: Record<string, any>[] = [];

  // If firmware-related, create FW -> Audit edge
  if (input.auditFirmwareId) {
    edges.push({
      PK: `${PREFIX.FIRMWARE}${input.auditFirmwareId}`,
      SK: `${PREFIX.AUDIT}${now}#${id}`,
      entityType: ENTITY.FW_AUDIT,
      action: input.action,
      userEmail: input.userEmail,
      auditStatus: input.auditStatus,
      auditTimestamp: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  return { entityItem: item, edgeItems: edges };
}

// --- Lambda Handler ----------------------------------------------------------

export async function handler(event: any) {
  const { fieldName, arguments: args } = event;

  switch (fieldName) {
    case "createCustomer":
      return formatCustomerKeys(args.input);
    case "createUser":
      return formatUserKeys(args.input);
    case "createDevice":
      return formatDeviceKeys(args.input);
    case "createFirmware":
      return formatFirmwareKeys(args.input);
    case "createServiceOrder":
      return formatServiceOrderKeys(args.input);
    case "createCompliance":
      return formatComplianceKeys(args.input);
    case "createAuditLog":
      return formatAuditLogKeys(args.input);
    default:
      throw new Error(`Unknown field: ${fieldName}`);
  }
}
```

### Frontend TypeScript Service Layer

To maintain **strict typing** on the frontend despite the single table backend, create typed wrapper functions.

**File:** `src/lib/hlm-api.ts`

```typescript
// =============================================================================
// Typed service layer that abstracts the Single Table Design from the frontend
// =============================================================================

import { API, graphqlOperation } from "aws-amplify";
import {
  queryByEntityTypeAndStatus,
  queryByEntityTypeAndDate,
  queryByAlternateKey,
  queryByCrossEntityRef,
  getHLMStore,
} from "../graphql/queries";
import {
  createHLMStore,
  updateHLMStore,
  deleteHLMStore,
} from "../graphql/mutations";

// --- Frontend Types (strict, entity-specific) --------------------------------

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

// --- Mapper Functions (DynamoDB item -> Frontend type) ------------------------

function extractId(prefixedKey: string): string {
  // "DEV#abc-123" -> "abc-123"
  return prefixedKey.split("#").slice(1).join("#");
}

function mapToDevice(item: any): Device {
  return {
    id: extractId(item.PK),
    deviceName: item.deviceName,
    serialNumber: item.serialNumber,
    model: item.model,
    manufacturer: item.manufacturer ?? "",
    location: item.location,
    status: item.status,
    firmwareVersion: item.firmwareVersion,
    firmwareId: item.firmwareId ? extractId(item.firmwareId) : "",
    lastUpdate: item.updatedAt,
    lastSeen: item.lastSeen,
    customer: item.customerId ? extractId(item.customerId) : "",
    healthScore: item.healthScore ?? 0,
  };
}

function mapToFirmware(item: any): Firmware {
  return {
    id: extractId(item.PK),
    name: item.name,
    version: item.version,
    deviceModel: item.deviceModel,
    releaseDate: item.releaseDate,
    fileSize: item.fileSizeFormatted ?? `${item.fileSize} bytes`,
    checksum: item.checksum,
    status: item.status,
    downloads: item.downloads ?? 0,
  };
}

function mapToServiceOrder(item: any): ServiceOrder {
  return {
    id: extractId(item.PK),
    title: item.title,
    technician: item.technicianName,
    type: item.serviceType,
    location: item.location,
    date: item.scheduledDate,
    time: item.scheduledTime,
    status: item.status,
    priority: item.priority,
  };
}

function mapToAuditLog(item: any): AuditLog {
  return {
    id: extractId(item.PK),
    user: item.userEmail,
    action: item.action,
    firmware: item.auditFirmwareName ?? "",
    timestamp: item.auditTimestamp,
    ipAddress: item.ipAddress,
    status: item.auditStatus,
  };
}

// --- Query Functions ---------------------------------------------------------

// AP-6: List all devices by status
export async function listDevices(
  status?: string,
  limit = 25,
  nextToken?: string
): Promise<{ items: Device[]; nextToken?: string }> {
  const gsi1pk = "DEVICE";
  const gsi1sk = status ? { beginsWith: `${status}#` } : undefined;

  const result: any = await API.graphql(
    graphqlOperation(queryByEntityTypeAndStatus, {
      GSI1PK: gsi1pk,
      GSI1SK: gsi1sk,
      limit,
      nextToken,
      filter: { entityType: { eq: "Device" } },
    })
  );

  const items = result.data.queryByEntityTypeAndStatus.items;
  return {
    items: items.map(mapToDevice),
    nextToken: result.data.queryByEntityTypeAndStatus.nextToken,
  };
}

// AP-7: Get devices by customer
export async function getDevicesByCustomer(
  customerId: string
): Promise<Device[]> {
  const result: any = await API.graphql(
    graphqlOperation(getHLMStore, {
      PK: `CUST#${customerId}`,
      SK: { beginsWith: "DEV#" },
    })
  );
  return result.data.listHLMStores.items.map(mapToDevice);
}

// AP-13: List service orders by status (Kanban view)
export async function listServiceOrdersByStatus(
  status: string
): Promise<ServiceOrder[]> {
  const result: any = await API.graphql(
    graphqlOperation(queryByEntityTypeAndStatus, {
      GSI1PK: "SERVICE_ORDER",
      GSI1SK: { beginsWith: `${status}#` },
      filter: { entityType: { eq: "ServiceOrder" } },
    })
  );
  return result.data.queryByEntityTypeAndStatus.items.map(mapToServiceOrder);
}

// AP-14: Service orders by date range (Calendar view)
export async function listServiceOrdersByDateRange(
  startDate: string,
  endDate: string
): Promise<ServiceOrder[]> {
  const result: any = await API.graphql(
    graphqlOperation(queryByEntityTypeAndDate, {
      GSI2PK: "SERVICE_ORDER",
      GSI2SK: { between: [startDate, endDate] },
      filter: { entityType: { eq: "ServiceOrder" } },
    })
  );
  return result.data.queryByEntityTypeAndDate.items.map(mapToServiceOrder);
}

// AP-15: Get service orders by technician
export async function getServiceOrdersByTechnician(
  techUserId: string
): Promise<ServiceOrder[]> {
  const result: any = await API.graphql(
    graphqlOperation(queryByAlternateKey, {
      GSI3PK: `TECH#${techUserId}`,
      sortDirection: "DESC",
    })
  );
  return result.data.queryByAlternateKey.items.map(mapToServiceOrder);
}

// AP-19: List firmware by approval status
export async function listFirmwareByStatus(
  status?: string
): Promise<Firmware[]> {
  const result: any = await API.graphql(
    graphqlOperation(queryByEntityTypeAndStatus, {
      GSI1PK: "FIRMWARE",
      GSI1SK: status ? { beginsWith: `${status}#` } : undefined,
      filter: { entityType: { eq: "Firmware" } },
    })
  );
  return result.data.queryByEntityTypeAndStatus.items.map(mapToFirmware);
}

// AP-23: Get all audit logs (time-sorted)
export async function listAuditLogs(
  startDate: string,
  endDate: string,
  limit = 50
): Promise<AuditLog[]> {
  const result: any = await API.graphql(
    graphqlOperation(queryByEntityTypeAndDate, {
      GSI2PK: "AUDIT_LOG",
      GSI2SK: { between: [startDate, endDate] },
      limit,
      sortDirection: "DESC",
      filter: { entityType: { eq: "AuditLog" } },
    })
  );
  return result.data.queryByEntityTypeAndDate.items.map(mapToAuditLog);
}

// AP-33: Get user by email
export async function getUserByEmail(email: string) {
  const result: any = await API.graphql(
    graphqlOperation(queryByAlternateKey, {
      GSI3PK: `EMAIL#${email}`,
    })
  );
  const items = result.data.queryByAlternateKey.items;
  return items.length > 0 ? items[0] : null;
}

// AP-36: Get customer with all children (devices, SOs, users)
export async function getCustomerWithRelations(customerId: string) {
  const result: any = await API.graphql(
    graphqlOperation(getHLMStore, {
      PK: `CUST#${customerId}`,
    })
  );

  const items = result.data.listHLMStores.items;
  const customer = items.find((i: any) => i.entityType === "Customer");
  const devices = items
    .filter((i: any) => i.entityType === "CustDevice")
    .map((i: any) => extractId(i.SK));
  const serviceOrders = items
    .filter((i: any) => i.entityType === "CustSO")
    .map((i: any) => extractId(i.SK));
  const users = items
    .filter((i: any) => i.entityType === "CustUser")
    .map((i: any) => extractId(i.SK));

  return {
    customer,
    deviceIds: devices,
    serviceOrderIds: serviceOrders,
    userIds: users,
  };
}
```

### Status Update Logic (GSI Key Cascade)

When entity status changes, the GSI1SK must also be updated to maintain correct query results:

```typescript
// Example: Updating a device status also updates GSI1SK
export async function updateDeviceStatus(
  deviceId: string,
  newStatus: "Online" | "Offline" | "Maintenance"
) {
  const now = new Date().toISOString();

  await API.graphql(
    graphqlOperation(updateHLMStore, {
      input: {
        PK: `DEV#${deviceId}`,
        SK: `DEV#${deviceId}`,
        status: newStatus,
        GSI1SK: `${newStatus}#${now}`, // Must update GSI sort key!
        lastSeen: now,
      },
    })
  );
}

// Example: Firmware approval workflow
export async function approveFirmware(
  firmwareId: string,
  approvedByUserId: string
) {
  const now = new Date().toISOString();

  await API.graphql(
    graphqlOperation(updateHLMStore, {
      input: {
        PK: `FW#${firmwareId}`,
        SK: `FW#${firmwareId}`,
        status: "Approved",
        GSI1SK: `Approved#${now}`,
        approvedBy: `USER#${approvedByUserId}`,
        approvedDate: now,
      },
    })
  );
}
```

### DynamoDB Stream Handler (Auto-Audit)

**File:** `amplify/backend/function/hlmAuditWriter/src/index.ts`

```typescript
// =============================================================================
// Triggered by DynamoDB Streams to auto-generate audit logs
// =============================================================================

import { DynamoDBStreamEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

const dynamodb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.API_HLMPLATFORM_HLMSTORETABLE_NAME!;

export async function handler(event: DynamoDBStreamEvent) {
  for (const record of event.Records) {
    // Skip edge items and audit logs themselves (prevent infinite loop)
    const newImage = record.dynamodb?.NewImage;
    if (!newImage) continue;

    const entityType = newImage.entityType?.S;
    if (
      !entityType ||
      entityType.startsWith("Cust") ||
      entityType.startsWith("Device") ||
      entityType.startsWith("FW") ||
      entityType === "AuditLog"
    ) {
      continue;
    }

    const action =
      record.eventName === "INSERT"
        ? "Created"
        : record.eventName === "MODIFY"
          ? "Modified"
          : "Deleted";

    const auditItem = {
      PK: `AUDIT#${Date.now()}`,
      SK: `AUDIT#${Date.now()}`,
      GSI1PK: "AUDIT_LOG",
      GSI1SK: `Success#${new Date().toISOString()}`,
      GSI2PK: "AUDIT_LOG",
      GSI2SK: new Date().toISOString(),
      entityType: "AuditLog",
      action,
      resourceType: entityType,
      resourceId: newImage.PK?.S,
      auditStatus: "Success",
      auditTimestamp: new Date().toISOString(),
    };

    await dynamodb.put({ TableName: TABLE_NAME, Item: auditItem }).promise();
  }
}
```

---

## Summary: Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **4 GSIs** | Covers all 38 access patterns with minimal index overhead. DynamoDB limit is 20 GSIs per table; we use 4. |
| **Edge items for relationships** | `CUST#c001 / DEV#d001` items enable "Get all devices for customer" in a single query without joins. |
| **Status#Date composite sort key (GSI1SK)** | Enables both status filtering (`begins_with`) and time-ordering within a status bucket. |
| **Sparse indexes** | GSI3/GSI4 attributes are only populated when relevant, keeping index storage minimal. |
| **Denormalized names on edges** | `technicianName` on ServiceOrder avoids a second lookup for display purposes. |
| **Lambda pre-processor** | Centralizes PK/SK formatting logic; frontend never constructs keys directly. |
| **Typed frontend service layer** | Abstracts STD complexity; React components work with clean `Device`, `Firmware` etc. interfaces. |
| **DynamoDB Streams for audit** | Automatic, tamper-resistant audit trail satisfying NIST AU-2/AU-12 controls. |

---

**Document Status:** Active
**Architecture Version:** 1.0
**Last Updated:** February 17, 2026
