import AdminDashboardClient from "@/components/admin/admin-dashboard-client";
import { requireSession } from "@/lib/session";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  differenceInDays,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

type Props = {
  searchParams: {
    from: string | undefined;
    to: string | undefined;
  };
};

export default async function AdminDashboard(props: Props) {
  const session = requireSession();

  if (session.role !== UserRole.ADMIN) {
    redirect("/admin/teams");
  }

  const timezone = "America/Monterrey";
  const date = {
    from: props.searchParams.from
      ? fromZonedTime(startOfDay(props.searchParams.from), timezone)
      : fromZonedTime(
          startOfMonth(startOfDay(toZonedTime(new Date(), timezone))),
          timezone,
        ),
    to: props.searchParams.to
      ? fromZonedTime(endOfDay(props.searchParams.to), timezone)
      : fromZonedTime(
          endOfMonth(endOfDay(toZonedTime(new Date(), timezone))),
          timezone,
        ),
  };

  const dateRangeDays = differenceInDays(date.to, date.from);
  const isDateRangeTooLong = dateRangeDays > 95;

  return (
    <AdminDashboardClient
      from={date.from}
      to={date.to}
      isDateRangeTooLong={isDateRangeTooLong}
    />
  );
}
