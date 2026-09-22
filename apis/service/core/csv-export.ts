import { prisma } from "@/lib/prisma";
import { getMachineOnlineStatus } from "@/lib/utils";
import { stringify } from "csv-stringify/sync";

export async function exportMachinesCSV() {
  // Fetch all machines including deleted ones with comprehensive data
  const machines = await prisma.machine.findMany({
    select: {
      // Basic machine info
      id: true,
      name: true,
      terminalSerialNumber: true,
      pharosTerminalCode: true,

      // Machine specifications
      tubesTotal: true,
      machineModel: true,
      machineSerial: true,
      machineVersion: true,
      versionCode: true,
      protocol: true,

      // Settings
      isEnabled: true,
      activeUntilDate: true,

      // Timestamps
      createdAt: true,
      updatedAt: true,
      lastPingAt: true,
      deletedAt: true,

      // Related data
      team: {
        select: {
          id: true,
          name: true,
          slug: true,
          isArchived: true,
        },
      },

      // Aggregated counts
      _count: {
        select: {
          sales: true,
        },
      },
    },
    orderBy: [{ team: { name: "asc" } }, { name: "asc" }],
  });

  // Transform data for CSV
  const csvData = machines.map((machine) => {
    const onlineStatus = machine.lastPingAt
      ? getMachineOnlineStatus(machine.lastPingAt)
      : "noData";

    return {
      // Basic Info
      "ID de Máquina": machine.id,
      "Nombre de Máquina": machine.name,
      "Serial de Terminal": machine.terminalSerialNumber || "",
      "Código de Terminal Pharos": machine.pharosTerminalCode || "",

      // Team Info
      "ID de Equipo": machine.team.id,
      "Nombre de Equipo": machine.team.name,
      "Slug de Equipo": machine.team.slug,
      "Equipo Archivado": machine.team.isArchived ? "Sí" : "No",

      // Machine Specifications
      Protocolo: machine.protocol,
      "Total de Tubos": machine.tubesTotal || "",
      "Modelo de Máquina": machine.machineModel || "",
      "Serial de Máquina": machine.machineSerial || "",
      "Versión de Máquina": machine.machineVersion || "",
      "Código de Versión": machine.versionCode || "",

      // Status & Settings
      "Está Habilitada": machine.isEnabled ? "Sí" : "No",
      "Activa Hasta la Fecha": machine.activeUntilDate
        .toISOString()
        .split("T")[0],
      "Estado en Línea": onlineStatus,
      "Está Eliminada": machine.deletedAt ? "Sí" : "No",

      // Statistics
      "Total de Ventas": machine._count.sales,

      // Timestamps
      "Creado el": machine.createdAt.toISOString(),
      "Actualizado el": machine.updatedAt.toISOString(),
      "Último Ping el": machine.lastPingAt
        ? machine.lastPingAt.toISOString()
        : "",
      "Eliminado el": machine.deletedAt ? machine.deletedAt.toISOString() : "",
    };
  });

  // Generate CSV string
  const csvString = stringify(csvData, {
    header: true,
    bom: true, // Add BOM for proper Excel encoding
  });

  return csvString;
}
