import ProductCreateCard from "@/components/product/product-create-card";
import { AppContainer } from "@/components/ui/app-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Title } from "@/components/ui/typography";
import { getTeamBySlugCached } from "@/loaders/team";
import { isExperimentActiveForTeam } from "@/service/experiment";
import Link from "next/link";

type Props = {
  params: {
    slug: string;
  };
};

export default async function Page(props: Props) {
  const team = await getTeamBySlugCached(props.params.slug);

  // Check if team is part of MICROMARKET experiment to show barcode field
  const { isActive: showBarcode } = await isExperimentActiveForTeam(
    "MICROMARKET",
    team.id,
  );

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
              <Link href={`/team/${props.params.slug}/products/create`}>
                Agregar Producto
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between">
        <Title>Agregar Producto</Title>
      </div>
      <ProductCreateCard showBarcode={showBarcode} />
    </AppContainer>
  );
}
