'use server'

import { prisma } from '@/utils/prisma'
import { revalidatePath } from 'next/cache'

interface LibraryItemInput {
  id?: string;
  title: string;
  category: string;
  content: string;
  fileUrl?: string | null;
  embedUrl?: string | null;
  password?: string | null;
}

export async function saveLibraryItem(data: LibraryItemInput) {
  try {
    if (data.id) {
      const updated = await prisma.libraryItem.update({
        where: { id: data.id },
        data: {
          title: data.title,
          category: data.category,
          content: data.content,
          fileUrl: data.fileUrl || null,
          embedUrl: data.embedUrl || null,
          password: data.password || null,
        }
      });
      revalidatePath('/workspace/library');
      return { success: true, data: updated };
    } else {
      const created = await prisma.libraryItem.create({
        data: {
          title: data.title,
          category: data.category,
          content: data.content,
          fileUrl: data.fileUrl || null,
          embedUrl: data.embedUrl || null,
          password: data.password || null,
        }
      });
      revalidatePath('/workspace/library');
      return { success: true, data: created };
    }
  } catch (error) {
    console.error("Lỗi khi lưu tài liệu thư viện:", error);
    return { success: false, error: "Không thể lưu trữ tài liệu vào cơ sở dữ liệu." };
  }
}

export async function deleteLibraryItem(id: string) {
  try {
    await prisma.libraryItem.delete({
      where: { id }
    });
    revalidatePath('/workspace/library');
    return { success: true };
  } catch (error) {
    console.error("Lỗi khi xóa tài liệu thư viện:", error);
    return { success: false, error: "Không thể xóa tài liệu khỏi thư viện." };
  }
}
