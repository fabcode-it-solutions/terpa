"use client";

import { formatCurrency } from "@/lib/currency";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Bar, BarChart, ResponsiveContainer, Tooltip } from "recharts";

type Props = {
  data: Array<{
    card: number;
    cash: number;
    free: number;
    remote: number;
    date: string;
  }>;
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
  const parsedDate = parse(data.date, "dd-MM-yyyy", new Date());
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

export default function SalesByDay(props: Props) {
  // Filter out the last day if it has no sales (all zeros)
  const filteredData = (() => {
    if (props.data.length === 0) return props.data;

    const lastDay = props.data[props.data.length - 1];
    const lastDayHasSales =
      lastDay.card > 0 ||
      lastDay.cash > 0 ||
      lastDay.free > 0 ||
      lastDay.remote > 0;

    if (!lastDayHasSales) {
      return props.data.slice(0, -1);
    }

    return props.data;
  })();

  // Calculate which payment methods have data
  const hasCard = filteredData.some((day) => day.card > 0);
  const hasCash = filteredData.some((day) => day.cash > 0);
  const hasFree = filteredData.some((day) => day.free > 0);
  const hasRemote = filteredData.some((day) => day.remote > 0);

  const handleBarClick = (data: any) => {
    console.log(data);
  };

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-3 text-sm pl-6">
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
            data={filteredData}
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
                onClick={handleBarClick}
                dataKey="card"
                stackId="sales"
                fill="#3B82F6"
              />
            )}
            {hasCash && (
              <Bar
                onClick={handleBarClick}
                dataKey="cash"
                stackId="sales"
                fill="#10B981"
              />
            )}
            {hasFree && (
              <Bar
                onClick={handleBarClick}
                dataKey="free"
                stackId="sales"
                fill="#6B7280"
              />
            )}
            {hasRemote && (
              <Bar
                onClick={handleBarClick}
                dataKey="remote"
                stackId="sales"
                fill="#8B5CF6"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
