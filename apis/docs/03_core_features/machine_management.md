# Machine Management in Terpa Web

This document details the machine management functionalities within the Terpa Web application. Machines appear to be a central entity in the system, likely representing physical or virtual assets that are tracked and managed.

## 1. Overview

Machine management involves all aspects of handling machines, from their creation and configuration to monitoring their status, tracking sales, and managing associated data. This feature is likely critical for businesses using Terpa Web to oversee a fleet of operational devices.

## 2. Key Components and Files

- **Admin Machine Pages (`app/admin/machines/`)**:
  - Likely contains a main page for listing all machines (`page.tsx`).
  - May include sub-pages or dialogs for creating, viewing, and editing individual machines.
- **Machine-Specific UI Components (`components/machine/`)**:
  - `machine-create-form.tsx`: Form for registering new machines.
  - `machine-admin-form.tsx`: Form for editing machine details by an admin.
  - `machine-location-form.tsx`: Form specifically for updating machine location.
  - `machine-settings-form.tsx`: Form for configuring machine-specific settings.
  - `machine-delete-dialog.tsx`: Confirmation dialog for deleting a machine.
  - `machine-dropdown.tsx`: Context menu or dropdown for machine actions.
  - `machine-information-dropdown.tsx`: Dropdown to display key machine info.
  - `machine-presence-indicator.tsx` & `machine-presence-label.tsx`: UI elements to show machine online/offline status.
  - `machine-reconciliation-dialog.tsx`: UI for machine reconciliation processes.
  - `machine-remote-sale-dialog.tsx`: UI for initiating remote sales.
  - `machine-sale-cost-indicator.tsx`: Displays cost related to sales.
  - `machine-sales-by-day.tsx`: Component to visualize daily sales for a machine (likely using `recharts`).
  - `machine-sales-export-dialog.tsx`: UI for exporting sales data (CSV).
  - `machine-sales-table.tsx`: Table to display sales records for a machine.
  - `machine-tabs.tsx`: Tabbed interface for organizing machine details/actions.
  - `machine-terminal-export-dialog.tsx`: UI for exporting terminal-related data (Pharos transactions) from a machine.
- **Admin Table Components (`components/admin/`)**:
  - `admin-machines-table.tsx`: The main table used in the admin section to list and manage machines.
  - `machine-filter.tsx`, `machines-filter-provider.tsx`, `status-filter.tsx`, `team-filter.tsx`: Components for filtering the list of machines.
- **Server Actions (`actions/machine.ts`)**: This file is central to machine management and contains the following key actions:
  - `machineCreateAction`: Handles new machine creation, setting initial `activeUntilDate` and default protocol.
  - `machineSettingsAction`: Updates machine name, protocol, and (for admins) `terminalSerialNumber`.
  - `machineLocationAction`: Updates machine latitude and longitude.
  - `machineRemoteSaleToggleAction`: Enables/disables remote sale functionality for a short duration.
  - `machineReconcileAction`: Performs machine reconciliation based on DEX reports and previous reconciliations.
  - `machineDeleteAction`: Soft-deletes a machine and its spirals (admin only).
  - `machineSalesExportAction`: Exports machine sales data to CSV for a given date range.
  - `machineAssignAction`: Assigns a user to a machine (owner/admin only).
  - `machineUnassignAction`: Unassigns a user from a machine (owner/admin only).
  - `machineAdminAction`: Allows admins to update `activeUntilDate` and `isEnabled` status.
  - `machineAdminExpirationDateAction`: Allows admins to specifically update `activeUntilDate`.
  - `machineDexExportAction`: Exports raw DEX report data to CSV for a given date range (max 7 days).
  - `machineTerminalExportAction`: Exports terminal transaction data (from Pharos) to CSV for a given date range.
    All actions typically involve session validation, Zod schema validation for payloads, database operations via Prisma, and cache revalidation (`revalidatePath`).
- **Validation Schemas (`validation/machine.ts`)**:
  - Contains Zod schemas like `machineCreateSchema`, `machineSettingsSchema`, `machineLocationSchema`, `machineRemoteSaleToggleSchema`, `machineReconcileSchema`, `machineDeleteSchema`, `machineSalesExportSchema`, `machineAssignSchema`, `machineUnassignSchema`, `machineAdminSchema`, `machineAdminExpirationDateSchema`, and `machineTerminalExportSchema` used by the corresponding Server Actions.
- **Data Loaders (`loaders/machine.ts`)**:
  - Functions for fetching machine data, used by Server Components.
- **Database Model (`Machine` in `prisma/schema.prisma`)**:
  - Stores all persistent data for machines, including `id`, `name`, `serialNumber`, `location`, `status`, `ipAddress`, `settings` (JSON), `teamId`, etc.
  - Relations to `Team`, `Product` (via inventory), `Sale`, `Incident`.

## 3. Core Machine Management Features

### 3.1. Machine CRUD Operations

- **Creation**: New machines are registered using `machine-create-form.tsx`. This is processed by the `machineCreateAction` Server Action, which validates input against `machineCreateSchema`. It sets a default `activeUntilDate` to the first day of the next month and `protocol` to `MDB`. A machine cannot be created if its `terminalSerialNumber` already exists.
- **Viewing**:
  - A list of machines is displayed in `admin-machines-table.tsx` within `app/admin/machines/`.
  - Detailed views of individual machines are likely available, possibly using `machine-tabs.tsx` to organize information. Data is fetched using loaders from `loaders/machine.ts`.
- **Updating**:
  - **General Settings**: `machine-settings-form.tsx` submits to `machineSettingsAction` (validates with `machineSettingsSchema`) to update name, protocol. Admins can also update `terminalSerialNumber`.
  - **Location**: `machine-location-form.tsx` submits to `machineLocationAction` (validates with `machineLocationSchema`) to update latitude and longitude.
  - **Admin-Specific**: `machine-admin-form.tsx` likely submits to `machineAdminAction` (validates with `machineAdminSchema`) allowing admins to set `activeUntilDate` and `isEnabled`. The `machineAdminExpirationDateAction` specifically handles `activeUntilDate` updates.
- **Deletion**: Machines can be soft-deleted by admins using `machine-delete-dialog.tsx`, which triggers `machineDeleteAction` (validates with `machineDeleteSchema`). This action sets `deletedAt` on the machine and its associated spirals, and nullifies `terminalSerialNumber` and `machineCode` on spirals.

### 3.2. Status and Presence Monitoring

- `machine-presence-indicator.tsx` and `machine-presence-label.tsx` display machine status.
- The `lastPingAt` field on the `Machine` model is updated by various API endpoints (`/api/dex/report`, `/api/terminal/{serial}/ping`, `/api/terminal/{serial}/sale`), indicating recent communication.
- The `isEnabled` field, managed by `machineAdminAction`, also contributes to the operational status.

### 3.3. Sales Tracking and Reporting

- **Sales Data**: The system records sales associated with each machine, primarily via DEX reports (`/api/dex/report` and `handleDexDiff` logic) and MDB sales (`/api/terminal/{serial}/sale`).
- **Visualization**: `machine-sales-by-day.tsx` provides daily sales charts.
- **Tabular Data**: `machine-sales-table.tsx` lists sales transactions.
- **Export**:
  - `machine-sales-export-dialog.tsx` triggers `machineSalesExportAction` (validates with `machineSalesExportSchema`) to generate a CSV of sales data for a specified date range.
- **Remote Sales**:
  - `machine-remote-sale-dialog.tsx` likely interacts with `machineRemoteSaleToggleAction` (validates with `machineRemoteSaleToggleSchema`).
  - This action toggles `remoteSaleEnabledUntil` for 45 seconds, allowing a terminal to check if a remote sale is permitted via the `/api/terminal/{serial}/remote-sale` endpoint.

### 3.4. Configuration and Settings

- `machine-settings-form.tsx` allows users to configure machine name and protocol, handled by `machineSettingsAction`.
- Admins have extended capabilities via `machineAdminAction` to control `activeUntilDate` and `isEnabled`.
- The `Machine` model in `prisma/schema.prisma` defines fields like `protocol`, `terminalSerialNumber`, `lat`, `lon`, `activeUntilDate`, `isEnabled`, `versionCode`, `pharosTerminalCode`, etc.

### 3.5. Machine Operations

- **Reconciliation (`machine-reconciliation-dialog.tsx`)**:
  - This UI triggers the `machineReconcileAction` (validates with `machineReconcileSchema`).
  - The action uses the latest DEX report (`getParsedReportById`) and the previous `MachineReconciliation` to calculate differences and create new reconciliation records. It handles cases for initial reconciliation and resets if negative values occur.
- **Data Exports**:
  - **DEX Reports**: `machineDexExportAction` allows exporting raw DEX report data to CSV for a machine within a 7-day range.
  - **Terminal Transactions**: `machine-terminal-export-dialog.tsx` triggers `machineTerminalExportAction` (validates with `machineTerminalExportSchema`) to export Pharos payment terminal transactions to CSV for a date range.

### 3.6. Filtering and Searching

- The admin machine list (`admin-machines-table.tsx`) is equipped with filters:
  - `machine-filter.tsx` (general machine attributes).
  - `status-filter.tsx` (filter by operational status).
  - `team-filter.tsx` (filter by associated team).
  - A `search-box.tsx` (from `components/`) is likely used for text-based searching.

### 3.7. Association with Other Entities

- **Teams**: Machines are created under a specific `Team` (`teamId` field in `Machine` model).
- **Users (Assignment)**:
  - `machineAssignAction` (validates with `machineAssignSchema`) allows team owners or admins to assign a user to a machine, creating a `UserMachine` record.
  - `machineUnassignAction` (validates with `machineUnassignSchema`) allows team owners or admins to remove this assignment.
- **Inventory/Products**: Machines manage and dispense products, linking them to `MachineSpiral` records which in turn link to `Product` records. DEX reports and MDB sales update inventory implicitly.
- **Routes**: Machines can be part of service or collection routes (via `RouteMachine` join table, managed by `actions/route.ts`).
- **Incidents**: Incidents can be reported against specific machines (via `/api/terminal/{serial}/incident` API or `actions/incident.ts`).

Machine management is a comprehensive module in Terpa Web, providing tools for detailed tracking, operation, and analysis of a fleet of machines, primarily orchestrated through Server Actions in `actions/machine.ts`.
