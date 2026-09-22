import PresenceIndicator from "@/components/machine/machine-presence-indicator";
import { getMachineOnlineStatus } from "@/lib/utils";

type Props = {
  lastPresence?: Date | null;
};

export default function PresenceLabel(props: Props) {
  const { className, title } = getParams(props.lastPresence);

  return (
    <div className="flex items-center gap-2">
      <PresenceIndicator lastPresence={props.lastPresence} />
      <p className={className}>{title}</p>
    </div>
  );
}

const getParams = (lastPresence?: Date | null) => {
  const status = getMachineOnlineStatus(lastPresence);

  if (status === "noData")
    return {
      title: "Sin Información",
      className: "text-neutral-500 dark:text-neutral-400",
    };

  // More than 3 hours offline
  if (status === "offline") {
    return {
      title: "Sin Conexión",
      className: "text-red-600 dark:text-red-400",
    };
  }

  // More than 1 hour 10 minutes offline
  if (status === "warning") {
    return {
      title: "Sin Conexión",
      className: "text-yellow-700 dark:text-yellow-500",
    };
  }
  return {
    title: "En Linea",
    className: "text-emerald-700 dark:text-emerald-400",
  };
};
