import {
  InvoicePaymentMethod,
  InvoiceStatus,
  Machine,
  MachineProtocol,
  PaymentMethod,
  SaleType,
  TeamMemberRole,
  TerminalFlowType,
  TerminalLanguage,
  TerminalType,
  UserRole,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { addMonths, addYears, startOfMonth, subYears } from "date-fns";
import { nanoid } from "nanoid";
import slug from "slug";
import { prisma } from "../lib/prisma";
import { MACHINE_NAMES, PRODUCT_DATA, TEAM_NAMES } from "./fixtures";

// --- Simulation Constants ---
const NOW = new Date();
const SIMULATION_START_DATE = subYears(NOW, 1);
const SIMULATION_END_DATE = addYears(NOW, 1);

// --- Seeding Configuration ---
const NUM_TEAMS = 5;
const NUM_MACHINES_PER_TEAM = 10; // Increased for more variety
const NUM_SPIRALS_PER_MACHINE = 8;
const AVG_PRODUCT_SALES_PER_DAY = 20;
const AVG_SERVICE_SALES_PER_DAY = 3;

// Helper to hash passwords
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Create admin user
async function createAdminUser() {
  const email = "admin@terpa.com";
  const password = "Test123!";

  const adminUser = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      firstName: "Admin",
      lastName: "User",
      role: UserRole.ADMIN,
      password: {
        create: {
          hash: await hashPassword(password),
        },
      },
    },
  });

  console.log(`👤 Created admin user: ${adminUser.email}`);
  return { ...adminUser, password };
}

// Create a team
async function createTeam(index: number, createdAt: Date) {
  const name = TEAM_NAMES[index % TEAM_NAMES.length];
  const teamSlug = `${slug(name)}-${nanoid(4)}`;

  const team = await prisma.team.upsert({
    where: { slug: teamSlug },
    update: {},
    create: {
      name,
      slug: teamSlug,
      createdAt,
      pharosMerchantCode: Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase(),
      costPerMachineCents: 1500,
      onboardingCompleted: true,
    },
  });

  console.log(`\n🏢 Created team: ${team.name} (${team.slug})`);
  return team;
}

// Create a customer user for a team
async function createCustomerUser(teamId: string, teamName: string) {
  const email = `${teamName.toLowerCase().replace(/\s+/g, ".")}@example.com`;
  const password = "password123";

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      firstName: `${teamName} Owner`,
      lastName: "Demo",
      teamId,
      role: UserRole.CUSTOMER,
      password: {
        create: {
          hash: await hashPassword(password),
        },
      },
    },
  });

  console.log(`  👥 Created customer user: ${user.email}`);
  return user;
}

// Create team membership
async function createTeamMembership(userId: string, teamId: string) {
  const membership = await prisma.teamMember.create({
    data: {
      userId,
      teamId,
      role: TeamMemberRole.OWNER,
    },
  });

  console.log(`  🤝 Assigned user ${userId} to team ${teamId}`);
  return membership;
}

// Create products for a team
async function createProducts(teamId: string, createdById: string) {
  const productCreations = PRODUCT_DATA.map((p) => ({
    ...p,
    teamId,
    createdById,
    sku: Math.random().toString(36).substring(2, 8).toUpperCase(),
  }));

  await prisma.product.createMany({
    data: productCreations,
    skipDuplicates: true,
  });

  const products = await prisma.product.findMany({ where: { teamId } });

  console.log(`  🍫 Created ${products.length} products`);
  return products;
}

// Create a terminal for a machine
async function createTerminal(
  serialNumber: string,
  teamId: string,
  pharosTerminalCode: string,
  pharosMerchantCode: string,
  createdAt: Date,
  teamName: string,
  machineName: string,
) {
  // Generate a descriptive alias by combining team and machine names
  const alias = slug(`${teamName} ${machineName}`, { lower: true });

  const terminal = await prisma.terminal.create({
    data: {
      serialNumber,
      description: alias,
      teamId,
      pharosTerminalCode,
      pharosMerchantCode,
      type: TerminalType.VENDING,
      flowType: TerminalFlowType.A,
      language: TerminalLanguage.ES,
      acceptCreditPayments: true,
      acceptCashPayments: true,
      acceptServicePayments: false,
      decimalMode: 1,
      createdAt,
    },
  });

  console.log(`      💳 Created terminal: ${terminal.serialNumber} (${alias})`);
  return terminal;
}

// Create a machine for a team
async function createMachine(
  teamId: string,
  createdById: string,
  index: number,
  createdAt: Date,
  team: { name: string; pharosMerchantCode: string },
) {
  // Generate shared serial number for machine and terminal
  const sharedSerial = Math.random()
    .toString(36)
    .substring(2, 12)
    .toUpperCase();
  const pharosTerminalCode = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();

  const machineName = MACHINE_NAMES[index % MACHINE_NAMES.length];

  // Create the terminal first
  const terminal = await createTerminal(
    sharedSerial,
    teamId,
    pharosTerminalCode,
    team.pharosMerchantCode,
    createdAt,
    team.name,
    machineName,
  );

  const machine = await prisma.machine.create({
    data: {
      name: machineName,
      createdAt, // Explicitly set creation date
      teamId,
      createdById,
      machineModel: "VendMax 3000",
      machineSerial: sharedSerial,
      terminalSerialNumber: sharedSerial, // Link to terminal
      machineVersion: "1.0.0",
      isRemoteSaleEnabled: Math.random() > 0.5,
      remoteSaleEnabledUntil: addMonths(NOW, 6),
      pharosTerminalCode,
      lat: 19.4326, // Zocalo CDMX
      lon: -99.1332,
      protocol: MachineProtocol.DEX,
      activeUntilDate: createdAt, // Initially, active until its creation date
      lastPingAt: createdAt, // Initially, pinged at its creation date
      isEnabled: true,
      tubesTotal: 8,
    },
  });

  console.log(
    `    📠 Created machine: ${
      machine.name
    } on ${createdAt.toLocaleDateString()}`,
  );
  return machine;
}

// Create inventory items (spirals) for a machine
async function createInventoryItems(machineId: string, products: any[]) {
  const spirals = [];

  for (let i = 0; i < NUM_SPIRALS_PER_MACHINE; i++) {
    const maxCapacity = 20;
    const currentCount = Math.floor(Math.random() * maxCapacity);
    const product = products[i % products.length];

    const spiral = await prisma.machineSpiral.create({
      data: {
        machineId,
        machineCode: `${i + 10}`,
        machineMdbCode: `${i + 100}`,
        maxCapacity,
        currentCount,
        productId: product.id,
      },
    });
    spirals.push(spiral);
  }

  console.log(`      🔧 Created ${spirals.length} spirals`);
  return spirals;
}

// Create and pay monthly invoices for a machine
async function createMonthlyInvoicesForMachine(
  machine: Machine,
  team: { id: string; costPerMachineCents: number },
  adminUser: { id: string },
  exchangeRate: number,
  monthsToPay: number,
) {
  let currentMachineState = machine;

  for (let i = 0; i < monthsToPay; i++) {
    // The first invoice starts at the machine's creation date.
    // Subsequent invoices start from the machine's last expiration date.
    const startDate =
      i === 0
        ? machine.createdAt
        : startOfMonth(addMonths(currentMachineState.activeUntilDate, 1));

    // Ensure startDate is not in the future for payment generation
    const validStartDate = startDate > NOW ? NOW : startDate;
    const endDate = startOfMonth(addMonths(startDate, 1));

    // Payment date should be realistic, between start and end of the month
    const paymentDate = new Date(
      validStartDate.getTime() +
        Math.random() *
          ((endDate > NOW ? NOW : endDate).getTime() -
            validStartDate.getTime()),
    );

    const subtotalCents = team.costPerMachineCents; // Invoice is for 1 month
    const vatAmountCents = Math.round(subtotalCents * 0.16);
    const totalPriceCents = subtotalCents + vatAmountCents;

    await prisma.invoice.create({
      data: {
        teamId: team.id,
        status: InvoiceStatus.PAYMENT_SUCCESS,
        paymentMethod: InvoicePaymentMethod.MANUAL,
        subtotalCents,
        vatRatePercent: 16.0,
        vatAmountCents,
        totalPriceCents,
        exchangeRate,
        approvedByUserId: adminUser.id,
        approvedAt: paymentDate,
        paidAt: paymentDate,
        createdAt: paymentDate,
        invoiceItems: {
          create: {
            machineId: machine.id,
            description: `Servicio de 1 mes`,
            createdAt: paymentDate,
            subtotalCents,
            vatAmountCents,
            priceCents: totalPriceCents,
            startDate,
            endDate,
          },
        },
      },
    });

    currentMachineState = await prisma.machine.update({
      where: { id: machine.id },
      data: { activeUntilDate: endDate },
    });

    console.log(
      `      💳 Created invoice for month ${
        i + 1
      }. New expiration: ${currentMachineState.activeUntilDate.toLocaleDateString()}`,
    );
  }

  return currentMachineState;
}

// Create sales for a machine
async function createSales(
  machine: {
    id: string;
    createdAt: Date;
    activeUntilDate: Date;
  },
  products: any[],
  spirals: any[],
) {
  const sales = [];

  // Determine the valid period for sales: from creation until expiration or NOW, whichever is earlier.
  const salesEndDate =
    machine.activeUntilDate < NOW ? machine.activeUntilDate : NOW;

  // No sales if the machine was created in the future or the sales period is invalid.
  if (machine.createdAt > salesEndDate) {
    console.log(
      `      📈 No sales generated for machine created in the future or with an invalid date range.`,
    );
    return [];
  }

  // Calculate the number of days the machine was active for sales generation.
  const activeDays =
    Math.max(
      0,
      (salesEndDate.getTime() - machine.createdAt.getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1;
  const numSalesToCreate = Math.round(activeDays * AVG_PRODUCT_SALES_PER_DAY);

  if (numSalesToCreate <= 0) {
    console.log(`      📈 No product sales generated for short-lived machine.`);
    return [];
  }

  for (let i = 0; i < numSalesToCreate; i++) {
    // Generate a random date within the valid sales period.
    const saleDate = new Date(
      machine.createdAt.getTime() +
        Math.random() * (salesEndDate.getTime() - machine.createdAt.getTime()),
    );

    // Pick a random product and spiral
    const spiral = spirals[Math.floor(Math.random() * spirals.length)];
    const product =
      products.find((p) => p.id === spiral.productId) ||
      products[Math.floor(Math.random() * products.length)];

    const sale = await prisma.sale.create({
      data: {
        machineId: machine.id,
        token: Math.random().toString(36).substring(2, 15),
        machineProductCost: product.priceCents,
        machineProductId: spiral.machineCode,
        machineMdbProductId: spiral.machineMdbCode,
        productId: product.id,
        productName: product.name,
        productPriceCents: product.priceCents,
        productSku: product.sku,
        paymentMethod: i % 2 === 0 ? PaymentMethod.CASH : PaymentMethod.CARD, // 50/50 CASH/CARD
        createdAt: saleDate,
      },
    });

    sales.push(sale);
  }

  console.log(`      📈 Created ${sales.length} product sales`);
  return sales;
}

// Create service and phone recharge sales for a machine
async function createServiceAndRechargeSales(machine: {
  id: string;
  createdAt: Date;
  activeUntilDate: Date;
}) {
  const sales = [];

  // Determine the valid period for sales: from creation until expiration or NOW, whichever is earlier.
  const salesEndDate =
    machine.activeUntilDate < NOW ? machine.activeUntilDate : NOW;

  // No sales if the machine was created in the future or the sales period is invalid.
  if (machine.createdAt > salesEndDate) {
    console.log(
      `      📱 No service/recharge sales for machine created in the future or with an invalid date range.`,
    );
    return [];
  }

  // Calculate the number of days the machine was active for sales generation.
  const activeDays =
    Math.max(
      0,
      (salesEndDate.getTime() - machine.createdAt.getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1;
  const numSalesToCreate = Math.round(activeDays * AVG_SERVICE_SALES_PER_DAY);

  if (numSalesToCreate <= 0) {
    console.log(
      `      📱 No service/recharge sales generated for short-lived machine.`,
    );
    return [];
  }

  for (let i = 0; i < numSalesToCreate; i++) {
    // Generate a random date within the valid sales period.
    const saleDate = new Date(
      machine.createdAt.getTime() +
        Math.random() * (salesEndDate.getTime() - machine.createdAt.getTime()),
    );

    const token = Math.random().toString(36).substring(2, 15); // Generate token once for potential reuse in mock API response

    let saleData: any = {
      machineId: machine.id,
      token,
      paymentMethod: PaymentMethod.CARD, // Always CARD for these sales
      createdAt: saleDate,
    };

    if (i % 2 === 0) {
      // SERVICE sale
      const serviceCost = 1000; // $10.00
      saleData = {
        ...saleData,
        type: SaleType.SERVICE,
        machineProductCost: serviceCost,
        description: `Servicio de Mantenimiento`,
        serviceCharge: 200, // $2.00
        productId: undefined,
        productName: undefined,
        productPriceCents: undefined,
        productSku: undefined,
      };
    } else {
      // PHONE_RECHARGE sale
      const rechargeAmount = [1000, 2000, 3000, 5000, 10000][
        Math.floor(Math.random() * 5)
      ];
      const phoneNumber = `55${Math.floor(
        10000000 + Math.random() * 90000000,
      )}`;
      saleData = {
        ...saleData,
        type: SaleType.PHONE_RECHARGE,
        machineProductCost: rechargeAmount,
        description: `Recarga para ${phoneNumber} - Monto: ${
          rechargeAmount / 100
        }`,
        taecelServiceId: Math.random()
          .toString(36)
          .substring(2, 12)
          .toUpperCase(),
        taecelTransactionId: token,
        taecelApiResponse: JSON.stringify({
          success: true,
          amount: rechargeAmount,
          transactionId: token,
          carrier: "Telcel",
          phoneNumber: phoneNumber,
        }),
        productId: undefined,
        productName: undefined,
        productPriceCents: undefined,
        productSku: undefined,
      };
    }

    const sale = await prisma.sale.create({
      data: saleData,
    });
    sales.push(sale);
  }

  console.log(`      📱 Created ${sales.length} service/recharge sales`);
  return sales;
}

// Create remote sales for a machine
async function createRemoteSales(
  machine: {
    id: string;
    createdAt: Date;
    activeUntilDate: Date;
  },
  products: any[],
  spirals: any[],
) {
  // Only run this for a small percentage of machines
  if (Math.random() > 0.2) {
    return;
  }

  const sales = [];
  const numSales = Math.floor(Math.random() * 5) + 1;

  // Determine the valid period for sales: from creation until expiration or NOW, whichever is earlier.
  const salesEndDate =
    machine.activeUntilDate < NOW ? machine.activeUntilDate : NOW;

  // No sales if the machine was created in the future or the sales period is invalid.
  if (machine.createdAt > salesEndDate) {
    console.log(
      `      🛰️ No remote sales for machine created in the future or with an invalid date range.`,
    );
    return;
  }

  for (let i = 0; i < numSales; i++) {
    // Generate a random date within the valid sales period.
    const saleDate = new Date(
      machine.createdAt.getTime() +
        Math.random() * (salesEndDate.getTime() - machine.createdAt.getTime()),
    );

    const spiral = spirals[Math.floor(Math.random() * spirals.length)];
    const product =
      products.find((p) => p.id === spiral.productId) ||
      products[Math.floor(Math.random() * products.length)];

    const sale = await prisma.sale.create({
      data: {
        machineId: machine.id,
        token: Math.random().toString(36).substring(2, 15),
        machineProductCost: product.priceCents,
        machineProductId: spiral.machineCode,
        machineMdbProductId: spiral.machineMdbCode,
        productId: product.id,
        productName: product.name,
        productPriceCents: product.priceCents,
        productSku: product.sku,
        paymentMethod: PaymentMethod.REMOTE,
        createdAt: saleDate,
      },
    });

    sales.push(sale);
  }

  console.log(`      🛰️ Created ${sales.length} remote sales`);
  return sales;
}

// Create invoices with varying statuses for a team
async function createInvoicesWithVaryingStatus(
  team: { id: string; costPerMachineCents: number },
  machines: Machine[],
  adminUser: { id: string },
  exchangeRate: number,
) {
  console.log(`  📄 Creating invoices with varying statuses...`);

  const statusesToCreate = [
    InvoiceStatus.PAYMENT_PENDING,
    InvoiceStatus.PAYMENT_VERIFICATION_PENDING,
    InvoiceStatus.PAYMENT_VERIFICATION_REJECTED,
    InvoiceStatus.CANCELLED,
  ];

  // Filter for machines that are not in the future
  const eligibleMachines = machines.filter((m) => m.createdAt <= NOW);
  if (eligibleMachines.length === 0) {
    console.log(
      `    No eligible (non-future) machines to create special status invoices for.`,
    );
    return;
  }

  for (const status of statusesToCreate) {
    // Select a random machine for the invoice
    const machine =
      eligibleMachines[Math.floor(Math.random() * eligibleMachines.length)];

    const subtotalCents = team.costPerMachineCents;
    const vatAmountCents = Math.round(subtotalCents * 0.16);
    const totalPriceCents = subtotalCents + vatAmountCents;
    const creationDate = new Date(
      machine.createdAt.getTime() +
        Math.random() * (NOW.getTime() - machine.createdAt.getTime()),
    );

    let invoiceData: any = {
      teamId: team.id,
      status,
      subtotalCents,
      vatRatePercent: 16.0,
      vatAmountCents,
      totalPriceCents,
      exchangeRate,
      createdAt: creationDate,
      invoiceItems: {
        create: {
          machineId: machine.id,
          description: `Servicio de 1 mes (${status})`,
          createdAt: creationDate,
          subtotalCents,
          vatAmountCents,
          priceCents: totalPriceCents,
          startDate: startOfMonth(creationDate),
          endDate: startOfMonth(addMonths(creationDate, 1)),
        },
      },
    };

    switch (status) {
      case InvoiceStatus.PAYMENT_VERIFICATION_PENDING:
        invoiceData = {
          ...invoiceData,
          paymentMethod: InvoicePaymentMethod.MANUAL,
          paymentProofUrl: "https://example.com/proof.pdf",
          paidAt: new Date(),
        };
        break;
      case InvoiceStatus.PAYMENT_VERIFICATION_REJECTED:
        invoiceData = {
          ...invoiceData,
          paymentMethod: InvoicePaymentMethod.MANUAL,
          paymentProofUrl: "https://example.com/rejected-proof.pdf",
          paidAt: new Date(),
          rejectedByUserId: adminUser.id,
          rejectedAt: new Date(),
        };
        break;
      case InvoiceStatus.CANCELLED:
        invoiceData = {
          ...invoiceData,
          cancelledByUserId: adminUser.id,
          cancelledAt: new Date(),
        };
        break;
    }

    await prisma.invoice.create({ data: invoiceData });
    console.log(`    📄 Created invoice with status: ${status}`);
  }
}

// Create an exchange rate
async function createExchangeRate() {
  const rate = 20.5;

  const exchangeRate = await prisma.exchangeRateHistory.create({
    data: {
      fromCurrency: "USD",
      toCurrency: "MXN",
      rate,
    },
  });

  console.log(
    `💱 Created exchange rate: 1 USD = ${exchangeRate.rate} ${exchangeRate.toCurrency}`,
  );
  return exchangeRate;
}

async function createMachineAndData(
  machineIndex: number,
  team: any,
  adminUser: { id: string },
  exchangeRate: { rate: number },
  products: any[],
  createdAt: Date,
) {
  let machine = await createMachine(
    team.id,
    adminUser.id,
    machineIndex,
    createdAt,
    team,
  );

  if (createdAt > NOW) {
    const futureMachine = await prisma.machine.update({
      where: { id: machine.id },
      data: { lastPingAt: NOW, isEnabled: false },
    });
    console.log(
      `      ⏳ Machine ${machine.name} is scheduled for the future. No invoices or sales generated.`,
    );
    return futureMachine;
  }

  const scenario = Math.random() < 0.8 ? "active" : "expired";
  if (scenario === "active") {
    const monthsSinceCreation =
      (NOW.getFullYear() - createdAt.getFullYear()) * 12 +
      (NOW.getMonth() - createdAt.getMonth());
    const monthsToPay = monthsSinceCreation + Math.floor(Math.random() * 6) + 1;
    if (monthsToPay > 0) {
      machine = await createMonthlyInvoicesForMachine(
        machine,
        team,
        adminUser,
        exchangeRate.rate,
        monthsToPay,
      );
    }
    console.log(
      `      ✅ Machine ${
        machine.name
      } is ACTIVE until ${machine.activeUntilDate.toLocaleDateString()}`,
    );
  } else {
    const monthsSinceCreation =
      (NOW.getFullYear() - createdAt.getFullYear()) * 12 +
      (NOW.getMonth() - createdAt.getMonth());
    if (monthsSinceCreation > 1) {
      const monthsToPay =
        Math.floor(Math.random() * (monthsSinceCreation - 1)) + 1;
      machine = await createMonthlyInvoicesForMachine(
        machine,
        team,
        adminUser,
        exchangeRate.rate,
        monthsToPay,
      );
    }
    console.log(
      `      ❌ Machine ${
        machine.name
      } is EXPIRED since ${machine.activeUntilDate.toLocaleDateString()}`,
    );
  }

  const isEnabled = machine.activeUntilDate > NOW;
  const lastPingAt = isEnabled ? NOW : machine.activeUntilDate;
  const updatedMachine = await prisma.machine.update({
    where: { id: machine.id },
    data: { lastPingAt, isEnabled },
  });

  const spirals = await createInventoryItems(updatedMachine.id, products);
  await createSales(updatedMachine, products, spirals);
  await createServiceAndRechargeSales(updatedMachine);
  await createRemoteSales(updatedMachine, products, spirals);

  return updatedMachine;
}

async function createTeamAndData(
  teamIndex: number,
  adminUser: { id: string },
  exchangeRate: { rate: number },
) {
  const machineCreationDates = Array.from({
    length: NUM_MACHINES_PER_TEAM,
  }).map(
    () =>
      new Date(
        SIMULATION_START_DATE.getTime() +
          Math.random() * (NOW.getTime() - SIMULATION_START_DATE.getTime()),
      ),
  );

  const oldestMachineDate = new Date(
    Math.min(...machineCreationDates.map((d) => d.getTime())),
  );

  const team = await createTeam(teamIndex, oldestMachineDate);
  const customerUser = await createCustomerUser(team.id, team.name);
  await createTeamMembership(customerUser.id, team.id);
  const products = await createProducts(team.id, adminUser.id);

  const machineCreationPromises = machineCreationDates.map((createdAt, j) =>
    createMachineAndData(j, team, adminUser, exchangeRate, products, createdAt),
  );

  const machines = await Promise.all(machineCreationPromises);

  // Create a few invoices with other statuses for variety
  await createInvoicesWithVaryingStatus(
    team,
    machines.filter((m): m is Machine => !!m), // Filter out undefined results
    adminUser,
    exchangeRate.rate,
  );

  return { team, customerUser };
}

// Main function to seed the database
async function main() {
  console.log("🌱 Starting database seed...");

  // Create admin user
  const adminUser = await createAdminUser();

  // Create exchange rate
  const exchangeRate = await createExchangeRate();

  // Create teams in parallel
  const teamCreationPromises = [];
  for (let i = 0; i < NUM_TEAMS; i++) {
    teamCreationPromises.push(createTeamAndData(i, adminUser, exchangeRate));
  }
  const teamResults = await Promise.all(teamCreationPromises);

  console.log("\n🔑 ADMIN ACCESS:");
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   Password: ${adminUser.password}`);

  console.log("\n👥 CUSTOMER ACCESS:");
  teamResults.forEach(({ team, customerUser }) => {
    console.log(`   ${customerUser.email} - password123 (${team.name})`);
  });
}

// Run the seed function
main()
  .catch((e) => {
    console.error("❌ Error during seeding:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Close Prisma client connection
    await prisma.$disconnect();
  });
