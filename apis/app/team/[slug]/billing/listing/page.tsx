import { InvoiceHistoryTable } from "@/components/team/invoice-history-table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getTeamInvoiceHistory } from "@/loaders/invoice";
import { getTeamBySlugCached } from "@/loaders/team";
import { isFacturamaEnabledForTeam } from "@/service/experiment";

export const dynamic = "force-dynamic";

type Props = {
  params: {
    slug: string;
  };
  searchParams: {
    page?: string;
  };
};

export default async function HistorialPage({ params, searchParams }: Props) {
  const page = searchParams.page ? parseInt(searchParams.page) : 1;

  try {
    const [{ invoices, pagination }, team] = await Promise.all([
      getTeamInvoiceHistory(params.slug, page),
      getTeamBySlugCached(params.slug),
    ]);

    const isFacturamaEnabled = await isFacturamaEnabledForTeam(team.id);

    return (
      <div className="space-y-6">
        <InvoiceHistoryTable
          invoices={invoices}
          isFacturamaEnabled={isFacturamaEnabled}
        />

        {pagination.totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              {pagination.hasPreviousPage && (
                <PaginationItem>
                  <PaginationPrevious
                    href={`/team/${params.slug}/billing/listing?page=${page - 1}`}
                  />
                </PaginationItem>
              )}

              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1,
              ).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href={`/team/${params.slug}/billing/listing?page=${pageNum}`}
                    isActive={pageNum === page}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {pagination.hasNextPage && (
                <PaginationItem>
                  <PaginationNext
                    href={`/team/${params.slug}/billing/listing?page=${page + 1}`}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        )}
      </div>
    );
  } catch (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Error al cargar el historial de pagos
        </p>
      </div>
    );
  }
}
