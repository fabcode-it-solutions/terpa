import {
  getFacturamaClientAction,
  getFiscalRegimesAction,
  getCfdiUsesAction,
} from "@/actions/billing";
import FacturamaClientForm from "@/components/billing/facturama-client-form";
import type { FiscalRegime, CfdiUse } from "@/lib/facturama/validation";

type Props = {
  params: { slug: string };
  searchParams?: { callbackUrl?: string };
};

// RFC validation function (same as in form component)
function isValidRFC(rfc: string): boolean {
  if (!rfc) return false;
  const cleanRfc = rfc.replace(/\s/g, "").toUpperCase();
  if (cleanRfc.length < 12 || cleanRfc.length > 13) return false;
  const rfcPattern = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
  return rfcPattern.test(cleanRfc);
}

// URL validation function - only allow relative paths
function isValidCallbackUrl(url: string): boolean {
  if (!url) return false;
  // Only allow relative paths starting with /
  return url.startsWith("/") && !url.startsWith("//");
}

export default async function DatosFiscalesPage(props: Props) {
  const clientData = await getFacturamaClientAction(props.params.slug).catch(
    () => null,
  );

  // Extract and validate callbackUrl
  const callbackUrl = props.searchParams?.callbackUrl;
  const validCallbackUrl =
    callbackUrl && isValidCallbackUrl(decodeURIComponent(callbackUrl))
      ? decodeURIComponent(callbackUrl)
      : null;

  // Pre-fetch fiscal regimes and CFDI uses if we have valid RFC
  let initialFiscalRegimes: FiscalRegime[] = [];
  let initialCfdiUses: CfdiUse[] = [];

  if (clientData?.Rfc && isValidRFC(clientData.Rfc)) {
    try {
      [initialFiscalRegimes, initialCfdiUses] = await Promise.all([
        getFiscalRegimesAction(clientData.Rfc),
        getCfdiUsesAction(clientData.Rfc),
      ]);
    } catch (error) {
      console.error("Error pre-fetching fiscal data:", error);
      // Continue with empty arrays if fetch fails
    }
  }

  return (
    <FacturamaClientForm
      initialData={clientData}
      initialFiscalRegimes={initialFiscalRegimes}
      initialCfdiUses={initialCfdiUses}
      callbackUrl={validCallbackUrl}
    />
  );
}
