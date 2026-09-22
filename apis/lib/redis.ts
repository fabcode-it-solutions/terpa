import { env } from "@/lib/env";
import { Redis } from "ioredis";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
