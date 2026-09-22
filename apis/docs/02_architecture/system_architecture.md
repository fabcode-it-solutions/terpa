# System Architecture: Terpa Web

This document provides an overview of the software architecture of the Terpa Web application, covering its frontend, backend, data flow, and state management strategies.

## 1. Overall Architecture

Terpa Web is a full-stack web application built primarily with Next.js, leveraging its capabilities for both client-side and server-side rendering and operations. The architecture is designed to be modular and scalable.

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Styling:** Tailwind CSS

## 2. Frontend Architecture

The frontend is built using React (v18) within the Next.js App Router paradigm.

- **Next.js App Router (`app/` directory):**
  - **Layouts (`layout.tsx`):** Define UI structure shared across multiple routes. Root layouts and nested layouts are used.
  - **Pages (`page.tsx`):** Unique UI for a route.
  - **Nested Routes for Complex Layouts:** The App Router's file-based routing is used to create complex layouts, such as tabbed interfaces. For example, the team management section (`app/admin/teams/[slug]/manage/`) uses a `layout.tsx` file to provide a shared UI (breadcrumbs and a tab component) for its child routes. The "General" tab is rendered by `page.tsx` in the `manage/` directory, while the "Documents" tab is rendered by `page.tsx` in the nested `manage/documents/` directory. This pattern keeps the UI for each tab decoupled while sharing a common layout.
  - **Server Components:** By default, components within the `app/` directory are React Server Components (RSCs). They run on the server and can directly access server-side resources (like databases via Prisma, or file systems) and perform data fetching. This reduces the amount of JavaScript sent to the client, improving performance.
  - **Client Components (`"use client";` directive):** Components that require browser-specific APIs (like `useState`, `useEffect`, event listeners) are explicitly marked as Client Components. They are pre-rendered on the server (SSR/SSG) and then hydrated and made interactive on the client.
- **UI Components (`components/` directory):**
  - A collection of reusable React components, likely built using Shadcn/UI and Radix UI primitives for accessibility and unstyled flexibility.
  - Organized into general UI elements (`components/ui/`) and feature-specific components (e.g., `components/machine/`, `components/billing/`).
- **Styling:**
  - Tailwind CSS is used for utility-first styling (`tailwind.config.ts`, `globals.css`).
  - `clsx` and `tailwind-merge` are used for conditional and optimized class name generation.

## 3. Backend Architecture

The backend logic is handled through a combination of Next.js features:

- **Next.js Server Actions (`actions/` directory):**
  - Functions that execute on the server, callable from Server and Client Components. They are used for data mutations (e.g., creating, updating, deleting data) and form submissions.
  - Defined with the `"use server";` directive, either at the top of a file or within a specific function.
  - Provide a streamlined way to handle server-side logic without manually creating API endpoints for every operation.
  - Examples: `actions/user.ts` for user-related operations, `actions/machine.ts` for machine data management.
- **Next.js API Routes (`app/api/` directory):**
  - Used for creating traditional API endpoints that can be accessed by the client-side or external services.
  - Follow a file-system based routing similar to pages (e.g., `app/api/health/route.ts` maps to `/api/health`).
  - Suitable for webhooks, specific data fetching needs not covered by Server Components, or when a standard REST/GraphQL API is required.
  - Examples: `app/api/dex/`, `app/api/webhooks/`.
- **Database Interaction:**
  - Prisma (`lib/prisma.ts`) serves as the Object-Relational Mapper (ORM), simplifying database operations (queries, mutations) by providing a type-safe API to interact with the database defined in `prisma/schema.prisma`.

## 4. Data Flow

- **Data Fetching in Server Components:**
  - Server Components can directly `async/await` data fetching functions (e.g., Prisma queries or functions from `loaders/`). This data is fetched on the server during the rendering process.
  - The `loaders/` directory (e.g., `loaders/machine.ts`, `loaders/dashboard.ts`) likely contains dedicated functions for fetching data for specific parts of the application, promoting reusability and separation of concerns.
- **Data Fetching in Client Components:**
  - Client Components typically fetch data using:
    - The `useEffect` hook in combination with `fetch` or a library like SWR/React Query (though these are not explicitly listed as direct dependencies, they are common in Next.js).
    - Data passed down as props from parent Server Components.
    - Calling Server Actions that return data.
- **Data Mutations:**
  - Primarily handled by Server Actions. Client Components can invoke Server Actions, which then interact with the database via Prisma and can revalidate data or redirect as needed.
  - API Routes can also handle mutations if called directly via `fetch` from the client.
- **Form Handling:**
  - React Hook Form (`react-hook-form`) is used for managing form state, validation (often with `zod` via `@hookform/resolvers`), and submission.
  - Forms typically submit their data to Server Actions.

## 5. State Management

- **Local Component State:** `useState` and `useReducer` are used for managing state within individual Client Components.
- **Global State / Context Sharing:**
  - React Context API is likely used for sharing global state or state that needs to be accessible across different parts of the component tree without prop drilling (e.g., theme, user session, application-wide settings).
  - Specific context providers might be set up in root layouts or feature-specific layouts.
- **Form State:** Managed by React Hook Form.
- **URL State:** The URL itself (query parameters, path segments) is often used as a source of truth for state, especially for filters, pagination, and current views, managed via Next.js routing.

## 6. Key Architectural Patterns

- **Server-Centric Approach:** Leveraging Next.js Server Components and Server Actions to keep much of the logic and data fetching on the server, aiming for better performance and simpler client-side code.
- **Modularity:** Code is organized by feature or domain in directories like `actions/`, `components/`, `app/[feature]/`, and `validation/`.
- **Type Safety:** TypeScript is used throughout the project, including with Prisma, to ensure type safety and improve developer experience.
- **Utility-First CSS:** Tailwind CSS enables rapid UI development with a consistent styling system.

This architecture provides a robust foundation for Terpa Web, balancing performance, developer experience, and scalability.
