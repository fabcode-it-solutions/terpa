# Project Overview: Terpa Web

## 1. Introduction

**Terpa Web** (name derived from `package.json`: `terpa-web`) is a comprehensive web application. Based on its dependencies and file structure, it appears to be a platform managing various operational aspects such as user accounts, teams, machines, inventory, incidents, billing, and potentially more. It includes an administrative interface and user-facing features.

The primary goal of this documentation is to provide a clear and thorough understanding of the Terpa Web application, catering to developers, new team members, and other stakeholders.

## 2. Purpose and Goals

The primary purpose of this application is to provide vending machine managers with real-time observability of their machines, including their inventory levels and sales records.

The application seems designed to serve as a centralized system for:

- Managing user identities, authentication (including 2FA), and authorization.
- Facilitating team creation, management, and collaboration.
- Tracking, monitoring, and managing a fleet of machines, potentially including their location, status, sales data, and settings.
- Handling inventory for products, including stock levels, picklists, and replenishment operations.
- Logging, tracking, and managing operational incidents through to resolution.
- Managing billing cycles, generating invoices, and processing payments, with integration for MercadoPago and handling of payment proofs.
- Providing dashboards and reporting capabilities for data visualization and operational insights.
- Offering robust API endpoints for various functionalities, potentially for internal or external integrations.

## 3. Core Technology Stack

The project is built using a modern and robust technology stack:

- **Frontend Framework:** Next.js (v14) with React (v18)
- **Primary Language:** TypeScript
- **Styling:** Tailwind CSS, with `clsx` and `tailwind-merge` for utility class management.
- **UI Components:**
  - Radix UI: A suite of unstyled, accessible primitive components.
  - Shadcn/UI: Likely used for building upon Radix UI, indicated by `components.json` and the structure of `components/ui/`.
- **State Management:**
  - React Context API for global state.
  - React Hook Form (v7) for form management and validation.
- **Routing:** The project uses the Next.js App Router, as confirmed by the `app/` directory structure and direct confirmation.
- **Database ORM:** Prisma (v5). The specific database (e.g., PostgreSQL, MySQL) is not explicitly defined in `package.json` but is configured within Prisma.
- **API Layer:**
  - Next.js API Routes (within `app/api/`).
  - Next.js Server Actions (within `actions/`).
- **Authentication:**
  - Custom implementation likely using JSON Web Tokens (JWT) via `jsonwebtoken`.
  - Password hashing with `bcryptjs`.
  - Two-Factor Authentication (2FA) using Time-based One-Time Passwords (TOTP) via `totp-generator`.
  - QR code display for 2FA setup using `qrcode.react`.
- **Background Jobs/Queueing:** BullMQ, utilizing Redis (via `ioredis`) as a message broker/store.
- **File Storage:** AWS S3 (via `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`), likely for payment proofs or other user-uploaded content.
- **Payment Gateway Integration:** MercadoPago (via `mercadopago` SDK).
- **Error Monitoring & Reporting:** Sentry (via `@sentry/nextjs`).
- **Utility Libraries:**
  - `date-fns` & `date-fns-tz`: For date and time manipulation.
  - `zod`: For data validation schema definition.
  - `nanoid`: For generating unique IDs.
  - `slug`: For generating URL-friendly slugs.
  - `p-map`: For concurrent promise mapping.
- **Development Tools:**
  - ESLint: For code linting.
  - `tsx`: For executing TypeScript files directly (e.g., Prisma seed script).
- **Node.js Version:** 22 (specified in `engines`).
- **Package Manager:** npm (v10) (specified in `engines`).

## 4. Key High-Level Features

The application includes the following key high-level features:

- User registration (sign up), team creation, and document uploading capabilities.
- Functionality for creating new machine records and defining their internal spiral configurations.
- Tools for assigning specific products to machine spirals and setting their respective costs.
- Detection of sale events via an API, utilizing machine data to identify the product sold, time of sale, and other relevant details.
- Generation of sales reports and dashboards, highlighting popular sales dates/times and products.

Based on the file structure (`app/`, `actions/`, `components/`) and dependencies, the application includes functionalities for:

- **User Management:**
  - Sign-up, Sign-in, Sign-out.
  - Password Reset.
  - Two-Factor Authentication (2FA) setup and management.
  - User Profiles.
- **Team Management:**
  - Team creation and administration.
  - (Potentially) Member invitation and role management.
- **Machine Management:**
  - CRUD operations for machines.
  - Location tracking.
  - Status monitoring (presence indicators).
  - Configuration settings.
  - Sales data recording and export.
  - Remote sales capabilities.
  - Reconciliation processes.
- **Inventory & Product Management:**
  - Product definition and CRUD.
  - Inventory tracking (spirals, picklists).
  - Stock filling, emptying, and adjustment operations.
- **Route Management:**
  - Route creation and assignment of machines to routes.
- **Incident Management:**
  - Logging and tracking of operational incidents.
  - Incident resolution workflows.
- **Billing & Invoicing:**
  - Invoice generation and status tracking.
  - Integration with MercadoPago for payments.
  - Payment proof upload, approval, and rejection.
- **Administrative Dashboard:**
  - Centralized interface for managing all aspects of the system.
  - Data tables with filtering and sorting (e.g., incidents, machines, invoices).
- **Reporting & Analytics:**
  - Data visualization (e.g., sales by day using `recharts`).
  - Date range pickers for reports.
- **API Endpoints:**
  - Exposed APIs for various services (e.g., `/api/dex/`, `/api/terminal/`, `/api/v1/`).
  - Webhook handling (`/api/webhooks/`).

This overview provides a foundational understanding of Terpa Web. Subsequent documents in this section and others will delve into more specific aspects of its architecture and functionality.
