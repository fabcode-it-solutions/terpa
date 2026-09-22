import TeamManageForm from "@/app/admin/teams/[slug]/manage/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getTeamBySlugCached } from "@/loaders/team";
import { LegalEntityType } from "@prisma/client";

type Props = {
  params: {
    slug: string;
  };
};

export default async function Page(props: Props) {
  const team = await getTeamBySlugCached(props.params.slug);

  const teamFormProps = {
    slug: team.slug,
    name: team.name,
    pharosMerchantCode: team.pharosMerchantCode,
    costPerMachineCents: team.costPerMachineCents,
    legalEntityType: team.legalEntityType as LegalEntityType | undefined,
    totalTerminals: team.totalTerminals || undefined,
    machineModelBrand: team.machineModelBrand || undefined,
    terminalSerialDigits: team.terminalSerialDigits || undefined,
    website: team.website,
    productServiceDescription: team.productServiceDescription,
    contactNumber: team.contactNumber,
    legalRepresentativeName: team.legalRepresentativeName,
    businessActivities: team.businessActivities,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{team.name}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-4">
        <TeamManageForm team={teamFormProps} />
      </CardContent>
    </Card>
  );
}
