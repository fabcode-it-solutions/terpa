# Deployment Guide for Terpa Web

This document provides an overview of the build process and key considerations for deploying the Terpa Web application to a production environment.

## 1. Overview

Deploying a Next.js application like Terpa Web involves building the application for production, setting up the server environment, configuring environment variables, managing database migrations, and ensuring background workers (if any) are running.

## 2. Build Process

The primary script for creating a production-ready build is `npm run build`. However, the project includes a more comprehensive script, `npm run do-build`, which likely handles prerequisite steps for a deployment.

- **`npm run build`**:

  - This command executes `next build`.
  - Next.js compiles the application, optimizes assets (JavaScript, CSS, images), generates static pages (if using SSG or ISR for some routes), and prepares server-side code for production.
  - The output is typically placed in the `.next` directory.

- **`npm run do-build`**:
  - Defined as: `"npx prisma generate && npm run build && npx prisma migrate deploy"`
  - This script orchestrates several key deployment steps:
    1.  **`npx prisma generate`**: Ensures the Prisma Client is up-to-date with the schema defined in `prisma/schema.prisma`. This is crucial if the schema has changed.
    2.  **`npm run build`**: Builds the Next.js application as described above.
    3.  **`npx prisma migrate deploy`**: Applies any pending database migrations to the production database. This command is designed for non-interactive deployment environments and applies migrations that have already been generated (typically in development using `prisma migrate dev`).

## 3. Deployment Environment Considerations

- **Hosting Platform**: Terpa Web is deployed to the DigitalOcean App Platform when changes are merged into the `main` branch.
- **Node.js Version**: Ensure the production environment uses Node.js version 22.x, as specified in `package.json`.
- **Environment Variables**:
  - All necessary environment variables (defined in `.env.example`) must be securely configured in the production environment. This includes:
    - `DATABASE_URL` (pointing to the production database).
    - `JWT_SECRET` (a strong, unique secret for production).
    - `REDIS_URL` (pointing to the production Redis instance for BullMQ).
    - API keys for Sentry, AWS S3, MercadoPago, WhatsApp, etc.
  - Platforms like Vercel, Netlify, and cloud providers offer secure ways to manage environment variables.
- **Database**:
  - A production-grade database (e.g., managed PostgreSQL, MySQL) should be used.
  - Ensure network connectivity between the application server and the database.
- **Redis**:
  - A production Redis instance is required for BullMQ if background jobs are a core part of the application.

## 4. Running the Application in Production

- **Start Command**: After a successful build, the application is typically started using:
  ```bash
  npm run start
  ```
  This command executes `next start`, which runs the optimized production server.
- **Port**: The application is configured to run on port 8080 by default (`"dev": "TZ='UTC' next dev -p 8080"` and `next start` often respects the `-p` from dev or uses a `PORT` environment variable). Ensure this port is accessible or mapped correctly by your hosting environment/reverse proxy.
- **Timezone**: The `TZ='UTC'` in the dev script is good practice. Ensure the production server environment is also consistently configured for UTC to avoid timezone-related issues with dates and scheduled jobs.

## 5. Deploying Database Migrations

- **Strategy**: Database migrations should be applied carefully in production.
- **`npx prisma migrate deploy`**: This command (part of `npm run do-build`) is the recommended way to apply migrations in a CI/CD pipeline or deployment script. It applies existing migration files from the `prisma/migrations` directory without prompting for input.
- **Process**:
  1.  Generate migration files in a development environment using `npx prisma migrate dev --name <migration-name>`.
  2.  Commit these migration files to version control.
  3.  During deployment, the `npx prisma migrate deploy` command will apply these committed migrations to the production database.

## 6. Static Assets and Public Directory

- Static assets in the `public/` directory are served automatically by Next.js.
- Next.js also optimizes and serves assets imported into components (like images) from the `.next/static` directory after a build.

## 7. Monitoring and Health Checks

- Ensure Sentry is correctly configured for the production environment to capture errors.
- Utilize the `/api/health` endpoint for health checks by your hosting platform or monitoring tools.
- Set up logging for the production application and workers to a centralized logging system for easier debugging.

A well-planned deployment process is essential for the stability and reliability of Terpa Web in a production setting. Consider automating these steps using a CI/CD pipeline.
