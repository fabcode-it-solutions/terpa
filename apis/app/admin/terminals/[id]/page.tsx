import TerminalUpdateCard from "@/components/terminals/terminal-update-card";
import { AppContainer } from "@/components/ui/app-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Title } from "@/components/ui/typography";
import { prisma } from "@/lib/prisma";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: {
    id: string;
  };
};

export default async function Page(props: Props) {
  const terminal = await prisma.terminal.findUnique({
    where: { id: props.params.id },
    select: {
      id: true,
      type: true,
      serialNumber: true,
      pharosTerminalCode: true,
      pharosMerchantCode: true,
      username: true,
      password: true,
      endpointUrl: true,
      fixedComissionCents: true,
      percentageCommission: true,
      extra1: true,
      extra2: true,
      description: true,
      initialCredit: true,
      flowType: true,
      language: true,
      acceptCreditPayments: true,
      acceptCashPayments: true,
      acceptServicePayments: true,
      decimalMode: true,
      nip: true,
      key: true,
      createdAt: true,
    },
  });

  if (!terminal) {
    return notFound();
  }

  // Get team information through the soft relationship
  const terminalTeam = await prisma.machine.findFirst({
    where: {
      terminalSerialNumber: terminal.serialNumber,
    },
    select: {
      team: {
        select: {
          name: true,
        },
      },
    },
  });

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
          <BreadcrumbPage>{terminal.description}</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Title>Terminal</Title>
          <p className="text-sm text-muted-foreground">
            {terminal.description}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/terminals/create">
            <PlusIcon className="w-5 h-5" />
            Crear Terminal
          </Link>
        </Button>
      </div>

      <TerminalUpdateCard
        defaultValues={{
          id: terminal.id,
          type: terminal.type,
          serialNumber: terminal.serialNumber,
          terminalCode: terminal.pharosTerminalCode,
          merchantCode: terminal.pharosMerchantCode,
          description: terminal.description,
          initialCredit: terminal.initialCredit,
          flowType: terminal.flowType,
          language: terminal.language,
          acceptCreditPayments: terminal.acceptCreditPayments,
          acceptCashPayments: terminal.acceptCashPayments,
          acceptServicePayments: terminal.acceptServicePayments,
          decimalMode: Number(terminal.decimalMode),
          username: terminal.username,
          password: terminal.password,
          endpointUrl: terminal.endpointUrl,
          fixedComissionCents: terminal.fixedComissionCents
            ? `${Number(terminal.fixedComissionCents) / 100}`
            : 0,
          percentageCommission: terminal.percentageCommission
            ? Number(terminal.percentageCommission)
            : 0,
          nip: terminal.nip || "",
          key: terminal.key || "",
          extra1: terminal.extra1 || "",
          extra2: terminal.extra2 || "",
        }}
        teamName={terminalTeam?.team?.name || null}
      />
    </AppContainer>
  );
}
