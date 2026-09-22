import { useQuery } from "@tanstack/react-query";
import { productsRepo } from "@/services/repositories/products";
import type { Product } from "@/services/api/schemas";

const keys = {
  all: ["products"] as const,
  list: (teamId: string, query?: string) => ["products", teamId, query ?? ""] as const,
};

export function useProducts(teamId?: string, params?: { query?: string }) {
  return useQuery<Product[]>({
    queryKey: teamId ? keys.list(teamId, params?.query) : keys.all,
    queryFn: () => productsRepo.list(teamId as string, params),
    enabled: !!teamId,
  });
}
