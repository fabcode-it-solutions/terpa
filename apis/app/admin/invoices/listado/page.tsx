import { InvoiceFilters } from "@/components/admin/invoice-filters";
import { InvoicesTable } from "@/components/admin/invoices-table";
import { TeamFilter } from "@/components/admin/team-filter";
import {
  getEndOfMonthInMonterrey,
  getStartOfMonthInMonterrey,
} from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@prisma/client";

type Props = {
  searchParams: {
    status?: string;
    teamId?: string;
    year?: string;
    month?: string;
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

  const startDate = getStartOfMonthInMonterrey(year, month);
  const endDate = getEndOfMonthInMonterrey(year, month);

  const [teams, invoices] = await Promise.all([
    prisma.team.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    // If "NOT_INVOICED" is selected, return empty array since there are no invoices for that status
    searchParams.status === "NOT_INVOICED"
      ? Promise.resolve([])
      : prisma.invoice.findMany({
          where: {
            status: searchParams.status
              ? (searchParams.status as InvoiceStatus)
              : {
                  not: InvoiceStatus.PAYMENT_PENDING,
                },
            teamId: searchParams.teamId ? searchParams.teamId : undefined,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            id: true,
            createdAt: true,
            totalPriceCents: true,
            adjustedAmountCents: true,
            exchangeRate: true,
            status: true,
            team: {
              select: {
                name: true,
                slug: true,
              },
            },
            cfdi: {
              select: {
                status: true,
                facturamaId: true,
                folio: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
        <InvoiceFilters year={year} month={month} />
        <TeamFilter teams={teams} />
      </div>
      <InvoicesTable invoices={invoices} />
    </div>
  );
}
