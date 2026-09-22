import MachineAdminForm from "@/components/machine/machine-admin-form";
import MachineSettingsForm from "@/components/machine/machine-settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { UserRole } from "@prisma/client";
import { notFound } from "next/navigation";

type Props = {
  params: {
    slug: string;
    machineId: string;
  };
};

export default async function Page(props: Props) {
  const session = requireSession();

  const machine = await prisma.machine.findUnique({
    where: { id: props.params.machineId },
    select: {
      id: true,
      name: true,
      terminalSerialNumber: true,
      pharosTerminalCode: true,
      protocol: true,
      lat: true,
      lon: true,
      activeUntilDate: true,
      isEnabled: true,
    },
  });

  if (!machine) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <Card className="bg-background">
        <CardHeader className="py-6">
          <CardTitle>Ajustes</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-6 p-4">
          <MachineSettingsForm
            isAdmin={session.role === UserRole.ADMIN}
            terminalCode={machine.pharosTerminalCode}
            defaultValues={{
              name: machine.name,
              terminalSerialNumber: machine.terminalSerialNumber,
              protocol: machine.protocol,
            }}
          />
        </CardContent>
      </Card>
      {session.role === UserRole.ADMIN && (
        <Card className="bg-background">
          <CardHeader className="py-6">
            <CardTitle>Administrar Máquina</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-6 p-4">
            <MachineAdminForm
              isEnabled={machine.isEnabled}
              activeUntilDate={
                machine.activeUntilDate
                  ? machine.activeUntilDate.toISOString().split("T")[0]
                  : ""
              }
            />
          </CardContent>
        </Card>
      )}
      {/* <Card className="bg-background">
        <CardHeader>
          <CardTitle>Ubicación</CardTitle>
          <CardDescription>
            Introduce la ubicación de la máquina para poder utilizar las
            funciones de geolocalización.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-4">
          <MachineLocationForm
            defaultValues={{
              lat: machine.lat,
              lon: machine.lon,
            }}
          />
        </CardContent>
      </Card> */}
    </div>
  );
}
