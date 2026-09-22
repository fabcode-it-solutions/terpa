import DateFilterQuery from "@/components/filters/date-filter-query";
import MachineSalesExportDialog from "@/components/machine/machine-sales-export-dialog";
import MachineSalesTable from "@/components/machine/machine-sales-table";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/session";
import { getTeamBySlugCached } from "@/loaders/team";
import { TeamMemberRole, UserRole } from "@prisma/client";
import { startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { Lock } from "lucide-react";
import Link from "next/link";

type Props = {
  params: { slug: string; machineId: string };
  searchParams: { date: string | undefined };
};

export default async function Page(props: Props) {
  const session = requireSession();
  const team = await getTeamBySlugCached(props.params.slug);
  const teamRole = team.members[0]?.role;

  // Check if user has financial access
  const showFinancials =
    session.role === UserRole.ADMIN ||
    teamRole === TeamMemberRole.OWNER ||
    team.members[0]?.showFinancials === true;

  if (!showFinancials) {
    return (
      <div className="text-center py-8 px-6 mx-auto max-w-md">
        <div className="flex justify-center mb-4">
          <Lock className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Esta sección está disponible solo para ciertos miembros del equipo.
        </p>
      </div>
    );
  }

  const isAdmin = session.role === "ADMIN";

  const timezone = "America/Monterrey";
  const date = props.searchParams.date
    ? fromZonedTime(props.searchParams.date, timezone)
    : fromZonedTime(startOfDay(toZonedTime(new Date(), timezone)), timezone);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <DateFilterQuery date={date} />
        <div className="md:block hidden">
          <MachineSalesExportDialog />
        </div>
      </div>
      <MachineSalesTable
        date={date}
        machineId={props.params.machineId}
        isAdmin={isAdmin}
      />
    </div>
  );
}
