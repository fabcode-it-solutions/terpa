# Terminal Management (`actions/terminal.ts`)

This document outlines the server actions available for managing terminals within the Terpa Web application. These actions are defined in `actions/terminal.ts`.

## Core Concepts

Terminals in Terpa Web represent physical or virtual points of sale or interaction. The actions below allow for their creation and modification, primarily by administrators.

## Actions

### 1. `terminalCreateAction`

**Purpose**: Creates a new terminal in the system.

**Authorization**: Restricted to users with the `ADMIN` role. Non-admin users will receive an authentication error.

**Parameters**:
The function accepts a `payload` object, which is validated against the `terminalCreateSchema` (defined in `validation/machine.ts`). The expected properties include:

- `type`: The type of the terminal.
- `serialNumber`: The unique serial number for the terminal.
- `terminalCode`: Pharos terminal code.
- `merchantCode`: Pharos merchant code.
- `description`: A description for the terminal.
- `teamId`: Optional UUID of the team to assign the terminal to (for administrative organization).
- `initialCredit`: Initial credit amount for the terminal.
- `flowType`: The flow type for terminal operations.
- `language`: Language setting for the terminal.
- `acceptCreditPayments`: Boolean indicating if credit payments are accepted.
- `acceptCashPayments`: Boolean indicating if cash payments are accepted.
- `acceptServicePayments`: Boolean indicating if service payments are accepted.
- `decimalMode`: Decimal mode setting.
- `username`: Username for terminal authentication/operation.
- `password`: Password for terminal authentication/operation.
- `endpointUrl`: Endpoint URL for the terminal.
- `fixedComissionCents`: Fixed commission in cents.
- `percentageCommission`: Percentage-based commission.
- `nip`: NIP for the terminal.
- `key`: Key for the terminal.
- `extra1`: Additional configuration field.
- `extra2`: Additional configuration field.

**Core Logic**:

1.  Validates the input `payload` using `terminalCreateSchema`.
2.  Checks if the session user has `ADMIN` privileges.
3.  Verifies if a terminal with the given `serialNumber` already exists to prevent duplicates. If a duplicate is found, an error is returned.
4.  Creates a new terminal record in the database with the provided details.

**Return Value**:

- On success: `{ success: true, id: string }` where `id` is the ID of the newly created terminal.
- On failure (e.g., non-admin user, duplicate serial number): `{ success: false, errorType: string, message: string }`.

**Side Effects**:

- `revalidatePath("/", "layout")`: Revalidates the cache for the entire application layout, ensuring UI updates reflect the new terminal.

### 2. `terminalUpdateAction`

**Purpose**: Updates an existing terminal's information.

**Authorization**: Restricted to users with the `ADMIN` role. Non-admin users will be redirected to the homepage (`/`).

**Parameters**:
The function accepts a `payload` object, which is validated against the `terminalUpdateSchema` (defined in `validation/machine.ts`). The expected properties include:

- `id`: The ID of the terminal to update.
- All properties listed for `terminalCreateAction` (type, serialNumber, etc.), as they can be updated.

**Core Logic**:

1.  Validates the input `payload` using `terminalUpdateSchema`.
2.  Checks if the session user has `ADMIN` privileges.
3.  Verifies if the provided `serialNumber` (if changed) is already in use by another terminal. If it is, an error is returned.
4.  Updates the terminal record in the database with the new details.

**Return Value**:

- On success: `{ success: true, id: string }` where `id` is the ID of the updated terminal.
- On failure (e.g., serial number conflict): `{ success: false, error: string }`.

**Side Effects**:

- `revalidatePath("/", "layout")`: Revalidates the cache for the entire application layout, ensuring UI updates reflect the terminal changes.
- Redirects to `/` if the user is not an `ADMIN`.

## Team Relationships

Terminals can optionally be assigned to teams for administrative organization purposes. This relationship has the following characteristics:

### Key Features

- **Optional Assignment**: Terminals can exist without being assigned to any team (`teamId = null`).
- **Administrative Only**: Team assignment is purely for organizational purposes and does not affect terminal functionality or platform operations.
- **Backward Compatible**: Existing terminals without team assignments continue to function normally.
- **UI Indication**: The admin interface clearly communicates that team assignment is administrative via the description: "Este campo es administrativo y no afecta la funcionalidad de la terminal o plataforma."

### Database Schema

```prisma
model Terminal {
  // ... other fields
  teamId String?
  team   Team?   @relation(fields: [teamId], references: [id])
}

model Team {
  // ... other fields
  terminals Terminal[]
}
```

### UI Components

- **Terminal Creation**: Team selection dropdown available during terminal creation with "Sin asignar" (Unassigned) as default option.
- **Terminal Editing**: Team assignment can be modified when editing existing terminals.
- **Admin Table**: Terminal list displays team name or "Sin asignar" for unassigned terminals.
- **Search**: Terminal search includes team names for improved discoverability.

### Benefits

- **Organization**: Terminals can be grouped by team for better management in multi-team environments.
- **Filtering**: Admin interface allows filtering terminals by team.
- **Reporting**: Foundation for team-specific terminal reports and analytics.
- **Scalability**: Supports growth to team-based permissions and access control in the future.
