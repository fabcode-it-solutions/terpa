import { addMonths, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";

type WhatsAppLinkParams = {
  phoneNumber: string;
  userName: string;
  teamSlug: string;
};

export function getWhatsAppLink(params: WhatsAppLinkParams) {
  const now = new Date();
  const nowZoned = toZonedTime(now, "America/Monterrey");
  const nextMonth = addMonths(nowZoned, 1);

  const message = [
    `¡Hola ${params.userName}!,`,
    "",
    "Hablamos de TERPA Solutions,",
    "",
    ` Le recordamos el pago de la mensualidad para el próximo mes (${format(
      nextMonth,
      "MMMM yyyy",
      { locale: es },
    )})`,
    "",
    `Le comparto la liga para ver el monto a pagar y hacer el pago: https://app.terpasolutions.com/team/${params.teamSlug}/billing/invoice/new`,
    "",
    '_*El pago de sus mensualidades se hace directo en la plataforma*, por MercadoPago o por transferencia en el apartado de "Facturación", en caso de ser pago por transferencia subir su comprobante ahí mismo seleccionando Pago por Transferencia._',
    "",
    "En caso de requerir *FACTURA*, solicitarla al momento de realizar el pago. En caso de ya haber realizado su pago, hacer caso omiso a este mensaje.",
    "",
    "Buen día!",
  ].join("\n");

  const url = `https://wa.me/+521${
    params.phoneNumber
  }?text=${encodeURIComponent(message)}`;
  return url;
}

/**
 * Generates a direct WhatsApp chat link without a pre-filled message.
 * Assumes the phoneNumber already includes the country code if necessary,
 * or that the wa.me service handles it.
 * Prepends +521 similar to the other function for consistency if needed,
 * but typically wa.me expects the number directly.
 * For now, let's assume the number is ready to be used with +521.
 * @param phoneNumber The phone number to link to.
 * @returns A WhatsApp chat URL.
 */
export function getWhatsAppChatLink(phoneNumber: string): string {
  // Ensure the phone number doesn't have an accidental leading + if we are adding +521
  const cleanedPhoneNumber = phoneNumber.startsWith("+")
    ? phoneNumber.substring(1)
    : phoneNumber;
  return `https://wa.me/521${cleanedPhoneNumber}`; // Using 521 directly as per common Mexican WhatsApp usage
}
