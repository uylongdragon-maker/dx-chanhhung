import { prisma } from "@/utils/prisma";
import { createClient } from "@/utils/supabase/server";
import PublishClient from "@/components/publish/PublishClient";

export default async function PublishPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  // Lấy danh sách bài viết từ DB
  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    include: { author: true },
  });

  return (
    <div className="flex flex-col h-full relative">
      <PublishClient initialPosts={posts} authorId={authUser.id} />
    </div>
  );
}
