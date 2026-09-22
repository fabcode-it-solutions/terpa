import AdminIncidentsTable from "@/components/admin/admin-incidents-table";
import { MachinesFilterProvider } from "@/components/admin/machines-filter-provider";
import ResolveIncidentsDialog from "@/components/admin/resolve-incidents-dialog";
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
import Link from "next/link";

type Props = {
  searchParams: {
    query?: string;
    machine?: string;
  };
};

export default function Page(props: Props) {
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
          <BreadcrumbPage>Incidencias</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <Title>Incidencias</Title>
        <div className="flex items-center gap-2">
          <MachinesFilterProvider />
          <ResolveIncidentsDialog machineId={props.searchParams.machine} />
        </div>
      </div>

      <AdminIncidentsTable machineId={props.searchParams.machine} />
    </AppContainer>
  );
}
