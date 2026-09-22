import ProductEditCard from "@/components/product/product-edit-card";
import { AppContainer } from "@/components/ui/app-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Title } from "@/components/ui/typography";
import { formatCurrencyValue } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { getCdnUrl } from "@/lib/s3";
import { getTeamBySlugCached } from "@/loaders/team";
import { isExperimentActiveForTeam } from "@/service/experiment";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: {
    slug: string;
    productId: string;
  };
};

export default async function Page(props: Props) {
  const team = await getTeamBySlugCached(props.params.slug);

  // Check if team is part of MICROMARKET experiment to show barcode field
  const { isActive: showBarcode } = await isExperimentActiveForTeam(
    "MICROMARKET",
    team.id,
  );

  const product = await prisma.product.findUnique({
    where: { id: props.params.productId, teamId: team.id },
    select: {
      id: true,
      name: true,
      priceCents: true,
      purchaseCostCents: true,
      sku: true,
      barcode: true,
      productImages: {
        where: { deletedAt: null },
        select: { id: true, fileUrl: true, fileName: true },
        orderBy: { position: "asc" },
        take: 1,
      },
    },
  });

  if (!product) {
    return notFound();
  }

  const productImage = product.productImages[0];
  const imageUrl = productImage ? getCdnUrl(productImage.fileUrl) : undefined;

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
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href={`/team/${props.params.slug}/products/${props.params.productId}`}
              >
                {product.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between">
        <Title>Producto: {product.name}</Title>
      </div>
      <ProductEditCard
        defaultValues={{
          name: product.name,
          price: formatCurrencyValue(product.priceCents),
          sku: product.sku || "",
          barcode: product.barcode || "",
          purchaseCost: product.purchaseCostCents
            ? formatCurrencyValue(product.purchaseCostCents)
            : "",
        }}
        existingImageUrl={imageUrl}
        productImage={productImage}
        showBarcode={showBarcode}
      />
    </AppContainer>
  );
}
