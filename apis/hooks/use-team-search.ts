import { TeamMemberRole } from "@prisma/client";
import { matchSorter } from "match-sorter";
import { useMemo, useState } from "react";

export type TeamSearchData = {
  id: string;
  name: string;
  slug: string;
  pharosMerchantCode: string | null;
  costPerMachineCents: number;
  contactNumber: string | null;
  createdAt: Date;
  isArchived: boolean;
  onboardingCompleted: boolean;
  _count: {
    machines: number;
  };
  members: Array<{
    role: TeamMemberRole;
    user: {
      email: string;
      phoneNumber: string | null;
      firstName: string | null;
      lastName: string | null;
    };
  }>;
};

export function useTeamSearch(teams: TeamSearchData[], initialQuery = "") {
  const [query, setQuery] = useState(initialQuery);

  // Transform teams for searching
  const searchableTeams = useMemo(() => {
    return teams.map((team) => {
      const ownerMember = team.members.find(
        (member) => member.role === TeamMemberRole.OWNER,
      );
      return {
        ...team,
        ownerEmail: ownerMember?.user.email || "",
        ownerPhone: ownerMember?.user.phoneNumber || "",
        ownerName:
          ownerMember?.user.firstName && ownerMember?.user.lastName
            ? `${ownerMember.user.firstName} ${ownerMember.user.lastName}`
            : "",
      };
    });
  }, [teams]);

  const filteredTeams = useMemo(() => {
    if (!query.trim()) return searchableTeams;

    return matchSorter(searchableTeams, query, {
      keys: [
        { key: "name", threshold: matchSorter.rankings.WORD_STARTS_WITH },
        {
          key: "pharosMerchantCode",
          threshold: matchSorter.rankings.STARTS_WITH,
        },
        { key: "ownerEmail", threshold: matchSorter.rankings.CONTAINS },
        { key: "ownerPhone", threshold: matchSorter.rankings.CONTAINS },
        { key: "contactNumber", threshold: matchSorter.rankings.CONTAINS },
        { key: "ownerName", threshold: matchSorter.rankings.CONTAINS },
      ],
      threshold: matchSorter.rankings.CONTAINS,
    });
  }, [searchableTeams, query]);

  return { query, setQuery, filteredTeams };
}
