"use client";

import ClearFiltersButton from "@/components/clear-filters-button";
import SortDropdown from "@/components/sort-dropdown";
import TeamArchiveFilter from "@/components/team/team-archive-filter";
import TeamDropdown from "@/components/team/team-dropdown";
import TeamSearchBox from "@/components/team/team-search-box";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTeamSearch, type TeamSearchData } from "@/hooks/use-team-search";
import { convertToMonterreyTimezone } from "@/lib/date-utils";
import { formatCurrency } from "@/lib/format";
import { pluralize } from "@/lib/utils";
import { getWhatsAppChatLink } from "@/lib/whatsapp";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileCheckIcon, Mail, MessageCircle, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

type Props = {
  teams: TeamSearchData[];
  initialQuery?: string;
  currentSort?: "name" | "machines" | "createdAt";
  showArchived?: boolean;
};

export default function TeamsList({
  teams,
  initialQuery = "",
  currentSort,
  showArchived = false,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { query, setQuery, filteredTeams } = useTeamSearch(teams, initialQuery);

  // Update URL when query changes (but not on initial load)
  useEffect(() => {
    if (query === initialQuery) return; // Skip if query matches initial value

    const newSearchParams = new URLSearchParams(searchParams);
    if (query.length > 0) {
      newSearchParams.set("query", query);
    } else {
      newSearchParams.delete("query");
    }

    const newUrl = `?${newSearchParams.toString()}`;
    const currentUrl = `?${searchParams.toString()}`;

    if (newUrl !== currentUrl) {
      router.replace(newUrl);
    }
  }, [query, router, searchParams, initialQuery]);

  // Apply sorting to filtered teams
  const sortedTeams = useMemo(() => {
    const teamsCopy = [...filteredTeams];

    switch (currentSort) {
      case "machines":
        return teamsCopy.sort((a, b) => b._count.machines - a._count.machines);
      case "createdAt":
        return teamsCopy.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
      case "name":
      default:
        return teamsCopy.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [filteredTeams, currentSort]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <TeamSearchBox
            query={query}
            onQueryChange={setQuery}
            placeholder="Buscar por nombre, código, email o teléfono..."
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <TeamArchiveFilter />
            <ClearFiltersButton />
          </div>
          <SortDropdown currentSort={currentSort} />
        </div>
      </div>

      <div key={`${query}-${currentSort}`}>
        {sortedTeams.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Comercio</TableHead>
                <TableHead>Máquinas Habilitadas</TableHead>
                <TableHead>Costo por Máquina</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTeams.map((team) => {
                const ownerMember = team.members[0];
                const ownerPhoneNumber = ownerMember?.user?.phoneNumber;
                const displayPhoneNumber =
                  team.contactNumber || ownerPhoneNumber;
                return (
                  <TableRow key={team.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/teams/${team.slug}/manage`}
                          className="hover:underline font-medium"
                        >
                          {team.name}
                        </Link>
                        {team.isArchived && (
                          <Badge variant="destructive" className="text-xs">
                            Archivado
                          </Badge>
                        )}
                        {team.onboardingCompleted && (
                          <Badge variant="default" className="text-xs">
                            <FileCheckIcon className="size-4" />
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col items-start">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="px-1 py-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                        >
                          <Link href={`mailto:${ownerMember?.user.email}`}>
                            <Mail className="mr-1.5 h-3.5 w-3.5" />
                            {ownerMember?.user.email}
                          </Link>
                        </Button>
                        {displayPhoneNumber && ownerMember?.user && (
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="px-1 py-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                          >
                            <Link
                              href={getWhatsAppChatLink(displayPhoneNumber)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                              {`+521 ${displayPhoneNumber}`}
                            </Link>
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Creado:{" "}
                        {format(
                          convertToMonterreyTimezone(team.createdAt),
                          "PPP",
                          { locale: es },
                        )}
                      </p>
                    </TableCell>
                    <TableCell>{team.pharosMerchantCode}</TableCell>
                    <TableCell>
                      <Button asChild variant="ghost">
                        <Link href={`/team/${team.slug}/machines`}>
                          {team._count.machines}{" "}
                          {pluralize(
                            team._count.machines,
                            "máquina",
                            "máquinas",
                          )}
                        </Link>
                      </Button>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(team.costPerMachineCents)} USD{" "}
                      <span className="text-muted-foreground text-xs">
                        + IVA
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild size="icon" variant="outline">
                          <Link href={`/admin/teams/${team.slug}/manage`}>
                            <SettingsIcon className="h-5 w-5" />
                          </Link>
                        </Button>
                        <TeamDropdown team={team} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : query.length > 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron equipos que coincidan con &ldquo;{query}&rdquo;
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No hay equipos disponibles
          </div>
        )}
      </div>
    </>
  );
}
