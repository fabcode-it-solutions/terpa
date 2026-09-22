# API Endpoints in Terpa Web

This document provides an overview of the API endpoints available in the Terpa Web application, primarily located within the `app/api/` directory. These endpoints are built using Next.js API Routes.

## 1. Overview

While Terpa Web heavily utilizes Next.js Server Actions for many server-side operations (especially data mutations and form handling), traditional API endpoints are also present. These are used for:

- Client-side data fetching where Server Components or Server Actions are not suitable.
- Interactions with external services or third-party applications.
- Handling webhooks from external services like MercadoPago.
- Providing a more conventional REST-like interface for certain functionalities.

API Routes in Next.js (App Router) are defined by creating a `route.ts` (or `route.js`) file within a directory structure under `app/api/`. For example, `app/api/health/route.ts` maps to the `/api/health` endpoint.

## 2. Key API Endpoint Groups

The `app/api/` directory contains several subdirectories, housing `route.ts` files that define the actual API endpoints.

### 2.1. `app/api/dex/`

- **Purpose**: Handles DEX (Data Exchange) protocol interactions, specifically for processing reports submitted by machines/terminals.
- **Actual Endpoints**:
  - **`POST /api/dex/report`** (defined in `app/api/dex/report/route.ts`):
    - **Functionality**: Receives and processes DEX reports from machines.
    - **Request Body**: Expects a JSON payload conforming to a Zod schema, including:
      - `serial` (string, terminal serial number)
      - `merchantCode` (string)
      - `terminalCode` (string)
      - `reportId` (string, UUID for the current report)
      - `data` (optional object):
        - `tubes`: `total` (number), `recyclerCount` (number)
        - `machine`: `serial` (string), `model` (string), `version` (string)
    - **Processing Steps**:
      1.  Validates the incoming payload.
      2.  Finds the `Machine` based on `parsed.data.serial` (maps to `terminalSerialNumber`). Returns 404 if not found.
      3.  Updates the `Machine` record with:
          - `tubesTotal` (sum of `data.tubes.total` and `data.tubes.recyclerCount`).
          - `machineModel`, `machineSerial`, `machineVersion` from `parsed.data.data.machine`.
          - `pharosTerminalCode` from `parsed.data.terminalCode`.
          - `lastPingAt` to the current timestamp.
      4.  Updates the associated `Team` record with `pharosMerchantCode` from `parsed.data.merchantCode`.
      5.  Retrieves the most recent `DexReport` for the machine.
      6.  If a previous report exists:
          - Calls `compareReports(previousReportId, newReportId)` (from `service/dex.ts`) to get the differences.
          - Calls `handleDexDiff({ protocol, machineId, nextReportId, diff })` (from `lib/api/dex.ts`) to process these differences (e.g., create `Sale` records, update inventory).
      7.  If no previous report exists, it creates a new `DexReport` record with the `newReportId` for future comparison.
    - **Responses**:
      - `200 OK`: Report processed successfully.
      - `204 No Content`: Indicates an issue during the report comparison or diff handling phase, though initial machine/team updates might have succeeded.
      - `400 Invalid Payload`: If the request body does not match the expected schema.
      - `404 Machine not found`: If no machine matches the provided serial number.
    - **Key Libraries/Services Used**:
      - `lib/prisma.ts`: For database interactions.
      - `service/dex.ts` (`compareReports`): For comparing DEX reports.
      - `lib/api/dex.ts` (`handleDexDiff`): For processing the results of the comparison.
      - `zod`: For request payload validation.

### 2.2. `app/api/team/`

- **Purpose**: Provides API endpoints related to team document management.
- **Actual Endpoints**:
  - **`GET /api/team/{slug}/document/{documentId}/download`** (defined in `app/api/team/[slug]/document/[documentId]/download/route.ts`):
    - **Functionality**: Generates a secure, time-limited presigned URL for downloading a specific team document.
    - **Path Parameters**:
      - `{slug}`: The slug of the team.
      - `{documentId}`: The ID of the document to download.
    - **Authentication**: Requires an active user session.
    - **Authorization**: Restricted to users with the `ADMIN` role. Non-admin users will receive a `401 Unauthorized` response.
    - **Processing Steps**:
      1.  Verifies the user session and role.
      2.  Fetches the `TeamDocument` from the database, ensuring it belongs to the specified team slug and is not soft-deleted. Returns `404 Not Found` if the document doesn't exist or doesn't meet criteria.
      3.  Uses an S3 client (configured for DigitalOcean Spaces via environment variables like `SPACES_REGION`, `SPACES_KEY`, `SPACES_SECRET`, `SPACES_BUCKET`) to generate a presigned URL for the object key stored in `document.fileUrl`.
      4.  The presigned URL is set to expire in 5 minutes (300 seconds).
    - **Response**:
      - `200 OK`: Returns a JSON object:
        ```json
        {
          "url": "PRE_SIGNED_S3_URL_HERE",
          "fileName": "ORIGINAL_DOCUMENT_FILENAME_HERE"
        }
        ```
        The client application is expected to use this `url` to initiate the actual file download from the S3-compatible storage.
      - `401 Unauthorized`: If the user is not an admin.
      - `404 Not Found`: If the document is not found.
    - **Key Libraries/Services Used**:
      - `lib/prisma.ts`: For database interactions.
      - `lib/session.ts` (`requireSession`): For session management and authentication.
      - `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`: For generating presigned URLs for S3/DigitalOcean Spaces.
- **Note**: Broader team management operations (create, update, list teams, manage members) are likely handled by Server Actions in `actions/team.ts`. These API routes serve specific needs like file downloads.

### 2.3. `app/api/terminal/`

- **Purpose**: Manages interactions with physical payment terminals or machine interfaces. These endpoints are likely called by the terminals/machines themselves to fetch configuration, report status, or transact.
- **Actual Endpoints**:
  - **`GET /api/terminal/{terminalSerial}`** (defined in `app/api/terminal/[terminalSerial]/route.ts`):
    - **Functionality**: Retrieves detailed configuration and status information for a specific payment terminal.
    - **Path Parameters**:
      - `{terminalSerial}`: The serial number of the terminal.
    - **Processing Steps**:
      1.  Fetches the `Terminal` record from the database using `terminalSerial`.
      2.  Fetches the corresponding `Machine` record to check its `activeUntilDate`.
      3.  If the `Terminal` is not found, returns a `404 Not Found` error.
      4.  Determines if the machine's service is expired by comparing `machine.activeUntilDate` (zoned to "America/Mexico_City") with the current date.
      5.  If the machine is expired, it sets `acceptCreditPayments` to `false` in the response, overriding the database value.
    - **Response**:
      - `200 OK`: Returns a JSON object containing the terminal's configuration:
        ```json
        {
          "terminal": {
            "id": "TERMINAL_ID",
            "type": "VENDING | PARKING",
            "serialNumber": "TERMINAL_SERIAL_NUMBER",
            "pharosMerchantCode": "PHAROS_MERCHANT_CODE",
            "pharosTerminalCode": "PHAROS_TERMINAL_CODE",
            "flowType": "A | B | C",
            "description": "TERMINAL_DESCRIPTION"
            // ... many other fields like username, password, endpointUrl,
            // fixedComissionCents, percentageCommission, language, initialCredit,
            // acceptCreditPayments, acceptCashPayments, acceptServicePayments,
            // decimalMode, nip, key
          }
        }
        ```
        (Note: Default values like empty strings or -1 are used for null fields, and `decimalMode` is converted to a number.)
      - `404 Not Found`: If the terminal with the given serial number is not found.
    - **Key Libraries/Services Used**:
      - `lib/prisma.ts`: For database interactions.
      - `date-fns`, `date-fns-tz`: For date and timezone manipulations.
  - **`POST /api/terminal/{terminalSerial}/incident`** (defined in `app/api/terminal/[terminalSerial]/incident/route.ts`):
    - **Functionality**: Creates a new incident record for the machine associated with the given terminal serial number.
    - **Path Parameters**:
      - `{terminalSerial}`: The serial number of the terminal whose associated machine is reporting the incident.
    - **Request Body**: Expects a JSON object:
      ```json
      {
        "message": "INCIDENT_DESCRIPTION_HERE"
      }
      ```
      The payload is validated using `machineIncidentCreateSchema` from `@/validation/machine.ts`.
    - **Processing Steps**:
      1.  Parses and validates the `message` from the request body.
      2.  Finds the active (not soft-deleted) `Machine` record corresponding to the `terminalSerial`.
      3.  If the machine is not found, returns a `404 Not Found` error.
      4.  Creates a new `Incident` in the database, associating it with `machine.id` and the provided `message`.
    - **Response**:
      - `201 Created`: Returns a JSON object `{"message": "Incident created"}`.
      - `400 Bad Request`: If the payload is invalid (implicitly, due to Zod parsing).
      - `404 Not Found`: If the machine associated with the terminal serial is not found.
    - **Key Libraries/Services Used**:
      - `lib/prisma.ts`: For database interactions.
      - `@/validation/machine.ts` (`machineIncidentCreateSchema`): For request payload validation.
  - **`POST /api/terminal/{terminalSerial}/ping`** (defined in `app/api/terminal/[terminalSerial]/ping/route.ts`):
    - **Functionality**: Allows a terminal to signal it is online ("ping") and updates associated machine and team information.
    - **Path Parameters**:
      - `{terminalSerial}`: The serial number of the terminal.
    - **Request Headers**:
      - `x-merchant-code` (optional): The merchant code associated with the terminal.
      - `x-terminal-code` (optional): The specific terminal code (e.g., Pharos terminal code).
      - `x-version-code` (optional): The software/firmware version of the terminal.
    - **Processing Steps**:
      1.  Retrieves `merchantCode`, `terminalCode`, and `versionCode` from the request headers.
      2.  Finds the active (not soft-deleted) `Machine` record corresponding to the `terminalSerial`.
      3.  If the machine is not found, returns a `404 Not Found` error.
      4.  In a database transaction:
          - Updates the `Machine` record: sets `lastPingAt` to the current time, updates `pharosTerminalCode` (from `x-terminal-code`), and `versionCode` (from `x-version-code`).
          - Updates the associated `Team` record: sets `pharosMerchantCode` (from `x-merchant-code`).
    - **Response**:
      - `200 OK`: Returns a JSON object `{"message": "pong"}`.
      - `404 Not Found`: If the machine associated with the terminal serial is not found.
    - **Key Libraries/Services Used**:
      - `lib/prisma.ts`: For database interactions.
  - **`POST /api/terminal/{terminalSerial}/remote-sale`** (defined in `app/api/terminal/[terminalSerial]/remote-sale/route.ts`):
    - **Functionality**: Checks if a remote sale is currently enabled for the machine associated with the terminal. If enabled and not expired, it consumes the "enabled" status (by setting `remoteSaleEnabledUntil` to null) and confirms enablement. This is likely called by a terminal to verify if it should proceed with a remotely initiated sale.
    - **Path Parameters**:
      - `{terminalSerial}`: The serial number of the terminal.
    - **Processing Steps**:
      1.  Finds the `Machine` record corresponding to the `terminalSerial`.
      2.  If the machine is not found, returns a `404 Not Found` error.
      3.  Checks the `remoteSaleEnabledUntil` field of the machine:
          - If `remoteSaleEnabledUntil` is a future date (i.e., a remote sale is active and valid):
            - Updates the `Machine` record by setting `remoteSaleEnabledUntil` to `null`.
            - Returns `{"isEnabled": true}`.
          - Otherwise (if `remoteSaleEnabledUntil` is null or in the past):
            - Returns `{"isEnabled": false}`.
    - **Response**:
      - `200 OK`: Returns a JSON object:
        - `{"isEnabled": true}`: If a remote sale was active and has now been acknowledged/consumed by this call.
        - `{"isEnabled": false}`: If no remote sale is currently active for this terminal.
      - `404 Not Found`: If the machine associated with the terminal serial is not found.
    - **Key Libraries/Services Used**:
      - `lib/prisma.ts`: For database interactions.
  - **`POST /api/terminal/{terminalSerial}/sale`** (defined in `app/api/terminal/[terminalSerial]/sale/route.ts`):
    - **Functionality**: Records a sale transaction reported by a terminal, with specific handling for MDB protocol machines.
    - **Path Parameters**:
      - `{terminalSerial}`: The serial number of the terminal reporting the sale.
    - **Request Body**: Expects a JSON payload validated by `terminalSaleSchema` (from `@/validation/terminalSaleSchema.ts`). Key fields likely include:
      - `token` (string, unique identifier for the sale attempt)
      - `mdbCode` (optional string, MDB product code from the machine spiral)
      - `cost` (number, cost of the item sold)
      - `paymentMethod` (enum: `CASH`, `CARD`, `FREE`, `REMOTE`)
      - `type` (enum: `PRODUCT`, `SERVICE`, `PHONE_RECHARGE`)
      - `isoDate` (string, ISO 8601 date for when the sale occurred)
      - Other optional fields like `comission`, `serviceCharge`, Taecel-related IDs, `description`.
    - **Processing Steps**:
      1.  Validates the incoming JSON payload against `terminalSaleSchema`. Returns `400 Invalid input` if validation fails.
      2.  Finds the `Machine` record using `terminalSerial`. Returns `404 Machine not found` if not found.
      3.  **Protocol Check**: If `machine.protocol` is NOT `MachineProtocol.MDB`, the endpoint returns `201 Created` immediately, implying non-MDB sales (e.g., DEX) are processed elsewhere or not through this specific MDB-centric logic.
      4.  **MDB Sale Logic**:
          - If `validatedData.data.mdbCode` is present, it attempts to find the `MachineSpiral` and its associated `Product` details.
          - **Idempotency**: Checks if a `Sale` with the same `token` and `machineId` already exists. If so, returns `201 Created` to prevent duplicate processing.
          - Performs a database transaction:
            - Updates `machine.lastPingAt` to the current time.
            - Creates a new `Sale` record, populating it with data from the request, and product details if a `MachineSpiral` was found. The `rawPayload` (stringified JSON input) is also stored.
            - If `validatedData.data.mdbCode` was provided, it `upserts` the `MachineSpiral`:
              - If the spiral exists and its `currentCount > 0`, decrements `currentCount` by 1.
              - If the spiral does not exist, it's created with `currentCount: 0` and `maxCapacity: 1` (this might be a fallback or placeholder).
    - **Response**:
      - `201 Created`: With `{"success": true}` if the sale is successfully recorded or if a duplicate sale `token` is detected (idempotency).
      - `400 Bad Request`: If payload validation fails.
      - `404 Not Found`: If the machine is not found.
      - `500 Internal Server Error`: For other unexpected errors during processing.
    - **Key Libraries/Services Used**:
      - `lib/prisma.ts`: For database interactions.
      - `@/validation/terminalSaleSchema.ts` (`terminalSaleSchema`): For request payload validation.

### 2.4. `app/api/v1/`

- **Purpose**: This is a versioned API (v1), suggesting a more stable interface intended for external consumption, possibly by client applications or third-party integrations.
- **Authentication**: As detailed in the separate `docs/api.md` (and summarized here), these endpoints require API Key authentication via a Bearer token in the `Authorization` header.
  ```shell
  curl --request GET \
    --url https://app.terpasolutions.com/api/v1/machines \
    --header 'Authorization: Bearer YOUR_API_KEY'
  ```
- **Actual Endpoints**:
  - **`app/api/v1/machines/route.ts`**:
    - **`GET /api/v1/machines`**: Lists all machines accessible with the provided API key.
    - _Example Response_:
      ```json
      {
        "machines": [
          {
            "id": "fc385e0d-b59c-47e5-bf05-07a4b678a1ba",
            "name": "Máquina Plaza 123",
            "terminalSerialNumber": "1640193062",
            "createdAt": "2024-05-03T20:46:16.215Z",
            "updatedAt": "2024-07-24T14:32:35.684Z"
          }
        ]
      }
      ```
  - **`app/api/v1/machines/[machineId]/sales/route.ts`**:
    - **`GET /api/v1/machines/:machineId/sales?date=YYYY-MM-DD`**: Retrieves sales data for a specific machine on a given date.
    - _Example Response_:
      ```json
      {
        "timezone": "America/Monterrey",
        "sales": [
          {
            "id": "9e8a5b4b-28de-4023-bd94-527904f9a5a5",
            "date": "2024-07-23 21:19:06",
            "machine": {
              "id": "e8109f40-9df8-4069-a6bf-5c56aceb7e56",
              "spiral": "50",
              "cost": { "cents": 2000, "formatted": "$20.00" }
            },
            "product": {
              "id": "71764ed4-51bf-48fd-9666-67f6d3928767",
              "name": "Emperador Grande",
              "cost": { "cents": 2000, "formatted": "$20.00" }
            }
          }
        ]
      }
      ```
  - **`app/api/v1/machines/[machineId]/terminal/route.ts`**:
    - **`GET /api/v1/machines/:machineId/terminal?date=YYYY-MM-DD`**: Retrieves terminal (card) transaction data for a specific machine on a given date.
    - _Example Response_:
      ```json
      {
        "transactions": [
          {
            "id": 12345667,
            "merchant": "MERCHANT NAME",
            "terminal_id": 8661,
            "card": "123456...7890",
            "authorization_number": "198272",
            "amount": "$120.00",
            "card_type": "credit",
            "date": "25/07/2024 11:23:16",
            "approved": true
            // ... other fields
          }
        ]
      }
      ```

### 2.5. `app/api/webhooks/`

- **Purpose**: Dedicated to handling incoming webhooks from external services.
- **Actual Endpoints**:
  - `app/api/webhooks/mercadopago/route.ts`: Receives and processes payment status updates and other notifications from MercadoPago.
- **Security**: Webhook endpoints must be secured, typically by verifying signatures sent by the external service (e.g., MercadoPago's `x-signature` header) to ensure the request is legitimate.
- **Processing**: Webhook handlers often add jobs to a queue (like BullMQ, configured in `lib/bullmq.ts`) for asynchronous processing. This prevents timeouts and allows for robust handling of retries.

### 2.6. `app/api/cron/`

- **Purpose**: Endpoints for automated cron jobs and scheduled tasks, typically called by background workers or monitoring systems.
- **Authentication**: Uses Bearer token authentication with `CRON_SECRET` environment variable for security.
- **Actual Endpoints**:
  - **`GET /api/cron/deactivate-machines`** (defined in `app/api/cron/deactivate-machines/route.ts`):
    - **Functionality**: Deactivates machines that have expired based on their `activeUntilDate`.
    - **Authentication**: Requires `Authorization: Bearer {CRON_SECRET}` header.
    - **Processing Steps**:
      1. Validates authentication using `CRON_SECRET`.
      2. Queries machines with `isEnabled: true` and `activeUntilDate` before today (Mexico City timezone).
      3. Updates matching machines to set `isEnabled: false`.
    - **Response**:
      - `200 OK`: Returns JSON with `{"message": "Machine deactivation process completed.", "updatedCount": number}`.
      - `401 Unauthorized`: If authentication fails.
    - **Scheduling**: Called daily at 3:00 AM Mexico City time via BullMQ worker.
  - **`GET /api/cron/payment-reminders`** (defined in `app/api/cron/payment-reminders/route.ts`):
    - **Functionality**: Sends payment reminder emails to team owners with machines expiring next month.
    - **Authentication**: Requires `Authorization: Bearer {CRON_SECRET}` header.
    - **Processing Steps**:
      1. Validates authentication using `CRON_SECRET`.
      2. Calculates next month date range in Mexico City timezone.
      3. Queries teams with machines expiring between next month start and end dates.
      4. For each team with expiring machines:
         - Finds team owner (role: OWNER)
         - Sends payment reminder email via SendGrid
         - Logs email attempt with SUCCESS/FAILED status
      5. Returns statistics on processing results.
    - **Response**:
      - `200 OK`: Returns JSON with:
        ```json
        {
          "message": "Payment reminders process completed.",
          "emailsSent": number,
          "emailsFailed": number,
          "teamsProcessed": number
        }
        ```
      - `401 Unauthorized`: If authentication fails.
      - `500 Internal Server Error`: If processing fails.
    - **Scheduling**: Called twice monthly via BullMQ workers:
      - 15th of each month at 6:00 AM Mexico City time
      - Last weekday of each month at 6:00 AM Mexico City time
    - **Email Content**: Spanish-language emails including team name, expiring machine list, and renewal URL.
    - **Error Handling**: Failed email sends are logged with `FAILED` status for monitoring and debugging.
    - **Key Libraries/Services Used**:
      - `lib/payment-reminders.ts` (`executeMonthlyPaymentReminders`): Core payment reminder logic.
      - `service/mailer.ts` (`sendPaymentReminderEmail`): Email sending functionality.
      - `lib/prisma.ts`: Database interactions for teams, machines, and email logging.

### 2.7. `app/health/route.ts` (maps to `/api/health`)

- **Purpose**: A standard health check endpoint.
- **Functionality**: Typically returns a simple `200 OK` response, possibly with status information about the application and its connected services (e.g., database connectivity).
- **Usage**: Used by monitoring systems, load balancers, or orchestration platforms (like Kubernetes) to determine if the application instance is running correctly.

## 3. General Considerations for API Endpoints

- **Request/Response Formats**: Most modern APIs use JSON for request and response bodies.
- **HTTP Methods**: Standard HTTP methods (GET, POST, PUT, DELETE, PATCH) are used to represent actions on resources.
- **Authentication & Authorization**:
  - Endpoints intended for use by the frontend for authenticated users might rely on session cookies (JWTs).
  - Endpoints for external services or third-party clients (`/api/v1/`, `/api/terminal/`) would require token-based authentication (API keys, OAuth).
  - Authorization logic within each endpoint handler ensures that the authenticated principal (user or service) has the necessary permissions to perform the requested action.
- **Validation**: Input data (request bodies, query parameters, path parameters) should be validated, likely using Zod schemas (similar to those in the `validation/` directory).
- **Error Handling**: Consistent error response formats and appropriate HTTP status codes are used to indicate success or failure.

A thorough review of each `route.ts` file within these directories is necessary to document the specific behavior, request parameters, and response structures for each individual API endpoint. The existing `docs/api.md` file might contain some of this information already and should be consulted or merged.
