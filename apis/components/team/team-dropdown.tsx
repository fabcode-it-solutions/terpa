"use client";

import ArchiveTeamDialog from "@/components/team/archive-team-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getWhatsAppLink } from "@/lib/whatsapp";
import { TeamMemberRole } from "@prisma/client";
import {
  ArchiveIcon,
  BoxesIcon,
  DoorClosedIcon,
  ExternalLinkIcon,
  GaugeIcon,
  MoreHorizontalIcon,
  ReceiptTextIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Props = {
  team: {
    contactNumber?: string | null;
    members: {
      role: TeamMemberRole;
      user: {
        phoneNumber: string | null;
        firstName: string | null;
        lastName: string | null;
      };
    }[];
    name: string;
    slug: string;
  };
};

export default function TeamDropdown(props: Props) {
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

  const teamOwner = props.team.members.find(
    (member) => member.role === TeamMemberRole.OWNER,
  );

  const phoneNumberForLink =
    props.team.contactNumber || teamOwner?.user.phoneNumber;

  const whatsAppLink =
    phoneNumberForLink &&
    teamOwner?.user.firstName &&
    teamOwner?.user.lastName &&
    getWhatsAppLink({
      phoneNumber: phoneNumberForLink,
      userName: `${teamOwner?.user.firstName} ${teamOwner?.user.lastName}`,
      teamSlug: props.team.slug,
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="outline">
            <MoreHorizontalIcon className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom">
          <DropdownMenuLabel>{props.team.name}</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/team/${props.team.slug}/dashboard`}>
              <GaugeIcon className="size-4" /> Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/team/${props.team.slug}/machines`}>
              <DoorClosedIcon className="size-4" /> Máquinas
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/team/${props.team.slug}/products`}>
              <BoxesIcon className="size-4" /> Productos
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/team/${props.team.slug}/users`}>
              <UsersIcon className="size-4" /> Usuarios
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/team/${props.team.slug}/billing`}>
              <ReceiptTextIcon className="size-4" /> Facturación
            </Link>
          </DropdownMenuItem>
          {whatsAppLink && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={whatsAppLink} target="_blank">
                  <ExternalLinkIcon className="size-4" /> WhatsApp Link de Pago
                </Link>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/admin/teams/${props.team.slug}/manage`}>
              <SettingsIcon className="size-4" /> Administrar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsArchiveDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <ArchiveIcon className="size-4" /> Archivar Equipo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ArchiveTeamDialog
        open={isArchiveDialogOpen}
        onOpenChange={setIsArchiveDialogOpen}
        teamName={props.team.name}
        teamSlug={props.team.slug}
      />
    </>
  );
}
