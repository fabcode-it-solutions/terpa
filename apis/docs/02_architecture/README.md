# 02: Architecture of Terpa Web

This section delves into the architectural design and core components of the Terpa Web application. Understanding the architecture is crucial for comprehending how different parts of the system interact and for making informed development decisions.

## Documents in this Section

- [**System Architecture**](./system_architecture.md):
  - An overview of the overall software architecture, including frontend (Next.js App Router, Server/Client Components) and backend (Next.js API Routes, Server Actions) structures.
  - Discussion of data flow patterns within the application, including the role of `loaders/`.
  - Explanation of state management strategies (React Context, React Hook Form).
- [**Database Schema**](./database_schema.md):
  - Detailed information about the database structure, based on `prisma/schema.prisma`.
  - Descriptions of key data models, their fields, and relationships.
  - Information on the data seeding process (`prisma/seed.ts`).
- [**Authentication and Authorization**](./authentication.md):
  - A comprehensive look at user authentication flows (sign-up, sign-in, password reset, 2FA).
  - Details on JWT usage, session management (`lib/auth.ts`, `lib/session.ts`), and security considerations.
  - (If applicable) Overview of authorization and role-based access control.
- [**Background Jobs**](./background_jobs.md):
  - Explanation of the background job processing system using BullMQ and Redis (`lib/bullmq.ts`, `lib/redis.ts`).
  - Discussion of the types of jobs processed and how workers are managed.

Begin with the [System Architecture](./system_architecture.md) for a broad overview of how Terpa Web is constructed.
