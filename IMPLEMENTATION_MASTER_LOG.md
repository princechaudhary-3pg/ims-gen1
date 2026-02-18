# Implementation Master Log — HLM Platform

**Version:** 1.0
**Last Updated:** February 18, 2026
**Architecture:** AWS Amplify Gen 1 (Studio / UI-Builder) + DynamoDB Single Table Design
**Source PRD:** PRD.md
**Source Architecture:** Amplify-Gen1-architecture.md

---

## Purpose

This document is the **Source of Truth** for all implementation decisions made during the HLM Platform build-out. Every module implementation guide must reference and update this log upon completion. It captures global GraphQL patterns, authentication strategies, shared Figma component structures, and cross-module dependencies.

---

## 1. Global GraphQL Patterns

### 1.1 Single Table Design — Core Model

All entities reside in a single DynamoDB table (`HLMStore`) with GSI overloading. The canonical schema is defined in `Amplify-Gen1-architecture.md`, Section 3.

**Model Name:** `HLMStore`

**Primary Key:**
| Key       | Attribute | Type   |
|-----------|-----------|--------|
| Partition | `PK`      | String |
| Sort      | `SK`      | String |

**GSI Inventory:**

| GSI Name | PK Attribute | SK Attribute | Purpose                                         |
|----------|-------------|-------------|--------------------------------------------------|
| `GSI1`   | `GSI1PK`    | `GSI1SK`    | Entity listing by type + status                  |
| `GSI2`   | `GSI2PK`    | `GSI2SK`    | Time-based queries (calendar, audit, metrics)    |
| `GSI3`   | `GSI3PK`    | `GSI3SK`    | Lookup by alternate key (email, location, model) |
| `GSI4`   | `GSI4PK`    | `GSI4SK`    | Cross-entity relationships                       |

### 1.2 Entity Prefix Registry

| # | Entity       | Prefix   | PK Example      | SK Example                        |
|---|--------------|----------|-----------------|-----------------------------------|
| 1 | Customer     | `CUST#`  | `CUST#c001`     | `CUST#c001`                       |
| 2 | User         | `USER#`  | `USER#u001`     | `USER#u001`                       |
| 3 | Device       | `DEV#`   | `DEV#d001`      | `DEV#d001`                        |
| 4 | Firmware     | `FW#`    | `FW#f001`       | `FW#f001`                         |
| 5 | ServiceOrder | `SO#`    | `SO#s001`       | `SO#s001`                         |
| 6 | Compliance   | `COMP#`  | `COMP#cp001`    | `COMP#cp001`                      |
| 7 | AuditLog     | `AUDIT#` | `AUDIT#a001`    | `AUDIT#a001`                      |

**Edge Item Types:** `CustDevice`, `CustSO`, `CustUser`, `DeviceSO`, `FWComp`, `FWAudit`

### 1.3 Naming Conventions

| Concern              | Convention                          | Example                              |
|----------------------|-------------------------------------|--------------------------------------|
| Entity type field    | PascalCase                          | `Device`, `ServiceOrder`             |
| GSI1SK pattern       | `Status#ISO-8601`                   | `Online#2025-06-15T00:00:00Z`        |
| GSI2SK pattern       | ISO-8601 timestamp                  | `2025-06-15T10:00:00Z`              |
| GSI3PK pattern       | `CATEGORY#value`                    | `EMAIL#admin@hlm.com`, `DEVICE#NYC` |
| FK references        | `PREFIX#id`                         | `FW#f001`, `USER#u001`              |
| Discriminator field  | `entityType`                        | Always present on every item         |

### 1.4 Query Pattern Reference

All 38 access patterns are documented in `Amplify-Gen1-architecture.md`, Section 1. Module-specific subsets are listed in each module's implementation guide.

---

## 2. Authentication & Authorization Strategy

### 2.1 Cognito User Pool Configuration

| Setting                 | Value                                            |
|-------------------------|--------------------------------------------------|
| Sign-in attribute       | Email                                            |
| MFA                     | Optional (mandatory for Admin, Manager roles)    |
| Password policy         | Min 12 chars, uppercase, lowercase, number, special |
| Account lockout         | 5 failed attempts                                |
| Access token expiry     | 15 minutes                                       |
| Refresh token expiry    | 7 days                                           |
| Account recovery        | Email-based                                      |

### 2.2 RBAC Groups

| Group           | Create | Read | Update | Delete | Notes                                    |
|-----------------|--------|------|--------|--------|------------------------------------------|
| `Admin`         | Yes    | Yes  | Yes    | Yes    | Full CRUD on all entities                |
| `Manager`       | Yes    | Yes  | Yes    | No     | Cannot delete records                    |
| `Technician`    | No     | Yes  | Yes*   | No     | *Update limited to assigned SOs/devices  |
| `Viewer`        | No     | Yes  | No     | No     | Read-only                                |
| `CustomerAdmin` | No     | Yes* | No     | No     | *Scoped to own customer data via resolver |

### 2.3 Auth Rule on HLMStore

```graphql
@auth(rules: [
  { allow: groups, groups: ["Admin"], operations: [create, read, update, delete] }
  { allow: groups, groups: ["Manager"], operations: [create, read, update] }
  { allow: groups, groups: ["Technician"], operations: [read, update] }
  { allow: groups, groups: ["Viewer"], operations: [read] }
  { allow: groups, groups: ["CustomerAdmin"], operations: [read] }
  { allow: owner, ownerField: "owner", operations: [read, update] }
])
```

---

## 3. Shared Figma Component Structures

### 3.1 Design System Tokens

| Token              | Light Mode   | Dark Mode    |
|--------------------|-------------|-------------|
| Primary            | `#2563eb`   | `#2563eb`   |
| Success            | `#10b981`   | `#10b981`   |
| Warning            | `#f59e0b`   | `#f59e0b`   |
| Error              | `#ef4444`   | `#ef4444`   |
| Info               | `#8b5cf6`   | `#8b5cf6`   |
| Background         | `#ffffff`   | `#0f172a`   |
| Card Background    | `#f8fafc`   | `#1e293b`   |

### 3.2 Shared Component Registry

Components registered here are available to all modules via Amplify Studio UI-Builder.

| Component Name           | Figma Source        | Amplify Component | Bound Model    | Used By Modules      |
|--------------------------|--------------------|--------------------|----------------|----------------------|
| `StatusBadge`            | Figma/HLM/Atoms   | `StatusBadge`      | —              | All                  |
| `SidebarNav`             | Figma/HLM/Layout  | `SidebarNav`       | —              | All (layout.tsx)     |
| `TopBar`                 | Figma/HLM/Layout  | `TopBar`           | —              | All (layout.tsx)     |
| `StatCard`               | Figma/HLM/Atoms   | `StatCard`         | —              | Dashboard, Inventory |
| `DataTable`              | Figma/HLM/Organisms | `DataTable`      | HLMStore       | Inventory, Deployment, Compliance |
| `SearchFilterBar`        | Figma/HLM/Molecules | `SearchFilterBar` | —             | Inventory, Deployment, Compliance |
| `PaginationControls`     | Figma/HLM/Molecules | `PaginationControls` | —          | Inventory, Deployment, Compliance |
| `DeviceRow`              | Figma/HLM/Inventory | `DeviceRow`          | HLMStore   | Inventory                         |
| `DeviceTable`            | Figma/HLM/Inventory | `DeviceTable`        | HLMStore   | Inventory                         |
| `InventoryStatsBar`      | Figma/HLM/Inventory | `InventoryStatsBar`  | —          | Inventory                         |
| `DeviceSearchFilterBar`  | Figma/HLM/Inventory | `DeviceSearchFilterBar` | —       | Inventory                         |

### 3.3 Component Naming Convention

```
Figma Layer Name    ->  Amplify Component Name  ->  File Output
─────────────────       ──────────────────────       ─────────────────────
HLM/DeviceRow       ->  DeviceRow               ->  src/ui-components/DeviceRow.jsx
HLM/DeviceTable     ->  DeviceTable             ->  src/ui-components/DeviceTable.jsx
```

**Rule:** Figma frame names must use PascalCase with no spaces. The Amplify Studio import preserves the frame name as the component name.

---

## 4. Module Implementation Tracker

| # | Module                        | Status      | Guide Document                        | Entities Created          |
|---|-------------------------------|-------------|---------------------------------------|---------------------------|
| 1 | Inventory & Asset Management  | Guide Complete | `Module1_Inventory_Asset_Setup.md`    | Device, CustDevice (edge), DeviceStats (aggregation) |
| 2 | Account & Service Management  | Not Started | —                                     | —                         |
| 3 | Deployment & Orchestration    | Not Started | —                                     | —                         |
| 4 | Firmware Compliance           | Not Started | —                                     | —                         |
| 5 | Reporting & Analytics         | Not Started | —                                     | —                         |
| 6 | Dashboard                     | Not Started | —                                     | —                         |

---

## 5. Cross-Module Dependency Map

```
Dashboard (Module 6)
  ├── reads Device counts        <- Module 1
  ├── reads Firmware status      <- Module 3
  ├── reads ServiceOrder status  <- Module 2
  └── reads Compliance rates     <- Module 4

Inventory (Module 1)
  ├── references Customer        <- shared entity
  ├── references Firmware        <- Module 3
  └── produces DeviceSO edges    <- consumed by Module 2

Service Management (Module 2)
  ├── references Device          <- Module 1
  ├── references Customer        <- shared entity
  └── references User            <- shared entity

Deployment (Module 3)
  ├── references Device          <- Module 1
  └── produces AuditLog entries  <- consumed by Module 5

Compliance (Module 4)
  ├── references Firmware        <- Module 3
  └── produces vulnerability data <- consumed by Module 5

Analytics (Module 5)
  └── reads all entity types     <- Modules 1-4
```

---

## 6. Infrastructure Decisions Log

| Date       | Decision                                    | Rationale                                                    |
|------------|---------------------------------------------|--------------------------------------------------------------|
| 2026-02-18 | Single Table Design with 4 GSIs             | Covers all 38 access patterns; well within DynamoDB 20 GSI limit |
| 2026-02-18 | PAY_PER_REQUEST billing mode                | Appropriate for development; switch to PROVISIONED for prod  |
| 2026-02-18 | Lambda pre-processor for key formatting     | Frontend never constructs PK/SK directly; centralized logic  |
| 2026-02-18 | DynamoDB Streams for auto-audit             | Tamper-resistant audit trail (NIST AU-2/AU-12)               |
| 2026-02-18 | Point-in-Time Recovery enabled              | NIST CP-9 compliance                                         |
| 2026-02-18 | SSE-KMS encryption on table                 | NIST SC-28 compliance                                        |

---

## 7. Changelog

| Date       | Module | Change Description                                      |
|------------|--------|---------------------------------------------------------|
| 2026-02-18 | Global | Initial master log creation; global patterns documented |
| 2026-02-18 | Mod 1  | Inventory & Asset Management guide created              |

---

*This document must be updated at the end of every module implementation session.*
