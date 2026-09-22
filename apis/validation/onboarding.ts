import { z } from "zod";

export const updateOnboardingTaskSchema = z.object({
  teamId: z.string().uuid(),
  taskKey: z.string(),
  newValue: z.boolean(),
});
