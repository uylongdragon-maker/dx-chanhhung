import { prisma } from "@/utils/prisma";

export async function seedLibrary() {
  const existing = await prisma.libraryItem.count();
  if (existing > 0) return;

  await prisma.libraryItem.createMany({
    data: [
      {
        title: "Quy trình Sản xuất Video TikTok 2026",
        category: "Sản xuất",
        content: "Hướng dẫn chi tiết từ khâu lên kịch bản, quay demo đến dựng hậu kỳ và tối ưu thuật toán cho các kênh nòng cốt của Ban.",
      },
      {
        title: "Cẩm nang Pháp luật về Bản quyền Truyền thông",
        category: "Pháp lý",
        content: "Tổng hợp các quy định mới nhất về sử dụng hình ảnh, âm nhạc và nội dung sáng tạo trong các chiến dịch truyền thông cộng đồng.",
      },
      {
        title: "Kỹ thuật Livestream Đa nền tảng",
        category: "Kỹ thuật",
        content: "Hướng dẫn thiết lập OBS, vMix và cấu hình luồng Bitrate tối ưu cho các buổi họp trực tuyến và sự kiện lan tỏa.",
      },
      {
        title: "Kịch bản Wordings cho Post Ngày lễ",
        category: "Sản xuất",
        content: "Bộ sưu tập các mẫu câu (Wordings) và phong cách viết bài chuẩn 'Social' cho các ngày lễ lớn trong năm.",
      },
    ],
  });
}
