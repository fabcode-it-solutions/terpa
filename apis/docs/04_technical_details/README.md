# 04: Technical Details of Terpa Web

This section provides deeper insights into specific technical aspects of the Terpa Web application, including its API endpoints, UI component strategy, error handling, and integrations with external services.

## Documents in this Section

- [**API Endpoints**](./api_endpoints.md):
  - Documentation for the various API routes found in `app/api/`.
  - Details on request/response formats, authentication requirements, and the purpose of different API groups (e.g., DEX, team, terminal, v1, webhooks).
- [**UI Components and Styling**](./ui_components_and_styling.md):
  - Explanation of the approach to UI development, including the use of Tailwind CSS.
  - Information on how Radix UI and Shadcn/UI are utilized for building components (`components.json`, `components/ui/`).
  - Overview of the structure and organization of the main `components/` directory.
- [**Error Handling and Monitoring**](./error_handling_and_monitoring.md):
  - Details on how errors are managed within the application.
  - Information on Sentry integration (`sentry.*.config.ts`) for error tracking and monitoring.
  - Overview of global error handling mechanisms (`app/global-error.tsx`).
- [**External Integrations**](./external_integrations.md):
  - Documentation on how Terpa Web integrates with key external services:
    - AWS S3 for file storage (e.g., payment proofs).
    - MercadoPago for payment processing.
    - Pharos (if details become available about its purpose).
    - WhatsApp (if used for notifications or communication).

These documents are intended for developers who need to understand or work with these specific technical areas of the application.
