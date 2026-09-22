// Common list mappers to keep screens/VMs DRY

export type TopMachine = { id: string; name: string; totalSalesFormatted?: string };
export type TopProduct = {
  id: string;
  name: string;
  sales_count?: number;
  totalSalesFormatted?: string;
  imageUrl?: string;
  images?: string[];
};

export function mapTopMachines(
  items?: any[],
): Array<{ id: string; code: string; price: string; status: string }> {
  return (items ?? []).map((m: TopMachine) => ({
    id: m.id,
    code: m.name,
    price: m.totalSalesFormatted ?? "",
    status: "active",
  }));
}

export function mapTopProducts(
  items?: any[],
): Array<{ image?: any; name: string; code: string; sales: string; price: string }> {
  return (items ?? []).map((p: TopProduct) => ({
    image: (p as any).imageUrl || ((p as any).images && (p as any).images[0]) || "🥤",
    name: p.name,
    code: p.id,
    sales: String(p.sales_count ?? 0),
    price: p.totalSalesFormatted ?? "",
  }));
}
