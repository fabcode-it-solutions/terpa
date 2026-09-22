import { prisma } from "@/lib/prisma";
import { FeatureFlagKeys } from "./constants";

export async function getFeatureFlags<K extends FeatureFlagKeys>(
  keys: K[],
): Promise<Record<K, boolean>> {
  if (keys.length === 0) {
    return {} as Record<K, boolean>;
  }

  const featureFlags = await prisma.featureFlag.findMany({
    where: { key: { in: keys } },
    select: {
      key: true,
      isEnabled: true,
    },
  });

  // Auto-create missing flags as disabled
  const missingKeys = keys.filter(
    (key) => !featureFlags.some((flag) => flag.key === key),
  );

  if (missingKeys.length > 0) {
    await prisma.$transaction(
      missingKeys.map((key) =>
        prisma.featureFlag.upsert({
          where: { key },
          update: { isEnabled: false },
          create: { key, isEnabled: false },
        }),
      ),
    );
  }

  // Initialize all flags as false
  const initialFlags = keys.reduce(
    (acc, key) => {
      acc[key] = false;
      return acc;
    },
    {} as Record<K, boolean>,
  );

  // Set actual values from database
  return featureFlags.reduce((acc, flag) => {
    const key = flag.key as K;
    if (keys.includes(key)) {
      acc[key] = flag.isEnabled || false;
    }
    return acc;
  }, initialFlags);
}
