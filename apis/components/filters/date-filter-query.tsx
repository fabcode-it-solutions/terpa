"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, isSameDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Props = {
  date: Date;
};

export default function DateFilterQuery(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const onSelect = (nextDate?: Date) => {
    if (!nextDate) return;
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("date", nextDate.toISOString().split("T")[0]);
    router.push(`?${nextSearchParams}`);
    setIsOpen(false);
  };

  const onPreviousClick = () => {
    const nextDate = new Date(props.date);
    nextDate.setDate(nextDate.getDate() - 1);
    onSelect(nextDate);
  };

  const onNextClick = () => {
    const nextDate = new Date(props.date);
    nextDate.setDate(nextDate.getDate() + 1);
    onSelect(nextDate);
  };

  const isToday = isSameDay(
    props.date,
    toZonedTime(new Date(), "America/Monterrey"),
  );

  return (
    <div className="flex items-center">
      <Button
        variant="outline"
        size="icon"
        className="border-r-0 rounded-r-none"
        onClick={onPreviousClick}
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </Button>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className="w-[250px] justify-start text-left font-normal rounded-none"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(toZonedTime(props.date, "America/Monterrey"), "PPP", {
              locale: es,
            })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            initialFocus
            mode="single"
            selected={props.date}
            onSelect={onSelect}
            locale={es}
            disabled={{ after: new Date() }}
          />
        </PopoverContent>
      </Popover>
      <Button
        variant="outline"
        size="icon"
        className="border-l-0 rounded-l-none"
        onClick={onNextClick}
        disabled={isToday}
      >
        <ChevronRightIcon className="w-5 h-5" />
      </Button>
    </div>
  );
}
