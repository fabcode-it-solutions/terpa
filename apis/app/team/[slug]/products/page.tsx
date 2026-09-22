import ProductDropdown from "@/components/product/product-dropdown";
import SearchBox from "@/components/search-box";
import Timestamp from "@/components/timestamp";
import { AppContainer } from "@/components/ui/app-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Title } from "@/components/ui/typography";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { getCdnUrl } from "@/lib/s3";
import { requireSession } from "@/lib/session";
import { getTeamBySlugCached } from "@/loaders/team";
import { TeamMemberRole, UserRole } from "@prisma/client";
import { ImageIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  params: {
    slug: string;
  };
  searchParams: {
    query: string;
  };
};

export default async function Page(props: Props) {
  const session = requireSession();
  const team = await getTeamBySlugCached(props.params.slug);
  const products = await prisma.product.findMany({
    where: {
      teamId: team.id,
      deletedAt: null,
      ...(props.searchParams.query
        ? {
            OR: [
              {
                name: {
                  contains: props.searchParams.query,
                  mode: "insensitive",
                },
              },
              {
                sku: {
                  contains: props.searchParams.query,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { name: "desc" },
    select: {
      id: true,
      name: true,
      priceCents: true,
      createdAt: true,
      sku: true,
      productImages: {
        where: { deletedAt: null },
        select: { fileUrl: true },
        orderBy: { position: "asc" },
        take: 1,
      },
    },
  });

  const teamRole = team.members[0]?.role;

  return (
    <AppContainer>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/team/${props.params.slug}`}>{team.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/team/${props.params.slug}/products`}>
                Productos
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between">
        <Title>Productos</Title>
        {(teamRole === TeamMemberRole.OWNER ||
          teamRole === TeamMemberRole.OPERATOR ||
          session.role === UserRole.ADMIN) && (
          <Button size="sm" asChild>
            <Link href={`/team/${props.params.slug}/products/create`}>
              <PlusIcon className="w-4 h-4" />
              <span className="hidden md:block">Agregar Producto</span>
            </Link>
          </Button>
        )}
      </div>
      <div>
        <SearchBox />
      </div>
      {products.length === 0 && (
        <div className="flex flex-col items-center py-20 border rounded-xl border-dotted gap-2 bg-card">
          <h3 className="text-xl font-semibold">No Hay Productos</h3>
          {props.searchParams.query && (
            <p className="text-muted-foreground text-sm">
              {`No se encontraron productos con "${props.searchParams.query}".`}
            </p>
          )}
        </div>
      )}
      {products.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16"></TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead className="hidden md:table-cell">Creación</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const productImage = product.productImages[0];
              const imageUrl = productImage
                ? getCdnUrl(productImage.fileUrl)
                : undefined;

              return (
                <TableRow key={product.id}>
                  <TableCell className="pr-0">
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <p>{product.name}</p>
                      {product.sku && (
                        <p className="text-xs text-muted-foreground font-mono">
                          SKU {product.sku}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(product.priceCents)}</TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    <Timestamp date={product.createdAt} />
                  </TableCell>
                  <TableCell>
                    {(teamRole === TeamMemberRole.OWNER ||
                      teamRole === TeamMemberRole.OPERATOR ||
                      session.role === UserRole.ADMIN) && (
                      <div className="flex justify-end">
                        <ProductDropdown productId={product.id} />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </AppContainer>
  );
}
