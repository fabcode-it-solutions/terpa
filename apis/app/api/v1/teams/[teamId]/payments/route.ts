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
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "25");
        const offset = (page - 1) * limit;

        const year = searchParams.get("year");
        const month = searchParams.get("month");
        const status = searchParams.get("status");

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

        let dateFilter = {};
        if (year && month) {
          const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          const endDate = new Date(parseInt(year), parseInt(month), 1);
          dateFilter = {
            createdAt: {
              gte: startDate,
              lt: endDate,
            },
          };
        } else if (year) {
          const startDate = new Date(parseInt(year), 0, 1);
          const endDate = new Date(parseInt(year) + 1, 0, 1);
          dateFilter = {
            createdAt: {
              gte: startDate,
              lt: endDate,
            },
          };
        }

        let statusFilter: InvoiceStatus | { not: InvoiceStatus } = status
          ? InvoiceStatus[status as keyof typeof InvoiceStatus]
          : { not: InvoiceStatus.PAYMENT_PENDING };

        const whereClause = {
          teamId: teamId,
          status: statusFilter,
          ...dateFilter,
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
              paymentMethod: true,
              paidAt: true,
              invoiceItems: {
                select: {
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

        const formattedInvoices = invoices.map((invoice) => {
          const periods = invoice.invoiceItems.map((item) => {
            const startDate = new Date(item.startDate);
            const endDate = new Date(item.endDate);
            const monthsDiff =
              (endDate.getFullYear() - startDate.getFullYear()) * 12 +
              (endDate.getMonth() - startDate.getMonth());
            return Math.max(1, monthsDiff);
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
            createdAtFormatted: formatInTimeZone(
              invoice.createdAt,
              timezone,
              "dd/MM/yyyy",
            ),
            status: invoice.status,
            statusLabel: getStatusLabel(invoice.status),
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
            paymentMethod: invoice.paymentMethod,
            paidAt: invoice.paidAt,
            paidAtFormatted: invoice.paidAt
              ? formatInTimeZone(invoice.paidAt, timezone, "dd/MM/yyyy")
              : null,
            months: totalMonths,
            monthsLabel: totalMonths === 1 ? "1 mes" : `${totalMonths} meses`,
            machines: uniqueMachines.length,
            machinesLabel:
              uniqueMachines.length === 1
                ? "1 máquina"
                : `${uniqueMachines.length} máquinas`,
            period:
              invoice.invoiceItems.length > 0
                ? {
                    startDate: invoice.invoiceItems[0].startDate,
                    endDate: invoice.invoiceItems[0].endDate,
                    startDateFormatted: formatInTimeZone(
                      invoice.invoiceItems[0].startDate,
                      timezone,
                      "dd/MM/yyyy",
                    ),
                    endDateFormatted: formatInTimeZone(
                      invoice.invoiceItems[0].endDate,
                      timezone,
                      "dd/MM/yyyy",
                    ),
                    periodFormatted: `${formatInTimeZone(invoice.invoiceItems[0].startDate, timezone, "dd/MM/yyyy")} - ${formatInTimeZone(invoice.invoiceItems[0].endDate, timezone, "dd/MM/yyyy")}`,
                  }
                : null,
            machinesList: invoice.invoiceItems.map((item) => ({
              id: item.machine.id,
              name: item.machine.name,
            })),
            cfdi: invoice.cfdi
              ? {
                  status: invoice.cfdi.status,
                  facturamaId: invoice.cfdi.facturamaId,
                  folio: invoice.cfdi.folio,
                }
              : null,
          };
        });

        const summary = {
          totalInvoices: totalCount,
          totalAmount: {
            usd: {
              valueCents: invoices.reduce(
                (sum, invoice) => sum + Number(invoice.totalPriceCents),
                0,
              ),
              valueFormatted: formatCurrency(
                invoices.reduce(
                  (sum, invoice) => sum + Number(invoice.totalPriceCents),
                  0,
                ),
              ),
            },
            mxn: invoices.some((inv) => inv.exchangeRate)
              ? {
                  valueCents: invoices.reduce((sum, invoice) => {
                    const mxnAmount = invoice.exchangeRate
                      ? Math.round(
                          Number(invoice.totalPriceCents) *
                            invoice.exchangeRate,
                        )
                      : 0;
                    return sum + mxnAmount;
                  }, 0),
                  valueFormatted: formatCurrency(
                    invoices.reduce((sum, invoice) => {
                      const mxnAmount = invoice.exchangeRate
                        ? Math.round(
                            Number(invoice.totalPriceCents) *
                              invoice.exchangeRate,
                          )
                        : 0;
                      return sum + mxnAmount;
                    }, 0),
                  ),
                }
              : null,
          },
          statusCounts: {
            paid: invoices.filter(
              (inv) => inv.status === InvoiceStatus.PAYMENT_SUCCESS,
            ).length,
            pending: invoices.filter(
              (inv) => inv.status === InvoiceStatus.PAYMENT_PENDING,
            ).length,
            verificationPending: invoices.filter(
              (inv) =>
                inv.status === InvoiceStatus.PAYMENT_VERIFICATION_PENDING,
            ).length,
            rejected: invoices.filter(
              (inv) =>
                inv.status === InvoiceStatus.PAYMENT_VERIFICATION_REJECTED,
            ).length,
            cancelled: invoices.filter(
              (inv) => inv.status === InvoiceStatus.CANCELLED,
            ).length,
          },
        };

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
          invoices: formattedInvoices,
          summary,
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
        console.error("Error fetching payment history:", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    },
  );
}
