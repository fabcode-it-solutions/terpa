# Terpa — Vending Machine Management Platform

A full-stack platform built for operators of vending machine fleets — giving them real-time visibility into machine health, inventory, sales, routes, and billing from a single dashboard, plus a companion mobile app for field teams.

This repository is shared as a **portfolio reference**. It showcases production-grade architecture, code quality, and delivery across a real, end-to-end SaaS product (web admin dashboard, mobile field app, and backend services) — not a demo or boilerplate project.

> 📌 **Note:** Source code is provided for review purposes only. See [LICENSE](./LICENSE) for usage terms.

---

## What This Project Does

Terpa helps vending machine operators run their fleet without guesswork:

- **Real-time machine observability** — live status, location, and health for every machine in the fleet
- **Inventory tracking** — per-machine stock levels, product catalogs, restock picklists
- **Sales & analytics** — transaction history and performance reporting per machine, route, or team
- **Route management** — plan and assign service/collection routes to field technicians
- **Incident tracking** — log, assign, and resolve operational issues as they happen
- **Billing & invoicing** — automated invoice generation with integrated payment processing (MercadoPago)
- **Team & role management** — multi-team support with permission-based access control
- **Admin dashboard** — centralized reporting and oversight across the entire operation

---

## Why This Project Stands Out

- **Two-platform delivery** — a Next.js web application for office/admin use and a React Native (Expo) mobile app for technicians in the field, sharing a common backend and API contract.
- **Production-ready foundations** — authentication, background job processing, error monitoring (Sentry), typed API layers, and schema-validated data flows throughout.
- **Clean, documented architecture** — the codebase includes structured internal documentation covering system architecture, database design, and every core feature (see [`apis/docs`](./apis/docs)).
- **Modern, maintainable stack** — TypeScript across the board, Prisma ORM, PostgreSQL, Redis, Zustand + React Query on mobile, and a component-driven UI built with reusable, themeable primitives.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Web App** | Next.js 14, TypeScript, Prisma ORM, PostgreSQL, Redis, Tailwind CSS |
| **Mobile App** | React Native (Expo), TypeScript, Zustand, TanStack React Query, MMKV |
| **Infrastructure** | PgBouncer connection pooling, Sentry error tracking, EAS build/deploy pipeline |
| **Integrations** | MercadoPago (payments), CFDI (invoicing) |

---

## Project Structure

```
terpa/
├── apis/          # Next.js web application & backend API (admin dashboard, core business logic)
│   └── docs/      # Structured project documentation (architecture, features, setup, deployment)
└── mobile-app/    # React Native (Expo) mobile app for field teams
```

Each project maintains its own README with setup instructions:

- [`apis/README.md`](./apis/README.md) — web application & API setup
- [`mobile-app/README.md`](./mobile-app/README.md) — mobile app setup

For a full walkthrough of the system — architecture, database schema, and every feature in detail — see the [complete documentation](./apis/docs/README.md).

---

## About

This project was built and is maintained by **[The Fabcode](https://thefabcode.org)**, a software development team delivering full-stack web and mobile products end-to-end — from architecture and UI/UX to deployment and ongoing support.

Interested in working together? Feel free to reach out via Upwork or [gurdit@thefabcode.org](mailto:gurdit@thefabcode.org).
