# 05: Development and Deployment

This section provides guidelines for developers contributing to the Terpa Web project and outlines key aspects of the deployment process.

## Documents in this Section

- [**Contributing Guidelines**](./contributing_guidelines.md):
  - Information on coding styles and conventions, enforced by tools like ESLint.
  - Guidance on the typical development workflow, including branching strategies (if defined).
  - Best practices for submitting changes (e.g., pull request process).
  - Notes on writing and running tests (if a testing strategy is in place).
- [**Deployment Guide**](./deployment_guide.md):
  - Overview of the build process for preparing the application for production (`npm run build`, `npm run do-build`).
  - Considerations for deploying a Next.js application, including environment variable management for production.
  - Information on database migrations in a deployment context (`npx prisma migrate deploy`).
  - Notes on running worker processes (for BullMQ) in a production environment.

Adhering to these guidelines will help maintain code quality, ensure smooth collaboration, and facilitate successful deployments of Terpa Web.
