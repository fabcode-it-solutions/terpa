import { InvoiceBreakdown } from "@/components/admin/invoice-breakdown";
import { InvoiceFilters } from "@/components/admin/invoice-filters";
import { TeamFilter } from "@/components/admin/team-filter";
import TeamArchiveFilter from "@/components/admin/team-archive-filter";
import { getInvoiceBreakdown } from "@/loaders/invoice";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@prisma/client";

type Props = {
  searchParams: {
    year?: string;
    month?: string;
    status?: string;
    teamId?: string;
    showArchived?: string;
  };
};

export default async function Page({ searchParams }: Props) {
  const now = new Date();
  const year = searchParams.year
    ? parseInt(searchParams.year)
    : now.getFullYear();
  const month = searchParams.month
    ? parseInt(searchParams.month)
    : now.getMonth() + 1;
  const validStatuses = [
    ...Object.values(InvoiceStatus),
    "NOT_INVOICED",
  ] as const;
  const status =
    searchParams.status && validStatuses.includes(searchParams.status as any)
      ? (searchParams.status as InvoiceStatus | "NOT_INVOICED")
      : undefined;
  const showArchived = searchParams.showArchived === "true";

  const [allTeams, teams] = await Promise.all([
    prisma.team.findMany({
      where: showArchived ? {} : { isArchived: false },
      select: {
        id: true,
        name: true,
        slug: true,
        isArchived: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    getInvoiceBreakdown(year, month, status, searchParams.teamId, showArchived),
  ]);

  return (
    <InvoiceBreakdown teams={teams}>
      <InvoiceFilters year={year} month={month} />
      <TeamFilter teams={allTeams} />
      <TeamArchiveFilter defaultShowArchived={false} />
    </InvoiceBreakdown>
  );
}
