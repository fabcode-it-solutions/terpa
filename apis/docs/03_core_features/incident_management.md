# Incident Management in Terpa Web

This document outlines the incident management functionalities within the Terpa Web application. This system is designed for logging, tracking, and resolving operational issues or incidents.

## 1. Overview

Incident management is a critical process for maintaining operational stability and addressing problems as they arise. In Terpa Web, this likely involves a system for reporting issues (potentially related to machines or general operations), assigning them, tracking their status, and documenting their resolution.

## 2. Key Components and Files

- **Admin Incident Pages (`app/admin/incidents/`)**:
  - This directory likely hosts the main interface for administrators or support staff to view and manage incidents.
  - A `page.tsx` would display a list or dashboard of incidents.
- **Admin Incident UI Components (`components/admin/`)**:
  - `admin-incidents-table.tsx`: A table for displaying a list of incidents, likely with sorting, filtering, and searching capabilities.
  - `admin-incident-resolve-form.tsx`: A form used to input details when resolving an incident (e.g., resolution notes, actions taken).
  - `resolve-incidents-dialog.tsx`: A dialog component that likely embeds the `admin-incident-resolve-form.tsx` for a focused resolution workflow.
- **Server Actions (`actions/incident.ts`)**:
  - Contains server-side logic for incident resolution:
    - `machineIncidentResolveAction`: Resolves a single specified incident.
    - `machineIncidentResolveAllAction`: Resolves all currently unresolved incidents, optionally filtered by a specific machine.
- **Database Model (`Incident` in `prisma/schema.prisma`)**:
  - Stores core incident information:
    - Fields: `id`, `title`, `description`, `status` (e.g., "Open", "In Progress", "Resolved", "Closed"), `priority` (e.g., "High", "Medium", "Low"), `reportedById` (linking to `User`), `resolvedById` (linking to `User`), `machineId` (optional, if incident is machine-specific), `createdAt`, `updatedAt`, `resolvedAt`.
  - Relations: `User` (for reporter and resolver), `Machine` (if applicable).
- **Validation Schemas**:
  - While not explicitly named as `validation/incident.ts`, validation schemas for incident creation and resolution forms would likely exist, perhaps within `validation/common.ts` or a dedicated file if complexity warrants.

## 3. Core Incident Management Features

### 3.1. Incident Reporting (Creation)

- **Process**: Users (or automated systems) can report new incidents. The exact UI for reporting by non-admin users isn't explicitly clear from the file list but could be a general "Report Issue" form or integrated into machine detail views.
- **Information**: When an incident is reported, details such as a title, description, priority, and potentially an associated machine are captured.
- **Backend Logic**: A `createIncident` Server Action in `actions/incident.ts` would:
  - Validate the submitted data.
  - Create a new `Incident` record in the database with an initial status (e.g., "Open").
  - Potentially trigger notifications to relevant staff or teams.

### 3.2. Viewing and Tracking Incidents

- **Incident List (`admin-incidents-table.tsx`)**:
  - Administrators and support staff can view a comprehensive list of all incidents.
  - The table would display key information like incident ID, title, status, priority, reported date, and associated machine.
  - Filtering (e.g., by status, priority, machine) and sorting capabilities are essential for managing a large number of incidents.
- **Individual Incident View**:
  - Selecting an incident from the list would navigate to a detailed view, showing all its information, history, and comments (if supported).

### 3.3. Incident Assignment and Triage

Currently, incident assignment and triage processes are primarily managed through Sentry.

- **Process**: Once an incident is reported, it may need to be assigned to a specific user or team for investigation and resolution.
- **Functionality**: The system might allow updating an `assignedToId` field on the `Incident` model.

### 3.4. Incident Resolution

- **Process**: Authorized administrators can mark incidents as resolved.
- **UI**: The `resolve-incidents-dialog.tsx` (embedding `admin-incident-resolve-form.tsx`) likely provides the interface for resolving individual incidents. Bulk resolution might be triggered from a different UI element on the `admin-incidents-table.tsx`.
- **Backend Logic (`actions/incident.ts`)**:
  - **`machineIncidentResolveAction(payload: unknown)`**:
    - **Purpose**: Resolves a single incident.
    - **Authorization**: Requires the user to have an `ADMIN` role.
    - **Input**: A `payload` object, validated against `machineIncidentResolveSchema`, which must contain `incidentId`.
    - **Core Logic**:
      - Updates the specified `Incident` record in the database.
      - Sets `resolvedAt` to the current timestamp.
      - Sets `resolvedByUserId` to the ID of the admin user performing the action.
    - **Side Effects**: Revalidates the cache for the root path (`/`) to ensure UI updates.
    - **Return Value**: `{ success: true }` on successful resolution, or `{ error: "message" }` if unauthorized or if an error occurs.
  - **`machineIncidentResolveAllAction(machineId?: string)`**:
    - **Purpose**: Resolves all currently unresolved incidents. Can optionally be filtered to a specific machine.
    - **Authorization**: Requires the user to have an `ADMIN` role.
    - **Input**: An optional `machineId` (string). If provided, only incidents for that machine are resolved.
    - **Core Logic**:
      - Updates all `Incident` records where `resolvedAt` is `null`.
      - If `machineId` is provided, the update is further filtered to that specific machine.
      - Sets `resolvedAt` to the current timestamp for all matched incidents.
      - Sets `resolvedByUserId` to the ID of the admin user performing the action.
    - **Side Effects**: Revalidates the cache for the root path (`/`) to ensure UI updates.
    - **Return Value**: `{ success: true }` on successful resolution, or `{ error: "message" }` if unauthorized or if an error occurs.

### 3.5. Linking Incidents to Machines

- The `Incident` model likely has an optional `machineId` field, allowing incidents to be directly associated with a specific machine. This helps in tracking machine-specific issues and maintenance history.

Incident management in Terpa Web provides a structured way to handle operational issues, ensuring they are tracked, managed, and resolved efficiently, thereby minimizing disruption and improving service quality.
