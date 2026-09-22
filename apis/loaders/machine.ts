import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { cache } from "react";

/**
 * Get a machine from a team
 * @param teamId - The team's ID
 * @param machineId - The machine's ID
 */
export async function getTeamMachine(teamId: string, machineId: string) {
  // The machine must be part of the team
  const machine = await prisma.machine.findUnique({
    where: { id: machineId, teamId, deletedAt: null },
    select: {
      id: true,
      name: true,
      terminalSerialNumber: true,
      machineModel: true,
      machineVersion: true,
      machineSerial: true,
      tubesTotal: true,
      remoteSaleEnabledUntil: true,
      pharosTerminalCode: true,
      lastPingAt: true,
      activeUntilDate: true,
    },
  });

  // Return a 404 if the machine is not found
  if (!machine) {
    return notFound();
  }

  return machine;
}

export const getTeamMachineCached = cache(getTeamMachine);
