import { DownloadCfdiPdfButton } from "@/components/billing/download-cfdi-pdf-button";
import { DownloadCfdiXmlButton } from "@/components/billing/download-cfdi-xml-button";
import { GenerateInvoiceButton } from "@/components/billing/generate-invoice-button";
import { InvoiceCancel } from "@/components/billing/invoice-cancel";
import { InvoiceStatusBadge } from "@/components/billing/invoice-status-badge";
import { PaymentProofApprove } from "@/components/billing/payment-proof-approve";
import { PaymentProofDownload } from "@/components/billing/payment-proof-download";
import { PaymentProofForm } from "@/components/billing/payment-proof-form";
import { PaymentProofReject } from "@/components/billing/payment-proof-reject";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { isFacturamaEnabledForTeam } from "@/service/experiment";
import { getTeamBySlugCached } from "@/loaders/team";
import { InvoiceStatus, UserRole } from "@prisma/client";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { AlertCircle, Check, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: {
    slug: string;
    invoiceId: string;
  };
};

export default async function Page(props: Props) {
  const session = requireSession();
  const [team, invoice] = await Promise.all([
    getTeamBySlugCached(props.params.slug),
    prisma.invoice.findUnique({
      where: {
        id: props.params.invoiceId,
        team: {
          slug: props.params.slug,
        },
      },
      include: {
        invoiceItems: {
          include: {
            machine: true,
          },
          orderBy: {
            machine: {
              name: "asc",
            },
          },
        },
        approvedBy: {
          select: {
            email: true,
          },
        },
        rejectedBy: {
          select: {
            email: true,
          },
        },
        cancelledBy: {
          select: {
            email: true,
          },
        },
        cfdi: true,
      },
    }),
  ]);

  if (!invoice) {
    notFound();
  }

  const isFacturamaEnabled = await isFacturamaEnabledForTeam(team.id);
  const isAdmin = session.role === UserRole.ADMIN;
  // Convert exchange rate to cents multiplier
  const exchangeRateCents = Math.round(invoice.exchangeRate * 100);

  // Check if payment was made in current month (America/Monterrey timezone)
  const now = new Date();
  const currentMonth = formatInTimeZone(now, "America/Monterrey", "yyyy-MM");
  const isPaidInCurrentMonth = invoice.paidAt
    ? formatInTimeZone(invoice.paidAt, "America/Monterrey", "yyyy-MM") ===
      currentMonth
    : false;

  return (
    <>
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href={`/team/${props.params.slug}/billing/listing`}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Regresar
          </Link>
        </Button>
      </div>

      {invoice.status === InvoiceStatus.PAYMENT_PENDING && (
        <nav aria-label="Progress">
          <ol
            role="list"
            className="divide-y bg-background divide-border rounded-md border border-border md:flex md:divide-y-0"
          >
            {[
              { id: "1", name: "Seleccionar Máquinas", status: "complete" },
              { id: "2", name: "Realiza tu Pago", status: "current" },
              { id: "3", name: "Finalizar", status: "upcoming" },
            ].map((step, stepIdx) => (
              <li key={step.name} className="relative md:flex md:flex-1">
                {step.status === "complete" ? (
                  <div className="group flex w-full items-center">
                    <span className="flex items-center px-6 py-4 text-sm font-medium">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
                        <Check className="h-5 w-5 text-primary-foreground" />
                      </span>
                      <span className="ml-4 text-sm font-medium text-foreground">
                        {step.name}
                      </span>
                    </span>
                  </div>
                ) : step.status === "current" ? (
                  <div
                    className="flex items-center px-6 py-4 text-sm font-medium"
                    aria-current="step"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary">
                      <span className="text-primary">{step.id}</span>
                    </span>
                    <span className="ml-4 text-sm font-medium text-primary">
                      {step.name}
                    </span>
                  </div>
                ) : (
                  <div className="group flex items-center">
                    <span className="flex items-center px-6 py-4 text-sm font-medium">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-muted">
                        <span className="text-muted-foreground">{step.id}</span>
                      </span>
                      <span className="ml-4 text-sm font-medium text-muted-foreground">
                        {step.name}
                      </span>
                    </span>
                  </div>
                )}

                {stepIdx !== 2 ? (
                  <>
                    <div
                      className="absolute right-0 top-0 hidden h-full w-5 md:block"
                      aria-hidden="true"
                    >
                      <svg
                        fill="none"
                        viewBox="0 0 22 80"
                        preserveAspectRatio="none"
                        className="h-full w-full text-border"
                      >
                        <path
                          d="M0 -2L20 40L0 82"
                          stroke="currentcolor"
                          vectorEffect="non-scaling-stroke"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </>
                ) : null}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {invoice.status === "PAYMENT_VERIFICATION_PENDING" && (
        <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/20">
          <CardHeader className="py-4">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-500">
              <AlertCircle className="h-4 w-4" />
              <CardTitle className="text-base text-amber-800 dark:text-amber-500">
                Pago en Revisión
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-sm text-amber-800 dark:text-amber-500">
              Tu comprobante de pago está siendo revisado por nuestro equipo de
              soporte. Te notificaremos cuando el pago haya sido validado.
            </p>
          </CardContent>
        </Card>
      )}

      {invoice.status === "PAYMENT_VERIFICATION_REJECTED" && (
        <Card className="bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/20">
          <CardHeader className="py-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-500">
              <AlertCircle className="h-4 w-4" />
              <CardTitle className="text-base text-red-800 dark:text-red-500">
                Pago Rechazado
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-sm text-red-800 dark:text-red-500">
              Tu comprobante de pago ha sido rechazado. Por favor, contacta a
              nuestro equipo de soporte para obtener más información sobre el
              motivo del rechazo y los siguientes pasos a seguir.
            </p>
          </CardContent>
        </Card>
      )}

      {invoice.status === "PAYMENT_SUCCESS" &&
        invoice.paymentMethod === "MERCADOPAGO" && (
          <Card className="bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/20">
            <CardHeader className="py-4">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-500">
                <AlertCircle className="h-4 w-4" />
                <CardTitle className="text-base text-green-800 dark:text-green-500">
                  Pago Exitoso
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-sm text-green-800 dark:text-green-500">
                Tu pago ha sido aprobado y los servicios han sido activados en
                tu cuenta. Las máquinas seleccionadas han sido actualizadas con
                las nuevas fechas de servicio.
              </p>
              <br />
              <p className="text-sm text-green-800 dark:text-green-500 font-bold">
                Mercado Pago #{invoice.mercadoPagoPaymentId}
              </p>
            </CardContent>
          </Card>
        )}

      {invoice.status === "PAYMENT_SUCCESS" &&
        invoice.paymentMethod === "MANUAL" && (
          <Card className="bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/20">
            <CardHeader className="py-4">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-500">
                <AlertCircle className="h-4 w-4" />
                <CardTitle className="text-base text-green-800 dark:text-green-500">
                  Pago Exitoso
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-sm text-green-800 dark:text-green-500">
                Tu pago ha sido aprobado y los servicios han sido activados en
                tu cuenta. Las máquinas seleccionadas han sido actualizadas con
                las nuevas fechas de servicio.
              </p>
            </CardContent>
          </Card>
        )}

      {invoice.status === "PAYMENT_SUCCESS" &&
        isPaidInCurrentMonth &&
        isFacturamaEnabled &&
        (invoice.adjustedAmountCents == null ||
          invoice.adjustedAmountCents > 0) &&
        !(
          invoice.paymentMethod === "MANUAL" &&
          invoice.manualPaymentMethod === "CASH"
        ) && (
          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-800/20 dark:border-blue-400">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
                  <AlertCircle className="h-4 w-4" />
                  <div>
                    <CardTitle className="text-base text-blue-800 dark:text-blue-400">
                      {invoice.cfdi?.status === "COMPLETED"
                        ? "¡Tu factura está lista!"
                        : "¡Solicita tu Factura!"}
                    </CardTitle>
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      {invoice.cfdi?.status === "COMPLETED"
                        ? "Folio: " + invoice.cfdi.folio
                        : "Ya puedes recibir tu factura de forma automática."}
                    </p>
                  </div>
                </div>
                {invoice.cfdi?.status === "COMPLETED" ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <GenerateInvoiceButton
                      teamSlug={props.params.slug}
                      hasFacturamaId={isFacturamaEnabled && !!team.facturamaId}
                      currentPath={`/team/${props.params.slug}/billing/listing/${props.params.invoiceId}`}
                      invoiceId={props.params.invoiceId}
                      cfdi={invoice.cfdi}
                    />
                    <div className="flex gap-2">
                      <DownloadCfdiPdfButton
                        invoiceId={props.params.invoiceId}
                      />
                      <DownloadCfdiXmlButton
                        invoiceId={props.params.invoiceId}
                      />
                    </div>
                  </div>
                ) : (
                  <GenerateInvoiceButton
                    teamSlug={props.params.slug}
                    hasFacturamaId={isFacturamaEnabled && !!team.facturamaId}
                    currentPath={`/team/${props.params.slug}/billing/listing/${props.params.invoiceId}`}
                    invoiceId={props.params.invoiceId}
                    cfdi={invoice.cfdi}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {isAdmin &&
        invoice.paymentProofUrl &&
        invoice.status === "PAYMENT_VERIFICATION_PENDING" && (
          <Card className="bg-background">
            <CardHeader>
              <CardTitle>Herramientas de Administrador</CardTitle>
              <CardDescription>
                Revisa y valida el comprobante de pago
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <PaymentProofDownload
                  teamSlug={props.params.slug}
                  invoiceId={props.params.invoiceId}
                />
                <div className="flex items-center gap-2">
                  <PaymentProofApprove
                    teamSlug={props.params.slug}
                    invoiceId={props.params.invoiceId}
                    totalPriceCents={invoice.totalPriceCents}
                    exchangeRate={invoice.exchangeRate}
                  />
                  <PaymentProofReject
                    teamSlug={props.params.slug}
                    invoiceId={props.params.invoiceId}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      <div className="flex flex-col gap-4">
        <Card className="bg-background">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <CardTitle>Resumen del Cobro</CardTitle>
                <CardDescription>
                  {props.params.invoiceId} &bull;{" "}
                  {formatInTimeZone(invoice.createdAt, "UTC", "dd/MM/yyyy")}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">
              Tipo de cambio DOF: 1 USD = {invoice.exchangeRate.toFixed(2)} MXN
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Máquina</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.invoiceItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p>{item.machine.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(item.startDate, "d 'de' MMMM 'del' yyyy", {
                        locale: es,
                      })}
                    </TableCell>
                    <TableCell>
                      {format(item.endDate, "d 'de' MMMM 'del' yyyy", {
                        locale: es,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div>USD {(item.priceCents / 100).toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        MXN{" "}
                        {formatCurrency(
                          Math.round(
                            (item.priceCents * exchangeRateCents) / 100,
                          ),
                        ).replace("$", "")}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    Subtotal
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <div>USD {(invoice.subtotalCents / 100).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      MXN{" "}
                      {formatCurrency(
                        Math.round(
                          (invoice.subtotalCents * exchangeRateCents) / 100,
                        ),
                      ).replace("$", "")}
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    IVA ({invoice.vatRatePercent.toFixed(1)}%)
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <div>USD {(invoice.vatAmountCents / 100).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      MXN{" "}
                      {formatCurrency(
                        Math.round(
                          (invoice.vatAmountCents * exchangeRateCents) / 100,
                        ),
                      ).replace("$", "")}
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-semibold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <div>USD {(invoice.totalPriceCents / 100).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      MXN{" "}
                      {formatCurrency(
                        Math.round(
                          (invoice.totalPriceCents * exchangeRateCents) / 100,
                        ),
                      ).replace("$", "")}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {isAdmin &&
          invoice.status === "PAYMENT_SUCCESS" &&
          invoice.paymentMethod === "MANUAL" && (
            <Card className="bg-background">
              <CardHeader>
                <CardTitle>Información de Aprobación (Admin)</CardTitle>
                <CardDescription>
                  Detalles sobre la aprobación del pago
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Administrador</TableHead>
                        <TableHead>Fecha y Hora</TableHead>
                        <TableHead>Método de Pago</TableHead>
                        <TableHead>Monto Aprobado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>{invoice.approvedBy?.email}</TableCell>
                        <TableCell>
                          {formatInTimeZone(
                            invoice.approvedAt!,
                            "America/Monterrey",
                            "d 'de' MMMM 'del' yyyy, HH:mm",
                            {
                              locale: es,
                            },
                          )}
                        </TableCell>
                        <TableCell>
                          {invoice.manualPaymentMethod === "BANK_TRANSFER" ? (
                            "Transferencia Bancaria"
                          ) : invoice.manualPaymentMethod === "CASH" ? (
                            "Efectivo"
                          ) : (
                            <span className="text-muted-foreground italic">
                              No especificado
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          MXN{" "}
                          {formatCurrency(
                            invoice.adjustedAmountCents != null
                              ? invoice.adjustedAmountCents
                              : Math.round(
                                  (invoice.totalPriceCents *
                                    exchangeRateCents) /
                                    100,
                                ),
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  {invoice.paymentProofUrl && (
                    <div className="flex flex-col gap-2">
                      <PaymentProofDownload
                        teamSlug={props.params.slug}
                        invoiceId={props.params.invoiceId}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        {isAdmin && invoice.status === "PAYMENT_VERIFICATION_REJECTED" && (
          <Card className="bg-background">
            <CardHeader>
              <CardTitle>Información de Rechazo (Admin)</CardTitle>
              <CardDescription>
                Detalles sobre el rechazo del pago
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Administrador</TableHead>
                      <TableHead>Fecha y Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>{invoice.rejectedBy?.email}</TableCell>
                      <TableCell>
                        {formatInTimeZone(
                          invoice.rejectedAt!,
                          "America/Monterrey",
                          "d 'de' MMMM 'del' yyyy, HH:mm",
                          {
                            locale: es,
                          },
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {invoice.paymentProofUrl && (
                  <div className="flex flex-col gap-2">
                    <div className="text-sm font-medium">
                      Comprobante rechazado
                    </div>
                    <PaymentProofDownload
                      teamSlug={props.params.slug}
                      invoiceId={props.params.invoiceId}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {isAdmin && invoice.status === "CANCELLED" && (
          <Card className="bg-background">
            <CardHeader>
              <CardTitle>Información de Cancelación (Admin)</CardTitle>
              <CardDescription>
                Detalles sobre la cancelación de la factura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Administrador</TableHead>
                      <TableHead>Fecha y Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>{invoice.cancelledBy?.email}</TableCell>
                      <TableCell>
                        {formatInTimeZone(
                          invoice.cancelledAt!,
                          "America/Monterrey",
                          "d 'de' MMMM 'del' yyyy, HH:mm",
                          {
                            locale: es,
                          },
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {invoice.paymentProofUrl && (
                  <div className="flex flex-col gap-2">
                    <div className="text-sm font-medium">
                      Comprobante cancelado
                    </div>
                    <PaymentProofDownload
                      teamSlug={props.params.slug}
                      invoiceId={props.params.invoiceId}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {invoice.status === InvoiceStatus.PAYMENT_PENDING &&
          invoice.paymentMethod === "MERCADOPAGO" &&
          invoice.mercadoPagoPaymentUrl && (
            <Card className="bg-background">
              <CardHeader>
                <CardTitle>Pagar con MercadoPago</CardTitle>
                <CardDescription>
                  Serás redirigido a MercadoPago para completar tu pago
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="w-full bg-sky-500 text-white hover:bg-sky-600"
                >
                  <Link href={invoice.mercadoPagoPaymentUrl}>
                    Continuar a MercadoPago
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

        {invoice.status === InvoiceStatus.PAYMENT_PENDING &&
          invoice.paymentMethod === "MANUAL" && <PaymentProofForm />}

        {isAdmin && invoice.status === InvoiceStatus.PAYMENT_PENDING && (
          <Card className="bg-background">
            <CardHeader>
              <CardTitle>Cancelar Pago (Admin)</CardTitle>
              <CardDescription>
                Permite cancelar este pago pendiente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceCancel
                teamSlug={props.params.slug}
                invoiceId={props.params.invoiceId}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
