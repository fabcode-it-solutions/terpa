# Billing and Invoicing in Terpa Web

This document covers the billing and invoicing functionalities within the Terpa Web application, including payment processing with MercadoPago and handling of payment proofs.

## 1. Overview

The billing and invoicing system in Terpa Web is responsible for managing financial transactions, generating invoices for services or usage, processing payments, and tracking payment statuses. This is a critical feature for monetizing the platform or for businesses using it to bill their own customers/teams.

## 2. Key Components and Files

- **Admin Invoicing Pages (`app/admin/invoices/`)**:
  - Likely hosts the main interface for administrators to manage all invoices in the system.
  - A `page.tsx` would display a list or dashboard of invoices.
- **Billing UI Components (`components/billing/`)**:
  - `billing-table.tsx`: A table for displaying a list of invoices or billing records, likely with sorting and filtering.
  - `invoice-cancel.tsx`: Component/dialog for cancelling an invoice.
  - `invoice-status-badge.tsx`: A UI element to visually represent the status of an invoice (e.g., Pending, Paid, Overdue, Cancelled).
  - `invoice-status-select.tsx` (in `components/admin/`): A select input for admins to change an invoice's status.
  - `payment-form.tsx`: A form for users/customers to make payments, potentially integrating with MercadoPago.
  - **Payment Proof Handling**:
    - `payment-proof-form.tsx`: Form for users to upload proof of payment (e.g., for bank transfers).
    - `payment-proof-download.tsx`: Component to allow admins to download uploaded payment proofs.
    - `payment-proof-approve.tsx`: Component/action for admins to approve a payment proof.
    - `payment-proof-reject.tsx`: Component/action for admins to reject a payment proof.
- **Server Actions (`actions/billing.ts`)**:

  - This file centralizes the backend logic for billing and invoicing operations. Each action typically involves data validation using Zod schemas (from `validation/billing.ts`), database interactions via Prisma, session management, and cache revalidation.

  - **`createInvoiceAction(data: unknown)`**:

    - **Purpose**: Generates a new invoice for a team, for specified machines and a number of months.
    - **Input Validation**: Uses `createInvoiceSchema` to validate `teamSlug`, `machineIds`, `months`, and `paymentMethod`.
    - **Core Logic**:
      - Fetches team details, machine details, and the latest USD to MXN exchange rate.
      - Calculates invoice items, including subtotal, VAT (16%), and total price in cents for each machine. The service start date for each machine considers its current `activeUntilDate`.
      - Creates an `Invoice` record in the database with associated `InvoiceItem` records.
      - If `paymentMethod` is `MERCADOPAGO`:
        - Calls `createInvoicePaymentUrl` (from `lib/mercadopago.ts`) to get a payment URL.
        - Updates the invoice with the `mercadoPagoPaymentUrl`.
        - If MercadoPago URL creation fails, the newly created invoice and its items are deleted to maintain data integrity.
    - **Side Effects**:
      - `revalidatePath(\`/team/\${teamSlug}/billing\`)`
      - `revalidatePath(\`/team/\${teamSlug}/billing/invoice/\${invoiceId}\`)`
    - **Returns**:
      - On success with MercadoPago: `{ success: true, invoiceId: string, redirectUrl: string }`
      - On success (other payment methods): `{ success: true, invoiceId: string }`
      - Throws an error if MercadoPago URL creation fails after initial invoice creation.

  - **`uploadPaymentProofAction(data: FormData)`**:

    - **Purpose**: Allows users to upload a payment proof file for an invoice.
    - **Input Validation**: Uses `paymentProofSchema` to validate the `file` (type, size) and `invoiceId` from `FormData`.
    - **Core Logic**:
      - Retrieves the invoice and checks if its status is `PAYMENT_PENDING`.
      - Converts the uploaded file to a buffer.
      - Generates a unique filename and uploads the file to an S3-compatible storage (DigitalOcean Spaces) using `S3Client`.
      - Updates the `Invoice` record with the `paymentProofUrl` and sets its status to `PAYMENT_VERIFICATION_PENDING`.
    - **Side Effects**: `revalidatePath(\`/team/[slug]/billing/invoice/\${invoiceId}\`)`
    - **Returns**: `{ success: true }`
    - Throws an error if the invoice is not pending payment.

  - **`rejectPaymentAction(data: unknown)`**:

    - **Purpose**: Allows an administrator to reject a submitted payment proof.
    - **Input Validation**: Uses `rejectPaymentSchema` to validate `invoiceId` and `teamSlug`.
    - **Core Logic**:
      - Requires an active admin session (`session.role === UserRole.ADMIN`).
      - Fetches the invoice and verifies its status is `PAYMENT_VERIFICATION_PENDING`.
      - Updates the `Invoice` status to `PAYMENT_VERIFICATION_REJECTED`, and records `rejectedByUserId` and `rejectedAt`.
    - **Side Effects**: `revalidatePath(\`/team/\${teamSlug}/billing/invoice/\${invoiceId}\`)`
    - **Returns**:
      - On success: `{ success: true }`
      - On failure (permissions, invalid state): `{ success: false, error: string }`

  - **`approvePaymentAction(data: unknown)`**:

    - **Purpose**: Allows an administrator to approve a submitted payment proof and mark an invoice as paid.
    - **Input Validation**: Uses `approvePaymentSchema` to validate `invoiceId`, `teamSlug`, and an optional `adjustedAmountCents`.
    - **Core Logic**:
      - Requires an active admin session (`session.role === UserRole.ADMIN`).
      - Fetches the invoice (including its items and associated machines) and verifies its status is `PAYMENT_VERIFICATION_PENDING`.
      - Performs a database transaction to:
        - Update the `Invoice` status to `PAYMENT_SUCCESS`.
        - Record `approvedAt`, `approvedByUserId`, `paidAt`.
        - Set `adjustedAmountCents` if provided.
        - Update the `activeUntilDate` for each machine linked to the invoice items, extending their service period.
    - **Side Effects**: `revalidatePath(\`/team/\${teamSlug}/billing/invoice/\${invoiceId}\`)`
    - **Returns**:
      - On success: `{ success: true }`
      - On failure (permissions, invalid state): `{ success: false, error: string }`

  - **`cancelInvoiceAction(data: unknown)`**:
    - **Purpose**: Allows an administrator to cancel an invoice.
    - **Input Validation**: Uses `cancelInvoiceSchema` to validate `invoiceId` and `teamSlug`.
    - **Core Logic**:
      - Requires an active admin session (`session.role === UserRole.ADMIN`).
      - Fetches the invoice and verifies its status is `PAYMENT_PENDING`.
      - Updates the `Invoice` status to `CANCELLED`, and records `cancelledAt` and `cancelledByUserId`.
    - **Side Effects**: `revalidatePath(\`/team/\${teamSlug}/billing/invoice/\${invoiceId}\`)`
    - **Returns**:
      - On success: `{ success: true }`
      - On failure (permissions, invalid state): `{ success: false, error: string }`

- **Validation Schemas (`validation/billing.ts`)**:
  - Zod schemas for validating data related to billing, such as invoice creation data or payment proof submission.
- **MercadoPago Integration (`lib/mercadopago.ts`)**:
  - Contains the setup and utility functions for interacting with the MercadoPago SDK/API for processing payments.
- **Database Models (`Invoice`, `PaymentProof`, `User`, `Team` in `prisma/schema.prisma`)**:
  - `Invoice`: Stores details of each invoice (ID, user/team ID, amount, due date, status, items, MercadoPago payment ID).
  - `PaymentProof`: Stores information about uploaded payment proofs (ID, invoice ID, file URL (S3), status, uploadedAt, reviewedAt).
  - `User`/`Team`: Invoices are associated with a user or a team.
- **AWS S3 Integration (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)**:
  - Used for securely uploading and storing payment proof files. Presigned URLs are likely generated for uploads.
- **Webhooks (`app/api/webhooks/`)**:
  - May include a webhook endpoint for MercadoPago to send payment status updates asynchronously (e.g., `app/api/webhooks/mercadopago/route.ts`).

## 3. Core Billing and Invoicing Features

### 3.1. Invoice Generation

- **Process**: Invoices can be generated manually by administrators or automatically based on subscriptions, usage, or predefined billing cycles.
- **Details**: An invoice would include line items, total amount, due date, and the recipient (user or team).
- **Backend Logic**: A `createInvoice` Server Action in `actions/billing.ts` would handle the creation of `Invoice` records in the database.

### 3.2. Viewing and Managing Invoices

- **Invoice List (`billing-table.tsx`, `app/admin/invoices/`)**:
  - Users (for their own invoices) and administrators (for all invoices) can view a list of invoices.
  - The list would display key details like invoice number, amount, due date, status (`invoice-status-badge.tsx`), and recipient.
  - Filtering by status, date range, or customer is likely supported.
- **Individual Invoice View**:
  - Detailed view of a single invoice, showing all line items, payment history, and associated payment proofs.
- **Status Updates**: Administrators can manually update invoice statuses using `invoice-status-select.tsx`.

### 3.3. Invoice Breakdown View

- **Purpose**: To provide administrators with a detailed, at-a-glance overview of the billing status for all teams and their machines for a specific month.
- **Location**: `app/admin/invoices`
- **Functionality**:
  - **Date Filtering**: Admins can select a year and month to view the breakdown for that period. The year selector is a combobox that allows for easy searching.
  - **Team Accordion**: The view displays a list of teams in a collapsible accordion. Each accordion header shows the team's name and a summary of their machines' invoice statuses for the selected month (e.g., Total, Paid, Pending Payment, In Review).
  - **Machine Table**: Inside each team's accordion section, a table lists all of their machines that were active during the selected period.
  - **Status and Details**: For each machine, the table displays the invoice status, the period covered by the invoice, and a direct link to view the payment details.
  - **Controls**: The view includes "Expand All" and "Collapse All" buttons for easy navigation of the accordion.

### 3.4. Payment Processing

- **Online Payments (`payment-form.tsx`, `lib/mercadopago.ts`)**:
  - Users can pay invoices online. The `payment-form.tsx` likely integrates with MercadoPago.
  - When a payment is initiated, Terpa Web communicates with MercadoPago to create a payment preference/checkout.
  - Users are redirected to MercadoPago to complete the payment.
  - MercadoPago then notifies Terpa Web about the payment status, either via a redirect URL or a webhook.
- **Webhook Handling**: A webhook endpoint (e.g., `/api/webhooks/mercadopago`) processes asynchronous notifications from MercadoPago (e.g., payment success, failure) and updates the invoice status accordingly in the database.

### 3.5. Payment Proof Handling (for Manual Payments)

- **Uploading Proof (`payment-proof-form.tsx`)**:
  - For payment methods like bank transfers, users can upload a payment proof (e.g., a screenshot or PDF of the transaction receipt).
  - Files are securely uploaded to AWS S3, likely using presigned URLs generated by a Server Action. The file URL is stored in the `PaymentProof` model.
- **Admin Review**:
  - Administrators can view uploaded payment proofs (`payment-proof-download.tsx`).
  - They can then approve (`payment-proof-approve.tsx`) or reject (`payment-proof-reject.tsx`) the proof.
  - Approving a proof updates the corresponding invoice status to "Paid".

### 3.6. Invoice Cancellation

- **Process**: Administrators can cancel invoices if necessary (e.g., issued in error) using `invoice-cancel.tsx`.
- **Backend Logic**: A Server Action updates the invoice status to "Cancelled" and may reverse any associated accounting entries.

### 3.7. Notifications

The system plans to send payment reminders to teams with active machines nearing their service expiry date.

- The system likely sends email notifications (via `service/mailer.ts` and possibly BullMQ for asynchronous sending) for:
  - New invoices.
  - Payment reminders for overdue invoices.
  - Payment confirmations.
  - Payment proof status updates.

The billing and invoicing module in Terpa Web provides a comprehensive system for managing financial aspects, from generating invoices to processing various types of payments and tracking their lifecycle.
