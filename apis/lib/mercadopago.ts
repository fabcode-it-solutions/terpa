import { Preference } from "mercadopago";
import { env } from "./env";

const mercadoPagoConfig = {
  accessToken: env.MERCADOPAGO_ACCESS_TOKEN,
};

export async function createInvoicePaymentUrl({
  invoice,
  team,
  exchangeRate,
  user,
}: {
  invoice: {
    id: string;
    totalPriceCents: number;
    invoiceItems: Array<{
      description: string;
      priceCents: number;
      machine: { name: string };
    }>;
  };
  team: {
    id: string;
    name: string;
    slug: string;
  };
  exchangeRate: number;
  user: { email: string };
}) {
  const preference = await new Preference(mercadoPagoConfig).create({
    body: {
      items: invoice.invoiceItems.map((item) => ({
        id: item.machine.name,
        title: `${item.machine.name} - ${item.description}`,
        description: `Servicio para ${team.name}`,
        quantity: 1,
        currency_id: "MXN",
        unit_price:
          Math.round(item.priceCents * Math.round(exchangeRate * 100)) / 10000,
      })),
      payer: {
        email: user.email,
        name: user.email,
      },
      statement_descriptor: `TERPA ${team.name}`
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""),
      back_urls: {
        success: `${env.APP_BASE_URL}/team/${team.slug}/billing/listing/${invoice.id}`,
        pending: `${env.APP_BASE_URL}/team/${team.slug}/billing/listing/${invoice.id}`,
        failure: `${env.APP_BASE_URL}/team/${team.slug}/billing/listing/${invoice.id}`,
      },
      external_reference: invoice.id,
      metadata: {
        teamId: team.id,
        invoiceId: invoice.id,
      },
    },
  });

  if (!preference.init_point) {
    throw new Error("MercadoPago: Payment URL not created");
  }

  return preference.init_point;
}
