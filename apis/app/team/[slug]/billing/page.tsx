import { InvoiceBreakdownDashboard } from "@/components/admin/invoice-breakdown-dashboard";
import { InvoiceFilters } from "@/components/admin/invoice-filters";
import { TeamInvoiceBreakdown } from "@/components/team/team-invoice-breakdown";
import { getTeamInvoiceBreakdown } from "@/loaders/invoice";
import { getTeamBySlugCached } from "@/loaders/team";
import { InvoiceStatus } from "@prisma/client";
import { isFacturamaEnabledForTeam } from "@/service/experiment";

export const dynamic = "force-dynamic";

type Props = {
  params: {
    slug: string;
  };
  searchParams: {
    query?: string;
    year?: string;
    month?: string;
    status?: string;
  };
};

export default async function Page(props: Props) {
  const now = new Date();
  const year = props.searchParams.year
    ? parseInt(props.searchParams.year)
    : now.getFullYear();
  const month = props.searchParams.month
    ? parseInt(props.searchParams.month)
    : now.getMonth() + 1;
  const validStatuses = [
    ...Object.values(InvoiceStatus),
    "NOT_INVOICED",
  ] as const;
  const status =
    props.searchParams.status &&
    validStatuses.includes(props.searchParams.status as any)
      ? (props.searchParams.status as InvoiceStatus | "NOT_INVOICED")
      : undefined;

  const [team, teamBreakdown] = await Promise.all([
    getTeamBySlugCached(props.params.slug),
    getTeamInvoiceBreakdown(props.params.slug, year, month, status),
  ]);

  const isFacturamaEnabled = await isFacturamaEnabledForTeam(team.id);

  return (
    <>
      {teamBreakdown && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
            <InvoiceFilters year={year} month={month} />
          </div>
          <InvoiceBreakdownDashboard summary={teamBreakdown.summary} />
          <TeamInvoiceBreakdown
            team={teamBreakdown}
            isFacturamaEnabled={isFacturamaEnabled}
          >
            {/* Additional action buttons can be added here */}
          </TeamInvoiceBreakdown>
        </div>
      )}
    </>
  );
}
