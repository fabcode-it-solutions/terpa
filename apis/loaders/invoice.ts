import {
  getEndOfMonthInMonterrey,
  getStartOfMonthInMonterrey,
} from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@prisma/client";

export async function getTeamInvoiceHistory(
  teamSlug: string,
  page: number = 1,
  limit: number = 25,
) {
  const offset = (page - 1) * limit;

  // Get team by slug first
  const team = await prisma.team.findUnique({
    where: { slug: teamSlug },
    select: { id: true },
  });

  if (!team) {
    throw new Error("Team not found");
  }

  // Fetch invoices excluding PAYMENT_PENDING status
  const [invoices, totalCount] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        teamId: team.id,
        status: {
          not: InvoiceStatus.PAYMENT_PENDING,
        },
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
        totalPriceCents: true,
        exchangeRate: true,
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
      where: {
        teamId: team.id,
        status: {
          not: InvoiceStatus.PAYMENT_PENDING,
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    invoices,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getInvoiceBreakdown(
  year: number,
  month: number,
  status?: InvoiceStatus | "NOT_INVOICED",
  teamId?: string,
  showArchived?: boolean,
) {
  const startDate = getStartOfMonthInMonterrey(year, month);
  const endDate = getEndOfMonthInMonterrey(year, month);

  const teams = await prisma.team.findMany({
    where: {
      ...(teamId && { id: teamId }),
      ...(showArchived === false && { isArchived: false }),
      createdAt: {
        lte: endDate,
      },
      machines: {
        some: {
          createdAt: {
            lte: endDate,
          },
          deletedAt: null,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      contactNumber: true,
      isArchived: true,
      machines: {
        where: {
          createdAt: {
            lte: endDate,
          },
          deletedAt: null,
        },
        orderBy: {
          name: "asc",
        },
        include: {
          invoiceItems: {
            where: {
              // Find invoice items where the viewing month overlaps with the invoice period
              // This handles cross-month invoices (e.g., yearly invoices)
              AND: [
                { startDate: { lte: endDate } }, // Invoice starts before or during viewing month
                { endDate: { gt: startDate } }, // Invoice ends after viewing month start (exclusive)
                {
                  invoice: {
                    status: {
                      not: InvoiceStatus.PAYMENT_PENDING,
                    },
                  },
                },
              ],
            },
            include: {
              invoice: {
                include: {
                  cfdi: {
                    select: {
                      status: true,
                      facturamaId: true,
                      folio: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              invoice: {
                createdAt: "desc", // Order by newest first for fallback
              },
            },
          },
        },
      },
      members: {
        select: {
          role: true,
          user: {
            select: {
              phoneNumber: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return teams
    .map((team) => {
      const summary = {
        totalMachines: 0, // Will be updated after filtering
        paid: 0,
        pendingPayment: 0,
        pendingReview: 0,
        rejected: 0,
        cancelled: 0,
        notInvoiced: 0,
      };

      // Filter machines based on status filter (applied after prioritization)
      const filteredMachines = team.machines.filter((machine) => {
        // Apply prioritization logic for multiple invoices per machine
        const prioritizedInvoiceItem = getPrioritizedInvoiceItem(
          machine.invoiceItems,
        );

        // If status filter is applied, only include machines where the winning item matches the status
        if (status) {
          if (status === "NOT_INVOICED") {
            // For NOT_INVOICED filter, only include machines with no invoice items
            return !prioritizedInvoiceItem;
          } else {
            if (!prioritizedInvoiceItem) {
              // No invoice items, doesn't match any specific invoice status
              return false;
            }
            // Check if the winning invoice item matches the selected status
            return prioritizedInvoiceItem.invoice.status === status;
          }
        }

        // If no status filter, include all machines (existing behavior)
        return true;
      });

      // Update summary based on filtered machines
      summary.totalMachines = filteredMachines.length;

      filteredMachines.forEach((machine) => {
        // Apply prioritization logic for multiple invoices per machine
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
        }
      });

      // Update the machines data structure to include only the prioritized invoice item
      const processedTeam = {
        ...team,
        machines: filteredMachines.map((machine) => ({
          ...machine,
          invoiceItems:
            machine.invoiceItems.length > 0
              ? [getPrioritizedInvoiceItem(machine.invoiceItems)!].filter(
                  Boolean,
                )
              : [],
        })),
        summary,
      };

      return processedTeam;
    })
    .filter((team) => {
      // Only show teams that have at least one machine after filtering
      return team.machines.length > 0;
    });
}

export async function getTeamInvoiceBreakdown(
  teamSlug: string,
  year: number,
  month: number,
  status?: InvoiceStatus | "NOT_INVOICED",
) {
  const startDate = getStartOfMonthInMonterrey(year, month);
  const endDate = getEndOfMonthInMonterrey(year, month);

  const team = await prisma.team.findUnique({
    where: {
      slug: teamSlug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      contactNumber: true,
      machines: {
        where: {
          createdAt: {
            lte: endDate,
          },
          deletedAt: null,
        },
        orderBy: {
          name: "asc",
        },
        include: {
          invoiceItems: {
            where: {
              // Find invoice items where the viewing month overlaps with the invoice period
              // This handles cross-month invoices (e.g., yearly invoices)
              AND: [
                { startDate: { lte: endDate } }, // Invoice starts before or during viewing month
                { endDate: { gt: startDate } }, // Invoice ends after viewing month start (exclusive)
                {
                  invoice: {
                    status: {
                      not: InvoiceStatus.PAYMENT_PENDING,
                    },
                  },
                },
              ],
            },
            include: {
              invoice: {
                include: {
                  cfdi: {
                    select: {
                      status: true,
                      facturamaId: true,
                      folio: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              invoice: {
                createdAt: "desc", // Order by newest first for fallback
              },
            },
          },
        },
      },
      members: {
        select: {
          role: true,
          user: {
            select: {
              phoneNumber: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!team) {
    return null;
  }

  const summary = {
    totalMachines: 0,
    paid: 0,
    pendingPayment: 0,
    pendingReview: 0,
    rejected: 0,
    cancelled: 0,
    notInvoiced: 0,
  };

  // Filter machines based on status filter (applied after prioritization)
  const filteredMachines = team.machines.filter((machine) => {
    // Apply prioritization logic for multiple invoices per machine
    const prioritizedInvoiceItem = getPrioritizedInvoiceItem(
      machine.invoiceItems,
    );

    // If status filter is applied, only include machines where the winning item matches the status
    if (status) {
      if (status === "NOT_INVOICED") {
        // For NOT_INVOICED filter, only include machines with no invoice items
        return !prioritizedInvoiceItem;
      } else {
        if (!prioritizedInvoiceItem) {
          // No invoice items, doesn't match any specific invoice status
          return false;
        }
        // Check if the winning invoice item matches the selected status
        return prioritizedInvoiceItem.invoice.status === status;
      }
    }

    // If no status filter, include all machines (existing behavior)
    return true;
  });

  // Update summary based on filtered machines
  summary.totalMachines = filteredMachines.length;

  filteredMachines.forEach((machine) => {
    // Apply prioritization logic for multiple invoices per machine
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
    }
  });

  // Update the machines data structure to include only the prioritized invoice item
  const processedTeam = {
    ...team,
    machines: filteredMachines.map((machine) => ({
      ...machine,
      invoiceItems:
        machine.invoiceItems.length > 0
          ? [getPrioritizedInvoiceItem(machine.invoiceItems)!].filter(Boolean)
          : [],
    })),
    summary,
  };

  return processedTeam;
}

/**
 * Prioritizes invoice items based on:
 * 1. PAID status (PAYMENT_SUCCESS) - highest priority
 * 2. Newest invoice (by createdAt) - fallback (excluding PAYMENT_PENDING)
 * Note: PAYMENT_PENDING invoices are ignored to treat them as "Sin Pago"
 */
function getPrioritizedInvoiceItem(invoiceItems: any[]) {
  if (invoiceItems.length === 0) return null;

  // Filter out PAYMENT_PENDING invoices entirely
  const validItems = invoiceItems.filter(
    (item) => item.invoice.status !== "PAYMENT_PENDING",
  );

  if (validItems.length === 0) return null;
  if (validItems.length === 1) return validItems[0];

  // Priority 1: Find PAID invoice
  const paidInvoice = validItems.find(
    (item) => item.invoice.status === "PAYMENT_SUCCESS",
  );
  if (paidInvoice) return paidInvoice;

  // Priority 2: Return newest invoice (already ordered by createdAt desc)
  return validItems[0];
}
