import { handleTeamProtectedRoute } from "@/helpers/api";
import { formatCurrency } from "@/lib/currency";
import { formatInTimeZone } from "date-fns-tz";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus, TeamMemberRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getStatusLabel(status: InvoiceStatus): string {
  switch (status) {
    case "PAYMENT_SUCCESS":
      return "Pago Exitoso";
    case "PAYMENT_PENDING":
      return "Pago Pendiente";
    case "PAYMENT_VERIFICATION_PENDING":
      return "Revisión Pendiente";
    case "PAYMENT_VERIFICATION_REJECTED":
      return "Rechazado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return "Sin Pago";
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } },
) {
  const { teamId } = await params;
  return handleTeamProtectedRoute(
    request,
    { teamId },
    async ({ user, teamId }) => {
      try {
        const { searchParams } = new URL(request.url);

        const page = searchParams.get("page")
          ? parseInt(searchParams.get("page")!)
          : 1;
        const limit = 25;
        const offset = (page - 1) * limit;

        const timezone = "America/Monterrey";

        const teamMember = await prisma.teamMember.findFirst({
          where: {
            teamId: teamId,
            userId: user.id,
          },
          select: { role: true },
        });

        const teamRole = teamMember?.role;

        const userMachines = await prisma.userMachine.findMany({
          where: { userId: user.id },
          select: { machineId: true },
        });

        const whereClause = {
          teamId: teamId,
          status: {
            not: InvoiceStatus.PAYMENT_PENDING,
          },
          ...(teamRole === TeamMemberRole.OPERATOR
            ? {
                invoiceItems: {
                  some: {
                    machine: {
                      id: { in: userMachines.map((um) => um.machineId) },
                    },
                  },
                },
              }
            : {}),
        };

        const [invoices, totalCount] = await Promise.all([
          prisma.invoice.findMany({
            where: whereClause,
            select: {
              id: true,
              createdAt: true,
              status: true,
              totalPriceCents: true,
              exchangeRate: true,
              invoiceItems: {
                select: {
                  id: true,
                  startDate: true,
                  endDate: true,
                  machine: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
                ...(teamRole === TeamMemberRole.OPERATOR
                  ? {
                      where: {
                        machine: {
                          id: { in: userMachines.map((um) => um.machineId) },
                        },
                      },
                    }
                  : {}),
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
            skip: offset,
            take: limit,
          }),
          prisma.invoice.count({
            where: whereClause,
          }),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        const processedInvoices = invoices.map((invoice) => {
          const periods = invoice.invoiceItems.map((item) => {
            const startDate = new Date(item.startDate);
            const endDate = new Date(item.endDate);
            const monthsDiff =
              (endDate.getFullYear() - startDate.getFullYear()) * 12 +
              (endDate.getMonth() - startDate.getMonth());
            return Math.max(1, monthsDiff); // Minimum 1 month
          });

          const totalMonths = periods.reduce((sum, months) => sum + months, 0);
          const uniqueMachines = Array.from(
            new Set(invoice.invoiceItems.map((item) => item.machine.id)),
          );

          const totalUSD = invoice.totalPriceCents;
          const totalMXN = invoice.exchangeRate
            ? Math.round(totalUSD * invoice.exchangeRate)
            : null;

          return {
            id: invoice.id,
            createdAt: invoice.createdAt,
            createdAtFormatted: formatInTimeZone(
              invoice.createdAt,
              timezone,
              "dd/MM/yyyy",
            ),
            status: invoice.status,
            statusLabel: getStatusLabel(invoice.status),
            totalPriceCents: totalUSD,
            totalPrice: {
              usd: {
                valueCents: totalUSD,
                valueFormatted: formatCurrency(totalUSD),
              },
              mxn: totalMXN
                ? {
                    valueCents: totalMXN,
                    valueFormatted: formatCurrency(totalMXN),
                  }
                : null,
            },
            exchangeRate: invoice.exchangeRate,
            months: totalMonths,
            monthsLabel: totalMonths === 1 ? "1 mes" : `${totalMonths} meses`,
            machines: uniqueMachines.length,
            machinesLabel:
              uniqueMachines.length === 1
                ? "1 máquina"
                : `${uniqueMachines.length} máquinas`,
            invoiceItems: invoice.invoiceItems.map((item) => ({
              id: item.id,
              startDate: item.startDate,
              endDate: item.endDate,
              startDateFormatted: formatInTimeZone(
                item.startDate,
                timezone,
                "dd/MM/yyyy",
              ),
              endDateFormatted: formatInTimeZone(
                item.endDate,
                timezone,
                "dd/MM/yyyy",
              ),
              periodFormatted: `${formatInTimeZone(item.startDate, timezone, "dd/MM/yyyy")} - ${formatInTimeZone(item.endDate, timezone, "dd/MM/yyyy")}`,
              machine: {
                id: item.machine.id,
                name: item.machine.name,
              },
            })),
            cfdi: invoice.cfdi,
          };
        });

        const team = await prisma.team.findUnique({
          where: { id: teamId },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        });

        return NextResponse.json({
          team: {
            id: team!.id,
            name: team!.name,
            slug: team!.slug,
          },
          invoices: processedInvoices,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
          },
        });
      } catch (error) {
        console.error("Error fetching team invoice history:", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    },
  );
}
