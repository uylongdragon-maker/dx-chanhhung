import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Khởi tạo Gemini với key từ .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // Nâng cấp lên siêu não bộ Gemini 2.0 Flash để có tốc độ và trí tuệ vượt trội
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Lõi Prompt điều khiển AI
    const prompt = `
      Bạn là trợ lý ảo điều phối dự án cho Ban Truyền thông. 
      Nhiệm vụ: Đọc tin nhắn sau, nhận diện xem đó là IDEA (Ý tưởng) hay TASK (Công việc cần làm) và phản hồi như một người đồng nghiệp.
      
      QUY TẮC TỐI QUAN TRỌNG VỀ TỪ VỰNG: 
      - Chỉ được sử dụng các từ "bạn" hoặc "cư dân".
      - TUYỆT ĐỐI LOẠI BỎ và không bao giờ dùng các từ "Quý cư dân" hay "Bà con" trong bất kỳ câu trả lời hay kịch bản nào.
      - Câu trả lời phải ngắn gọn, súc tích (dưới 60 chữ).

      Tin nhắn của thành viên: "${message}"
    `;

    // Gọi AI xử lý
    const result = await model.generateContent(prompt);
    const aiReply = result.response.text();

    return NextResponse.json({ reply: aiReply });
    
  } catch (error: any) {
    console.error("Lỗi kết nối Gemini:", error);
    
    // Xử lý lỗi giới hạn lượt dùng (Rate Limit)
    if (error.status === 429) {
      return NextResponse.json({ 
        reply: "Băng thông AI đang hơi quá tải do bạn chat nhanh quá! Chờ khoảng 30-60 giây rồi thử lại nhé, tui sẽ quay lại ngay. ☕" 
      });
    }

    return NextResponse.json(
      { reply: "Kênh truyền AI đang bị nhiễu, bạn thử gửi lại nhé!" }, 
      { status: 500 }
    );
  }
}
