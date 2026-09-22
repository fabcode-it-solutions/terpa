import { RouteSettingsForm } from "@/components/route/route-settings-form";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { notFound } from "next/navigation";

type Props = {
  params: {
    slug: string;
    id: string;
  };
};

export default async function Page(props: Props) {
  requireSession();

  const route = await prisma.route.findUnique({
    where: { id: props.params.id },
    select: {
      id: true,
      name: true,
    },
  });

  if (!route) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <Card className="bg-background">
        <CardContent className="space-y-6 p-4">
          <RouteSettingsForm
            defaultValues={{
              name: route.name,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
