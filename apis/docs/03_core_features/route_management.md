# Route Management in Terpa Web

This document describes the route management functionalities within the Terpa Web application. Routes are likely used to organize machines for servicing, collection, or other operational purposes.

## 1. Overview

Route management allows users to define logical groupings of machines, typically for operational efficiency. This could involve creating routes for service technicians to follow for restocking, maintenance, or cash collection.

## 2. Key Components and Files

- **Route UI Components (`components/route/`)**:
  - `route-create-card.tsx`: UI for creating new routes.
  - `route-form.tsx`: The core form used for creating and editing route details.
  - `route-delete-dialog.tsx`: Confirmation dialog for deleting a route.
  - `route-dropdown.tsx`: Context menu or dropdown for route-specific actions.
  - `route-machine-add-dialog.tsx`: UI for adding machines to an existing route.
  - `route-machines-table.tsx`: Table to display machines assigned to a specific route.
- **Server Actions (`actions/route.ts`)**:
  - Contains server-side logic for route-related operations. The primary actions include:
    - `routeCreateAction(payload: unknown)`: Handles the creation of new routes. It requires an active session, validates the input payload (team slug, route name) against `routeCreateSchema`, checks for pre-existing routes with the same name within the specified team (case-insensitive), creates a new `Route` record in the database, and then calls `revalidatePath('/', 'layout')` to update cached data. Returns a success status and the created route object, or an error message.
    - `routeDeleteAction(payload: unknown)`: Manages the deletion of existing routes. It requires an active session, validates the input (team slug, route ID) using `routeDeleteSchema`, verifies that the route exists and belongs to the team, and crucially, checks if there are any machines currently associated with the route via the `RouteMachine` table. If machines are associated, deletion is prevented. Otherwise, it performs a soft delete by setting the `deletedAt` timestamp on the `Route` record and calls `revalidatePath('/team/[teamSlug]/routes', 'page')`. Returns a success status or an error message.
    - `routeSettingsAction(payload: unknown)`: Allows updating the settings of a route, specifically its name. It validates the input (team slug, route ID, new name) with `routeSettingsSchema`, ensures the route exists and belongs to the team, checks that the new name doesn't conflict with another existing route in the same team (case-insensitive, excluding the current route being modified), updates the route's `name` field, and calls `revalidatePath('/', 'layout')`. Returns a success status or an error message.
    - `addMachineToRouteAction(payload: unknown)`: Handles associating a machine with a specific route. It requires an active session, validates the input (team slug, route ID, machine ID) using `routeMachineAddSchema`, confirms the existence of both the team and the route, checks if the machine is already part of the route to prevent duplicates, and then creates a new record in the `RouteMachine` join table to establish the link. Finally, it calls `revalidatePath('/team/[teamSlug]/routes', 'page')`. Returns a success status or an error message.
- **Validation Schemas (`validation/route.ts`)**:
  - Zod schemas for validating data submitted through route creation or editing forms (e.g., route name).
- **Database Models (`Route`, `Machine`, potentially a join table like `RouteMachine` in `prisma/schema.prisma`)**:
  - `Route`: Stores core route information (ID, name, description, possibly assigned operator/user ID).
  - `Machine`: Each machine can be associated with one or more routes.
  - `RouteMachine` (or similar): If a machine can belong to multiple routes or if additional information about the machine's assignment to a route is needed (e.g., sequence number in the route), a join table would manage this many-to-many relationship.

## 3. Core Route Management Features

### 3.1. Route Creation

- **Process**: Users (likely administrators or route planners) can create new routes using the `route-create-card.tsx` component, which probably utilizes `route-form.tsx`.
- **Information**: A route would typically have a name and an optional description. It might also be possible to assign a default service technician or vehicle to the route.
- **Backend Logic**: The `routeCreateAction` Server Action in `actions/route.ts` handles:
  - Verification of an active user session via `requireSession()`.
  - Validation of the input payload (containing `teamSlug` and `name`) using the `routeCreateSchema` from `validation/route.ts`.
  - Retrieval of team details using `getTeamBySlugCached(teamSlug)`.
  - A check to prevent creating a route if another route with the same name (case-insensitive) already exists within the same team and is not deleted.
  - Creation of a new `Route` record in the database, associating it with the `teamId`.
  - Invalidation of cached paths using `revalidatePath('/', 'layout')` to ensure UI updates.
  - Returns an object like `{ success: true, route }` on success, or `{ error: "Error message" }` on failure.

### 3.2. Viewing and Managing Routes

- **Route List**: An interface (likely in an admin or operational section) would display a list of all defined routes.
- **Individual Route View**: Selecting a route would show its details, including:
  - Route name and description.
  - A list of machines currently assigned to this route, displayed using `route-machines-table.tsx`.
  - Options to manage the route (edit, delete, add/remove machines).

### 3.3. Assigning Machines to Routes

- **Process**: Users can add machines to a route using the `route-machine-add-dialog.tsx`. This might involve selecting from a list of available (unassigned or assignable) machines.
- **Backend Logic**: The `addMachineToRouteAction` Server Action in `actions/route.ts` handles this:
  - Verification of an active user session.
  - Validation of the input payload (containing `teamSlug`, `routeId`, and `machineId`) using the `routeMachineAddSchema`.
  - Confirmation that the specified team and route exist.
  - A check to ensure the machine is not already associated with the target route.
  - Creation of a new entry in the `RouteMachine` join table, linking the `routeId` and `machineId`.
  - Invalidation of the specific team's routes page cache using `revalidatePath('/team/[teamSlug]/routes', 'page')`.
  - Returns `{ success: true }` on success, or `{ error: "Error message" }` on failure.

### 3.4. Managing Machine Assignments in Routes

- **Process**: While `actions/route.ts` does not contain a specific `removeMachineFromRouteAction`, the management of machine assignments is implicitly handled. For example, the `routeDeleteAction` prevents the deletion of a route if it has machines associated with it.
- **Backend Logic**:
  - There is no dedicated server action in `actions/route.ts` for individually removing a machine from a route.
  - The `routeDeleteAction` includes a check using `prisma.routeMachine.findFirst({ where: { routeId: route.id } })`. If any `RouteMachine` entries exist for the route, the deletion is blocked with an error: "No se puede eliminar una ruta con máquinas asociadas".
  - This implies that machines must be unassigned from a route through a different mechanism or UI flow before the route itself can be deleted, or that this specific functionality (individual machine removal) might be handled elsewhere or is pending implementation.

### 3.5. Editing Route Details

- **Process**: Existing route details, specifically the name, can be modified, likely using the `route-form.tsx`.
- **Backend Logic**: The `routeSettingsAction` Server Action in `actions/route.ts` handles these changes:
  - Validation of the input payload (containing `teamSlug`, `routeId`, and the new `name`) using the `routeSettingsSchema`.
  - Confirmation that the specified team and route exist.
  - A check to prevent updating the route name if another route with the same new name (case-insensitive) already exists within the same team (excluding the route being edited).
  - Updates the `name` field of the `Route` record in the database.
  - Invalidation of cached paths using `revalidatePath('/', 'layout')`.
  - Returns `{ success: true }` on success, or `{ error: "Error message" }` on failure.

### 3.6. Deleting Routes

- **Process**: Routes can be deleted using `route-delete-dialog.tsx` for confirmation.
- **Considerations**: Deleting a route would typically unassign all machines from it. The system should clarify this impact to the user.
- **Backend Logic**: The `routeDeleteAction` Server Action in `actions/route.ts` handles the deletion:
  - Verification of an active user session.
  - Validation of the input payload (containing `teamSlug` and `routeId`) using the `routeDeleteSchema`.
  - Confirmation that the specified team and route exist and are not already deleted.
  - A critical check: it queries `prisma.routeMachine` to see if any machines are associated with the `routeId`. If `associatedMachines` is found, the deletion is prevented, and an error is returned.
  - If no machines are associated, it performs a soft delete by updating the `Route` record with a `deletedAt` timestamp.
  - Invalidation of the specific team's routes page cache using `revalidatePath('/team/[teamSlug]/routes', 'page')`.
  - Returns `{ success: true }` on success, or `{ error: "Error message" }` on failure.

### 3.7. Operational Use of Routes

- **Service Planning**: Routes form the basis for planning daily or weekly service schedules for technicians.
- **Picklist Generation**: Picklists for restocking might be generated per route, consolidating the needs of all machines on that route.
- **Efficiency**: Well-defined routes can optimize travel time and resource allocation for service operations.

Route management in Terpa Web provides the tools to organize machines into logical groups for servicing and other operational activities, contributing to streamlined field operations.
