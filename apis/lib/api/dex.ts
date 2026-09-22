import { prisma } from "@/lib/prisma";
import { MachineProtocol, PaymentMethod } from "@prisma/client";

type SaleData = {
  product: string;
  sales: number;
  price: number;
};

export async function handleDexDiff(params: {
  machineId: string;
  nextReportId: string;
  protocol: MachineProtocol;
  diff: {
    globalSales: Array<SaleData>;
    cashSales: Array<SaleData>;
    digitalSales: Array<SaleData>;
    freeSales: Array<SaleData>;
  };
}) {
  const totalSalesToCreate: Array<{
    machineId: string;
    machineProductId: string;
    machineProductCost: number;
    reportId: string;
    productId?: string | null;
    productName?: string | null;
    productPriceCents?: number | null;
    paymentMethod?: PaymentMethod | null;
  }> = [];

  const spiralsToupdate: Array<{
    machineId: string;
    machineCode: string;
    newCount: number;
  }> = [];

  // Get all the machine spiral data
  const spirals = await prisma.machineSpiral.findMany({
    where: { machineId: params.machineId },
    include: { product: true },
  });

  const processSale = (
    saleData: SaleData,
    paymentMethod: PaymentMethod | null,
  ) => {
    const spiral = spirals.find(
      (spiral) => spiral.machineCode === saleData.product,
    );

    if (spiral) {
      // check if we already have an update for the spiral
      const existingSpiralToUpdate = spiralsToupdate.find(
        (spiral) => spiral.machineCode === saleData.product,
      );

      // calculate the new count for the spiral after the sale
      const newCount =
        (existingSpiralToUpdate?.newCount || spiral.currentCount) -
        saleData.sales;

      // if we already have a spiral to update, just update the count
      if (existingSpiralToUpdate) {
        existingSpiralToUpdate.newCount = newCount < 0 ? 0 : newCount;
        return;
      }

      // if we don't have a spiral to update, add a new one
      spiralsToupdate.push({
        machineId: params.machineId,
        machineCode: spiral.id,
        newCount: newCount < 0 ? 0 : newCount,
      });
    }

    // create a new sale record for each sale count
    for (let i = 0; i < saleData.sales; i++) {
      totalSalesToCreate.push({
        machineId: params.machineId,
        machineProductId: saleData.product,
        machineProductCost: saleData.price,
        reportId: params.nextReportId,
        productId: spiral?.productId || null,
        productName: spiral?.product?.name || null,
        productPriceCents: spiral?.product?.priceCents || null,
        paymentMethod: paymentMethod || null,
      });
    }
  };

  // Handle sales if the machine protocol is DEX
  if (params.protocol === MachineProtocol.DEX) {
    console.log("Processing DEX sales", params.machineId);
    params.diff.cashSales.forEach((sale) => {
      processSale(sale, PaymentMethod.CASH);
    });
    params.diff.digitalSales.forEach((sale) => {
      processSale(sale, PaymentMethod.CARD);
    });
    params.diff.freeSales.forEach((sale) => {
      processSale(sale, PaymentMethod.FREE);
    });
    params.diff.globalSales.forEach((sale) => {
      processSale(sale, null); // global sales don't have a payment method
    });
  } else {
    console.log("Skipping DEX sales", params.machineId);
  }

  /**
   * Do all operations in a single transaction
   */
  await prisma.$transaction([
    ...(totalSalesToCreate.length > 0
      ? [prisma.sale.createMany({ data: totalSalesToCreate })]
      : []),
    prisma.dexReport.create({
      data: {
        reportId: params.nextReportId,
        machineId: params.machineId,
      },
    }),
    ...spiralsToupdate.map((spiral) =>
      prisma.machineSpiral.update({
        where: { id: spiral.machineCode },
        data: { currentCount: spiral.newCount },
      }),
    ),
  ]);
}
