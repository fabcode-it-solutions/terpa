# Plan: Team Onboarding Tasks Feature

This document outlines the plan to implement the team onboarding tasks feature.

### 1. Update Prisma Schema (`prisma/schema.prisma`)

- Add the `TeamOnboardingTask` and `TeamOnboardingTaskHistory` models to the `prisma/schema.prisma` file.
- Add a one-to-many relation from `Team` to `TeamOnboardingTask` and `TeamOnboardingTaskHistory`.
- Add a one-to-many relation from `User` to `TeamOnboardingTaskHistory`.
- Add a unique constraint on `teamId` and `key` in the `TeamOnboardingTask` model.

### 2. Run Prisma Migration

- Generate a new migration using `npx prisma migrate dev --name add_onboarding_tasks`.
- This will create a new migration file in `prisma/migrations/` and apply the changes to the database.

### 3. Update Constants (`lib/constants.ts`)

- Add a `TEAM_ONBOARDING_TASKS` constant to `lib/constants.ts`. This will be an array of objects, each with a `label` and a `key`, to define the available onboarding tasks.

### 4. Create Validation Schema (`validation/onboarding.ts`)

- In alignment with the project's use of Zod for validation, create a new file, `validation/onboarding.ts`, to define a schema for the onboarding task updates. This will ensure that the data sent to the server action is valid.

### 5. Create New Server Action (`actions/onboarding.ts`)

- Create a new file, `actions/onboarding.ts`, with a `"use server";` directive at the top.
- Create a new function, `updateOnboardingTask`, that accepts the `teamId`, `taskKey`, and `newValue` as arguments.
- This function will use the Zod schema from `validation/onboarding.ts` to validate the input.
- It will then use Prisma to perform an `upsert` on the `TeamOnboardingTask` model.
- After the `upsert`, it will create a new record in the `TeamOnboardingTaskHistory` model to log the change.
- The action will return a success or error message, which will be used to display a toast notification in the UI.

### 6. Update Sidebar Component (`components/team/admin-team-documents-sidebar.tsx`)

- Modify the `AdminTeamDocumentsSidebar` to be a client component by adding the `"use client";` directive.
- Use a new loader function to fetch the current state of the onboarding tasks for the team.
- Use `useState` to manage the loading state of each checkbox.
- Render a form with checkboxes for each task defined in `lib/constants.ts`.
- When a checkbox is changed, it will call the `updateOnboardingTask` server action.
- While the action is running, the checkbox will be disabled, and a spinner will be displayed.
- Upon completion, a toast notification will be displayed to indicate success or failure.

### 7. Update Documentation

- Update `docs/02_architecture/database_schema.md` to include the new `TeamOnboardingTask` and `TeamOnboardingTaskHistory` models.
- Update any other relevant documentation to reflect the new feature.
