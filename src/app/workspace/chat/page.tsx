import { prisma } from "@/utils/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ChatPageClient from "@/components/chat/ChatPageClient";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return redirect("/login");

  const currentUser = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!currentUser) return redirect("/login");

  const pool = await prisma.pool.findFirst();
  if (!pool) return redirect("/workspace");

  // Fetch all chat rooms user is member of, plus default/global rooms
  const [myRooms, allUsers] = await Promise.all([
    prisma.chatRoom.findMany({
      where: {
        OR: [
          { members: { some: { userId: currentUser.id } } },
          { isDefault: true }
        ]
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.user.findMany({ select: { id: true, name: true, avatarUrl: true } })
  ]);

  // Get messages for the first room by default
  const defaultRoom = myRooms[0] || null;
  const initialMessages = defaultRoom
    ? await prisma.message.findMany({
        where: { roomId: defaultRoom.id },
        orderBy: { createdAt: "asc" },
        take: 60,
        include: { sender: { select: { name: true, avatarUrl: true } } }
      })
    : [];

  return (
    <ChatPageClient
      currentUser={currentUser}
      initialRooms={myRooms}
      initialMessages={initialMessages}
      defaultRoomId={defaultRoom?.id || null}
      poolId={pool.id}
      allUsers={allUsers}
    />
  );
}
