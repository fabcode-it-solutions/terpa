import { deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";

export function GET() {
  deleteSession();
  redirect("/auth/signin");
}
