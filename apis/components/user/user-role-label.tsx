import { TeamMemberRole } from "@prisma/client";

export function UserRoleLabel(props: { role: TeamMemberRole }) {
  switch (props.role) {
    case "OWNER":
      return (
        <span className="text-sm text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 py-1 px-2 rounded-md">
          Propietario
        </span>
      );
    case "OPERATOR":
      return (
        <span className="text-sm text-sky-600 dark:text-sky-400 border border-sky-600 dark:border-sky-400 py-1 px-2 rounded-md">
          Operador
        </span>
      );
  }
}
