import { MachineFilter } from "@/components/admin/machine-filter";
import { prisma } from "@/lib/prisma";

export async function MachinesFilterProvider() {
  const machines = await prisma.machine.findMany({
    where: {
      isEnabled: true,
      deletedAt: null,
    },
    orderBy: [{ team: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      terminalSerialNumber: true,
      team: {
        select: {
          name: true,
        },
      },
    },
  });

  return <MachineFilter machines={machines} />;
}
