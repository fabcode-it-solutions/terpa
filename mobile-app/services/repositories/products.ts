import { apiClient } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { Product, ProductListSchema } from "@/services/api/schemas";

export const productsRepo = {
  async list(teamId: string, params?: { query?: string }): Promise<Product[]> {
    const base = endpoints.teams.products(teamId);
    let path = base;
    if (params?.query && params.query.trim().length > 0) {
      const q = new URLSearchParams({ query: params.query.trim() });
      path = `${base}?${q.toString()}`;
    }
    const data = await apiClient.get<unknown>(path);
    const products = (data as any)?.products ?? data;
    return ProductListSchema.parse(products);
  },
};
