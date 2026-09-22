"use server";

import { deleteSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signOutAction() {
  deleteSession();
  revalidatePath("/", "layout");
  redirect("/auth/signin");
}
