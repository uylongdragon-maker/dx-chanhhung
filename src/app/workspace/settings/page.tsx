import { createClient } from "@/utils/supabase/server";
import { syncUser } from "@/utils/sync-user";
import { redirect } from "next/navigation";
import { prisma } from "@/utils/prisma";
import SettingsClient from "./SettingsClient";

export default async function MemberSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    return redirect("/login");
  }

  // Fetch the current user details from Postgres
  let currentUser = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
  });

  if (!currentUser) {
    // Sync if user is logged in to Supabase but doesn't exist in Postgres yet
    currentUser = await syncUser(supabaseUser);
  }

  if (!currentUser) {
    return redirect("/login");
  }

  return <SettingsClient user={currentUser} />;
}
