import Timestamp from "@/components/timestamp";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { getReportById } from "@/service/dex";
import { notFound } from "next/navigation";

type Props = {
  params: {
    slug: string;
    machineId: string;
    reportId: string;
  };
};

export default async function Page(props: Props) {
  const report = await prisma.dexReport.findUnique({
    where: {
      reportId: props.params.reportId,
      machineId: props.params.machineId,
    },
  });

  if (!report) {
    return notFound();
  }

  const dexReport = await getReportById(props.params.reportId);
  if (!dexReport || !dexReport.report) {
    return notFound();
  }

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex flex-col gap-1">
          <CardTitle>DEX</CardTitle>
          <CardDescription>
            <Timestamp date={report.createdAt} />
          </CardDescription>
        </div>
        <div>
          <p className="font-mono text-xs bg-muted p-1 rounded-md">
            {report.reportId}
          </p>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="overflow-x-auto">
        <pre className="text-sm pt-4">{dexReport.report.data}</pre>
      </CardContent>
    </Card>
  );
}
