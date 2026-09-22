# User Management in Terpa Web

This document details user management features in Terpa Web, extending beyond basic authentication (which is covered in the [Authentication and Authorization](./../02_architecture/authentication.md) document). It focuses on user profiles, settings, and other related functionalities.

## 1. Overview

User management encompasses all aspects of handling user accounts after they are authenticated, including managing their personal information, preferences, and application-specific settings.

## 2. Key Components and Files

- **User Profile Page (`app/profile/page.tsx`)**:
  - This is likely the central UI for users to view and manage their own information.
  - It may include forms for updating personal details, changing passwords (distinct from password reset for forgotten passwords), and managing 2FA settings.
- **Server Actions (`actions/user.ts`)**:
  - Contains server-side logic for updating user information, such as:
    - Updating profile details (name, contact information).
    - Changing user passwords (requires current password).
    - Managing user preferences or settings specific to the application.
- **Validation Schemas (`validation/user.ts`)**:
  - Zod schemas for validating data submitted through user profile forms (e.g., password change forms, profile update forms).
- **UI Components (`components/user/`)**:
  - If present, this directory would contain reusable UI components specific to user management features (e.g., a profile form component, a password change component).
- **Database Model (`User` in `prisma/schema.prisma`)**:
  - The `User` model stores all persistent user data, including profile information, preferences, and security settings like 2FA status.

## 3. Core User Management Features

### 3.1. User Profile Management

- **Viewing Profile Information**:
  - Authenticated users can view their own profile details, typically displayed on `/profile`.
- **Editing Profile Information**:
  - Users can update their profile information, specifically their `firstName`, `lastName`, `email`, and `phoneNumber`.
  - This is handled by the `updateUserProfileAction` Server Action defined in `actions/user.ts`.
  - **Input Validation**: The action uses the `userProfileSchema` from `validation/user.ts` to validate the submitted data.
  - **Email Uniqueness**: If the user attempts to change their email address, the system checks if the new email is already in use by another account. If it is, an error is returned.
  - **Data Persistence**: Upon successful validation, the user's record in the database is updated with the new information.
  - **Cache Revalidation**: After a successful update, the `/profile` path is revalidated using `revalidatePath("/profile")` to ensure the UI reflects the changes immediately.
  - **Return Value**: The action returns an object indicating success (`{ success: true }`) or an error (`{ error: "message" }`).
- **Profile Picture/Avatar**:
  - (Currently, `actions/user.ts` does not include functionality for profile picture/avatar management. This section remains a placeholder for potential future features.)

### 3.2. Password Management

- **Changing Password**:
  - Authenticated users can change their own password, typically by providing their current password and a new password (which is then confirmed).
  - This flow is distinct from the "forgot password" reset mechanism.
  - Handled by a Server Action in `actions/user.ts`, with validation from `validation/user.ts` (e.g., checking new password strength, ensuring current password is correct).

### 3.3. Two-Factor Authentication (2FA) Management

- **Setup, Verification, and Disabling 2FA**:
  - While the initial flows are part of authentication, managing 2FA (e.g., viewing current status, initiating setup if not done, or disabling it) is often part of user profile settings.
  - Pages like `app/auth/setup-2fa/page.tsx` and `app/auth/disable-2fa/page.tsx` are directly involved.
  - Server Actions in `actions/user.ts` handle the backend logic.

### 3.4. User Preferences and Settings

- **Application-Specific Settings**:
  - Users might be able to configure preferences related to their experience in Terpa Web (e.g., notification preferences, display settings, language preferences if applicable).
  - These settings would be stored in the `User` model (perhaps in a JSON field if highly variable) and managed via the profile page and corresponding Server Actions.

### 3.5. Account Activity and Security

- **Viewing Active Sessions (Advanced)**:
  - (If implemented) Users might be able to see a list of their active sessions on different devices and have the option to log out specific sessions.
- **Account Deactivation/Deletion (Advanced)**:
  - (If implemented) Users might have an option to request deactivation or deletion of their account, which would trigger a specific workflow.

## 4. Admin User Management (Brief Note)

While this document focuses on self-service user management, administrators would have broader user management capabilities within the `app/admin/` section. This could include:

- Viewing a list of all users.
- Editing user details (e.g., roles, status).
- Manually resetting passwords or 2FA for users.
- Deactivating or activating user accounts.
  These admin-specific actions would also be handled by Server Actions, likely within `actions/user.ts` or a dedicated `actions/admin/user.ts`, with appropriate authorization checks.

User management is a critical aspect of Terpa Web, ensuring users can control their personal information and security settings effectively.
