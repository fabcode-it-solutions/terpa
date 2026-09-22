import { Progress } from "@/components/ui/progress"; // Import Progress component
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Machine = {
  id: string;
  name: string;
  inventory: number;
  maxCapacity: number; // Add maxCapacity to Machine type
};

type Props = {
  machines: Machine[];
};

export default function RouteMachinesTable(props: Props) {
  if (props.machines.length === 0) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center py-20 border rounded-xl border-dotted gap-2">
          <h3 className="text-xl font-semibold">
            No Hay Máquinas en esta Ruta
          </h3>
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              Aún no has agregado máquinas a esta ruta.
            </p>
            <p className="text-muted-foreground text-sm">
              Haz clic en el botón de arriba para agregar una máquina a esta
              ruta.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Table wrapperClassName="border-none rounded-none">
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Inventario</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.machines.map((machine) => {
          const percent =
            Math.round((machine.inventory * 100) / machine.maxCapacity) || 0; // Calculate percentage

          return (
            <TableRow key={machine.id}>
              <TableCell>{machine.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-4">
                  {percent}%
                  <Progress
                    value={percent}
                    className="w-[30px] md:w-[60px] h-1"
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
