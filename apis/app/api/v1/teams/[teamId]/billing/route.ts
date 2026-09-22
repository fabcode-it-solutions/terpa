import { handleTeamProtectedRoute } from "@/helpers/api";
import { formatCurrency } from "@/lib/currency";
import { formatInTimeZone } from "date-fns-tz";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus, TeamMemberRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getPrioritizedInvoiceItem(invoiceItems: any[]) {
  if (invoiceItems.length === 0) return null;

  const validItems = invoiceItems.filter(
    (item) => item.invoice.status !== "PAYMENT_PENDING",
  );

  if (validItems.length === 0) return null;
  if (validItems.length === 1) return validItems[0];

  const paidInvoice = validItems.find(
    (item) => item.invoice.status === "PAYMENT_SUCCESS",
  );
  if (paidInvoice) return paidInvoice;

  return validItems[0];
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

        const now = new Date();
        const year = searchParams.get("year")
          ? parseInt(searchParams.get("year")!)
          : now.getFullYear();
        const month = searchParams.get("month")
          ? parseInt(searchParams.get("month")!)
          : now.getMonth() + 1;
        const status = searchParams.get("status");

        const timezone = "America/Monterrey";

        const userMachines = await prisma.userMachine.findMany({
          where: { userId: user.id },
          select: { machineId: true },
        });

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);

        const teamData = await prisma.team.findUnique({
          where: { id: teamId },
          select: {
            id: true,
            name: true,
            slug: true,
            machines: {
              where: { deletedAt: null },
              orderBy: { name: "asc" },
              select: {
                id: true,
                name: true,
                invoiceItems: {
                  where: {
                    startDate: {
                      gte: startDate,
                      lt: endDate,
                    },
                  },
                  select: {
                    id: true,
                    startDate: true,
                    endDate: true,
                    invoice: {
                      select: {
                        id: true,
                        status: true,
                        totalPriceCents: true,
                        createdAt: true,
                        cfdi: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!teamData) {
          return NextResponse.json(
            { error: "Team not found" },
            { status: 404 },
          );
        }

        const teamMember = await prisma.teamMember.findFirst({
          where: {
            teamId: teamId,
            userId: user.id,
          },
          select: { role: true },
        });

        const userRole = teamMember?.role;
        const isAdminOrOwner = userRole === TeamMemberRole.OWNER;
        const userMachineIds = userMachines.map((um) => um.machineId);

        const filteredMachines = teamData.machines.filter((machine) => {
          if (isAdminOrOwner) return true;

          return userMachineIds.includes(machine.id);
        });

        const summary = {
          totalMachines: 0,
          paid: 0,
          notInvoiced: 0,
          pendingPayment: 0,
          pendingReview: 0,
          rejected: 0,
          cancelled: 0,
        };

        filteredMachines.forEach((machine) => {
          const prioritizedInvoiceItem = getPrioritizedInvoiceItem(
            machine.invoiceItems,
          );

          if (!prioritizedInvoiceItem) {
            summary.notInvoiced++;
            return;
          }

          switch (prioritizedInvoiceItem.invoice.status) {
            case "PAYMENT_SUCCESS":
              summary.paid++;
              break;
            case "PAYMENT_PENDING":
              summary.pendingPayment++;
              break;
            case "PAYMENT_VERIFICATION_PENDING":
              summary.pendingReview++;
              break;
            case "PAYMENT_VERIFICATION_REJECTED":
              summary.rejected++;
              break;
            case "CANCELLED":
              summary.cancelled++;
              break;
            default:
              summary.notInvoiced++;
              break;
          }
        });

        summary.totalMachines = filteredMachines.length;

        const processedMachines = filteredMachines.map((machine) => {
          const prioritizedInvoiceItem = getPrioritizedInvoiceItem(
            machine.invoiceItems,
          );

          return {
            id: machine.id,
            name: machine.name,
            period: prioritizedInvoiceItem
              ? {
                  startDate: prioritizedInvoiceItem.startDate,
                  endDate: prioritizedInvoiceItem.endDate,
                  startDateFormatted: format(
                    new Date(prioritizedInvoiceItem.startDate),
                    "dd/MM/yyyy",
                  ),
                  endDateFormatted: format(
                    new Date(prioritizedInvoiceItem.endDate),
                    "dd/MM/yyyy",
                  ),
                  periodFormatted: `${format(new Date(prioritizedInvoiceItem.startDate), "dd/MM/yyyy")} - ${format(new Date(prioritizedInvoiceItem.endDate), "dd/MM/yyyy")}`,
                }
              : null,
            status: prioritizedInvoiceItem?.invoice.status || "NOT_INVOICED",
            statusLabel: getStatusLabel(prioritizedInvoiceItem?.invoice.status),
            invoice: prioritizedInvoiceItem
              ? {
                  id: prioritizedInvoiceItem.invoice.id,
                  totalPrice: {
                    valueCents: prioritizedInvoiceItem.invoice.totalPriceCents,
                    valueFormatted: formatCurrency(
                      prioritizedInvoiceItem.invoice.totalPriceCents,
                    ),
                  },
                  createdAt: prioritizedInvoiceItem.invoice.createdAt,
                  createdAtFormatted: formatInTimeZone(
                    prioritizedInvoiceItem.invoice.createdAt,
                    timezone,
                    "dd/MM/yyyy hh:mm:ss a",
                  ),
                  cfdi: prioritizedInvoiceItem.invoice.cfdi,
                }
              : null,
          };
        });

        return NextResponse.json({
          team: {
            id: teamData.id,
            name: teamData.name,
            slug: teamData.slug,
          },
          period: {
            year,
            month,
            startDate,
            endDate,
            periodFormatted: format(new Date(year, month - 1), "MMMM yyyy", {
              locale: es,
            }),
          },
          summary: {
            totalMachines: summary.totalMachines,
            paid: summary.paid,
            notInvoiced: summary.notInvoiced,
            pendingPayment: summary.pendingPayment,
            pendingReview: summary.pendingReview,
            rejected: summary.rejected,
            cancelled: summary.cancelled,
          },
          machines: processedMachines,
        });
      } catch (error) {
        console.error("Error fetching team billing:", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    },
  );
}

function getStatusLabel(status?: InvoiceStatus): string {
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
