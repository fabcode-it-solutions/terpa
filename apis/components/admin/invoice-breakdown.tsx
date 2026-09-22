"use client";

import { InvoiceBreakdownDashboard } from "@/components/admin/invoice-breakdown-dashboard";
import { SummaryBadge } from "@/components/admin/summary-badge";
import { CfdiActionButtons } from "@/components/billing/cfdi-action-buttons";
import { InvoiceStatusBadge } from "@/components/billing/invoice-status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/date-utils";
import { getWhatsAppLink } from "@/lib/whatsapp";
import { InvoiceStatus, TeamMemberRole } from "@prisma/client";
import { ArrowUpRightIcon, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type TeamWithMachinesAndInvoices = {
  id: string;
  name: string;
  slug: string;
  contactNumber: string | null;
  isArchived?: boolean;
  members: {
    role: TeamMemberRole;
    user: {
      phoneNumber: string | null;
      firstName: string | null;
      lastName: string | null;
    };
  }[];
  machines: {
    id: string;
    name: string;
    invoiceItems: {
      startDate: Date;
      endDate: Date;
      invoice: {
        id: string;
        status: InvoiceStatus;
        cfdi?: {
          status: string;
          facturamaId: string | null;
          folio: string | null;
        } | null;
      };
    }[];
  }[];
  summary: {
    totalMachines: number;
    paid: number;
    pendingPayment: number;
    pendingReview: number;
    rejected: number;
    cancelled: number;
    notInvoiced: number;
  };
};

type Props = {
  teams: TeamWithMachinesAndInvoices[];
  children: React.ReactNode;
};

export function InvoiceBreakdown({ teams, children }: Props) {
  const [value, setValue] = useState<string[]>([]);
  const allTeamIds = teams.map((team) => team.id);

  const totalSummary = teams.reduce(
    (acc, team) => {
      acc.totalMachines += team.summary.totalMachines;
      acc.paid += team.summary.paid;
      acc.pendingPayment += team.summary.pendingPayment;
      acc.pendingReview += team.summary.pendingReview;
      acc.rejected += team.summary.rejected;
      acc.cancelled += team.summary.cancelled;
      acc.notInvoiced += team.summary.notInvoiced;
      return acc;
    },
    {
      totalMachines: 0,
      paid: 0,
      pendingPayment: 0,
      pendingReview: 0,
      rejected: 0,
      cancelled: 0,
      notInvoiced: 0,
    },
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
        {children}
      </div>
      <InvoiceBreakdownDashboard summary={totalSummary} />
      <div className="space-y-4">
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setValue(allTeamIds)}
              className="w-full sm:w-auto"
            >
              Mostrar todo
            </Button>
            <Button
              variant="outline"
              onClick={() => setValue([])}
              className="w-full sm:w-auto"
            >
              Ocultar todo
            </Button>
          </div>
        </div>

        {teams.length === 0 ? (
          <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">
              No hay equipos para mostrar en el período seleccionado.
            </p>
          </div>
        ) : (
          <div className="px-2">
            <Accordion
              type="multiple"
              className="w-full"
              value={value}
              onValueChange={setValue}
            >
              {teams.map((team) => {
                const ownerMember = team.members.find(
                  (member) => member.role === TeamMemberRole.OWNER,
                );
                const ownerPhoneNumber = ownerMember?.user?.phoneNumber;
                const displayPhoneNumber =
                  team.contactNumber || ownerPhoneNumber;
                const ownerName = ownerMember?.user
                  ? `${ownerMember.user.firstName || ""} ${ownerMember.user.lastName || ""}`.trim()
                  : "";

                return (
                  <AccordionItem key={team.id} value={team.id}>
                    <AccordionTrigger>
                      <div className="flex w-full items-center justify-between pr-4">
                        <div className="flex items-center gap-2">
                          <span>{team.name}</span>
                          {team.isArchived && (
                            <Badge variant="destructive" className="text-xs">
                              Archivado
                            </Badge>
                          )}
                          {displayPhoneNumber && ownerMember?.user && (
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="px-1 py-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link
                                href={getWhatsAppLink({
                                  phoneNumber: displayPhoneNumber,
                                  userName: ownerName,
                                  teamSlug: team.slug,
                                })}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                                {`+521 ${displayPhoneNumber}`}
                              </Link>
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 no-underline">
                          <SummaryBadge
                            status="total"
                            count={team.summary.totalMachines}
                          />
                          <SummaryBadge
                            status="paid"
                            count={team.summary.paid}
                          />
                          <SummaryBadge
                            status="pendingPayment"
                            count={team.summary.pendingPayment}
                          />
                          <SummaryBadge
                            status="pendingReview"
                            count={team.summary.pendingReview}
                          />
                          <SummaryBadge
                            status="rejected"
                            count={team.summary.rejected}
                          />
                          <SummaryBadge
                            status="cancelled"
                            count={team.summary.cancelled}
                          />
                          <SummaryBadge
                            status="notInvoiced"
                            count={team.summary.notInvoiced}
                          />
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Máquina</TableHead>
                            <TableHead className="hidden sm:table-cell">
                              Período
                            </TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Factura</TableHead>
                            <TableHead />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {team.machines.map((machine) => {
                            const invoiceItem = machine.invoiceItems[0];
                            const status = invoiceItem?.invoice.status;

                            return (
                              <TableRow key={machine.id}>
                                <TableCell>{machine.name}</TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  {invoiceItem ? (
                                    <>
                                      {formatDate(invoiceItem.startDate, "P")} -{" "}
                                      {formatDate(invoiceItem.endDate, "P")}
                                    </>
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <InvoiceStatusBadge
                                    status={status || "NOT_INVOICED"}
                                  />
                                </TableCell>
                                <TableCell>
                                  {invoiceItem?.invoice.cfdi?.status ===
                                    "COMPLETED" && (
                                    <CfdiActionButtons
                                      invoiceId={invoiceItem.invoice.id}
                                    />
                                  )}
                                </TableCell>
                                <TableCell>
                                  {invoiceItem && (
                                    <div className="flex justify-end">
                                      <Button
                                        asChild
                                        variant="ghost"
                                        size="sm"
                                        className="hidden sm:flex"
                                      >
                                        <Link
                                          href={`/team/${team.slug}/billing/listing/${invoiceItem.invoice.id}`}
                                          target="_blank"
                                          className="flex items-center gap-1"
                                        >
                                          <span>Ver Pago</span>
                                          <ArrowUpRightIcon className="h-4 w-4" />
                                        </Link>
                                      </Button>
                                      <Button
                                        asChild
                                        variant="ghost"
                                        size="icon"
                                        className="flex sm:hidden"
                                      >
                                        <Link
                                          href={`/team/${team.slug}/billing/listing/${invoiceItem.invoice.id}`}
                                          target="_blank"
                                        >
                                          <ArrowUpRightIcon className="h-4 w-4" />
                                        </Link>
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        )}
      </div>
    </div>
  );
}
