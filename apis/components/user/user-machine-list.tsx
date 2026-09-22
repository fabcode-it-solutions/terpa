import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import UserMachineRemoveDialog from "@/components/user/user-machine-remove-dialog";
type Props = {
  machines: Array<{
    id: string;
    name: string;
  }>;
};

export default function UserMachineList(props: Props) {
  return (
    <Table>
      <TableBody>
        {props.machines.map((machine) => (
          <TableRow key={machine.id}>
            <TableCell>{machine.name}</TableCell>
            <TableCell>
              <div className="flex justify-end">
                <UserMachineRemoveDialog
                  machineId={machine.id}
                  machineName={machine.name}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
