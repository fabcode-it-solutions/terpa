import { deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function POST() {
  deleteSession();
  redirect("/");
}

export async function GET() {
  deleteSession();
  redirect("/");
}
