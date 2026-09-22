import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@prisma/client";
import { createHmac } from "crypto";
import { Payment } from "mercadopago";
import { NextRequest } from "next/server";

const mercadoPagoConfig = {
  accessToken: env.MERCADOPAGO_ACCESS_TOKEN,
};

/**
 * MercadoPago Webhook Handler
 * @see https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks
 */
export async function POST(request: NextRequest) {
  const dataId = request.nextUrl.searchParams.get("data.id");
  const requestId = request.headers.get("x-request-id");
  const signature = request.headers.get("x-signature");

  // Ensure environment variables and request headers are present
  if (!env.MERCADOPAGO_WEBHOOK_TOKEN || !dataId || !requestId || !signature) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Parse the signature header
  const parts = signature.split(",");
  const ts = parts[0].split("=")[1];
  const signatureHash = parts[1].split("=")[1];

  // Compute a hash of the manifest string using the secret token
  const hmac = createHmac("sha256", env.MERCADOPAGO_WEBHOOK_TOKEN);
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  hmac.update(manifest);
  const computedHash = hmac.digest("hex");

  // The hash must match the one sent by MercadoPago
  if (computedHash !== signatureHash) {
    console.error("MercadoPago Webhook: Invalid Signature");
    return new Response("Unauthorized", { status: 401 });
  }

  // At this point we can trust the request is coming from MercadoPago
  const json = await request.json();

  // Get payment details from MercadoPago
  const payment = await new Payment(mercadoPagoConfig).get({
    id: json.data.id,
  });

  console.info({ payment }, "MercadoPago Webhook");

  if (payment.status === "approved") {
    // Get the invoice using the external_reference
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: payment.external_reference,
        status: InvoiceStatus.PAYMENT_PENDING,
      },
      include: {
        invoiceItems: true,
      },
    });

    if (!invoice) {
      console.error("MercadoPago Webhook: Invoice not found or not pending");
      return new Response("OK", { status: 200 });
    }

    // Update invoice and machine dates in a transaction
    await prisma.$transaction([
      // Update invoice status
      prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.PAYMENT_SUCCESS,
          paidAt: new Date(),
          mercadoPagoPaymentId: payment.id?.toString(),
        },
      }),
      // Update each machine's activeUntilDate to the invoice item's end date
      ...invoice.invoiceItems.map((item) =>
        prisma.machine.update({
          where: { id: item.machineId },
          data: {
            activeUntilDate: item.endDate,
          },
        }),
      ),
    ]);
  } else if (payment.status === "rejected") {
    console.error({ payment }, "MercadoPago Webhook: Payment rejected");
  }

  return new Response("OK", { status: 200 });
}
