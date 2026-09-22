export const endpoints = {
  auth: {
    login: "/api/v1/auth/login",
    session: "/api/v1/auth/session",
    requestRecovery: "/api/v1/auth/request-recovery-token",
    submitRecovery: "/api/v1/auth/submit-recovery-token",
    exchangeTotp: "/api/v1/auth/exchange-totp-token",
  },
  teams: {
    list: "/api/v1/teams",
    info: (teamId: string) => `/api/v1/teams/${encodeURIComponent(teamId)}/info`,
    users: (teamId: string) => `/api/v1/teams/${encodeURIComponent(teamId)}/users`,
    machines: (teamId: string) => `/api/v1/teams/${encodeURIComponent(teamId)}/machines`,
    machineById: (teamId: string, machineId: string) =>
      `/api/v1/teams/${encodeURIComponent(teamId)}/machines/${encodeURIComponent(machineId)}`,
    machineSales: (teamId: string, machineId: string) =>
      `/api/v1/teams/${encodeURIComponent(teamId)}/machines/${encodeURIComponent(machineId)}/sales`,
    machineInventory: (teamId: string, machineId: string) =>
      `/api/v1/teams/${encodeURIComponent(teamId)}/machines/${encodeURIComponent(machineId)}/inventory`,
    spiralUpdate: (teamId: string, machineId: string, spiralId: string) =>
      `/api/v1/teams/${encodeURIComponent(teamId)}/machines/${encodeURIComponent(machineId)}/inventory/spirals/${encodeURIComponent(spiralId)}`,
    machineTerminal: (teamId: string, machineId: string) =>
      `/api/v1/teams/${encodeURIComponent(teamId)}/machines/${encodeURIComponent(machineId)}/terminal`,
    dashboard: (teamId: string) => `/api/v1/teams/${encodeURIComponent(teamId)}/dashboard`,
    dashboardReports: (teamId: string) =>
      `/api/v1/teams/${encodeURIComponent(teamId)}/dashboard/reports`,
    products: (teamId: string) => `/api/v1/teams/${encodeURIComponent(teamId)}/products`,
    productById: (teamId: string, productId: string) =>
      `/api/v1/teams/${encodeURIComponent(teamId)}/products/${encodeURIComponent(productId)}`,
    billing: (teamId: string) => `/api/v1/teams/${encodeURIComponent(teamId)}/billing`,
    billingListing: (teamId: string) =>
      `/api/v1/teams/${encodeURIComponent(teamId)}/billing/listing`,
    payments: (teamId: string) => `/api/v1/teams/${encodeURIComponent(teamId)}/payments`,
  },
};
