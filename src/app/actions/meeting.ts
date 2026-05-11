'use server'

import { prisma } from '@/utils/prisma'
import { revalidatePath } from 'next/cache'

// Thành viên gửi yêu cầu mượn phòng họp
export async function bookMeetingRoom(userId: string, roomName: string, purpose: string, startTime: Date, endTime: Date) {
  try {
    await prisma.meetingRequest.create({
      data: { roomName, purpose, startTime, endTime, status: 'PENDING', requestedBy: userId }
    });
    revalidatePath('/workspace/meetings');
    return { success: true };
  } catch (error) {
    console.error("Lỗi khi đặt phòng:", error);
    return { success: false, error: "Không thể gửi yêu cầu đặt phòng." };
  }
}

// Admin duyệt / từ chối thủ công
export async function manualApprove(requestId: string, status: 'APPROVED' | 'REJECTED') {
  try {
    await prisma.meetingRequest.update({
      where: { id: requestId },
      data: { status, isAIApproved: false }
    });
    revalidatePath('/workspace/meetings');
    return { success: true };
  } catch (error) {
    console.error("Lỗi khi duyệt:", error);
    return { success: false };
  }
}
