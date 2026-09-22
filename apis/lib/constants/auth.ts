/**
 * The name of the cookie that stores the session token.
 */
export const SESSION_COOKIE_NAME = "session.token";

/**
 * The maximum duration a session is valid for in seconds.
 */
export const FULL_SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * The amount of time an OTP session is valid for in seconds.
 */
export const OTP_SESSION_DURATION_SECONDS = 60 * 15; // 15 minutes

/**
 * The amount of time a reset password token is valid for in seconds.
 */
export const RESET_PASSWORD_TOKEN_DURATION_SECONDS = 60 * 30; // 30 minutes
