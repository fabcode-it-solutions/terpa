import { z } from "zod";

// Teams
export const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
});
export type Team = z.infer<typeof TeamSchema>;

export const TeamListSchema = z.array(TeamSchema);

export const TeamInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  pharosMerchantCode: z.string().nullable(),
});
export type TeamInfo = z.infer<typeof TeamInfoSchema>;

// Auth
export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  role: z.string().optional(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthSessionSchema = z.object({
  authenticated: z.boolean(),
  requiresTotp: z.boolean().optional(),
  session: z
    .object({
      uid: z.string(),
      role: z.string(),
      type: z.string(),
    })
    .optional(),
  user: AuthUserSchema.optional(),
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;

export const VendingMachineSchema = z.object({
  id: z.string(),
  name: z.string(),
  terminalSerialNumber: z.string().optional(),
  pharosTerminalCode: z.string().optional(),
  lastPingAt: z.string().optional(),
  activeUntilDate: z.string().optional(),
  subscriptionExpired: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
  tubesTotal: z.number().optional(),
  currentChange: z.number().optional(),
  type: z.string().optional(),
  status: z.enum(["online", "offline", "warning"]).optional(),
  inventoryPercent: z.number().optional(),
  salesToday: z.number().optional(),
  machineModel: z.string().optional(),
  machineVersion: z.string().optional(),
  machineSerial: z.string().optional(),
  versionCode: z.string().optional(),
});
export type VendingMachine = z.infer<typeof VendingMachineSchema>;

export const MachineCountsSchema = z.object({
  total: z.number(),
  online: z.number(),
  warning: z.number(),
  offline: z.number(),
});
export type MachineCounts = z.infer<typeof MachineCountsSchema>;

export const MachineListResponseSchema = z.object({
  counts: MachineCountsSchema,
  machines: z.array(VendingMachineSchema),
});
export type MachineListResponse = z.infer<typeof MachineListResponseSchema>;

export const VendingMachineListSchema = z.array(VendingMachineSchema);

export const VendingMachineUpdateSchema = z.object({
  name: z.string().optional(),
  isEnabled: z.boolean().optional(),
  status: z.enum(["online", "offline", "warning"]).optional(),
});
export type VendingMachineUpdate = z.infer<typeof VendingMachineUpdateSchema>;

const PriceSchema = z.object({
  valueCents: z.number(),
  valueFormatted: z.string(),
});

// Products
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string().nullable(),
  price: PriceSchema.optional(),
  images: z.array(
    z.object({
      id: z.uuid(),
      url: z.url(),
    }),
  ),
  createdAt: z.string().optional(),
  createdAtFormatted: z.string().optional(),
});
export type Product = z.infer<typeof ProductSchema>;

export const ProductListSchema = z.array(ProductSchema);

// Machine detail/overview
export const MachineOverviewResponseSchema = z.object({
  machine: VendingMachineSchema,
  latestSales: z.array(z.any()).optional(),
  salesByDay: z.array(z.any()).optional(),
  topProducts: z.array(z.any()).optional(),
});
export type MachineOverviewResponse = z.infer<typeof MachineOverviewResponseSchema>;

// Machine sales for date
export const MachineSalesResponseSchema = z.object({
  date: z.string(),
  showPaymentMethod: z.boolean().optional(),
  summary: z.any().optional(),
  sales: z.array(z.any()).optional(),
});
export type MachineSalesResponse = z.infer<typeof MachineSalesResponseSchema>;

// Machine inventory
export const InventoryItemSchema = z.object({
  id: z.string(),
  machineCode: z.string().nullable(),
  machineMdbCode: z.string().nullable(),
  machineMicromarketCode: z.string().nullable(),
  currentCount: z.number(),
  maxCapacity: z.number(),
  percent: z.number(),
  status: z.enum(["high", "medium", "low"]),
  formattedCapacity: z.string(),
  product: z
    .object({
      id: z.string(),
      name: z.string(),
      sku: z.string().nullable(),
      price: z.object({
        valueCents: z.number(),
        valueFormatted: z.string(),
      }),
      images: z.array(
        z.object({
          id: z.string(),
          url: z.string(),
        }),
      ),
    })
    .nullable(),
});

export const MachineInventoryResponseSchema = z.object({
  machine: z.object({
    name: z.string(),
    type: z.enum(["VENDING", "MICROMARKET"]),
  }),
  picklist: z
    .object({
      id: z.string(),
      createdAt: z.string(),
    })
    .nullable(),
  products: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      price: z.object({
        valueCents: z.number(),
        valueFormatted: z.string(),
      }),
    }),
  ),
  summary: z.object({
    totalCapacity: z.number(),
    totalCurrentCount: z.number(),
    globalPercent: z.number(),
    formattedSummary: z.string(),
  }),
  inventory: z.array(InventoryItemSchema),
});

export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type MachineInventoryResponse = z.infer<typeof MachineInventoryResponseSchema>;

// Machine terminal (card transactions)
export const MachineTerminalResponseSchema = z.object({
  date: z.string().optional(),
  showPaymentMethod: z.boolean().optional(),
  showFinancials: z.boolean().optional(),
  accessDenied: z.boolean().optional(),
  accessDeniedReason: z.string().nullable().optional(),
  machineStatus: z
    .object({
      isLocked: z.boolean(),
      isExpired: z.boolean(),
      lockedMessage: z.string().nullable(),
      activeUntilDate: z.string().nullable(),
    })
    .optional(),
  summary: z
    .object({
      totalApproved: z
        .object({
          valueCents: z.number(),
          valueFormatted: z.string(),
        })
        .optional(),
      totalCount: z.number().optional(),
      byStatus: z
        .object({
          approved: z
            .object({
              count: z.number(),
              total: z.object({
                valueCents: z.number(),
                valueFormatted: z.string(),
              }),
            })
            .nullable()
            .optional(),
          rejected: z
            .object({
              count: z.number(),
              total: z.object({
                valueCents: z.number(),
                valueFormatted: z.string(),
              }),
            })
            .nullable()
            .optional(),
          reversed: z
            .object({
              count: z.number(),
              total: z.object({
                valueCents: z.number(),
                valueFormatted: z.string(),
              }),
            })
            .nullable()
            .optional(),
          chargeback: z
            .object({
              count: z.number(),
              total: z.object({
                valueCents: z.number(),
                valueFormatted: z.string(),
              }),
            })
            .nullable()
            .optional(),
        })
        .optional(),
      byCardType: z
        .record(
          z.string(),
          z
            .object({
              count: z.number(),
              total: z.object({
                valueCents: z.number(),
                valueFormatted: z.string(),
              }),
            })
            .nullable(),
        )
        .optional(),
      byCardBrand: z
        .record(
          z.string(),
          z
            .object({
              count: z.number(),
              total: z.object({
                valueCents: z.number(),
                valueFormatted: z.string(),
              }),
            })
            .nullable(),
        )
        .optional(),
    })
    .optional(),
  transactions: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]).optional(),
        createdAt: z.string().optional(),
        createdAtFormatted: z.string().optional(),
        amount: z
          .object({
            valueCents: z.number(),
            valueFormatted: z.string(),
          })
          .optional(),
        status: z.string().optional(),
        statusColor: z.string().optional(),
        statusLabel: z.string().optional(),
        cardBrand: z.string().nullable().optional(),
        cardBrandIcon: z.string().optional(),
        cardType: z.string().nullable().optional(),
        cardLast4: z.string().optional(),
        cardIssuer: z.string().nullable().optional(),
        approved: z.boolean().optional(),
        reversed: z.boolean().optional(),
        chargeback: z.boolean().optional(),
        authorizationNumber: z.string().optional(),
        referenceNumber: z.string().optional(),
        stan: z.number().optional(),
        transactionType: z.string().optional(),
        conciliated: z.boolean().optional(),
        paid: z.boolean().optional(),
        resultCode: z.string().optional(),
        country: z.string().optional(),
        countryCode: z.union([z.string(), z.number()]).optional(),
      }),
    )
    .optional(),
  lockedMessage: z.string().nullable().optional(),
});
export type MachineTerminalResponse = z.infer<typeof MachineTerminalResponseSchema>;

// Team members / Users
export const TeamMemberRoleSchema = z.enum(["OWNER", "OPERATOR"]);
export type TeamMemberRole = z.infer<typeof TeamMemberRoleSchema>;

export const TeamMemberSchema = z.object({
  userId: z.string(),
  email: z.string(),
  role: TeamMemberRoleSchema,
});
export type TeamMember = z.infer<typeof TeamMemberSchema>;

export const TeamUsersResponseSchema = z.object({
  members: z.array(TeamMemberSchema),
});
export type TeamUsersResponse = z.infer<typeof TeamUsersResponseSchema>;
