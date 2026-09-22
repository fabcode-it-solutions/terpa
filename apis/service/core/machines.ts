import { prisma } from "@/lib/prisma";

export async function getMachineDetails(params: {
  teamId: string;
  machineId: string;
}) {
  const machine = await prisma.machine.findUnique({
    where: { id: params.machineId, teamId: params.teamId },
    select: {
      id: true,
      name: true,
    },
  });

  return machine;
}
