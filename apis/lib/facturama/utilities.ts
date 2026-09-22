import logger from "@/utils/logger";
import { env } from "../env";
import {
  CfdiDownloadResponse,
  CfdiDownloadResponseSchema,
  CfdiRequest,
  CfdiRequestSchema,
  CfdiResponse,
  CfdiResponseSchema,
  CfdiUse,
  CfdiUseSchema,
  CreateClientRequest,
  CreateClientRequestSchema,
  CreateClientResponse,
  CreateClientResponseSchema,
  FiscalRegime,
  FiscalRegimeSchema,
  GetClientResponse,
  GetClientResponseSchema,
  UpdateClientRequest,
  UpdateClientRequestSchema,
} from "./validation";

export function generateBasicToken(): string {
  return Buffer.from(
    `${env.FACTURAMA_USERNAME}:${env.FACTURAMA_PASSWORD}`,
  ).toString("base64");
}

export async function createClient(
  clientData: CreateClientRequest,
): Promise<CreateClientResponse> {
  const validatedData = CreateClientRequestSchema.parse(clientData);
  const basicToken = generateBasicToken();

  logger.info({
    event: "facturama.createClient.start",
    rfc: validatedData.Rfc,
    email: validatedData.Email,
  });

  const response = await fetch(`${env.FACTURAMA_API_URL}/Client`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...validatedData,
      Address: {
        ZipCode: validatedData.TaxZipCode,
      },
    }),
  });

  const rawResponseText = await response.text();

  if (!response.ok) {
    logger.error({
      event: "facturama.createClient.error",
      rfc: validatedData.Rfc,
      email: validatedData.Email,
      status: response.status,
      statusText: response.statusText,
      errorBody: rawResponseText,
    });
    const error = new Error(`Failed to create client: ${response.statusText}`);
    (error as any).status = response.status;
    (error as any).responseText = rawResponseText;
    throw error;
  }

  try {
    const rawData = JSON.parse(rawResponseText);
    const parsed = CreateClientResponseSchema.parse(rawData);
    logger.info({
      event: "facturama.createClient.success",
      rfc: validatedData.Rfc,
      clientId: (parsed as any).Id,
    });
    return parsed;
  } catch (parseError) {
    logger.error({
      event: "facturama.createClient.parseError",
      rfc: validatedData.Rfc,
      email: validatedData.Email,
      rawResponse: rawResponseText,
      parseError:
        parseError instanceof Error ? parseError.message : String(parseError),
    });
    const error = new Error(`Failed to parse create client response`);
    (error as any).status = response.status;
    (error as any).responseText = rawResponseText;
    throw error;
  }
}

export async function getClient(id: string): Promise<GetClientResponse> {
  const basicToken = generateBasicToken();

  logger.info({ event: "facturama.getClient.start", id });

  const response = await fetch(`${env.FACTURAMA_API_URL}/Client/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${basicToken}`,
    },
  });

  const rawResponseText = await response.text();

  if (!response.ok) {
    logger.error({
      event: "facturama.getClient.error",
      id,
      status: response.status,
      statusText: response.statusText,
      errorBody: rawResponseText,
    });
    const error = new Error(`Failed to get client: ${response.statusText}`);
    (error as any).status = response.status;
    (error as any).responseText = rawResponseText;
    throw error;
  }

  try {
    const rawData = JSON.parse(rawResponseText);
    const parsed = GetClientResponseSchema.parse(rawData);
    logger.info({ event: "facturama.getClient.success", id });
    return parsed;
  } catch (parseError) {
    logger.error({
      event: "facturama.getClient.parseError",
      id,
      rawResponse: rawResponseText,
      parseError:
        parseError instanceof Error ? parseError.message : String(parseError),
    });
    const error = new Error(`Failed to parse get client response`);
    (error as any).status = response.status;
    (error as any).responseText = rawResponseText;
    throw error;
  }
}

export async function updateClient(
  id: string,
  clientData: UpdateClientRequest,
): Promise<void> {
  const validatedData = UpdateClientRequestSchema.parse(clientData);
  const basicToken = generateBasicToken();

  logger.info({
    event: "facturama.updateClient.start",
    id,
    rfc: validatedData.Rfc,
    email: validatedData.Email,
  });

  const response = await fetch(`${env.FACTURAMA_API_URL}/Client/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Basic ${basicToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Id: id,
      ...validatedData,
      Address: {
        ZipCode: validatedData.TaxZipCode,
      },
    }),
  });

  const rawResponseText = await response.text();

  if (!response.ok) {
    logger.error({
      event: "facturama.updateClient.error",
      id,
      rfc: validatedData.Rfc,
      email: validatedData.Email,
      status: response.status,
      statusText: response.statusText,
      errorBody: rawResponseText,
    });
    const error = new Error(`Failed to update client: ${response.statusText}`);
    (error as any).status = response.status;
    (error as any).responseText = rawResponseText;
    throw error;
  }
  logger.info({ event: "facturama.updateClient.success", id });
}

export async function getFiscalRegimes(rfc: string): Promise<FiscalRegime[]> {
  const basicToken = generateBasicToken();

  logger.info({ event: "facturama.getFiscalRegimes.start", rfc });

  const response = await fetch(
    `${env.FACTURAMA_API_URL}/Catalogs/FiscalRegimens?rfc=${encodeURIComponent(rfc)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${basicToken}`,
      },
    },
  );

  const rawResponseText = await response.text();

  if (!response.ok) {
    logger.error({
      event: "facturama.getFiscalRegimes.error",
      rfc,
      status: response.status,
      statusText: response.statusText,
      errorBody: rawResponseText,
    });
    const error = new Error(
      `Failed to get fiscal regimes: ${response.statusText}`,
    );
    (error as any).status = response.status;
    (error as any).responseText = rawResponseText;
    throw error;
  }

  try {
    const rawData = JSON.parse(rawResponseText);
    const parsed = rawData.map((item: unknown) =>
      FiscalRegimeSchema.parse(item),
    );
    logger.info({
      event: "facturama.getFiscalRegimes.success",
      rfc,
      count: parsed.length,
    });
    return parsed;
  } catch (parseError) {
    logger.error({
      event: "facturama.getFiscalRegimes.parseError",
      rfc,
      rawResponse: rawResponseText,
      parseError:
        parseError instanceof Error ? parseError.message : String(parseError),
    });
    const error = new Error(`Failed to parse fiscal regimes response`);
    (error as any).responseText = rawResponseText;
    throw error;
  }
}

export async function getCfdiUses(rfc: string): Promise<CfdiUse[]> {
  const basicToken = generateBasicToken();

  logger.info({ event: "facturama.getCfdiUses.start", rfc });

  const response = await fetch(
    `${env.FACTURAMA_API_URL}/Catalogs/CfdiUses?keyword=${encodeURIComponent(rfc)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${basicToken}`,
      },
    },
  );

  const rawResponseText = await response.text();

  if (!response.ok) {
    logger.error({
      event: "facturama.getCfdiUses.error",
      rfc,
      status: response.status,
      statusText: response.statusText,
      errorBody: rawResponseText,
    });
    const error = new Error(`Failed to get CFDI uses: ${response.statusText}`);
    (error as any).status = response.status;
    (error as any).responseText = rawResponseText;
    throw error;
  }

  try {
    const rawData = JSON.parse(rawResponseText);
    const parsed = rawData.map((item: unknown) => CfdiUseSchema.parse(item));
    logger.info({
      event: "facturama.getCfdiUses.success",
      rfc,
      count: parsed.length,
    });
    return parsed;
  } catch (parseError) {
    logger.error({
      event: "facturama.getCfdiUses.parseError",
      rfc,
      rawResponse: rawResponseText,
      parseError:
        parseError instanceof Error ? parseError.message : String(parseError),
    });
    const error = new Error(`Failed to parse CFDI uses response`);
    (error as any).responseText = rawResponseText;
    throw error;
  }
}

export async function generateCfdi(
  cfdiRequest: CfdiRequest,
): Promise<CfdiResponse> {
  const validatedData = CfdiRequestSchema.parse(cfdiRequest);
  const basicToken = generateBasicToken();

  logger.info({
    event: "facturama.generateCfdi.start",
    currency: validatedData.Currency,
    receiverRfc: validatedData.Receiver?.Rfc,
    items: Array.isArray(validatedData.Items) ? validatedData.Items.length : 0,
    date: validatedData.Date,
  });

  const response = await fetch(`${env.FACTURAMA_API_URL}/3/cfdis`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validatedData),
  });

  const rawResponseText = await response.text();

  if (!response.ok) {
    logger.error({
      event: "facturama.generateCfdi.error",
      receiverRfc: validatedData.Receiver?.Rfc,
      status: response.status,
      statusText: response.statusText,
      errorBody: rawResponseText,
    });
    const error = new Error(`Failed to generate CFDI: ${response.statusText}`);
    (error as any).status = response.status;
    (error as any).responseText = rawResponseText;
    throw error;
  }

  try {
    const rawData = JSON.parse(rawResponseText);
    const parsed = CfdiResponseSchema.parse(rawData);
    logger.info({
      event: "facturama.generateCfdi.success",
      receiverRfc: validatedData.Receiver?.Rfc,
      facturamaId: parsed.Id,
      folio: parsed.Folio,
    });
    return parsed;
  } catch (parseError) {
    logger.error({
      event: "facturama.generateCfdi.parseError",
      receiverRfc: validatedData.Receiver?.Rfc,
      rawResponse: rawResponseText,
      parseError:
        parseError instanceof Error ? parseError.message : String(parseError),
    });
    const error = new Error(`Failed to parse CFDI generation response`);
    (error as any).responseText = rawResponseText;
    throw error;
  }
}

export async function sendCfdiByEmail(
  cfdiId: string,
  email: string,
): Promise<void> {
  const basicToken = generateBasicToken();

  logger.info({ event: "facturama.sendCfdiByEmail.start", cfdiId, email });

  const response = await fetch(
    `${env.FACTURAMA_API_URL}/Cfdi?cfdiType=issued&cfdiId=${encodeURIComponent(cfdiId)}&email=${encodeURIComponent(email)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicToken}`,
      },
    },
  );

  const rawResponseText = await response.text();

  if (!response.ok) {
    logger.error({
      event: "facturama.sendCfdiByEmail.error",
      cfdiId,
      email,
      status: response.status,
      statusText: response.statusText,
      errorBody: rawResponseText,
    });
    const error = new Error(
      `Failed to send CFDI by email: ${response.statusText}`,
    );
    (error as any).status = response.status;
    (error as any).responseText = rawResponseText;
    throw error;
  }
  logger.info({ event: "facturama.sendCfdiByEmail.success", cfdiId, email });
}

export function buildCfdiFromInvoice(
  invoice: any,
  clientData: GetClientResponse,
): CfdiRequest {
  logger.info({
    event: "facturama.buildCfdiFromInvoice.start",
    hasAdjustedAmount: !!invoice.adjustedAmountCents,
    hasExchangeRate: !!invoice.exchangeRate,
    clientRfc: clientData.Rfc,
  });
  // Calculate amounts from invoice
  const totalAmount = invoice.adjustedAmountCents
    ? invoice.adjustedAmountCents / 100 // adjustedAmountCents is already in MXN
    : Math.round((invoice.totalPriceCents * invoice.exchangeRate * 100) / 100) /
      100; // Convert USD to MXN

  // Calculate subtotal by removing VAT (16%)
  const subtotal = totalAmount / (1 + 0.16);
  const ivaAmount = subtotal * 0.16;

  // Format current date for Mexico timezone
  const now = new Date();
  const mexicoDate = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Monterrey" }),
  );
  const formattedDate = mexicoDate.toISOString().slice(0, 19); // Remove Z and milliseconds

  const cfdi: CfdiRequest = {
    CfdiType: "I",
    Currency: "MXN",
    PaymentForm: "03",
    PaymentMethod: "PUE",
    ExpeditionPlace: "64910",
    Date: formattedDate,
    Receiver: {
      Rfc: clientData.Rfc,
      CfdiUse: clientData.CfdiUse,
      Name: clientData.Name,
      FiscalRegime: clientData.FiscalRegime,
      TaxZipCode: clientData.TaxZipCode || "64910",
    },
    Items: [
      {
        ProductCode: "81112502",
        Description: "Pago en Plataforma TERPA",
        UnitCode: "E48",
        UnitPrice: Math.round(subtotal * 100) / 100, // Round to 2 decimals
        Quantity: 1.0,
        Subtotal: Math.round(subtotal * 100) / 100,
        TaxObject: "02",
        Taxes: [
          {
            Total: Math.round(ivaAmount * 100) / 100,
            Name: "IVA",
            Base: Math.round(subtotal * 100) / 100,
            Rate: 0.16,
            IsRetention: false,
          },
        ],
        Total: Math.round(totalAmount * 100) / 100,
      },
    ],
  };
  logger.info({
    event: "facturama.buildCfdiFromInvoice.success",
    clientRfc: clientData.Rfc,
    subtotal: Math.round(subtotal * 100) / 100,
    ivaAmount: Math.round(ivaAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    itemsCount: cfdi.Items.length,
  });
  return cfdi;
}

export async function downloadCfdiPdf(
  cfdiId: string,
): Promise<CfdiDownloadResponse> {
  const basicToken = generateBasicToken();

  logger.info({ event: "facturama.downloadCfdiPdf.start", cfdiId });

  const response = await fetch(
    `${env.FACTURAMA_API_URL}/Cfdi/pdf/issued/${encodeURIComponent(cfdiId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${basicToken}`,
      },
    },
  );

  const rawResponseText = await response.text();

  if (!response.ok) {
    logger.error({
      event: "facturama.downloadCfdiPdf.error",
      cfdiId,
      status: response.status,
      statusText: response.statusText,
      errorBody: rawResponseText,
    });
    const error = new Error(
      `Failed to download CFDI PDF: ${response.statusText}`,
    );
    (error as any).status = response.status;
    (error as any).responseText = rawResponseText;
    throw error;
  }

  try {
    const rawData = JSON.parse(rawResponseText);
    const parsed = CfdiDownloadResponseSchema.parse(rawData);
    logger.info({ event: "facturama.downloadCfdiPdf.success", cfdiId });
    return parsed;
  } catch (parseError) {
    logger.error({
      event: "facturama.downloadCfdiPdf.parseError",
      cfdiId,
      rawResponse: rawResponseText,
      parseError:
        parseError instanceof Error ? parseError.message : String(parseError),
    });
    const error = new Error(`Failed to parse download CFDI PDF response`);
    (error as any).responseText = rawResponseText;
    throw error;
  }
}

export async function downloadCfdiXml(
  cfdiId: string,
): Promise<CfdiDownloadResponse> {
  const basicToken = generateBasicToken();

  logger.info({ event: "facturama.downloadCfdiXml.start", cfdiId });

  const response = await fetch(
    `${env.FACTURAMA_API_URL}/Cfdi/xml/issued/${encodeURIComponent(cfdiId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${basicToken}`,
      },
    },
  );

  const rawResponseText = await response.text();

  if (!response.ok) {
    logger.error({
      event: "facturama.downloadCfdiXml.error",
      cfdiId,
      status: response.status,
      statusText: response.statusText,
      errorBody: rawResponseText,
    });
    const error = new Error(
      `Failed to download CFDI XML: ${response.statusText}`,
    );
    (error as any).status = response.status;
    (error as any).responseText = rawResponseText;
    throw error;
  }

  try {
    const rawData = JSON.parse(rawResponseText);
    const parsed = CfdiDownloadResponseSchema.parse(rawData);
    logger.info({ event: "facturama.downloadCfdiXml.success", cfdiId });
    return parsed;
  } catch (parseError) {
    logger.error({
      event: "facturama.downloadCfdiXml.parseError",
      cfdiId,
      rawResponse: rawResponseText,
      parseError:
        parseError instanceof Error ? parseError.message : String(parseError),
    });
    const error = new Error(`Failed to parse download CFDI XML response`);
    (error as any).responseText = rawResponseText;
    throw error;
  }
}
