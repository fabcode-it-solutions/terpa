# External Service Integrations in Terpa Web

This document outlines the key external services that Terpa Web integrates with, detailing their purpose and how they are utilized within the application.

## 1. Overview

Terpa Web leverages several third-party services to enhance its functionality, offload specific tasks, or provide specialized capabilities. These integrations are crucial for features like payment processing, file storage, and error monitoring.

## 2. Key External Integrations

### 2.1. AWS S3 (Amazon Simple Storage Service)

- **Purpose**: Secure and scalable cloud storage for files.
- **Dependencies**:
  - `@aws-sdk/client-s3`: The AWS SDK v3 client for interacting with S3.
  - `@aws-sdk/s3-request-presigner`: Used to generate presigned URLs for S3 objects.
- **Usage in Terpa Web**:
  - **Payment Proofs**: Likely used for storing payment proof files uploaded by users (see `components/billing/payment-proof-form.tsx`).
  - **File Uploads**: Server Actions or API Routes would handle file upload requests. For uploads directly from the client to S3, presigned URLs are generated server-side to grant temporary, secure access for the client to upload a file to a specific S3 bucket and key.
  - **File Downloads**: Similarly, presigned URLs can be generated for secure, time-limited downloads of stored files (e.g., `components/billing/payment-proof-download.tsx`).
- **Configuration**: AWS credentials (access key ID, secret access key) and S3 bucket details (name, region) are configured via environment variables.

### 2.2. MercadoPago

- **Purpose**: A popular payment gateway in Latin America, used for processing online payments.
- **Dependency**: `mercadopago` (official MercadoPago SDK for Node.js).
- **Library File**: `lib/mercadopago.ts` likely encapsulates the initialization of the MercadoPago SDK and provides helper functions for creating payment preferences, handling payment notifications, and other payment-related operations.
- **Usage in Terpa Web**:
  - **Online Payments**: Integrated with `components/billing/payment-form.tsx` to allow users to pay invoices.
  - **Payment Flow**:
    1.  Terpa Web (server-side, via `actions/billing.ts` or an API route) creates a payment preference with MercadoPago, detailing the transaction (items, amount, callback URLs).
    2.  The user is redirected to MercadoPago's checkout page to complete the payment.
    3.  MercadoPago notifies Terpa Web of the payment status via:
        - Redirecting the user back to a success/failure URL in Terpa Web.
        - Sending an asynchronous webhook notification to an endpoint like `app/api/webhooks/mercadopago/route.ts`.
  - **Webhook Handling**: The webhook handler updates the invoice status in the database based on the payment outcome.
- **Configuration**: MercadoPago API keys (access token, public key) are configured via environment variables.

### 2.3. Sentry

- **Purpose**: Real-time error tracking and application monitoring.
- **Dependency**: `@sentry/nextjs`.
- **Configuration Files**: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`.
- **Usage in Terpa Web**:
  - Captures unhandled JavaScript errors, promise rejections, and React component errors from both client-side and server-side (including Server Actions and API Routes).
  - Provides detailed error reports with stack traces, context, and breadcrumbs to help developers diagnose and fix issues quickly.
  - Can also be used for performance monitoring (tracing).
- **Configuration**: Sentry DSN (Data Source Name) and other settings are configured via environment variables and the Sentry configuration files.
  (See [Error Handling and Monitoring](./error_handling_and_monitoring.md) for more details).

### 2.4. Pharos Payments (`service/pharos.ts`)

- **Purpose**: Integration with the Pharos Payments service (`https://backoffice.pharospayments.com/api`) to retrieve transaction data. This is likely used to reconcile or display card transactions processed by payment terminals.
- **Service File**: `service/pharos.ts` encapsulates the logic for interacting with the Pharos API.
- **Key Functionality**:
  - `getTransactions(params)`: Fetches transactions based on `merchantCode`, `terminalCode`, and a specific `dateUtc`.
    - It handles date formatting to "America/Monterrey" timezone as required by the Pharos API.
    - Makes a GET request to `${PHAROS_API_URL}/v2/transactions/by_filters`.
    - Authenticates using a token stored in the `PHAROS_TOKEN` environment variable.
    - Parses the response using a Zod schema (`getTransactionsSchema`) to validate the structure of the transaction data.
- **Usage in Terpa Web**:
  - Likely used by backend processes (Server Actions or API routes, possibly `app/api/v1/machines/[machineId]/terminal/route.ts`) to fetch detailed transaction reports for specific terminals/machines.
  - This data can be used for financial reconciliation, reporting within the admin dashboard, or providing detailed transaction histories to users/teams.
- **Configuration**: Requires `PHAROS_TOKEN` and potentially `PHAROS_API_URL` (though the URL is hardcoded in the service file) to be set in environment variables.

### 2.5. WhatsApp (`lib/whatsapp.ts`)

- **Purpose**: Integration with WhatsApp, likely for sending notifications or messages to users.
- **Dependency**: The specific WhatsApp API client or library used is not directly visible from `package.json` (it might be a generic HTTP client making calls to a WhatsApp Business API endpoint, or a specific library not listed).
- **Usage in Terpa Web**:
  - **Notifications**: Sending alerts for important events (e.g., new invoice, overdue payment, incident updates, 2FA codes if SMS/WhatsApp is an option).
  - **Communication**: Potentially for direct communication features if the application supports it.
- **Implementation**: `lib/whatsapp.ts` would contain the logic for formatting messages and interacting with the WhatsApp API. This would typically involve API keys, endpoint URLs, and message templating.
- **Configuration**: WhatsApp Business API credentials or service provider details would be configured via environment variables.

### 2.6. SendGrid Email Service (`service/mailer.ts`)

- **Purpose**: Transactional email delivery service for automated system notifications and communications.
- **Dependencies**: Built-in `fetch` API for direct integration with SendGrid REST API v3.
- **Service File**: `service/mailer.ts` encapsulates all email sending functionality and logging.
- **Email Types and Functions**:
  - **Password Reset** (`sendPasswordResetEmail`): Sends password reset links to users.
  - **Team Welcome** (`sendTeamWelcomeEmail`): Sends onboarding emails with temporary passwords for new team members.
  - **Payment Reminders** (`sendPaymentReminderEmail`): Automated reminders for teams with machines expiring next month.
  - **Document Notifications** (`sendEmailWithAttachments`): Internal notifications with file attachments for document updates.
- **Email Status Tracking**:
  - **Database Model**: All email attempts are logged in the `EmailLog` model with comprehensive metadata.
  - **Status Types**:
    - `SUCCESS`: SendGrid accepted the email for delivery (HTTP 2xx response).
    - `FAILED`: SendGrid rejected the email due to authentication errors, API issues, or network failures.
  - **Error Handling**: All email functions use try-catch blocks to ensure failed attempts are logged even when SendGrid API calls throw exceptions.
  - **Logged Information**: Email type, recipient, subject, body content, associated team/user IDs, timestamp, and delivery status.
- **Integration with Background Jobs**:
  - **Scheduled Reminders**: Payment reminder emails are triggered by BullMQ workers on the 15th of each month and the last weekday of each month at 6:00 AM Mexico City time.
  - **Manual Triggering**: Payment reminders can be manually triggered via the `/api/cron/payment-reminders` endpoint.
- **Configuration**:
  - `SENDGRID_API_KEY`: Required environment variable for authenticating with SendGrid API.
  - **From Address**: All emails are sent from `noreply@terpasolutions.com` with "TERPA Solutions" as the display name.
- **Usage in Terpa Web**:
  - **Authentication Flow**: Password reset emails during user account recovery.
  - **Team Management**: Welcome emails for new team members with temporary credentials.
  - **Billing System**: Automated payment reminders for teams with expiring machine subscriptions.
  - **Document Processing**: Internal notifications when teams upload required documentation.
- **Monitoring and Debugging**:
  - **Console Logging**: All email operations log success/failure messages with recipient details.
  - **Database Queries**: Email logs can be queried for delivery statistics, debugging failed sends, and compliance auditing.
  - **Error Tracking**: Failed email attempts include error details in console logs for troubleshooting SendGrid integration issues.

These external integrations play a vital role in extending the capabilities of Terpa Web, handling specialized tasks like payments and file storage, and improving operational aspects like error monitoring.
