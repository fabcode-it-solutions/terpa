"use client";

import { machineAdminExpirationDateAction } from "@/actions/machine";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  differenceInDays,
  formatDate,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  machine: {
    id: string;
    nameLabel: string;
    teamLabel: string;
    activeUntilDate: Date | undefined;
  };
};

export function AdminExpirationDateDialog(props: Props) {
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      machineId: props.machine.id,
      activeUntilDate: props.machine.activeUntilDate
        ? toZonedTime(props.machine.activeUntilDate, "UTC")
        : undefined,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    machineAdminExpirationDateAction(values).then((result) => {
      if (result.success) {
        setOpen(false);
        toast.success("Fecha de expiración actualizada");
      } else {
        toast.error(result.error);
      }
    });
  });

  const isExpired = props.machine.activeUntilDate
    ? isBefore(
        toZonedTime(props.machine.activeUntilDate, "America/Mexico_City"),
        startOfDay(toZonedTime(new Date(), "America/Mexico_City")),
      )
    : false;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "mx-auto block text-sm font-normal",
            isExpired &&
              "text-red-500 hover:text-red-600 dark:text-red-400 hover:dark:text-red-500",
          )}
          variant="ghost"
          size="sm"
        >
          {props.machine.activeUntilDate ? (
            formatDate(
              toZonedTime(props.machine.activeUntilDate, "UTC"),
              "d 'de' MMMM 'del' yyyy",
              {
                locale: es,
              },
            )
          ) : (
            <span className="text-muted-foreground">Nunca</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.machine.nameLabel}</DialogTitle>
          <DialogDescription>{props.machine.teamLabel}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <div className="py-6">
              <FormField
                control={form.control}
                name="activeUntilDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de expiración</FormLabel>
                    <FormControl>
                      <Popover
                        open={calendarOpen}
                        onOpenChange={setCalendarOpen}
                        modal={true}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              formatDate(
                                field.value,
                                "d 'de' MMMM 'del' yyyy",
                                {
                                  locale: es,
                                },
                              )
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0"
                          align="start"
                          onOpenAutoFocus={(e) => e.preventDefault()}
                        >
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setCalendarOpen(false);
                            }}
                            defaultMonth={field.value}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button className="w-full" type="submit">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default AdminExpirationDateDialog;
