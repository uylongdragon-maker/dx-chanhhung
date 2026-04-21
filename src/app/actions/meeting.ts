'use server'

import { prisma } from '@/utils/prisma'
import { revalidatePath } from 'next/cache'
import { GoogleGenerativeAI } from '@google/generative-ai'

// 1. Hàm Thành viên gửi yêu cầu mượn phòng (Modernized)
export async function bookMeetingRoom(userId: string, roomName: string, purpose: string, startTime: Date, endTime: Date) {
  try {
    await prisma.meetingRequest.create({
      data: {
        roomName, 
        purpose, 
        startTime, 
        endTime, 
        status: 'PENDING', 
        requestedBy: userId
      }
    });
    revalidatePath('/workspace/meetings');
    return { success: true };
  } catch (error) {
    console.error("Lỗi khi đặt phòng:", error);
    return { success: false, error: "Không thể gửi yêu cầu đặt phòng." };
  }
}

// 2. Hàm Admin tự tay duyệt (Nếu đang online)
export async function manualApprove(requestId: string, status: 'APPROVED' | 'REJECTED') {
  try {
    await prisma.meetingRequest.update({
      where: { id: requestId },
      data: { status, isAIApproved: false }
    });
    revalidatePath('/workspace/meetings');
    return { success: true };
  } catch (error) {
    console.error("Lỗi khi duyệt thủ công:", error);
    return { success: false };
  }
}

// 3. Hàm AI Tự động duyệt (Giải phóng sức lao động cho Admin)
export async function aiAutoApprove() {
  const config = await prisma.systemConfig.findUnique({
    where: { key: 'GEMINI_API_KEY' }
  });
  const apiKey = config?.value || process.env.GEMINI_API_KEY || '';
  
  if (!apiKey) {
    console.error("Lỗi: Chưa cấu hình Gemini API Key.");
    return { success: false, error: "Missing API Key" };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const pendingRequests = await prisma.meetingRequest.findMany({
    where: { status: 'PENDING' },
    include: { user: true }
  });

  if (pendingRequests.length === 0) return { success: true, count: 0 };

  let processedCount = 0;

  for (const req of pendingRequests) {
    const prompt = `
      Bạn là quản trị viên Ban Truyền thông Chánh Hưng. Một thành viên vừa xin mượn phòng họp.
      Người yêu cầu: ${req.user.name}
      Lý do mượn: "${req.purpose}".
      Thời gian: ${req.startTime.toLocaleString()} đến ${req.endTime.toLocaleString()}
      
      QUY TẮC DUYỆT:
      - Nếu lý do này hợp lý, phục vụ công việc (họp nội dung, quay video, làm kịch bản, dựng phim, tập văn nghệ...), hãy trả lời CHÍNH XÁC một chữ: "DUYET".
      - Nếu lý do đùa cợt, không rõ ràng hoặc mang tính chất cá nhân không liên quan công việc, trả lời: "TUCHOI".
      - Chỉ trả về duy nhất 1 từ DUYET hoặc TUCHOI.
    `;

    try {
      const result = await model.generateContent(prompt);
      const aiDecision = result.response.text().trim().toUpperCase();

      if (aiDecision.includes('DUYET')) {
        await prisma.meetingRequest.update({
          where: { id: req.id },
          data: { status: 'APPROVED', isAIApproved: true }
        });
        processedCount++;
      } else if (aiDecision.includes('TUCHOI')) {
        await prisma.meetingRequest.update({
          where: { id: req.id },
          data: { status: 'REJECTED', isAIApproved: true }
        });
        processedCount++;
      }
    } catch (e) {
      console.error(`Lỗi AI khi duyệt phòng (ID: ${req.id}):`, e);
    }
  }
  
  revalidatePath('/workspace/meetings');
  return { success: true, count: processedCount };
}

// 4. Tóm tắt cuộc họp và giao việc tự động (Moved and Refined)
export async function summarizeAndAssign(topic: string, content: string) {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: 'GEMINI_API_KEY' }
      });
      const apiKey = config?.value || process.env.GEMINI_API_KEY || '';
      
      if (!apiKey) throw new Error("Chưa cấu hình API Key");
  
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `
        Bạn là trợ lý AI chuyên nghiệp cho Ban Truyền thông. 
        Nhiệm vụ: Tóm tắt nội dung họp và BÓC TÁCH CÁC CÔNG VIỆC CẦN LÀM.
        
        CHỦ ĐỀ: ${topic}
        NỘI DUNG THẢO LUẬN: ${content}
        
        HÃY TRẢ VỀ DƯỚI DẠNG JSON:
        {
          "summary": "Tóm tắt súc tích trong 2-3 câu...",
          "tasks": [
            {"title": "Tên công việc cụ thể", "priority": "HIGH/MEDIUM/LOW"},
            {"title": "Việc tiếp theo", "priority": "MEDIUM"}
          ]
        }
      `;
  
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonStr = responseText.replace(/```json|```/g, "").trim();
      const data = JSON.parse(jsonStr);
  
      // Lưu bản tóm tắt
      await prisma.meeting.create({
        data: {
          topic: topic,
          summary: data.summary,
          startTime: new Date(),
        }
      });
  
      // Tự động tạo Task vào Kanban
      for (const task of data.tasks) {
        await prisma.task.create({
          data: {
            title: task.title,
            description: `Bóc tách từ cuộc họp: ${topic}`,
            priority: task.priority || "MEDIUM",
            status: "TODO",
            poolId: "default-pool" // Hardcoded for now based on previous context
          }
        });
      }
  
      revalidatePath("/workspace/meetings");
      revalidatePath("/workspace/kanban");
      
      return { 
        success: true, 
        message: `AI đã tóm tắt xong và tạo ${data.tasks.length} đầu việc mới!` 
      };
    } catch (error: any) {
      console.error("AI Summarize Error:", error);
      return { success: false, error: error.message };
    }
  }
