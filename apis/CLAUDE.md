# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development

- `npm run dev` - Start development server on port 8080 (runs with UTC timezone)
- `npm run build` - Build for production
- `npm run do-build` - Full build with Prisma generation and migration deployment
- `npm run lint` - Run ESLint to check code quality
- `npx tsx prisma/seed.ts` - Seed the database with sample data
- `npx tsc --noEmit` - Test TypeScript compilation without emitting files

### Database

- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Apply database migrations in development
- `npx prisma migrate deploy` - Deploy migrations to production
- `npx prisma studio` - Open Prisma Studio for database browsing

## Tech Stack & Architecture

**Terpa Web** is a Next.js 14 vending machine management platform with:

- **Next.js 14** with App Router
- **TypeScript** throughout
- **Prisma** with PostgreSQL for data persistence
- **Redis** for caching and background jobs (BullMQ)
- **Tailwind CSS** + **Shadcn/UI** for styling
- **Server Actions** for data mutations with **Zod** validation

## Key Architecture Patterns

### Multi-tenant Team Structure

- Teams have isolated dashboards at `/team/[slug]`
- Role-based access (Admin/Customer roles)
- Team-scoped data access throughout the application

### Component Organization

- `/components/ui` - Base Shadcn/UI components
- `/components/{domain}` - Feature-specific components (admin, machine, team, billing, inventory)
- `/app` - Next.js App Router pages
- `/actions` - Server Actions for data mutations
- `/validation` - Zod schemas for type-safe validation

### Data Layer

- **Prisma** handles all database operations
- Server Actions in `/actions` handle CRUD operations
- All inputs validated with Zod schemas from `/validation`
- Multi-tenant data isolation by team

## Core Business Domains

1. **Machine Management** - Vending machine CRUD, status monitoring, remote sales
2. **Inventory Control** - Product tracking, spiral assignments, picklist generation
3. **Billing System** - Invoice generation, MercadoPago integration, payment tracking
4. **Incident Management** - Issue tracking and resolution workflows
5. **Team Collaboration** - Multi-user teams with role-based permissions
6. **Sales Analytics** - Real-time reporting with Recharts visualizations

## Important Implementation Details

### Authentication

- Custom JWT-based auth with 2FA support
- Session management in `/lib/session.ts`
- Protected routes use `getUserSessionOrThrow()` helper

### Database Schema

- Complex multi-tenant schema in `/prisma/schema.prisma`
- Teams → Machines → Products → Sales relationship hierarchy
- Comprehensive audit trails and soft deletes

### Background Jobs

- BullMQ with Redis for asynchronous processing
- Cron jobs for automated tasks (payment reminders, machine deactivation)
- Job processors in `/lib/bullmq.ts`

### External Integrations

- AWS S3 (DigitalOcean Spaces) for file storage
- MercadoPago for payment processing
- Sendgrid for email notifications
- Sentry for error monitoring

## Development Notes

- **Environment**: Node.js 22+, PostgreSQL 16+, Redis 7+
- **Timezone**: All times stored/processed in UTC
- **Validation**: Every form and API input uses Zod schemas
- **Error Handling**: Comprehensive error boundaries and Sentry integration
- **Type Safety**: Full TypeScript coverage with strict mode enabled
- **Testing** Do not try to build or run dev server, use npx tsc --noEmit
