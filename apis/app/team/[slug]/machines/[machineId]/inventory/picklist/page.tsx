import PicklistForm from "@/components/inventory/picklist-form";
import { prisma } from "@/lib/prisma";
import { getTeamMachineCached } from "@/loaders/machine";
import { getTeamBySlugCached } from "@/loaders/team";
import { redirect } from "next/navigation";

type Props = {
  params: {
    slug: string;
    machineId: string;
  };
};

export default async function Page(props: Props) {
  const team = await getTeamBySlugCached(props.params.slug);
  const machine = await getTeamMachineCached(team.id, props.params.machineId);

  const currentPicklist = await prisma.machinePicklist.findFirst({
    where: { machineId: machine.id, fulfilledAt: null, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          machineSpiral: {
            include: { product: true },
          },
        },
      },
    },
  });

  if (!currentPicklist) {
    return redirect(`/team/${team.slug}/machines/${machine.id}/inventory`);
  }

  const defaultValues: {
    items: Record<string, { id: string; quantity: string }>;
  } = { items: {} };

  // get the remaining quantity for each item
  currentPicklist.items.forEach((item) => {
    defaultValues.items[item.id] = {
      id: item.id,
      quantity: `${item.quantity}`,
    };
  });

  return (
    <PicklistForm
      picklist={currentPicklist}
      defaultValues={defaultValues}
      machineName={machine.name}
    />
  );
}
