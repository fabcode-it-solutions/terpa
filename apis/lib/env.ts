import { z } from "zod";
import "dotenv/config";

const schema = z.object({
  /**
   * The environment the application is running in.
   */
  NODE_ENV: z.string().default("development"),
  /**
   * The secret used to sign JWTs.
   */
  JWT_SECRET: z.string(),
  /**
   * The base URL from which the application is served.
   */
  APP_BASE_URL: z.string().url(),
  /**
   * The URL of the DEX service.
   */
  TERPA_DEX_SERVICE_URL: z.string().url(),
  /**
   * Pharos API Token
   */
  PHAROS_TOKEN: z.string(),
  /**
   * Sendgrid API Key
   */
  SENDGRID_API_KEY: z.string(),
  /**
   * DigitalOcean Spaces Bucket
   */
  SPACES_BUCKET: z.string(),
  /**
   * DigitalOcean Spaces Region
   */
  SPACES_REGION: z.string(),
  /**
   * DigitalOcean Spaces Access Key
   */
  SPACES_KEY: z.string(),
  /**
   * DigitalOcean Spaces Secret Key
   */
  SPACES_SECRET: z.string(),
  /**
   * Redis URL
   */
  REDIS_URL: z.string(),
  /**
   * Banxico API Key
   */
  BANXICO_API_KEY: z.string(),
  /**
   * MercadoPago Access Token
   */
  MERCADOPAGO_ACCESS_TOKEN: z.string(),
  /**
   * MercadoPago Webhook Token
   */
  MERCADOPAGO_WEBHOOK_TOKEN: z.string(),
  /**
   * Secret for cron jobs
   */
  CRON_SECRET: z.string(),
  /**
   * Facturama API Username
   */
  FACTURAMA_USERNAME: z.string(),
  /**
   * Facturama API Password
   */
  FACTURAMA_PASSWORD: z.string(),
  /**
   * Facturama API URL
   */
  FACTURAMA_API_URL: z.string().url(),
});

export const env = schema.parse(process.env);
