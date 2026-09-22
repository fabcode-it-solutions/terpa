# Error Handling and Monitoring in Terpa Web

This document outlines the strategies and tools used for error handling and application monitoring within the Terpa Web project. Effective error management is crucial for maintaining application stability, diagnosing issues, and ensuring a good user experience.

## 1. Overview

Terpa Web employs a combination of Next.js built-in mechanisms and third-party services (Sentry) for capturing, reporting, and managing errors.

## 2. Key Components and Files

- **Sentry Integration**:
  - **Dependency**: `@sentry/nextjs` is used for integrating Sentry's error tracking capabilities into the Next.js application.
  - **Configuration Files**:
    - `sentry.client.config.ts`: Configures Sentry for the client-side (browser environment). This typically initializes the Sentry SDK with a DSN (Data Source Name) and settings for capturing frontend errors and performance data.
    - `sentry.server.config.ts`: Configures Sentry for the server-side Node.js environment (e.g., for Server Components, Server Actions, API Routes).
    - `sentry.edge.config.ts`: Configures Sentry specifically for Next.js Edge Functions (if used).
  - **Instrumentation**: `instrumentation.ts` is a Next.js file that can be used for OpenTelemetry and other instrumentation. Sentry's Next.js SDK often hooks into this or provides its own wrappers for Next.js files (`next.config.mjs`) to automatically instrument the application.
- **Next.js Error Handling Mechanisms**:
  - **`app/global-error.tsx`**: This file defines a global error boundary for the entire application. It catches unhandled errors that occur during rendering in Server Components or Client Components and allows displaying a custom fallback UI instead of a broken page.
  - **Error Boundaries (React)**: Standard React error boundaries can be implemented at more granular levels within the component tree to catch errors in specific parts of the UI and display localized fallbacks.
  - **`try...catch` Blocks**: Used in Server Actions, API Routes, and other server-side logic to gracefully handle expected errors (e.g., database errors, validation errors, external API failures) and return appropriate responses or error messages.
- **Logging**:
  - While not explicitly detailed by a specific logging library dependency (other than `console` methods), structured logging is important, especially on the server side. Sentry itself captures context with errors, but additional application logging can be beneficial.

## 3. Error Handling Strategies

### 3.1. Client-Side Errors

- **Capture**: Uncaught JavaScript errors, unhandled promise rejections, and errors within React component lifecycles on the client-side are captured by Sentry (via `sentry.client.config.ts`).
- **User Feedback**:
  - The global error boundary (`app/global-error.tsx`) provides a user-friendly fallback UI for critical rendering errors.
  - Specific UI components (e.g., forms) might display inline error messages for validation failures or operational errors returned from Server Actions/API Routes.
  - Toasts or notifications (e.g., using `sonner` dependency) can be used to inform users of non-critical errors or issues.

### 3.2. Server-Side Errors

- **Server Actions & API Routes**:
  - Errors occurring within Server Actions or API Routes are caught using `try...catch` blocks.
  - Based on the error type, appropriate HTTP status codes and error messages are returned to the client.
  - Unexpected or critical errors are reported to Sentry via its server-side SDK (`sentry.server.config.ts`).
- **Server Component Rendering Errors**:
  - Errors during the rendering of Server Components are also caught by Sentry and can be handled by `app/global-error.tsx` or more specific error boundaries.
- **Database Errors**: Prisma client operations can throw errors, which should be caught and handled appropriately (e.g., logging the error, returning a generic error message to the user, reporting to Sentry).

### 3.3. Error Reporting to Sentry

- **Automatic Reporting**: Sentry's SDK automatically captures unhandled exceptions and unhandled promise rejections.
- **Manual Reporting**: Specific errors can be manually reported to Sentry using `Sentry.captureException(error)` or `Sentry.captureMessage(message)` to provide more context or report handled exceptions that are still noteworthy.
- **Contextual Data**: Sentry captures rich contextual information with each error, including stack traces, browser/OS details, user information (if configured and PII is handled correctly), breadcrumbs (a trail of events leading up to the error), and custom tags/extra data. This is invaluable for debugging.

## 4. Application Monitoring

- **Error Monitoring (Sentry)**:
  - Provides a dashboard to view, triage, and manage reported errors.
  - Alerting capabilities to notify developers of new or high-frequency errors.
  - Helps track error trends and identify regressions.
- **Performance Monitoring (Sentry or OpenTelemetry)**:
  - Sentry's Next.js SDK can also provide performance monitoring (tracing) for frontend and backend transactions, helping identify bottlenecks.
  - `instrumentation.ts` suggests potential integration with OpenTelemetry for more extensive tracing and metrics collection, which Sentry can also consume.
- **Health Checks (`app/health/route.ts`)**:
  - The `/api/health` endpoint allows external monitoring services to check the basic health and availability of the application.
- **Logging**:
  - Server-side logs (e.g., from Server Actions, API Routes, background jobs) are essential for debugging and understanding application behavior. These might be sent to a centralized logging platform in a production environment.

Effective error handling and monitoring are vital for maintaining the reliability and quality of Terpa Web, enabling developers to quickly identify and resolve issues.
