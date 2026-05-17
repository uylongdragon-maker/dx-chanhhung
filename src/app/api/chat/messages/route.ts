import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("roomId");
  if (!roomId) return NextResponse.json({ messages: [] });

  try {
    const messages = await prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
      take: 60,
      include: { sender: { select: { name: true, avatarUrl: true } } }
    });
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ messages: [], error: "Failed to fetch" }, { status: 500 });
  }
}
