import TerminalCreateCard from "@/components/terminals/terminal-create-card";
import { AppContainer } from "@/components/ui/app-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Title } from "@/components/ui/typography";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

type Props = {
  searchParams: {
    query?: string;
  };
};

export default async function Page(props: Props) {
  return (
    <AppContainer>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/admin`}>Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/admin/terminals`}>Terminales</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>Crear Terminal</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      <Title>Crear Terminal</Title>
      <TerminalCreateCard />
    </AppContainer>
  );
}
