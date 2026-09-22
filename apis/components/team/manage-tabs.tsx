"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

export default function ManageTabs() {
  const params = useParams();
  const path = usePathname();
  const base = `/admin/teams/${params.slug}/manage`;
  const last = path.split("/").pop();

  // Determine the active tab. Default to 'manage' if it's the base path.
  // Handle nested routes: if path contains '/users', set active tab to 'users'
  const activeTab = path.includes(`${base}/users`)
    ? "users"
    : last === "manage"
      ? ""
      : last;

  return (
    <Tabs value={activeTab} className="overflow-x-auto">
      <TabsList>
        <TabsTrigger value="" asChild>
          <Link href={base}>General</Link>
        </TabsTrigger>
        <TabsTrigger value="documents" asChild>
          <Link href={`${base}/documents`}>Documentos</Link>
        </TabsTrigger>
        <TabsTrigger value="users" asChild>
          <Link href={`${base}/users`}>Usuarios</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
