import DateFilterQuery from "@/components/filters/date-filter-query";
import MachineTerminalExportDialog from "@/components/machine/machine-terminal-export-dialog";
import { Card, CardHeader } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/currency";
import { requireSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { getTeamMachineCached } from "@/loaders/machine";
import { getTeamBySlugCached } from "@/loaders/team";
import { TeamMemberRole, UserRole } from "@prisma/client";
import { pharos } from "@/service/pharos";
import { format, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import { Lock } from "lucide-react";
import Image from "next/image";

type Props = {
  params: {
    slug: string;
    machineId: string;
  };
  searchParams: {
    date?: string;
  };
};

export default async function Page(props: Props) {
  const session = requireSession();
  const team = await getTeamBySlugCached(props.params.slug);
  const teamRole = team.members[0]?.role;

  // Check if user has financial access
  const showFinancials =
    session.role === UserRole.ADMIN ||
    teamRole === TeamMemberRole.OWNER ||
    team.members[0]?.showFinancials === true;

  if (!showFinancials) {
    return (
      <div className="text-center py-8 px-6 mx-auto max-w-md">
        <div className="flex justify-center mb-4">
          <Lock className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Esta sección está disponible solo para ciertos miembros del equipo.
        </p>
      </div>
    );
  }

  const machine = await getTeamMachineCached(team.id, props.params.machineId);
  const timezone = "America/Monterrey";
  const date = props.searchParams.date
    ? fromZonedTime(props.searchParams.date, timezone)
    : fromZonedTime(startOfDay(toZonedTime(new Date(), timezone)), timezone);

  const transactions =
    team.pharosMerchantCode && machine.pharosTerminalCode
      ? await pharos.getTransactions({
          dateUtc: date,
          merchantCode: team.pharosMerchantCode,
          terminalCode: machine.pharosTerminalCode,
        })
      : [];

  const renderCardType = (cardType: string | null) => {
    switch (cardType) {
      case "credit":
        return "Crédito";
      case "debit":
        return "Débito";
      case "prepaid":
        return "Prepago";
      case "charge_card":
        return "Tarjeta de cargos";
      default:
        return cardType;
    }
  };

  const renderCardBrand = (cardBrand: string | null) => {
    if (!cardBrand) return null;
    switch (cardBrand.toLowerCase()) {
      case "visa":
        return (
          <Image
            width={40}
            height={26}
            src="/icons/payments/visa.svg"
            alt="visa"
          />
        );
      case "master card intl":
      case "master card":
        return (
          <Image
            width={36}
            height={23}
            src="/icons/payments/mastercard.svg"
            alt="visa"
          />
        );
      case "amex":
        return (
          <Image
            width={30}
            height={20}
            src="/icons/payments/amex.svg"
            alt="visa"
          />
        );
      case "discover":
        return (
          <Image
            width={40}
            height={40}
            src="/icons/payments/discover.svg"
            alt="visa"
          />
        );
      default:
        return <div>{cardBrand}</div>;
    }
  };

  const totalTransactions = transactions.reduce((acc, transaction) => {
    if (
      transaction.approved &&
      !transaction.reversed &&
      !transaction.chargeback
    ) {
      return (
        acc +
        Math.ceil(
          Number(transaction.amount.replaceAll("$", "").replaceAll(",", "")) *
            100,
        )
      );
    }
    return acc;
  }, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <DateFilterQuery date={date} />
        <div className="md:block hidden">
          <MachineTerminalExportDialog />
        </div>
      </div>
      <div className="flex flex-col">
        <Card className="bg-background rounded-b-none border-b-0">
          <CardHeader>
            <h3 className="text-md font-semibold capitalize">
              {format(date, "PPPP", { locale: es })}
            </h3>
            <p className="text-muted-foreground text-sm">
              Transacciones Aprobadas: {formatCurrency(totalTransactions)}
            </p>
          </CardHeader>
        </Card>

        {transactions.length === 0 && (
          <EmptyState
            title="No hay transacciones"
            description="No hay transacciones en la fecha seleccionada."
            className="rounded-t-none"
          />
        )}
        {transactions.length > 0 && (
          <Card className="divide-y bg-background rounded-t-none">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex justify-between items-center gap-2 p-4"
              >
                <div
                  className={cn(
                    "flex-1 flex flex-col gap-2",
                    (transaction.approved === false ||
                      transaction.reversed === true) &&
                      "opacity-50",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {renderCardBrand(transaction.card_brand)}
                    <div className="flex items-center text-sm font-medium gap-4">
                      {renderCardType(transaction.card_type)}{" "}
                      <div className="flex items-center">
                        ...
                        <span>{transaction.card.slice(-4)}</span>
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-xs text-muted-foreground",
                    )}
                  >
                    <div>
                      {transaction.chargeback ? (
                        <span className="text-red-600 dark:text-red-400">
                          Contracargo
                        </span>
                      ) : transaction.reversed ? (
                        <span className="text-orange-600 dark:text-orange-400">
                          Reversada
                        </span>
                      ) : transaction.approved ? (
                        <span className="dark:text-green-400 text-green-600">
                          Aprobada
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">
                          Rechazada
                        </span>
                      )}
                    </div>
                    <div>{transaction.card_issuer}</div>
                    <div className="text-muted-foreground">
                      {transaction.date}
                    </div>
                  </div>
                </div>
                <div
                  className={cn(
                    "text-center min-w-24",
                    transaction.approved === false &&
                      "text-red-600 dark:text-red-400",
                    transaction.reversed === true &&
                      "text-orange-600 dark:text-orange-400",
                  )}
                >
                  {transaction.amount}
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
