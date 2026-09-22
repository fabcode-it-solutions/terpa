# Admin Dashboard in Terpa Web

This document provides an overview of the administrative dashboard functionalities within the Terpa Web application. The admin dashboard serves as a central control panel for managing various aspects of the system.

## 1. Overview

The admin dashboard (`app/admin/`) is a restricted section of the application designed for users with administrative privileges. It provides tools and interfaces to oversee and manage users, teams, machines, incidents, billing, and other core entities and processes of the Terpa Web platform.

## 2. Key Components and Files

- **Admin Root Page (`app/admin/page.tsx` and `app/admin/layout.tsx`)**:
  - `page.tsx`: The main landing page for the admin section, likely displaying a summary dashboard with key metrics, recent activities, or quick access to common administrative tasks.
  - `layout.tsx`: The primary layout for the entire admin section, providing consistent navigation (e.g., a sidebar menu) and structure.
- **Admin Feature Sections (Subdirectories under `app/admin/`)**:
  - `incidents/`: Interface for managing incidents (see [Incident Management](./incident_management.md)).
  - `invoices/`: Interface for managing invoices (see [Billing and Invoicing](./billing_and_invoicing.md)).
  - `machines/`: Interface for managing machines (see [Machine Management](./machine_management.md)).
  - `teams/`: Interface for managing teams (see [Team Management](./team_management.md)).
  - `terminals/`: This directory suggests management features specifically for "terminals," which could be a distinct aspect of machines or a separate entity.
  - `[...all]/`: A catch-all route, possibly for handling admin sub-routes not explicitly defined or for a custom admin panel framework.
- **Admin-Specific UI Components (`components/admin/`)**:
  - `admin-incidents-table.tsx`: Table for displaying incidents.
  - `admin-machines-table.tsx`: Table for displaying machines.
  - `invoices-table.tsx`: Table for displaying invoices.
  - Various filter components (`machine-filter.tsx`, `status-filter.tsx`, `team-filter.tsx`) to refine data displayed in tables.
  - Dialogs and forms for admin actions (e.g., `admin-incident-resolve-form.tsx`, `resolve-incidents-dialog.tsx`, `admin-expiration-date-dialog.tsx`).
- **Dashboard UI Components (`components/dashboard/`)**:
  - `dashboard-tabs.tsx`: Likely used to organize different views or sections within a dashboard page.
  - `reports-date-range-picker.tsx`: A common component for selecting date ranges for reports and data visualizations.
  - `sales-by-day.tsx`: A chart component (using `recharts`) to display sales trends, possibly on the main admin dashboard or machine-specific views.
- **Data Loaders (`loaders/dashboard.ts`, etc.)**:
  - Server-side functions to fetch data required for display on various admin dashboard pages and components.
- **Authorization**:
  - Access to the entire `/admin` path and its sub-routes is strictly controlled, typically based on user roles (e.g., an 'admin' role). This is enforced server-side (e.g., in layouts, middleware, or Server Actions).

## 3. Core Admin Dashboard Features

### 3.1. Centralized Management

- **Entity Management**: Provides interfaces to Create, Read, Update, and Delete (CRUD) core entities of the application:
  - Users (though not explicitly listed as a top-level admin dir, user management by admins is a standard feature).
  - Teams.
  - Machines.
  - Products (likely managed within an inventory section).
  - Routes.
  - Incidents.
  - Invoices.
- **Data Tables**: Extensive use of tables (`admin-machines-table.tsx`, `admin-incidents-table.tsx`, etc.) to display lists of records, with features like:
  - Pagination.
  - Sorting by columns.
  - Filtering using various criteria (`components/admin/*-filter.tsx`, `components/filters/date-filter-query.tsx`).
  - Searching (`components/search-box.tsx`).

### 3.2. Reporting and Analytics

- **Sales Data Visualization**: `sales-by-day.tsx` (using `recharts`) indicates the presence of graphical reports, at least for sales.
- **Date Range Selection**: `reports-date-range-picker.tsx` allows admins to customize the time period for displayed data and reports.
- **Export Capabilities**: Dialogs like `machine-sales-export-dialog.tsx` and `machine-terminal-export-dialog.tsx` suggest that admins can export data for offline analysis or record-keeping.

### 3.3. System Monitoring and Control

Administrators can monitor several key aspects of the system via the dashboard, including:

- Each machine's last connection date.
- The current amount of money reported in each machine.
- The number of products currently stocked in each vending machine.
- Basic telemetry data from the machines.

Details on direct system control functionalities from this dashboard section are not specified.

- **Machine Status**: Admins can likely monitor the status of all machines (online/offline, errors).
- **Incident Overview**: A dashboard view of open incidents, their priorities, and resolution progress.
- **Billing Overview**: Tracking overall revenue, outstanding invoices, and payment statuses.

### 3.4. User and Access Management

User and access management through the dashboard is based on a two-role system:

- **Administrators**: Have global access to all system functionalities and data.
- **Customers (Team Members)**: Have access restricted to the specific teams they are connected to and the data relevant to those teams.

- While not explicitly detailed in the provided file list for `app/admin/`, a comprehensive admin dashboard typically includes:
  - Managing user accounts (e.g., creating admin users, assigning roles, deactivating accounts).
  - Managing system-wide settings or configurations.

### 3.5. Specific Admin Actions

- **Resolving Incidents**: Using `resolve-incidents-dialog.tsx`.
- **Managing Invoice Statuses**: Using `invoice-status-select.tsx`.
- **Approving/Rejecting Payment Proofs**: As part of the billing workflow.
- **Setting Expiration Dates**: `admin-expiration-date-dialog.tsx` suggests a feature for managing expirations, though the context (e.g., for what entity) is not immediately clear from the filename alone.

The admin dashboard in Terpa Web is a powerful, multifaceted interface that provides administrators with the necessary tools to manage, monitor, and control the entire platform effectively.
