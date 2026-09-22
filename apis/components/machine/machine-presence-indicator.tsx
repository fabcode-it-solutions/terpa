import { cn, getMachineOnlineStatus } from "@/lib/utils";

type Props = {
  lastPresence?: Date | null;
};

export default function PresenceIndicator(props: Props) {
  const status = getMachineOnlineStatus(props.lastPresence);

  const classNames = () => {
    if (status === "noData" || !props.lastPresence)
      return "border-neutral-200 dark:border-neutral-800 bg-neutral-400";

    // More than 3 hours offline
    if (status === "offline") {
      return "border-red-300 bg-red-600 dark:border-red-900";
    }

    // More than 1 hour 10 minutes offline
    if (status === "warning") {
      return "border-yellow-300 bg-yellow-500 dark:border-yellow-700";
    }

    return "border-emerald-300 bg-emerald-600 dark:border-emerald-900";
  };

  return (
    <div className="animate-pulse">
      <span
        className={cn(
          "w-3 h-3 border-4 block rounded-full shadow",
          classNames(),
        )}
      />
    </div>
  );
}
