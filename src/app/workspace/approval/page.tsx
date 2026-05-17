import { prisma } from "@/utils/prisma";
import { createClient } from "@/utils/supabase/server";
import ApprovalClient from "@/components/approval/ApprovalClient";
import { redirect } from "next/navigation";

export default async function ApprovalPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return redirect("/login");

  const currentUser = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!currentUser) return redirect("/login");

  // Fetch all approval requests
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return (
    <div className="flex flex-col h-full relative">
      <ApprovalClient initialPosts={posts} currentUser={currentUser} />
    </div>
  );
}
