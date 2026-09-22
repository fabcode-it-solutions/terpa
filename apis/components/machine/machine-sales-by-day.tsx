"use client";

import { formatCurrency } from "@/lib/currency";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Lock } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Bar, BarChart, ResponsiveContainer, Tooltip } from "recharts";

type Props = {
  data: Array<{
    card: number;
    cash: number;
    free: number;
    remote: number;
    date: string;
  }>;
  title?: string;
  subtitle?: string;
  machineId?: string;
  showFinancials?: boolean;
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any;
  label?: any;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  const total = data.card + data.cash + data.free + data.remote;

  // Parse the date and format with day of week
  const parsedDate = parse(data.date, "dd/MM/yyyy", new Date());
  const formattedDate = format(parsedDate, "EEEE, dd 'de' MMMM", {
    locale: es,
  });

  return (
    <div className="bg-muted/70 backdrop-blur-md p-3 rounded space-y-2 shadow-md">
      <p className="text-sm font-medium text-muted-foreground">
        {formattedDate}
      </p>
      <div className="space-y-1">
        <p className="text-sm font-medium">
          Total: {formatCurrency(total * 100)}
        </p>
        {data.card > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <p className="text-sm">
              Tarjeta: {formatCurrency(data.card * 100)}
            </p>
          </div>
        )}
        {data.cash > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <p className="text-sm">
              Efectivo: {formatCurrency(data.cash * 100)}
            </p>
          </div>
        )}
        {data.free > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <p className="text-sm">Gratis: {formatCurrency(data.free * 100)}</p>
          </div>
        )}
        {data.remote > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <p className="text-sm">
              Remoto: {formatCurrency(data.remote * 100)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MachineSalesByDay(props: Props) {
  const router = useRouter();
  const { slug } = useParams();

  // Show lock icon if financial access is denied
  if (props.showFinancials === false) {
    return (
      <div className="w-full">
        {(props.title || props.subtitle) && (
          <div className="mb-2">
            {props.title && (
              <h3 className="text-lg font-semibold">{props.title}</h3>
            )}
            {props.subtitle && (
              <p className="text-sm text-muted-foreground">{props.subtitle}</p>
            )}
          </div>
        )}
        <div
          className="flex justify-center items-center"
          style={{ height: "180px" }}
        >
          <Lock className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Calculate which payment methods have data
  const hasCard = props.data.some((day) => day.card > 0);
  const hasCash = props.data.some((day) => day.cash > 0);
  const hasFree = props.data.some((day) => day.free > 0);
  const hasRemote = props.data.some((day) => day.remote > 0);

  const handleBarClick = (data: any) => {
    if (!props.machineId) return;

    // Convert date from dd/MM/yyyy to yyyy-MM-dd for URL
    const parsedDate = parse(data.date, "dd/MM/yyyy", new Date());
    const formattedDate = format(parsedDate, "yyyy-MM-dd");

    router.push(
      `/team/${slug}/machines/${props.machineId}/sales?date=${formattedDate}`,
    );
  };

  return (
    <div className="w-full">
      {(props.title || props.subtitle) && (
        <div className="mb-2">
          {props.title && (
            <h3 className="text-lg font-semibold">{props.title}</h3>
          )}
          {props.subtitle && (
            <p className="text-sm text-muted-foreground">{props.subtitle}</p>
          )}
        </div>
      )}
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-3 text-sm">
        {hasCard && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-muted-foreground">Tarjeta</span>
          </div>
        )}
        {hasCash && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">Efectivo</span>
          </div>
        )}
        {hasFree && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            <span className="text-muted-foreground">Gratis</span>
          </div>
        )}
        {hasRemote && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span className="text-muted-foreground">Remoto</span>
          </div>
        )}
      </div>
      <div style={{ width: "100%", height: "140px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={props.data}
            margin={{
              left: 20,
              right: 20,
              top: 10,
              bottom: 0,
            }}
          >
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={<CustomTooltip />}
            />
            {hasCard && (
              <Bar
                dataKey="card"
                stackId="sales"
                fill="#3B82F6"
                onClick={handleBarClick}
              />
            )}
            {hasCash && (
              <Bar
                dataKey="cash"
                stackId="sales"
                fill="#10B981"
                onClick={handleBarClick}
              />
            )}
            {hasFree && (
              <Bar
                dataKey="free"
                stackId="sales"
                fill="#6B7280"
                onClick={handleBarClick}
              />
            )}
            {hasRemote && (
              <Bar
                dataKey="remote"
                stackId="sales"
                fill="#8B5CF6"
                onClick={handleBarClick}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
