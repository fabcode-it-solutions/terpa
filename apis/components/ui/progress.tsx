"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as React from "react";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-3 w-full overflow-hidden rounded-full bg-primary/10 shadow-inner",
      {
        "shadow-red-500/20 bg-red-500/10": value! >= 0,
        "shadow-yellow-500/20 bg-yellow-500/10": value! > 25,
        "shadow-emerald-500/20 bg-emerald-500/10": value! > 50,
      },
      className,
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 bg-primary transition-all duration-1000",
        {
          "bg-red-500": value! >= 0,
          "bg-yellow-500": value! > 25,
          "bg-emerald-500": value! > 50,
        },
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
