"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  add,
  addDays,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { format, toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import { CalendarIcon, CalendarSearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

type Props = {
  from: Date;
  to: Date;
  timezone: string;
};

export default function ReportsDateRangePicker(props: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [{ from, to }, setRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>(() => ({
    from: props.from,
    to: props.to,
  }));
  const [fromTime, setFromTime] = useState({
    hour: getHours(props.from),
    minute: getMinutes(props.from),
  });
  const [toTime, setToTime] = useState({
    hour: getHours(props.to),
    minute: getMinutes(props.to),
  });
  const weekStartsOn = 1;

  // Sync time state when props change (e.g., URL navigation)
  useEffect(() => {
    setRange({ from: props.from, to: props.to });
    setFromTime({ hour: getHours(props.from), minute: getMinutes(props.from) });
    setToTime({ hour: getHours(props.to), minute: getMinutes(props.to) });
  }, [props.from, props.to]);

  const onConfirm = (from?: Date, to?: Date) => {
    if (from && to) {
      // Apply the selected times to the dates
      const fromWithTime = setMinutes(
        setHours(from, fromTime.hour),
        fromTime.minute,
      );
      const toWithTime = setMinutes(setHours(to, toTime.hour), toTime.minute);

      const newSearchParams = new URLSearchParams(window.location.search);
      newSearchParams.set(
        "from",
        format(fromWithTime, "yyyy-MM-dd HH:mm", { timeZone: props.timezone }),
      );
      newSearchParams.set(
        "to",
        format(toWithTime, "yyyy-MM-dd HH:mm", { timeZone: props.timezone }),
      );
      router.push(`?${newSearchParams.toString()}`);
      startTransition(() => {
        setRange({ from: fromWithTime, to: toWithTime });
        setIsOpen(false);
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[330px] justify-start text-left font-normal",
              !from && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-5 w-5" />
            {from &&
              `${format(toZonedTime(from, props.timezone), "LLL dd, y HH:mm", {
                locale: es,
              })}`}
            {to &&
              ` - ${format(toZonedTime(to, props.timezone), "LLL dd, y HH:mm", {
                locale: es,
              })}`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            weekStartsOn={weekStartsOn}
            initialFocus
            mode="range"
            defaultMonth={from}
            selected={{ from: from, to: to }}
            onSelect={(value) => setRange({ from: value?.from, to: value?.to })}
            numberOfMonths={1}
            disabled={{ after: new Date() }}
            locale={es}
          />
          <Separator />
          <div className="p-3 space-y-3">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Hora de inicio</h4>
              <div className="flex gap-2">
                <Select
                  value={fromTime.hour.toString()}
                  onValueChange={(value) =>
                    setFromTime((prev) => ({ ...prev, hour: parseInt(value) }))
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm self-center">:</span>
                <Select
                  value={fromTime.minute.toString()}
                  onValueChange={(value) =>
                    setFromTime((prev) => ({
                      ...prev,
                      minute: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 15, 30, 45].map((minute) => (
                      <SelectItem key={minute} value={minute.toString()}>
                        {minute.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Hora de fin</h4>
              <div className="flex gap-2">
                <Select
                  value={toTime.hour.toString()}
                  onValueChange={(value) =>
                    setToTime((prev) => ({ ...prev, hour: parseInt(value) }))
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm self-center">:</span>
                <Select
                  value={toTime.minute.toString()}
                  onValueChange={(value) =>
                    setToTime((prev) => ({ ...prev, minute: parseInt(value) }))
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 15, 30, 45].map((minute) => (
                      <SelectItem key={minute} value={minute.toString()}>
                        {minute.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={() => onConfirm(from, to)}
            >
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="outline">
            <CalendarSearchIcon className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              const from = toZonedTime(startOfDay(new Date()), props.timezone);
              const to = toZonedTime(
                startOfDay(addDays(new Date(), 1)),
                props.timezone,
              );
              const fromHour = getHours(from);
              const fromMinute = getMinutes(from);
              const toHour = getHours(to);
              const toMinute = getMinutes(to);
              setRange({ from, to });
              setFromTime({ hour: fromHour, minute: fromMinute });
              setToTime({ hour: toHour, minute: toMinute });

              // Apply times and update URL immediately
              const fromWithTime = setMinutes(
                setHours(from, fromHour),
                fromMinute,
              );
              const toWithTime = setMinutes(setHours(to, toHour), toMinute);
              const newSearchParams = new URLSearchParams(
                window.location.search,
              );
              newSearchParams.set(
                "from",
                format(fromWithTime, "yyyy-MM-dd HH:mm", {
                  timeZone: props.timezone,
                }),
              );
              newSearchParams.set(
                "to",
                format(toWithTime, "yyyy-MM-dd HH:mm", {
                  timeZone: props.timezone,
                }),
              );
              router.push(`?${newSearchParams.toString()}`);
              startTransition(() => {
                setRange({ from: fromWithTime, to: toWithTime });
                setIsOpen(false);
              });
            }}
          >
            Hoy
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              const from = toZonedTime(
                startOfDay(add(new Date(), { days: -1 })),
                props.timezone,
              );
              const to = toZonedTime(startOfDay(new Date()), props.timezone);
              const fromHour = getHours(from);
              const fromMinute = getMinutes(from);
              const toHour = getHours(to);
              const toMinute = getMinutes(to);
              setRange({ from, to });
              setFromTime({ hour: fromHour, minute: fromMinute });
              setToTime({ hour: toHour, minute: toMinute });

              // Apply times and update URL immediately
              const fromWithTime = setMinutes(
                setHours(from, fromHour),
                fromMinute,
              );
              const toWithTime = setMinutes(setHours(to, toHour), toMinute);
              const newSearchParams = new URLSearchParams(
                window.location.search,
              );
              newSearchParams.set(
                "from",
                format(fromWithTime, "yyyy-MM-dd HH:mm", {
                  timeZone: props.timezone,
                }),
              );
              newSearchParams.set(
                "to",
                format(toWithTime, "yyyy-MM-dd HH:mm", {
                  timeZone: props.timezone,
                }),
              );
              router.push(`?${newSearchParams.toString()}`);
              startTransition(() => {
                setRange({ from: fromWithTime, to: toWithTime });
                setIsOpen(false);
              });
            }}
          >
            Ayer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              const from = toZonedTime(
                startOfWeek(new Date(), { weekStartsOn }),
                props.timezone,
              );
              const to = toZonedTime(
                startOfWeek(addDays(new Date(), 7), { weekStartsOn }),
                props.timezone,
              );
              const fromHour = getHours(from);
              const fromMinute = getMinutes(from);
              const toHour = getHours(to);
              const toMinute = getMinutes(to);
              setRange({ from, to });
              setFromTime({ hour: fromHour, minute: fromMinute });
              setToTime({ hour: toHour, minute: toMinute });

              // Apply times and update URL immediately
              const fromWithTime = setMinutes(
                setHours(from, fromHour),
                fromMinute,
              );
              const toWithTime = setMinutes(setHours(to, toHour), toMinute);
              const newSearchParams = new URLSearchParams(
                window.location.search,
              );
              newSearchParams.set(
                "from",
                format(fromWithTime, "yyyy-MM-dd HH:mm", {
                  timeZone: props.timezone,
                }),
              );
              newSearchParams.set(
                "to",
                format(toWithTime, "yyyy-MM-dd HH:mm", {
                  timeZone: props.timezone,
                }),
              );
              router.push(`?${newSearchParams.toString()}`);
              startTransition(() => {
                setRange({ from: fromWithTime, to: toWithTime });
                setIsOpen(false);
              });
            }}
          >
            Semana Actual
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              const from = toZonedTime(
                startOfWeek(add(new Date(), { weeks: -1 }), { weekStartsOn }),
                props.timezone,
              );
              const to = toZonedTime(
                startOfWeek(new Date(), { weekStartsOn }),
                props.timezone,
              );
              const fromHour = getHours(from);
              const fromMinute = getMinutes(from);
              const toHour = getHours(to);
              const toMinute = getMinutes(to);
              setRange({ from, to });
              setFromTime({ hour: fromHour, minute: fromMinute });
              setToTime({ hour: toHour, minute: toMinute });

              // Apply times and update URL immediately
              const fromWithTime = setMinutes(
                setHours(from, fromHour),
                fromMinute,
              );
              const toWithTime = setMinutes(setHours(to, toHour), toMinute);
              const newSearchParams = new URLSearchParams(
                window.location.search,
              );
              newSearchParams.set(
                "from",
                format(fromWithTime, "yyyy-MM-dd HH:mm", {
                  timeZone: props.timezone,
                }),
              );
              newSearchParams.set(
                "to",
                format(toWithTime, "yyyy-MM-dd HH:mm", {
                  timeZone: props.timezone,
                }),
              );
              router.push(`?${newSearchParams.toString()}`);
              startTransition(() => {
                setRange({ from: fromWithTime, to: toWithTime });
                setIsOpen(false);
              });
            }}
          >
            Semana Anterior
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              const from = toZonedTime(
                startOfMonth(new Date()),
                props.timezone,
              );
              const to = toZonedTime(
                startOfMonth(add(new Date(), { months: 1 })),
                props.timezone,
              );
              const fromHour = getHours(from);
              const fromMinute = getMinutes(from);
              const toHour = getHours(to);
              const toMinute = getMinutes(to);
              setRange({ from, to });
              setFromTime({ hour: fromHour, minute: fromMinute });
              setToTime({ hour: toHour, minute: toMinute });

              // Apply times and update URL immediately
              const fromWithTime = setMinutes(
                setHours(from, fromHour),
                fromMinute,
              );
              const toWithTime = setMinutes(setHours(to, toHour), toMinute);
              const newSearchParams = new URLSearchParams(
                window.location.search,
              );
              newSearchParams.set(
                "from",
                format(fromWithTime, "yyyy-MM-dd HH:mm", {
                  timeZone: props.timezone,
                }),
              );
              newSearchParams.set(
                "to",
                format(toWithTime, "yyyy-MM-dd HH:mm", {
                  timeZone: props.timezone,
                }),
              );
              router.push(`?${newSearchParams.toString()}`);
              startTransition(() => {
                setRange({ from: fromWithTime, to: toWithTime });
                setIsOpen(false);
              });
            }}
          >
            Mes Actual
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              const from = toZonedTime(
                startOfMonth(add(new Date(), { months: -1 })),
                props.timezone,
              );
              const to = toZonedTime(startOfMonth(new Date()), props.timezone);
              const fromHour = getHours(from);
              const fromMinute = getMinutes(from);
              const toHour = getHours(to);
              const toMinute = getMinutes(to);
              setRange({ from, to });
              setFromTime({ hour: fromHour, minute: fromMinute });
              setToTime({ hour: toHour, minute: toMinute });

              // Apply times and update URL immediately
              const fromWithTime = setMinutes(
                setHours(from, fromHour),
                fromMinute,
              );
              const toWithTime = setMinutes(setHours(to, toHour), toMinute);
              const newSearchParams = new URLSearchParams(
                window.location.search,
              );
              newSearchParams.set(
                "from",
                format(fromWithTime, "yyyy-MM-dd HH:mm", {
                  timeZone: props.timezone,
                }),
              );
              newSearchParams.set(
                "to",
                format(toWithTime, "yyyy-MM-dd HH:mm", {
                  timeZone: props.timezone,
                }),
              );
              router.push(`?${newSearchParams.toString()}`);
              startTransition(() => {
                setRange({ from: fromWithTime, to: toWithTime });
                setIsOpen(false);
              });
            }}
          >
            Mes Anterior
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
