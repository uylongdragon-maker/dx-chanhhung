import { prisma } from "@/utils/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import LibraryClient from "@/components/library/LibraryClient";

export const revalidate = 0; // Disable caching to fetch real-time items on admin upload

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  if (!supabaseUser) return redirect("/login");

  const currentUser = await prisma.user.findUnique({ where: { id: supabaseUser.id } });
  if (!currentUser) return redirect("/login");

  // Load items from database
  const libraryItems = await prisma.libraryItem.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex flex-col gap-6 pb-24 animate-in fade-in duration-500">
      <LibraryClient 
        initialItems={libraryItems as any}
        currentUser={currentUser}
      />
    </div>
  );
}
