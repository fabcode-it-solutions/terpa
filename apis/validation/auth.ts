import { z } from "zod";

/**
 * Validation schema to validate the request body for sign in
 */
export const authSignInSchema = z.object({
  /**
   * Email of the user
   */
  email: z.string().email(),

  /**
   * Password of the user
   */
  password: z
    .string()
    .min(6, "La contraseña debe contener al menos 6 caracteres."),
});

/**
 * Validation schema to validate the request body for sign up
 */
export const authSignUpSchema = z
  .object({
    /**
     * Email of the user
     */
    email: z
      .string()
      .email()
      .transform((val) => val.toLowerCase()),

    /**
     * Password of the user
     */
    password: z
      .string()
      .min(6, "La contraseña debe contener al menos 6 caracteres."),

    /**
     * Password confirmation of the user
     */
    confirmPassword: z
      .string()
      .min(6, "La contraseña debe contener al menos 6 caracteres."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

/**
 * Validation schema to validate the request body for OTP verification
 */
export const authOptSchema = z.object({
  /**
   * OTP of the user
   */
  otp: z.string().length(6, "El código debe contener 6 dígitos."),
});

/**
 * Validation schema to validate the request body for forgot password
 */
export const authForgotPasswordSchema = z.object({
  /**
   * Email of the user
   */
  email: z.string().email(),
});

/**
 * Validation schema to validate the request body for reset password
 */
export const authResetPasswordSchema = z
  .object({
    /**
     * JWT with the intent, email and expiry
     */
    token: z.string(),

    /**
     * Password of the user
     */
    password: z
      .string()
      .min(6, "La contraseña debe contener al menos 6 caracteres."),

    /**
     * Password confirmation of the user
     */
    confirmPassword: z
      .string()
      .min(6, "La contraseña debe contener al menos 6 caracteres."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coincidenå√",
    path: ["confirmPassword"],
  });
