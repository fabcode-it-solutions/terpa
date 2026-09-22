import { InvoicesTabs } from "@/components/admin/invoices-tabs";
import { AppContainer } from "@/components/ui/app-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Title } from "@/components/ui/typography";
import Link from "next/link";

export default function InvoicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppContainer>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Facturación</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="space-y-4">
        <Title>Facturación</Title>
        <InvoicesTabs />
        {children}
      </div>
    </AppContainer>
  );
}
