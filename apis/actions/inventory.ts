"use server";

import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getTeamMachine } from "@/loaders/machine";
import { getTeamBySlug } from "@/loaders/team";
import {
  inventoryEmptySchema,
  inventoryExportSchema,
  inventoryFillSchema,
  picklistDeleteSchema,
  picklistEditSchema,
  picklistExportSchema,
  picklistFillSchema,
  picklistGenerateSchema,
  picklistRegenerateSchema,
  spiralCreateSchema,
  spiralDecrementSchema,
  spiralDeleteSchema,
  spiralEditSchema,
  spiralFillSchema,
  spiralIncrementSchema,
} from "@/validation/inventory";
import { stringify } from "csv-stringify/sync";
import { revalidatePath } from "next/cache";
import { RedirectType, notFound, redirect } from "next/navigation";

/**
 * Spiral related actions
 */

/**
 * Action to handle creating a new spiral
 */
export async function spiralCreateAction(payload: unknown) {
  const parsed = spiralCreateSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  const existingSpiralsInMachine = await prisma.machineSpiral.findMany({
    where: {
      machineId: parsed.machineId,
      deletedAt: null,
    },
    select: {
      machineCode: true,
      machineMdbCode: true,
      machineMicromarketCode: true,
    },
  });

  let dexCodeConflict = false;
  if (parsed.machineCode !== null) {
    dexCodeConflict = existingSpiralsInMachine.some(
      (spiral) => spiral.machineCode === parsed.machineCode,
    );
  }

  let mdbCodeConflict = false;
  if (parsed.machineMdbCode !== null) {
    mdbCodeConflict = existingSpiralsInMachine.some(
      (spiral) => spiral.machineMdbCode === parsed.machineMdbCode,
    );
  }

  let micromarketCodeConflict = false;
  if (parsed.machineMicromarketCode !== null) {
    micromarketCodeConflict = existingSpiralsInMachine.some(
      (spiral) =>
        spiral.machineMicromarketCode === parsed.machineMicromarketCode,
    );
  }

  // Check for conflicts
  if (micromarketCodeConflict) {
    return {
      error: `El código de producto '${parsed.machineMicromarketCode}' ya está en uso en este micromarket.`,
    };
  }

  if (dexCodeConflict && mdbCodeConflict) {
    return {
      error: `El código DEX '${parsed.machineCode}' y el código MDB '${parsed.machineMdbCode}' ya están en uso en esta máquina.`,
    };
  } else if (dexCodeConflict) {
    return {
      error: `El código DEX '${parsed.machineCode}' ya está en uso en esta máquina.`,
    };
  } else if (mdbCodeConflict) {
    return {
      error: `El código MDB '${parsed.machineMdbCode}' ya está en uso en esta máquina.`,
    };
  }

  // create the spiral
  await prisma.machineSpiral.create({
    data: {
      machineId: parsed.machineId,
      machineCode: parsed.machineCode,
      productId: parsed.productId,
      currentCount: parsed.currentCount,
      maxCapacity: parsed.maxCapacity,
      machineMdbCode: parsed.machineMdbCode,
      machineMicromarketCode: parsed.machineMicromarketCode,
    },
  });

  // Clear client cache and redirect to the inventory page
  revalidatePath("/", "layout");
  redirect(`/team/${team.slug}/machines/${machine.id}/inventory`);
}

/**
 * Action to handle editing a spiral
 */
export async function spiralEditAction(payload: unknown) {
  const parsed = spiralEditSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  // check if the spiral exists and belongs to the machine
  const spiral = await prisma.machineSpiral.findUnique({
    where: {
      id: parsed.spiralId,
      machineId: machine.id,
      deletedAt: null,
    },
  });

  if (!spiral) {
    return { error: "Espiral no encontrado." };
  }

  // update the spiral
  await prisma.machineSpiral.update({
    where: { id: parsed.spiralId },
    data: {
      machineCode: parsed.machineCode,
      machineMdbCode: parsed.machineMdbCode,
      machineMicromarketCode: parsed.machineMicromarketCode,
      productId: parsed.productId,
      currentCount: parsed.currentCount,
      maxCapacity: parsed.maxCapacity,
    },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Action to handle deleting a spiral
 */
export async function spiralDeleteAction(payload: unknown) {
  const parsed = spiralDeleteSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  // check if the spiral exists and belongs to the machine
  const spiral = await prisma.machineSpiral.findUnique({
    where: { id: parsed.spiralId, machineId: machine.id, deletedAt: null },
  });

  if (!spiral) {
    return notFound();
  }

  // delete the spiral
  await prisma.machineSpiral.update({
    where: { id: parsed.spiralId },
    data: { deletedAt: new Date(), machineCode: null, machineMdbCode: null },
  });

  revalidatePath("/", "layout");
}

/**
 * Action to handle refilling a spiral
 */
export async function spiralFillAction(payload: unknown) {
  const parsed = spiralFillSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  if (!machine) {
    return notFound();
  }

  // check if the spiral exists and belongs to the machine
  const spiral = await prisma.machineSpiral.findUnique({
    where: {
      id: parsed.spiralId,
      machineId: parsed.machineId,
      deletedAt: null,
    },
  });

  if (!spiral) {
    return notFound();
  }

  // refill the spiral
  await prisma.machineSpiral.update({
    where: { id: parsed.spiralId },
    data: { currentCount: spiral.maxCapacity },
  });

  revalidatePath("/", "layout");
}

/**
 * Action to handle emptying a spiral
 */
export async function spiralEmptyAction(payload: unknown) {
  const parsed = spiralFillSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  // check if the spiral exists and belongs to the machine
  const spiral = await prisma.machineSpiral.findUnique({
    where: { id: parsed.spiralId, machineId: machine.id, deletedAt: null },
  });

  if (!spiral) {
    return notFound();
  }

  // empty the spiral
  await prisma.machineSpiral.update({
    where: { id: parsed.spiralId },
    data: { currentCount: 0 },
  });

  revalidatePath("/", "layout");
}

/**
 * Inventory related actions
 */

/**
 * Action to handle filling all spirals in a machine
 */
export async function inventoryFillAction(payload: unknown) {
  const parsed = inventoryFillSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  // get all spirals in the machine
  const spirals = await prisma.machineSpiral.findMany({
    where: { machineId: machine.id, deletedAt: null },
  });

  // check if there is an existing unfufilled picklist for the machine
  const existingPicklist = await prisma.machinePicklist.findFirst({
    where: { machineId: machine.id, fulfilledAt: null, deletedAt: null },
  });

  // refill all spirals
  await prisma.$transaction([
    // Update the current count of each spiral to its max capacity
    ...spirals.map((spiral) =>
      prisma.machineSpiral.update({
        where: { id: spiral.id },
        data: { currentCount: spiral.maxCapacity },
      }),
    ),
    // Mark the existing picklist as deleted if one exists
    ...(existingPicklist
      ? [
          prisma.machinePicklist.update({
            where: { id: existingPicklist.id },
            data: { deletedAt: new Date() },
          }),
        ]
      : []),
  ]);

  revalidatePath("/", "layout");
}

/**
 * Action to handle emptying all spirals in a machine
 */
export async function inventoryEmptyAction(payload: unknown) {
  const parsed = inventoryEmptySchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  // get all spirals in the machine
  const spirals = await prisma.machineSpiral.findMany({
    where: { machineId: machine.id, deletedAt: null },
  });

  // empty all spirals
  await prisma.$transaction(
    spirals.map((spiral) =>
      prisma.machineSpiral.update({
        where: { id: spiral.id },
        data: { currentCount: 0 },
      }),
    ),
  );

  revalidatePath("/", "layout");
}

/**
 * Picklist related actions
 */

/**
 * Action to handle generating a picklist for a machine
 */
export async function picklistGenerateAction(payload: unknown) {
  const parsed = picklistGenerateSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  // check if there is an existing unfufilled picklist for the machine
  const existingPicklist = await prisma.machinePicklist.findFirst({
    where: { machineId: machine.id, fulfilledAt: null, deletedAt: null },
  });

  // there can only be one picklist per machine
  if (existingPicklist) {
    return { error: "Ya existe una picklist pendiente para esta máquina." };
  }

  // get all spirals in the machine
  const spirals = await prisma.machineSpiral.findMany({
    where: { machineId: machine.id, deletedAt: null },
  });

  // get the spirals that need to be updated
  const spiralsToUpdate = spirals
    .map((spiral) => ({
      id: spiral.id,
      productId: spiral.productId,
      quantity: spiral.maxCapacity - spiral.currentCount,
    }))
    // filter out spirals that are already full
    .filter((item) => item.quantity > 0);

  // create the picklist for the machine
  await prisma.machinePicklist.create({
    data: {
      machineId: machine.id,
      items: {
        createMany: {
          data: spiralsToUpdate.map((spiral) => ({
            machineSpiralId: spiral.id,
            quantity: spiral.quantity,
          })),
        },
      },
    },
  });

  revalidatePath("/", "layout");
  redirect(`/team/${team.slug}/machines/${machine.id}/inventory/picklist`);
}

/**
 * Action to edit a list of items in a picklist.
 */
export async function picklistEditAction(payload: unknown) {
  requireSession();
  const parsed = picklistEditSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  // find the picklist
  const picklist = await prisma.machinePicklist.findFirst({
    where: { machineId: machine.id, fulfilledAt: null },
    include: {
      items: { include: { machineSpiral: { include: { product: true } } } },
    },
  });

  // a picklist must exist
  if (!picklist) {
    return { error: "Ya no hay una picklist pendiente para esta máquina." };
  }

  const updates = Object.keys(parsed.items);

  // update the picklist items
  prisma.$transaction(
    updates.map((id) => {
      const item = parsed.items[id];
      return prisma.picklistItem.update({
        where: { id },
        data: { quantity: item.quantity },
      });
    }),
  );

  revalidatePath("/", "layout");
  redirect(
    `/team/${team.slug}/machines/${machine.id}/inventory`,
    RedirectType.replace,
  );
}

/**
 * Action to delete a picklist.
 */
export async function picklistDeleteAction(payload: unknown) {
  const parsed = picklistDeleteSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  // find the picklist
  const picklist = await prisma.machinePicklist.findFirst({
    where: { machineId: machine.id, fulfilledAt: null, deletedAt: null },
  });

  // a picklist must exist
  if (!picklist) {
    return { error: "Ya no hay una picklist pendiente para esta máquina." };
  }

  // soft delete the picklist
  await prisma.machinePicklist.update({
    where: { id: picklist.id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/", "layout");
  redirect(
    `/team/${team.slug}/machines/${machine.id}/inventory`,
    RedirectType.replace,
  );
}

/**
 * Action to rgenerate a picklist.
 */
export async function picklistRegenerateAction(payload: unknown) {
  const parsed = picklistRegenerateSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  // find the picklist
  const picklist = await prisma.machinePicklist.findFirst({
    where: { machineId: machine.id, fulfilledAt: null, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  // a picklist must exist
  if (!picklist) {
    return { error: "Ya no hay una picklist pendiente para esta máquina." };
  }

  // get all spirals in the machine
  const spirals = await prisma.machineSpiral.findMany({
    where: { machineId: machine.id, deletedAt: null },
  });

  // get the spirals that need to be updated
  const spiralsToUpdate = spirals
    .map((spiral) => ({
      id: spiral.id,
      productId: spiral.productId,
      quantity: spiral.maxCapacity - spiral.currentCount,
    }))
    // filter out spirals that are already full
    .filter((item) => item.quantity > 0);

  await prisma.$transaction([
    prisma.machinePicklist.update({
      where: { id: picklist.id },
      data: { deletedAt: new Date() },
    }),
    prisma.machinePicklist.create({
      data: {
        machineId: machine.id,
        items: {
          createMany: {
            data: spiralsToUpdate.map((spiral) => ({
              machineSpiralId: spiral.id,
              quantity: spiral.quantity,
            })),
          },
        },
      },
    }),
  ]);
}

/**
 * Action to fill a picklist.
 */
export async function picklistFillAction(payload: unknown) {
  const parsed = picklistFillSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  // find the picklist
  const picklist = await prisma.machinePicklist.findFirst({
    where: { machineId: machine.id, fulfilledAt: null, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { machineSpiral: true } } },
  });

  // a picklist must exist
  if (!picklist) {
    return { error: "Ya no hay una picklist pendiente para esta máquina." };
  }

  // fill the picklist and mark it as fulfilled in a single
  await prisma.$transaction([
    ...picklist.items.map((item) => {
      const spaceRemaining =
        item.machineSpiral.maxCapacity - item.machineSpiral.currentCount;
      const increment = Math.min(spaceRemaining, item.quantity);

      return prisma.machineSpiral.update({
        where: { id: item.machineSpiralId },
        data: { currentCount: { increment } },
      });
    }),
    prisma.machinePicklist.update({
      where: { id: picklist.id },
      data: { fulfilledAt: new Date() },
    }),
  ]);

  revalidatePath("/", "layout");
  redirect(`/team/${team.slug}/machines/${machine.id}/inventory`);
}

/**
 * Action to handle decrementing the inventory of a spiral
 */
export async function spiralDecrementAction(payload: unknown) {
  const parsed = spiralDecrementSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  // find the spiral
  const spiral = await prisma.machineSpiral.findFirst({
    where: { id: parsed.spiralId, machineId: machine.id, deletedAt: null },
  });

  // a spiral must exist
  if (!spiral) {
    return { success: false, error: "El espiral no existe." };
  }

  // decrement the spiral
  try {
    await prisma.machineSpiral.update({
      where: { id: parsed.spiralId, currentCount: { gt: 0 } },
      data: { currentCount: { decrement: 1 } },
    });
  } catch (error) {
    return { success: false, error: "No se pudo decrementar el inventario." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Action to handle incrementing the inventory of a spiral
 */
export async function spiralIncrementAction(payload: unknown) {
  const parsed = spiralIncrementSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  // find the spiral
  const spiral = await prisma.machineSpiral.findFirst({
    where: { id: parsed.spiralId, machineId: machine.id, deletedAt: null },
  });

  // a spiral must exist
  if (!spiral) {
    return { success: false, error: "El espiral no existe." };
  }

  // increment the spiral
  try {
    await prisma.machineSpiral.update({
      where: { id: parsed.spiralId, currentCount: { lt: spiral.maxCapacity } },
      data: { currentCount: { increment: 1 } },
    });
  } catch (error) {
    return { success: false, error: "No se pudo incrementar el inventario." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Action to handle exporting a picklist
 */
export async function picklistExportAction(payload: unknown) {
  const parsed = picklistExportSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  // find the picklist
  const picklist = await prisma.machinePicklist.findFirst({
    where: { machineId: machine.id, fulfilledAt: null, deletedAt: null },
    include: {
      items: { include: { machineSpiral: { include: { product: true } } } },
    },
  });

  if (!picklist) {
    return { error: "No hay una picklist pendiente para esta máquina." };
  }

  const data = picklist.items.map((item) => ({
    DEX: item.machineSpiral.machineCode,
    MDB: item.machineSpiral.machineMdbCode,
    Producto: item.machineSpiral.product?.name,
    Costo: formatCurrency(item.machineSpiral.product?.priceCents || 0),
    SKU: item.machineSpiral.product?.sku,
    Cantidad: item.quantity,
  }));

  // create a csv file using csv-stringify
  const csv = stringify(data, {
    header: true,
    columns: ["DEX", "MDB", "Producto", "Costo", "SKU", "Cantidad"],
  });

  return { success: true, data: csv };
}

/**
 * Action to handle exporting machine inventory
 */
export async function inventoryExportAction(payload: unknown) {
  const parsed = inventoryExportSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  // get all spirals with product data
  const spirals = await prisma.machineSpiral.findMany({
    where: { machineId: machine.id, deletedAt: null },
    select: {
      machineCode: true,
      machineMdbCode: true,
      currentCount: true,
      maxCapacity: true,
      product: {
        select: {
          name: true,
          priceCents: true,
          sku: true,
        },
      },
    },
  });

  // If every spiral has a machine code that is a number, sort by machine code
  // as a number, otherwise, sort by machine code as a string
  const sortedSpirals = spirals.every(
    (s) => !isNaN(parseInt(s.machineCode || "")),
  )
    ? spirals.sort(
        (a, b) => parseInt(a.machineCode || "") - parseInt(b.machineCode || ""),
      )
    : spirals.sort((a, b) =>
        (a.machineCode || "").localeCompare(b.machineCode || ""),
      );

  const data = sortedSpirals.map((spiral) => {
    const percent =
      Math.round((spiral.currentCount / spiral.maxCapacity) * 100) || 0;

    return {
      codigo_dex: spiral.machineCode || "",
      codigo_mdb: spiral.machineMdbCode || "",
      producto: spiral.product?.name || "",
      precio: spiral.product ? formatCurrency(spiral.product.priceCents) : "",
      sku: spiral.product?.sku || "",
      cantidad_actual: spiral.currentCount,
      capacidad_maxima: spiral.maxCapacity,
      porcentaje: `${percent}%`,
    };
  });

  // create a csv file using csv-stringify
  const csv = stringify(data, {
    header: true,
    columns: [
      "codigo_dex",
      "codigo_mdb",
      "producto",
      "precio",
      "sku",
      "cantidad_actual",
      "capacidad_maxima",
      "porcentaje",
    ],
  });

  return { success: true, data: csv };
}
