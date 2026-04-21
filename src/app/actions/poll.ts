'use server'

import { prisma } from '@/utils/prisma'
import { revalidatePath } from 'next/cache'

export async function castVote(pollId: string, userId: string, optionIdx: number) {
  try {
    // Upsert dựa trên khóa phức hợp (composite key) pollId_userId mà chúng ta vừa cấu hình trong schema
    await prisma.vote.upsert({
      where: { 
        pollId_userId: {
          pollId: pollId,
          userId: userId
        }
      },
      update: { optionIdx },
      create: { pollId, userId, optionIdx }
    });
    
    revalidatePath('/workspace');
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi bỏ phiếu: ", error);
    return { success: false, error: error.message };
  }
}
