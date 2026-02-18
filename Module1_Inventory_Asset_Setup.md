# Module 1: Inventory & Asset Management — Implementation Guide

**Version:** 1.0
**Last Updated:** February 18, 2026
**Architecture:** AWS Amplify Gen 1 (Studio / UI-Builder) + Figma
**Master Log:** IMPLEMENTATION_MASTER_LOG.md
**PRD Reference:** PRD.md — Module 2: Inventory & Asset Management (lines 205–261)

---

## Table of Contents

1. [Module Overview](#module-overview)
2. [Phase 1: Data Modeling (Studio)](#phase-1-data-modeling-studio)
3. [Phase 2: Figma to UI-Builder Sync](#phase-2-figma-to-ui-builder-sync)
4. [Phase 3: Component Pull & Setup](#phase-3-component-pull--setup)
5. [Phase 4: Logic Integration](#phase-4-logic-integration)
6. [Access Patterns Covered](#access-patterns-covered)
7. [Testing Checklist](#testing-checklist)

---

## Module Overview

### Purpose

Provide comprehensive device tracking and asset management, including device catalog, search/filter, status monitoring, data export, and paginated views.

### PRD Features Addressed

- Device Catalog (name, serial, model, location, status, firmware version, customer)
- Search & Filter (full-text, advanced filtering, multi-column sort)
- Status Indicators (color-coded badges, real-time updates)
- Data Export (CSV/Excel)
- Statistics Dashboard (total count, online/offline/maintenance breakdown)
- Pagination (configurable page size, navigation, result count)

### Entities Involved

| Entity       | Role in Module                 | Prefix  | entityType   |
|--------------|-------------------------------|---------|-------------|
| Device       | Primary entity                | `DEV#`  | `Device`    |
| Customer     | Parent relationship           | `CUST#` | `Customer`  |
| Firmware     | Referenced (current version)  | `FW#`   | `Firmware`  |
| CustDevice   | Edge item (Customer → Device) | —       | `CustDevice`|

### Access Patterns Used

| AP#   | Pattern                        | Index  | Key Condition                                          |
|-------|--------------------------------|--------|--------------------------------------------------------|
| AP-5  | Get device by ID               | Table  | `PK = "DEV#<id>", SK = "DEV#<id>"`                    |
| AP-6  | List all devices (paginated)   | GSI1   | `GSI1PK = "DEVICE", GSI1SK begins_with <status>`      |
| AP-7  | Get devices by customer        | Table  | `PK = "CUST#<id>", SK begins_with "DEV#"`             |
| AP-8  | Get devices by status          | GSI1   | `GSI1PK = "DEVICE", GSI1SK begins_with "<status>#"`   |
| AP-9  | Get devices by location        | GSI3   | `GSI3PK = "DEVICE#<location>"`                         |
| AP-10 | Get devices by firmware        | GSI4   | `GSI4PK = "FW#<fwId>", GSI4SK begins_with "DEV#"`     |
| AP-11 | Search devices (name/serial)   | GSI1   | `GSI1PK = "DEVICE"` + filter expression               |

---

## Phase 1: Data Modeling (Studio)

### 1.1 Prerequisite: Amplify Backend Initialized

Before modeling, confirm the Amplify backend is initialized and the core `HLMStore` model exists.

```
Verification Steps:
1. Open Amplify Studio → Data tab
2. Confirm "HLMStore" model is present with PK/SK primary key
3. Confirm all 4 GSIs (GSI1–GSI4) are configured
4. Confirm @auth rules match IMPLEMENTATION_MASTER_LOG.md Section 2.3
```

If the `HLMStore` model does not exist, follow `Amplify-Gen1-architecture.md`, Sections 3–4 to create it first.

### 1.2 Device Entity — Field Mapping

The Device entity is stored as a row in `HLMStore` with `entityType = "Device"`. The following fields from the shared schema are relevant to this module:

| Schema Field       | Type     | Required | Device Usage                          |
|--------------------|----------|----------|---------------------------------------|
| `PK`               | String!  | Yes      | `DEV#<uuid>`                          |
| `SK`               | String!  | Yes      | `DEV#<uuid>`                          |
| `entityType`       | String!  | Yes      | `"Device"`                            |
| `GSI1PK`           | String   | Yes      | `"DEVICE"`                            |
| `GSI1SK`           | String   | Yes      | `"<status>#<ISO-8601>"`              |
| `GSI2PK`           | String   | Yes      | `"DEVICE"`                            |
| `GSI2SK`           | String   | Yes      | `<ISO-8601 createdAt>`               |
| `GSI3PK`           | String   | Yes      | `"DEVICE#<location>"`                |
| `GSI3SK`           | String   | Yes      | `"DEV#<uuid>"`                       |
| `GSI4PK`           | String   | Cond.    | `"FW#<firmwareId>"` (if firmware set)|
| `GSI4SK`           | String   | Cond.    | `"DEV#<uuid>"`                       |
| `deviceName`       | String   | Yes      | Display name                          |
| `serialNumber`     | String   | Yes      | Unique hardware serial                |
| `model`            | String   | Yes      | Device model (e.g., GW-3000)         |
| `manufacturer`     | String   | No       | Manufacturer name                     |
| `location`         | String   | Yes      | Physical location                     |
| `status`           | String   | Yes      | `Online`, `Offline`, `Maintenance`   |
| `firmwareVersion`  | String   | Yes      | Current firmware version string       |
| `firmwareId`       | String   | No       | FK → `FW#<id>`                       |
| `customerId`       | String   | Yes      | FK → `CUST#<id>`                     |
| `lastSeen`         | String   | Auto     | ISO-8601, set by pre-processor       |
| `healthScore`      | Int      | Auto     | 0–100, defaults to 100               |
| `name`             | String   | No       | Alias for `deviceName` (shared field)|
| `deviceMetadata`   | AWSJSON  | No       | Arbitrary key-value metadata          |

### 1.3 CustDevice Edge Item — Relationship Mapping

When a Device is created, the Lambda pre-processor also writes an edge item under the Customer's partition. This enables AP-7 (Get devices by customer) as a single-partition query.

| Schema Field  | Value                              |
|---------------|------------------------------------|
| `PK`          | `CUST#<customerId>`               |
| `SK`          | `DEV#<deviceId>`                   |
| `entityType`  | `CustDevice`                       |
| `deviceName`  | Denormalized from Device           |
| `status`      | Denormalized from Device           |

**Important:** When a Device's status changes, the corresponding CustDevice edge item must also be updated to keep denormalized data consistent. This is handled by the Lambda pre-processor on update mutations.

### 1.4 Studio Data Modeling Steps

```
Step-by-step in Amplify Studio:

1. Navigate to: Amplify Studio → Data → Models
2. The HLMStore model should already exist (shared across all modules)
3. DO NOT create a separate "Device" model — all entities use HLMStore
4. Verify the following fields exist on HLMStore:
   - deviceName (String)
   - serialNumber (String)
   - model (String)
   - manufacturer (String)
   - location (String)
   - firmwareVersion (String)
   - firmwareId (String)
   - customerId (String)
   - lastSeen (String)
   - healthScore (Int)
   - deviceMetadata (AWSJSON)
5. If any fields are missing, add them via "Add a field" in Studio
6. Save and deploy the model
```

### 1.5 Relationship Diagram (Module 1 Scope)

```
┌──────────────────────────────────────────────┐
│ DynamoDB Table: HLMStore                     │
│                                              │
│  ┌─────────────────────┐                     │
│  │ Customer Entity     │                     │
│  │ PK: CUST#c001       │                     │
│  │ SK: CUST#c001       │──┐                  │
│  └─────────────────────┘  │                  │
│                           │ 1:N (edge items) │
│  ┌─────────────────────┐  │                  │
│  │ CustDevice Edge     │◄─┘                  │
│  │ PK: CUST#c001       │                     │
│  │ SK: DEV#d001        │                     │
│  └────────┬────────────┘                     │
│           │ points to                        │
│  ┌────────▼────────────┐                     │
│  │ Device Entity       │                     │
│  │ PK: DEV#d001        │                     │
│  │ SK: DEV#d001        │                     │
│  │ GSI4PK: FW#f001     │──┐                  │
│  └─────────────────────┘  │ references       │
│                           │                  │
│  ┌─────────────────────┐  │                  │
│  │ Firmware Entity     │◄─┘                  │
│  │ PK: FW#f001         │                     │
│  │ SK: FW#f001         │                     │
│  └─────────────────────┘                     │
└──────────────────────────────────────────────┘
```

---

## Phase 2: Figma to UI-Builder Sync

### 2.1 Prerequisites

| Requirement                  | Details                                                   |
|------------------------------|-----------------------------------------------------------|
| Figma account                | Team/Professional plan (required for API access)          |
| Figma file                   | HLM Platform design file with inventory components        |
| Amplify Studio access        | Admin or full-access role                                 |
| Figma-Amplify plugin         | Installed in Figma (search "AWS Amplify" in plugins)      |

### 2.2 Figma Component Structure for Inventory Module

Design the following components in Figma. Each top-level frame becomes an importable component in Amplify Studio.

```
Figma File: HLM Platform
└── Page: Inventory & Assets
    ├── Frame: InventoryStatsBar
    │   ├── StatCard (instance) — "Total Devices"
    │   ├── StatCard (instance) — "Online"
    │   ├── StatCard (instance) — "Offline"
    │   └── StatCard (instance) — "Maintenance"
    │
    ├── Frame: DeviceSearchFilterBar
    │   ├── SearchInput
    │   ├── StatusDropdown
    │   ├── LocationDropdown
    │   ├── CustomerDropdown
    │   └── ExportButton
    │
    ├── Frame: DeviceTable
    │   ├── DeviceTableHeader
    │   └── DeviceRow (component with variants)
    │       ├── Variant: status=Online
    │       ├── Variant: status=Offline
    │       └── Variant: status=Maintenance
    │
    ├── Frame: DeviceRow
    │   ├── Text: deviceName
    │   ├── Text: serialNumber
    │   ├── Text: model
    │   ├── Text: location
    │   ├── StatusBadge (instance)
    │   ├── Text: firmwareVersion
    │   ├── Text: lastUpdate
    │   └── Text: customer
    │
    ├── Frame: StatusBadge (shared atom)
    │   ├── Variant: status=Online  (green)
    │   ├── Variant: status=Offline (red)
    │   └── Variant: status=Maintenance (orange)
    │
    └── Frame: PaginationControls (shared molecule)
        ├── Text: resultCount
        ├── PageSizeSelector
        ├── PrevButton
        ├── PageIndicator
        └── NextButton
```

**Figma Naming Rules:**
- Frame names = PascalCase, no spaces (these become Amplify component names)
- Text layers intended for data binding = camelCase matching the schema field name exactly
- Variant properties = camelCase (`status`, `priority`)

### 2.3 Linking Figma to Amplify Studio

```
Step-by-step:

1. In Figma, open the HLM Platform file
2. Run Plugin: Plugins → AWS Amplify → "Sync with Amplify Studio"
3. Select the Amplify app from the dropdown
4. Choose environment: "dev"
5. Select components to sync:
   - InventoryStatsBar
   - DeviceSearchFilterBar
   - DeviceTable
   - DeviceRow
   - StatusBadge (if not already synced as shared component)
   - PaginationControls (if not already synced as shared component)
6. Click "Send to Amplify Studio"
7. Wait for sync confirmation (check Amplify Studio → UI Library)
```

### 2.4 Data Binding in Amplify Studio UI-Builder

After Figma components arrive in Studio, bind them to the `HLMStore` data model.

#### 2.4.1 Binding DeviceRow to HLMStore

```
In Amplify Studio → UI Library → DeviceRow:

1. Click "Configure" on the DeviceRow component
2. Set "Data source" → HLMStore (Collection)
3. Map child elements to model fields:

   Figma Layer Name    →    Model Field        →    Binding Type
   ─────────────────────────────────────────────────────────────
   deviceName          →    deviceName          →    Data field
   serialNumber        →    serialNumber        →    Data field
   model               →    model               →    Data field
   location            →    location            →    Data field
   firmwareVersion     →    firmwareVersion     →    Data field
   lastUpdate          →    updatedAt           →    Data field
   customer            →    customerId          →    Data field (will need override for display)

4. For the StatusBadge child:
   - Set variant property "status" → bound to model field "status"
   - This auto-switches the badge variant based on device status

5. Save the component configuration
```

#### 2.4.2 Binding DeviceTable as a Collection

```
In Amplify Studio → UI Library → DeviceTable:

1. Click "Configure" on DeviceTable
2. Set component type: "Collection"
3. Data source: HLMStore
4. Filter: entityType eq "Device"
5. Sort: GSI1SK descending (most recently updated first)
6. Pagination: Enabled, default page size = 25
7. Child component: DeviceRow (with bindings from 2.4.1)
8. Save configuration
```

#### 2.4.3 Binding InventoryStatsBar

```
The stats bar is NOT a collection — it displays aggregated values.
Binding strategy: Use "overrides" prop at runtime (see Phase 4).

In Studio, configure the StatCard text layers as static placeholders:
  - "Total Devices" → value: "—"
  - "Online"        → value: "—"
  - "Offline"       → value: "—"
  - "Maintenance"   → value: "—"

These will be replaced at runtime via the overrides prop.
```

### 2.5 Figma-to-Studio Sync Troubleshooting

| Issue                                    | Resolution                                                      |
|------------------------------------------|-----------------------------------------------------------------|
| Component not appearing in Studio        | Ensure the Figma frame is a top-level component (not nested)    |
| Variant not mapping                      | Variant property names must be camelCase and match exactly      |
| Text layer not available for binding     | Layer name must not contain spaces; rename in Figma and re-sync |
| Auto-layout breaks in Studio             | Studio respects Figma auto-layout; verify constraints in Figma  |
| Colors look different                    | Verify Figma is using the design tokens from Section 3.1 of Master Log |

---

## Phase 3: Component Pull & Setup

### 3.1 Pulling Components to Local Codebase

After configuring components in Amplify Studio, pull them into the local React project.

```bash
# Ensure you are in the project root
cd /path/to/ims-gen1

# Pull the latest Studio configuration (models + UI components)
amplify pull

# Expected prompts:
#   - App ID: (auto-detected from amplify/team-provider-info.json)
#   - Environment: dev
#   - Default editor: Visual Studio Code
#   - Framework: react
#   - Source directory: src
#   - Distribution directory: dist
#   - Build command: npm run build
#   - Start command: npm run dev
#   - Generate code for GraphQL API: Yes
#   - Code generation language: typescript
#   - File name pattern: src/graphql/**/*.ts
#   - Generate all GraphQL operations: Yes
#   - Max statement depth: 3
```

### 3.2 Generated File Structure

After `amplify pull`, the following files are generated or updated:

```
src/
├── ui-components/                  # ← Amplify Studio generated components
│   ├── DeviceRow.jsx               # Single device row (data-bound)
│   ├── DeviceRow.d.ts              # TypeScript declarations
│   ├── DeviceTable.jsx             # Collection component
│   ├── DeviceTable.d.ts
│   ├── DeviceSearchFilterBar.jsx   # Search/filter bar
│   ├── DeviceSearchFilterBar.d.ts
│   ├── InventoryStatsBar.jsx       # Stats summary bar
│   ├── InventoryStatsBar.d.ts
│   ├── StatusBadge.jsx             # Shared status badge
│   ├── StatusBadge.d.ts
│   ├── PaginationControls.jsx      # Shared pagination
│   ├── PaginationControls.d.ts
│   └── index.js                    # Barrel export
│
├── models/                         # ← DataStore models (auto-generated)
│   ├── index.d.ts
│   ├── index.js
│   └── schema.js
│
├── graphql/                        # ← GraphQL operations (auto-generated)
│   ├── queries.ts                  # All query operations
│   ├── mutations.ts                # All mutation operations
│   ├── subscriptions.ts            # Real-time subscriptions
│   └── schema.json                 # Introspection schema
│
└── aws-exports.js                  # ← Amplify configuration (auto-generated)
```

### 3.3 Organizing Generated Components

The generated `ui-components/` directory should NOT be manually edited — changes will be overwritten on the next `amplify pull`. Instead, wrap them in your own component files.

**Recommended project structure:**

```
src/
├── app/
│   └── components/
│       └── inventory/              # ← YOUR module-specific wrappers
│           ├── InventoryPage.tsx    # Page-level orchestrator
│           ├── DeviceTableWrapper.tsx
│           ├── StatsBarWrapper.tsx
│           ├── SearchFilterWrapper.tsx
│           └── hooks/
│               ├── useDeviceList.ts     # Custom hook: fetches + paginates devices
│               ├── useDeviceStats.ts    # Custom hook: aggregates device counts
│               └── useDeviceSearch.ts   # Custom hook: search + filter logic
│
├── ui-components/                  # ← DO NOT EDIT (Amplify-managed)
│   └── ...
│
└── lib/
    └── hlm-api.ts                  # ← Typed service layer (from architecture doc)
```

**Key Principle:** Your wrapper components import from `ui-components/` and pass `overrides` props to inject logic. The generated files stay untouched.

### 3.4 Re-pulling After Figma Changes

When Figma designs are updated and re-synced to Studio:

```bash
# Pull updated components
amplify pull

# This regenerates ui-components/*.jsx files
# Your wrapper components in app/components/inventory/ are unaffected
# Verify the pull didn't break any override prop names:
#   - Check that Figma layer names haven't changed
#   - Check that variant property names are consistent
```

### 3.5 CodeGen Verification

After pulling, verify the GraphQL codegen produced the expected operations:

```
Verify in src/graphql/queries.ts:
  ✓ getHLMStore           — AP-5 (get device by ID)
  ✓ listHLMStores         — AP-7 (get devices by customer, PK query)
  ✓ queryByEntityTypeAndStatus  — AP-6, AP-8, AP-11 (list/filter devices)
  ✓ queryByAlternateKey         — AP-9 (devices by location)
  ✓ queryByCrossEntityRef       — AP-10 (devices by firmware)
  ✓ queryByEntityTypeAndDate    — (general time queries)

Verify in src/graphql/mutations.ts:
  ✓ createHLMStore
  ✓ updateHLMStore
  ✓ deleteHLMStore
```

---

## Phase 4: Logic Integration

### 4.1 The `overrides` Prop Pattern

Amplify Studio-generated components accept an `overrides` prop. This is the primary mechanism for injecting custom business logic without editing generated files.

**How overrides work:**

```
overrides = {
  "<FigmaLayerName>": {
    // Standard React props
    children: "Custom text",
    onClick: () => { ... },
    style: { color: "red" },
    // Component-specific props
    src: "image-url",
    // Data transformation
    children: formatDate(item.updatedAt),
  }
}
```

Each key in the `overrides` object corresponds to a **Figma layer name** (the name visible in Figma's layers panel). Amplify generates a mapping from layer names to React element refs.

### 4.2 Override Injection Points — DeviceRow

| Figma Layer    | Override Purpose                                  | Override Key      |
|----------------|--------------------------------------------------|-------------------|
| `deviceName`   | Clickable link to device detail page             | `deviceName`      |
| `serialNumber` | Monospace font styling                           | `serialNumber`    |
| `lastUpdate`   | Format ISO-8601 to human-readable date           | `lastUpdate`      |
| `customer`     | Resolve `customerId` → customer display name     | `customer`        |
| `StatusBadge`  | Ensure correct variant is applied                | `StatusBadge`     |

**Override strategy in wrapper component:**

```
DeviceTableWrapper.tsx renders:

  <DeviceTable
    overrides={{
      DeviceRow: {
        overrides: {
          deviceName: {
            // Transform: make device name a clickable link
            onClick: (item) => navigate(`/inventory/${extractId(item.PK)}`),
            style: { cursor: "pointer", color: "#2563eb" },
          },
          serialNumber: {
            // Transform: apply monospace font
            style: { fontFamily: "monospace" },
          },
          lastUpdate: {
            // Transform: format date from ISO-8601
            children: (item) => formatRelativeDate(item.updatedAt),
          },
          customer: {
            // Transform: resolve customerId to display name
            children: (item) => resolveCustomerName(item.customerId),
          },
        },
      },
    }}
  />
```

### 4.3 Search & Filter Logic

Search and filter are implemented outside the generated components, in your custom hooks. The hooks execute GraphQL queries and pass results to the generated collection component.

#### 4.3.1 Search Strategy

| Search Type       | Implementation                                              |
|-------------------|-------------------------------------------------------------|
| By device name    | GSI1 query (`GSI1PK = "DEVICE"`) + filter on `deviceName`  |
| By serial number  | GSI1 query (`GSI1PK = "DEVICE"`) + filter on `serialNumber`|
| By customer       | Table query (`PK = "CUST#<id>", SK begins_with "DEV#"`)    |

**Note:** DynamoDB `filter` expressions run AFTER the query, so they consume read capacity. For large datasets, consider adding a search-specific GSI or integrating Amazon OpenSearch.

#### 4.3.2 Filter Strategy

| Filter Dimension  | Query Approach                                               |
|-------------------|--------------------------------------------------------------|
| By status         | GSI1: `GSI1PK = "DEVICE", GSI1SK begins_with "<status>#"`   |
| By location       | GSI3: `GSI3PK = "DEVICE#<location>"`                        |
| By firmware       | GSI4: `GSI4PK = "FW#<fwId>", GSI4SK begins_with "DEV#"`    |
| By customer       | Table: `PK = "CUST#<id>", SK begins_with "DEV#"`            |
| Combined filters  | Use the most selective index as primary, apply remaining as filters |

#### 4.3.3 Filter Combination Logic

When multiple filters are active simultaneously:

```
Decision Tree:

1. If customer filter is set:
   → Use Table query: PK = "CUST#<id>", SK begins_with "DEV#"
   → Apply status/location as filter expressions

2. Else if status filter is set:
   → Use GSI1: GSI1PK = "DEVICE", GSI1SK begins_with "<status>#"
   → Apply location as filter expression

3. Else if location filter is set:
   → Use GSI3: GSI3PK = "DEVICE#<location>"
   → Apply other filters as filter expressions

4. Else (no filters):
   → Use GSI1: GSI1PK = "DEVICE"
   → Return all devices, paginated
```

#### 4.3.4 Search Override Injection

The `DeviceSearchFilterBar` component receives search/filter state via overrides:

```
DeviceSearchFilterBar overrides:

  SearchInput:
    → onChange: updates search term in useDeviceSearch hook
    → value: bound to current search term state

  StatusDropdown:
    → onChange: updates status filter in useDeviceList hook
    → value: bound to current status filter state
    → options: ["All", "Online", "Offline", "Maintenance"]

  LocationDropdown:
    → onChange: updates location filter
    → value: bound to current location filter state
    → options: dynamically populated from distinct device locations

  CustomerDropdown:
    → onChange: updates customer filter
    → value: bound to current customer filter state
    → options: populated from Customer entities (GSI1PK = "CUSTOMER")

  ExportButton:
    → onClick: triggers CSV export function
```

### 4.4 Pagination Logic

#### 4.4.1 DynamoDB Pagination Model

DynamoDB uses cursor-based pagination (`nextToken`), not offset-based. The generated collection component handles this natively when configured in Studio.

```
Pagination Flow:

1. Initial query: GSI1PK = "DEVICE", limit = 25
   → Returns: items[] + nextToken (opaque cursor)

2. "Next Page": Same query + nextToken from step 1
   → Returns: next batch + new nextToken (or null if last page)

3. "Previous Page": Maintained in client-side page stack
   → Store each nextToken in an array as pages are visited
   → Pop from stack to go back
```

#### 4.4.2 PaginationControls Override Injection

```
PaginationControls overrides:

  resultCount:
    → children: "Showing {startIndex}–{endIndex} of {totalCount}"
    → Note: Total count requires a separate aggregation query or
      DynamoDB scan (expensive). Consider caching total count.

  PageSizeSelector:
    → onChange: updates page size, resets pagination
    → options: [10, 25, 50, 100]

  PrevButton:
    → onClick: go to previous page (pop from token stack)
    → disabled: true when on first page

  NextButton:
    → onClick: fetch next page using nextToken
    → disabled: true when nextToken is null

  PageIndicator:
    → children: "Page {currentPage}"
```

### 4.5 Statistics Bar Logic

The InventoryStatsBar displays aggregated device counts. These cannot be efficiently retrieved from a single DynamoDB query — they require multiple queries or a cached aggregation.

#### 4.5.1 Aggregation Strategy

```
Option A: Multiple GSI1 Queries (Acceptable for < 10K devices)

  1. Total Devices:    GSI1PK = "DEVICE" → count all results
  2. Online count:     GSI1PK = "DEVICE", GSI1SK begins_with "Online#" → count
  3. Offline count:    GSI1PK = "DEVICE", GSI1SK begins_with "Offline#" → count
  4. Maintenance count: GSI1PK = "DEVICE", GSI1SK begins_with "Maintenance#" → count

  Pros: Real-time, no extra infrastructure
  Cons: 4 queries per page load; won't scale past ~10K devices

Option B: Pre-computed Aggregation Item (Recommended for scale)

  Store a summary item in HLMStore:
    PK: "STATS#DEVICE"
    SK: "STATS#DEVICE"
    entityType: "DeviceStats"
    totalDevices: 1247
    onlineCount: 1100
    offlineCount: 97
    maintenanceCount: 50
    lastComputed: "2026-02-18T12:00:00Z"

  Updated by DynamoDB Stream Lambda whenever a Device item is created/updated/deleted.

  Query: Single GetItem → PK = "STATS#DEVICE", SK = "STATS#DEVICE"
```

#### 4.5.2 StatsBar Override Injection

```
InventoryStatsBar overrides:

  StatCard (Total Devices):
    → value: stats.totalDevices
    → trend: calculated from historical data (future enhancement)

  StatCard (Online):
    → value: stats.onlineCount
    → color: "#10b981" (success green)

  StatCard (Offline):
    → value: stats.offlineCount
    → color: "#ef4444" (error red)

  StatCard (Maintenance):
    → value: stats.maintenanceCount
    → color: "#f59e0b" (warning orange)
```

### 4.6 Data Export Logic

Export is a client-side operation that takes the current (filtered) dataset and converts it to CSV.

```
Export Flow:

1. User clicks "Export" button
2. ExportButton onClick override fires
3. Custom hook fetches ALL devices matching current filters
   (paginate through all nextTokens until exhausted)
4. Map results to CSV columns:
   Device Name, Serial Number, Model, Location, Status,
   Firmware Version, Last Update, Customer
5. Generate CSV blob and trigger browser download
6. Log audit event: action = "Exported", resourceType = "Device"
```

**Caution:** For large datasets (50K+ devices), streaming export via a Lambda function and S3 pre-signed URL is recommended over client-side generation.

### 4.7 Real-time Subscriptions (Optional Enhancement)

Amplify DataStore / GraphQL subscriptions can provide live device status updates.

```
Subscription Setup:

1. Subscribe to: onUpdateHLMStore
2. Filter: entityType = "Device"
3. On event:
   - Update the matching device row in the local cache
   - Update the stats bar counts
   - Flash the StatusBadge to indicate a recent change
```

This is optional for initial implementation. The base version uses pull-based data refresh.

---

## Access Patterns Covered

Summary of all access patterns this module exercises:

| AP#   | Pattern                        | Phase | How Triggered                           |
|-------|--------------------------------|-------|-----------------------------------------|
| AP-5  | Get device by ID               | 4     | Click device row → detail view          |
| AP-6  | List all devices (paginated)   | 2, 4  | Default table load                      |
| AP-7  | Get devices by customer        | 4     | Customer dropdown filter                |
| AP-8  | Get devices by status          | 4     | Status dropdown filter                  |
| AP-9  | Get devices by location        | 4     | Location dropdown filter                |
| AP-10 | Get devices by firmware        | 4     | Future: firmware version filter         |
| AP-11 | Search devices (name/serial)   | 4     | Search input with debounce              |

---

## Testing Checklist

### Data Layer Verification

- [ ] Create a Device via mutation → verify PK/SK/GSI keys are correctly formatted
- [ ] Query GSI1 with `GSI1PK = "DEVICE"` → returns only Device entities
- [ ] Query GSI1 with status prefix → returns only devices with that status
- [ ] Query GSI3 with location → returns devices at that location
- [ ] Query table with `PK = "CUST#<id>", SK begins_with "DEV#"` → returns customer's devices
- [ ] Update device status → verify GSI1SK is updated (key cascade)
- [ ] Update device status → verify CustDevice edge item is updated (denorm sync)
- [ ] Delete device → verify CustDevice edge item is also removed

### UI Component Verification

- [ ] DeviceTable renders with paginated data
- [ ] DeviceRow displays all fields correctly
- [ ] StatusBadge shows correct color for each status
- [ ] Search input filters results with debounce
- [ ] Status dropdown filter queries GSI1 with correct prefix
- [ ] Location dropdown filter queries GSI3
- [ ] Customer dropdown filter queries table partition
- [ ] Pagination forward/backward works correctly
- [ ] Page size selector changes result count
- [ ] Export button generates valid CSV
- [ ] Stats bar shows correct counts

### Auth Verification

- [ ] Admin can create, read, update, delete devices
- [ ] Manager can create, read, update devices (no delete)
- [ ] Technician can read all devices, update assigned devices
- [ ] Viewer can only read devices
- [ ] CustomerAdmin can only see devices belonging to their customer

### Performance Verification

- [ ] Initial page load < 2 seconds
- [ ] Search results return < 1 second
- [ ] Pagination transitions < 500ms
- [ ] Export completes within acceptable time for dataset size

---

*Upon completion of this module, update IMPLEMENTATION_MASTER_LOG.md:*
*1. Set Module 1 status to "Complete"*
*2. Add any new shared components to the Shared Component Registry*
*3. Log any infrastructure decisions made during implementation*
