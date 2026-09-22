import PaymentForm from "@/components/billing/payment-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Title } from "@/components/ui/typography";
import { prisma } from "@/lib/prisma";
import { getTeamBySlugCached } from "@/loaders/team";
import { Check } from "lucide-react";

const steps = [
  { id: "1", name: "Seleccionar Máquinas", status: "current" },
  { id: "2", name: "Realiza tu Pago", status: "upcoming" },
  { id: "3", name: "Finalizar", status: "upcoming" },
];

type Props = {
  params: {
    slug: string;
  };
};

export default async function Page({ params }: Props) {
  const [team, machines, latestExchangeRate] = await Promise.all([
    getTeamBySlugCached(params.slug),
    prisma.machine.findMany({
      where: {
        deletedAt: null,
        team: {
          slug: params.slug,
        },
      },
      select: {
        id: true,
        name: true,
        activeUntilDate: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.exchangeRateHistory.findFirst({
      where: {
        fromCurrency: "USD",
        toCurrency: "MXN",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        rate: true,
      },
    }),
  ]);

  return (
    <>
      <Title>Nuevo Pago</Title>

      <nav aria-label="Progress">
        <ol
          role="list"
          className="divide-y bg-background divide-border rounded-md border border-border md:flex md:divide-y-0"
        >
          {steps.map((step, stepIdx) => (
            <li key={step.name} className="relative md:flex md:flex-1">
              {step.status === "complete" ? (
                <div className="group flex w-full items-center">
                  <span className="flex items-center px-6 py-4 text-sm font-medium">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
                      <Check className="h-5 w-5 text-primary-foreground" />
                    </span>
                    <span className="ml-4 text-sm font-medium text-foreground">
                      {step.name}
                    </span>
                  </span>
                </div>
              ) : step.status === "current" ? (
                <div
                  className="flex items-center px-6 py-4 text-sm font-medium"
                  aria-current="step"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary">
                    <span className="text-primary">{step.id}</span>
                  </span>
                  <span className="ml-4 text-sm font-medium text-primary">
                    {step.name}
                  </span>
                </div>
              ) : (
                <div className="group flex items-center">
                  <span className="flex items-center px-6 py-4 text-sm font-medium">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-muted">
                      <span className="text-muted-foreground">{step.id}</span>
                    </span>
                    <span className="ml-4 text-sm font-medium text-muted-foreground">
                      {step.name}
                    </span>
                  </span>
                </div>
              )}

              {stepIdx !== steps.length - 1 ? (
                <>
                  <div
                    className="absolute right-0 top-0 hidden h-full w-5 md:block"
                    aria-hidden="true"
                  >
                    <svg
                      fill="none"
                      viewBox="0 0 22 80"
                      preserveAspectRatio="none"
                      className="h-full w-full text-border"
                    >
                      <path
                        d="M0 -2L20 40L0 82"
                        stroke="currentcolor"
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </>
              ) : null}
            </li>
          ))}
        </ol>
      </nav>

      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Seleccionar Máquinas</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentForm
            machines={machines}
            team={team}
            exchangeRate={latestExchangeRate?.rate ?? 17}
          />
        </CardContent>
      </Card>
    </>
  );
}
