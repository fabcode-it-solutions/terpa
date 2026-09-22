# Authentication and Authorization: Terpa Web

This document describes the authentication and authorization mechanisms implemented in the Terpa Web application.

## 1. Overview

The authentication system in Terpa Web is responsible for verifying user identities and managing user sessions. It appears to be a custom implementation leveraging JSON Web Tokens (JWTs), password hashing, and Two-Factor Authentication (2FA). Authorization, while not explicitly detailed yet, would control what authenticated users can access and do within the application.

## 2. Key Components and Files

The primary files, directories, and libraries involved in authentication include:

- **Authentication Pages (`app/auth/`)**:
  - `signin/page.tsx`: User login interface.
  - `signup/page.tsx`: User registration interface.
  - `forgot/page.tsx`: Page to initiate password reset.
  - `reset/page.tsx`: Page to complete password reset using a token.
  - `2fa/page.tsx`: Interface for entering a 2FA code.
  - `setup-2fa/page.tsx`: Interface for users to enable and configure 2FA.
  - `disable-2fa/page.tsx`: Interface for users to disable 2FA.
  - `me/page.tsx`: Potentially displays current user information or acts as a protected route example.
  - `signout/`: Handles user logout, likely via a Server Action or API route.
  - `layout.tsx`: A specific layout for authentication-related pages.
- **Server Actions (`actions/user.ts`)**: Contains server-side logic for handling authentication processes such as user registration, login, password reset initiation and confirmation, 2FA setup, 2FA verification, and disabling 2FA.
- **Library Utilities**:
  - `lib/auth.ts`: Core authentication helper functions, including JWT generation and verification, password hashing/comparison, and session management logic.
  - `lib/session.ts`: Utilities for managing user sessions, potentially interacting with cookies or server-side session stores (if any).
- **Validation Schemas (`validation/auth.ts`)**: Zod schemas define the expected structure and constraints for authentication-related data (e.g., login credentials, registration details, password reset forms), ensuring data integrity and security.
- **Key Dependencies**:
  - `jsonwebtoken`: Used for creating and verifying JWTs, which are central to session management.
  - `bcryptjs`: For securely hashing user passwords before storing them.
  - `totp-generator`: For generating Time-based One-Time Passwords (TOTP) required for 2FA.
  - `qrcode.react`: For rendering QR codes, typically used during 2FA setup to allow users to easily add the account to their authenticator apps.

## 3. Authentication Flows

### 3.1. User Sign-Up (`/auth/signup`)

1.  User accesses the sign-up page and fills in the registration form (e.g., name, email, password).
2.  Input data is validated against schemas in `validation/auth.ts`.
3.  Upon submission, a Server Action in `actions/user.ts` is invoked.
4.  The action performs checks (e.g., if email already exists), hashes the password using `bcryptjs`, and creates a new user record in the database via Prisma.
5.  A verification email might be sent (if `service/mailer.ts` is integrated for this).
6.  User may be automatically signed in or redirected to the sign-in page.

### 3.2. User Sign-In (`/auth/signin`)

1.  User accesses the sign-in page and enters their credentials.
2.  Input is validated.
3.  A Server Action (e.g., `signIn` in `actions/user.ts`) is called.
4.  The action retrieves the user, compares the provided password with the stored hash.
5.  If credentials are correct:
    - If 2FA is enabled, the user is redirected to `/auth/2fa`.
    - If 2FA is not enabled, a JWT is generated (`lib/auth.ts`), a session is established (e.g., JWT stored in an HTTP-only cookie), and the user is redirected to their dashboard or intended page.
6.  If credentials are incorrect, an error message is displayed.

### 3.3. Password Reset (`/auth/forgot`, `/auth/reset`)

1.  User visits `/auth/forgot` and submits their email.
2.  A Server Action verifies the email, generates a unique, time-limited password reset token, stores it, and sends an email (via `service/mailer.ts`) with a reset link (e.g., `/auth/reset?token=...`).
3.  User clicks the link, navigates to `/auth/reset`.
4.  The page component verifies the token.
5.  If valid, the user enters and confirms a new password.
6.  A Server Action updates the hashed password in the database and invalidates the token.

### 3.4. Two-Factor Authentication (2FA)

- **Setup (`/auth/setup-2fa`)**:
  1.  User initiates 2FA setup (e.g., from profile settings).
  2.  A Server Action generates a TOTP secret.
  3.  The secret is displayed as a QR code (`qrcode.react`) and a manual entry key.
  4.  User scans QR with an authenticator app.
  5.  User enters a TOTP code from their app to verify; if correct, 2FA is enabled, and the secret is stored securely.
- **Verification (`/auth/2fa`)**:
  1.  Post-password login, if 2FA is enabled, user is redirected here.
  2.  User enters current TOTP code.
  3.  A Server Action verifies the code against the stored secret using `totp-generator`.
  4.  If valid, the session is fully authenticated.
- **Disabling (`/auth/disable-2fa`)**:
  1.  User navigates to this page (may require password/2FA confirmation).
  2.  A Server Action disables 2FA and invalidates the secret.

### 3.5. Sign Out (`/auth/signout`)

1.  User initiates sign-out.
2.  A Server Action or API route is called.
3.  Server-side logic invalidates the session (e.g., clears the JWT cookie).
4.  User is redirected (e.g., to sign-in page or homepage).

## 4. Session Management

- Sessions are primarily managed using JWTs, likely stored in secure, HTTP-only cookies to prevent XSS attacks.
- `lib/auth.ts` and `lib/session.ts` contain logic for creating, validating, and refreshing (if applicable) these tokens/sessions.
- Next.js Middleware (`middleware.ts`, if present at the root or in `app/`) or route-specific checks (e.g., in layouts or page components) are likely used to protect routes and manage access based on authentication status.

## 5. Authorization

Once a user is authenticated, authorization is handled based on their assigned role. Currently, the system defines two primary roles:

- **Admin**: Administrators have global access to all system functionalities and data.
- **Customer**: Customers (typically team members) have their access restricted to the specific teams they are connected to and the data relevant to those teams.

More granular permissions and roles are planned for future development.

- Once authenticated, user roles (e.g., 'admin', 'user', 'team_member') stored in the `User` model or JWT payload would be used to control access to specific features, pages, or actions.
- Logic within Server Components, Server Actions, API Routes, and potentially client-side components would check these roles/permissions before allowing operations or rendering UI elements.
- For example, the `app/admin/` section would be restricted to users with an 'admin' role.

## 6. Security Considerations

- **Password Hashing**: `bcryptjs` provides strong protection against password cracking.
- **JWT Security**: Tokens are signed with a strong secret key (from `.env`) and should be transmitted over HTTPS. Using HTTP-only cookies is crucial.
- **2FA**: Adds a significant layer of security.
- **Input Validation**: `zod` schemas prevent common vulnerabilities by ensuring data integrity.
- **Rate Limiting**: Recommended for login, password reset, and 2FA endpoints to prevent brute-force attacks (implementation details not yet confirmed).
- **CSRF Protection**: Next.js provides some built-in CSRF protection, especially with Server Actions. If using traditional forms to API routes, custom CSRF tokens might be needed.

This system provides a comprehensive approach to managing user identity and access within Terpa Web.
