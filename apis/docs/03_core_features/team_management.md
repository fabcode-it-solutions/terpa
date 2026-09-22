# Team Management in Terpa Web

This document outlines the team management functionalities within the Terpa Web application. Teams appear to be a core concept, allowing users to group resources and collaborate.

## 1. Overview

Team management enables users to create, join, and manage teams or organizations. This feature is crucial for scenarios where resources (like machines) or billing are handled at a team level rather than an individual user level.

## 2. Key Components and Files

- **Team Pages (`app/team/`)**:
  - `create/page.tsx`: UI for creating a new team.
  - `list/page.tsx`: UI displaying a list of teams the user is part of or can manage.
  - `[slug]/page.tsx`: A dynamic route page to display details and management options for a specific team, identified by its unique `slug`.
  - `[slug]/layout.tsx`: Potentially a layout specific to viewing/managing a single team, providing consistent navigation or sidebars.
- **Server Actions (`actions/team.ts`)**:
  - Contains server-side logic for all team-related operations:
    - Creating new teams.
    - Updating team details (e.g., name).
    - Deleting teams (if allowed, and with appropriate checks).
    - Managing team members (inviting, removing, changing roles - if this functionality exists).
    - Fetching team data.
- **Validation Schemas (`validation/teams.ts`)**:
  - Zod schemas for validating data submitted through team creation or editing forms (e.g., team name, slug format).
- **UI Components (`components/team/`)**:
  - This directory would house reusable UI components specific to team management, such as:
    - Team creation/edit forms.
    - Team list item display.
    - Team member management interface (if applicable).
- **Data Loaders (`loaders/team.ts`)**:
  - Functions dedicated to fetching team-related data, likely used by Server Components within the `app/team/` routes.
- **Database Models (`Team`, `User`, potentially `TeamMember` in `prisma/schema.prisma`)**:
  - `Team`: Stores core team information (ID, name, slug, owner ID, `contactNumber`, etc.). The `contactNumber` is an optional field for a direct contact number for the team.
  - `User`: Relates to `Team` as an owner or member.
  - `TeamMember` (or similar join table): If a many-to-many relationship exists between users and teams for membership, this table would manage that, possibly including roles within the team.
- **API Endpoints (`app/api/team/`)**:
  - If present, these API routes might provide alternative ways to interact with team data, perhaps for client-side fetching patterns not covered by Server Actions or for external integrations.

## 3. Core Team Management Server Actions

The `actions/team.ts` file provides several server actions to manage teams, members, documents, and related data. These actions are typically invoked from forms or UI elements within the application.

### 3.1. `teamCreateAction(payload: unknown)`

- **Purpose**: Creates a new team and associates the current user as its owner.
- **Parameters**:
  - `payload`: An object containing team and user details, validated against `teamCreateSchema` from `validation/teams.ts`. Expected fields include `firstName`, `lastName`, `phoneNumber`, `name` (team name), `legalEntityType`, `totalTerminals`, `machineModelBrand`, `terminalSerialDigits`.
- **Core Logic**:
  1.  Requires an active user session.
  2.  Redirects if the user is not found or already belongs to a team.
  3.  Updates the current user's personal information (`firstName`, `lastName`, `phoneNumber`).
  4.  Creates a new `Team` record in the database with a generated `slug` (e.g., `team-name-xxxx`).
  5.  Creates a `TeamMember` record, assigning the current user as `OWNER` of the new team.
- **Returns**:
  - On success: `{ success: true, team: { id: team.id, slug: team.slug } }`.
  - Redirects to `/auth/signout` if user not found, or `/team/[teamSlug]` if user already in a team.
- **Side Effects**:
  - Database: Creates `User` (if updated), `Team`, and `TeamMember` records.

### 3.2. `teamManageAction(payload: unknown)`

- **Purpose**: Allows an ADMIN user to update a team's information, including contact details and business activities.
- **Parameters**:
  - `payload`: An object containing team details to update, validated against `teamManageSchema`. Includes `slug`, `name`, `contactNumber` (optional team contact phone), `pharosMerchantCode`, `costPerMachineCents`, `legalEntityType`, `totalTerminals`, `machineModelBrand`, `terminalSerialDigits`, `website`, `productServiceDescription`, and `businessActivities`.
- **Core Logic**:
  1.  Requires an active user session and checks if the user has `ADMIN` role.
  2.  Finds the team by its `slug`.
  3.  Updates the `Team` record with the provided details, including `contactNumber`.
  4.  If `businessActivities` are provided:
      - Deletes all existing `TeamBusinessActivity` records for the team.
      - Creates new `TeamBusinessActivity` records based on the input.
- **Returns**:
  - On success: `{ success: true }`.
  - On failure (e.g., permission denied, team not found): `{ error: "Error message" }`.
- **Side Effects**:
  - Database: Updates `Team` record, deletes and creates `TeamBusinessActivity` records.
  - Cache: `revalidatePath("/", "layout")`.

### 3.3. `teamSalesExportAction(payload: unknown)`

- **Purpose**: Exports sales data for a team within a specified date range as a CSV string.
- **Parameters**:
  - `payload`: An object validated against `teamSalesExportSchema`. Includes `teamSlug`, `from` (date), `to` (date), and optionally `machineIds` (array of machine IDs to filter sales).
- **Core Logic**:
  1.  Retrieves the team by `teamSlug`.
  2.  Sets the timezone to "America/Mexico_City" for date processing.
  3.  Fetches `Sale` records from the database, filtered by date range, team, and optionally by `machineIds`.
  4.  Selects specific fields for the export: `createdAt`, `machineProductCost`, `machineProductId`, `machineMdbProductId`, `paymentMethod`, product details (`name`, `priceCents`, `sku`), and machine name.
  5.  Formats the fetched sales data into a CSV string using `csv-stringify/sync`.
- **Returns**:
  - On success: `{ success: true, data: "CSV string" }`.
- **Side Effects**: None directly on the database.

### 3.4. `teamMemberCreateAction(payload: unknown)`

- **Purpose**: Adds a new member to a team. If the user doesn't exist, a new user account is created.
- **Parameters**:
  - `payload`: An object validated against `teamMemberCreateSchema`. Includes `teamSlug` and `email` of the user to be added.
- **Core Logic**:
  1.  Requires an active user session.
  2.  Retrieves the team by `teamSlug`.
  3.  Checks if a user exists with the provided `email`.
      - If not, creates a new `User` with a randomly generated password and sends a welcome email (`sendTeamWelcomeEmail`) with the temporary password.
  4.  If the existing user has an `ADMIN` role, returns an error.
  5.  Creates a `TeamMember` record, linking the user to the team with the `OPERATOR` role.
- **Returns**:
  - On success: `{ success: true, userId: existingUser.id }`.
  - On failure (e.g., user is an admin): `{ success: false, error: "Error message" }`.
- **Side Effects**:
  - Database: Potentially creates a `User` record, creates a `TeamMember` record.
  - Email: May send a welcome email to the new user.
  - Cache: `revalidatePath("/", "layout")`.

### 3.5. `teamMemberRemoveAction(payload: unknown)`

- **Purpose**: Removes a member from a team and also removes their assignments to any machines within that team.
- **Parameters**:
  - `payload`: An object validated against `teamMemberRemoveSchema`. Includes `teamSlug` and `userId` of the member to be removed.
- **Core Logic**:
  1.  Requires an active user session.
  2.  Retrieves the team by `teamSlug`.
  3.  Performs a database transaction to:
      - Delete the `TeamMember` record.
      - Delete all `UserMachine` records associating the user with machines belonging to the team.
- **Returns**:
  - On success: `{ success: true }`.
- **Side Effects**:
  - Database: Deletes `TeamMember` and `UserMachine` records.
  - Cache: `revalidatePath("/", "layout")`.

### 3.6. `teamDocumentsUpdateAction(formData: FormData)`

- **Purpose**: Allows a team member to upload multiple documents related to their team's onboarding process, update team details, and mark onboarding as complete. Sends an email with the uploaded documents.
- **Parameters**:
  - `formData`: A `FormData` object. Expected fields include:
    - `slug`: Team slug.
    - `website`: Team website (optional).
    - `productServiceDescription`: Description of products/services (optional).
    - `electronicSignature`: Base64 encoded PNG image string (optional).
    - `businessActivities`: JSON string of business activities.
    - File fields for various document types (e.g., `businessOperationProofFiles`, `legalRepresentativeIdFiles`, `taxSituationFiles`, etc.).
  - Data is validated against `teamDocumentsServerSchema`.
- **Core Logic**:
  1.  Requires an active user session and retrieves the current user.
  2.  Redirects to the team page if `onboardingCompleted` is already true for the team.
  3.  Processes various types of uploaded files:
      - For each file type (e.g., `BUSINESS_OPERATION_PROOF`, `LEGAL_REPRESENTATIVE_ID`), calls the `processFiles` helper.
      - `processFiles` uploads each file to an S3 bucket (DigitalOcean Spaces) and prepares metadata (URL, name, size, type) and base64 content for email.
  4.  Performs a database transaction to:
      - Update the `Team` record: sets `website`, `productServiceDescription`, `onboardingCompleted` to `true`, and stores `electronicSignature` (if provided and valid).
      - Deletes existing `TeamBusinessActivity` records for the team.
      - Creates new `TeamBusinessActivity` records based on `parsed.businessActivities`.
      - Creates `TeamDocument` records for all successfully uploaded files.
  5.  If files were uploaded, sends an email (`sendEmailWithAttachments`) to a predefined recipient. The email includes team and user details and the uploaded documents as attachments.
- **Returns**:
  - On success: `{ success: true }`.
  - On failure (e.g., user not found): `{ success: false, error: "Error message" }`.
  - Redirects to `/team/[slug]` if onboarding was already complete.
- **Side Effects**:
  - S3: Uploads multiple files.
  - Database: Updates `Team`, deletes/creates `TeamBusinessActivity`, creates `TeamDocument` records.
  - Email: Sends an email with document attachments.
  - Cache: `revalidatePath("/", "layout")`.

### 3.7. `adminTeamDocumentsUpdateAction(formData: FormData)`

- **Purpose**: Allows an ADMIN user to selectively update a team's documents, website, product/service description, and business activities.
- **Parameters**:
  - `formData`: A `FormData` object. Similar to `teamDocumentsUpdateAction` but fields are more optional. Includes `slug`, and optionally `website`, `productServiceDescription`, `businessActivities` (JSON string), and various file fields (e.g., `businessOperationProofFiles`, `signedContractFiles`).
- **Core Logic**:
  1.  Requires an active user session and checks if the user has `ADMIN` role.
  2.  Retrieves the team by `slug`.
  3.  Processes uploaded files using the `processFiles` helper (uploads to S3, prepares metadata). This includes a `SIGNED_CONTRACT` document type.
  4.  Performs a database transaction if there are operations to perform:
      - Updates `Team` record with `website` and `productServiceDescription` if provided.
      - If `businessActivities` are provided, deletes existing ones and creates new ones.
      - Creates `TeamDocument` records for any newly uploaded files.
- **Returns**:
  - On success: `{ success: true }`.
  - On failure (e.g., permission denied, team not found): `{ success: false, error: "Error message" }`.
- **Side Effects**:
  - S3: Uploads multiple files.
  - Database: Updates `Team`, potentially deletes/creates `TeamBusinessActivity`, creates `TeamDocument` records.
  - Cache: `revalidatePath("/", "layout")` and `revalidatePath("/admin/teams/[teamSlug]", "page")`.

### 3.8. `adminTeamDocumentDeleteAction(payload: unknown)`

- **Purpose**: Allows an ADMIN user to soft-delete a specific team document.
- **Parameters**:
  - `payload`: An object validated against `teamDocumentDeleteSchema`. Includes `documentId` and `teamSlug`.
- **Core Logic**:
  1.  Requires an active user session and checks if the user has `ADMIN` role.
  2.  Finds the `TeamDocument` by `documentId`, ensuring it's not already soft-deleted (`deletedAt` is null).
  3.  Updates the `TeamDocument` record by setting its `deletedAt` field to the current timestamp.
- **Returns**:
  - On success: `{ success: true }`.
  - On failure (e.g., permission denied, document not found): `{ success: false, error: "Error message" }`.
- **Side Effects**:
  - Database: Updates `TeamDocument` record (soft delete).
  - Cache: `revalidatePath("/", "layout")` and `revalidatePath("/admin/teams/[teamSlug]", "page")`.

### Helper Function: `processFiles`

- **Purpose**: A non-exported helper function used by `teamDocumentsUpdateAction` and `adminTeamDocumentsUpdateAction`.
- **Parameters**: `teamId`, `files` (array of `File` objects), `documentType` (enum `TeamDocumentType`).
- **Logic**:
  1.  Iterates through each file.
  2.  Converts file to a buffer and then to base64 string (for email attachments).
  3.  Generates a unique filename for S3 storage (e.g., `team-documents/[teamId]/[documentType]/[timestamp]-[randomString].[extension]`).
  4.  Uploads the file buffer to S3 using `PutObjectCommand`.
  5.  Collects file metadata (`fileUrl`, `fileName`, `fileSize`, `fileType`, `type`, `teamId`) and the `content` (base64 string).
- **Returns**: An array of objects, each containing the S3 URL, original filename, size, type, document type, team ID, and base64 content of an uploaded file.

This detailed breakdown provides a clearer understanding of the team management capabilities offered by the server actions.

## 4. Admin Team Listing and Information Display

The primary interface for administrators to view and manage multiple teams is located at `app/admin/teams/page.tsx`.

### 4.1. Overview

This page presents a sortable and searchable table listing all teams in the system. Key information displayed for each team includes:

- Name
- Pharos Merchant Code
- Number of Enabled Machines
- Cost Per Machine
- Contact Information (Email and Phone)
- Creation Date

### 4.2. Contact Information Display Logic

A notable feature recently implemented is the enhanced display of contact phone numbers:

- **Primary Contact**: The table attempts to display the team's dedicated `contactNumber` first. This field is part of the `Team` model and can be managed via the `teamManageAction`.
- **Fallback Contact**: If a team's `contactNumber` is not set (i.e., it's `null` or an empty string), the system falls back to displaying the `phoneNumber` of the user who is designated as the `OWNER` of that team.
- **Data Fetching**: To support this, the Prisma query within `app/admin/teams/page.tsx` has been updated to select the `contactNumber` field from the `Team` model alongside other team details.

### 4.3. Team Dropdown and WhatsApp Link

Each row in the admin teams table includes a `TeamDropdown` component (`components/team/team-dropdown.tsx`). This dropdown provides quick links to various team-specific pages and actions.

- **WhatsApp Link de Pago**: One of the actions in this dropdown is "WhatsApp Link de Pago". The phone number used to generate this link also follows the new contact logic:
  - It prioritizes the team's `contactNumber`.
  - If `contactNumber` is not available, it uses the `phoneNumber` of the team's `OWNER`.
- The `TeamDropdown` component's props and internal logic have been updated to accept and utilize the `team.contactNumber` field.

### 4.4. Admin Team Management View

When an administrator navigates to manage a specific team (e.g., from the team listing page), they are presented with a tabbed interface located at `app/admin/teams/[slug]/manage/`. This structure organizes the various management tasks into logical sections, improving usability.

- **Layout (`app/admin/teams/[slug]/manage/layout.tsx`):** This file provides the shared UI for the management section, including breadcrumbs and the tab navigation component (`<ManageTabs />`).
- **"General" Tab (`app/admin/teams/[slug]/manage/page.tsx`):** This is the default tab. It contains the `TeamManageForm`, which allows administrators to edit the team's core details, such as its name, contact information, and business activities.
- **"Documentos" Tab (`app/admin/teams/[slug]/manage/documents/page.tsx`):** This tab is dedicated to document management. It displays the `AdminTeamDocumentsDisplay` component, which allows admins to view, upload, and manage documents associated with the team, such as contracts and legal IDs.
