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

// Chuyển đổi file DOCX sang HTML để đọc trực tuyến không cần tải về
export async function renderDocxToHtml(base64Data: string) {
  try {
    const mammoth = require("mammoth");
    // Loại bỏ prefix data url nếu có
    const base64Clean = base64Data.includes("base64,") 
      ? base64Data.split("base64,")[1] 
      : base64Data;

    const buffer = Buffer.from(base64Clean, "base64");
    const result = await mammoth.convertToHtml({ buffer });
    return { success: true, html: result.value };
  } catch (error: any) {
    console.error("Lỗi khi chuyển đổi docx sang HTML:", error);
    return { success: false, error: "Không thể hiển thị tài liệu Word trực tuyến." };
  }
}
