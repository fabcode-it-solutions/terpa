# Two-Factor Authentication (TOTP) Flow

This project now supports the server-side challenge flow that returns either a `full` login token or a temporary `totp` token.

## Token Types

- `full`: Standard bearer token; grants full API access and is stored in the auth store/native bridge.
- `totp`: Short-lived token that indicates an extra verification step is required. It must be exchanged—together with a 6-digit TOTP code—for a `full` token.

## Client Flow

1. The login request (`POST /api/v1/auth/login` with Basic auth) returns `{ token, type }`.
2. When `type === "totp"`, the app navigates to `/ (auth) /totp`, prompting the user for the 6-digit code from their authenticator.
3. The app exchanges the temporary token via `POST /api/v1/auth/exchange-totp-token` using the headers/body:

   ```http
   Authorization: Bearer <totp-token>
   Content-Type: application/json
   ```

   ```json
   {
     "otp": "<6-digit-code>"
   }
   ```

4. The exchange returns a `full` token (and optional user payload). The app stores this token and resumes the authenticated experience.

## Manual Testing

For local/manual testing you can generate valid 6-digit TOTP codes with the shared secret below.

1. Open https://totp.danhersam.com/ (or any RFC 6238 compatible TOTP generator).
2. Enter the shared secret `PKSVEZMLTI3OCY6A`.
3. Use the displayed 6-digit code on the `/ (auth) /totp` screen immediately (codes rotate every 30 seconds).

> **Note:** The secret above is intended for internal QA-only scenarios. Do not ship it with production builds or share it outside trusted testers.
