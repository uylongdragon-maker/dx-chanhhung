'use server'

import { prisma } from '@/utils/prisma'
import { revalidatePath } from 'next/cache'
import mammoth from 'mammoth'

interface MeetingMinutesInput {
  meetingId: string;
  title: string;
  timeLocation: string;
  attendees: {
    host: string;
    secretary: string;
    participants: string[];
  };
  goal: string;
  summary: string;
  actionItems: Array<{
    name: string;
    assignee: string;
    deadline: string;
    status: string;
    priority: string;
  }>;
  issuesDecisions: {
    decisions: string[];
    issues: string[];
  };
  ideasInsights: {
    ideas: string[];
  };
}

// 1. Parse .docx file base64 data to extract structured meeting minutes fields
export async function parseMeetingMinutesDocx(base64Data: string) {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    if (!text || text.trim().length === 0) {
      return { success: false, error: "Tệp tin Word rỗng hoặc không thể trích xuất văn bản." };
    }

    // Call heuristic parser
    const parsedData = parseMeetingText(text);
    return { success: true, data: parsedData, rawText: text };
  } catch (error) {
    console.error("Lỗi khi giải nén docx:", error);
    return { success: false, error: "Đã xảy ra lỗi khi đọc tệp tin Word (.docx)." };
  }
}

// Heuristic parser based on sections and Vietnamese keywords
function parseMeetingText(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let meetingId = "";
  let title = "";
  let timeLocation = "";
  let host = "";
  let secretary = "";
  let participants: string[] = [];
  let goal = "";
  let summary = "";
  let actionItems: any[] = [];
  let decisions: string[] = [];
  let issues: string[] = [];
  let ideas: string[] = [];

  // Parse Meeting ID (MEET_YYYYMMDD_NAME)
  const meetIdMatch = text.match(/MEET_\d{8}_\w+/i);
  if (meetIdMatch) {
    meetingId = meetIdMatch[0].toUpperCase();
  }

  // Scan line by line for metadata
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    if (!meetingId && (lowerLine.includes("mã cuộc họp") || lowerLine.includes("meeting id"))) {
      const parts = line.split(/[:\-]/);
      if (parts.length > 1) {
        meetingId = parts[1].trim().toUpperCase().replace(/[\s()]/g, '');
      }
    }

    if (lowerLine.startsWith("tiêu đề") || lowerLine.startsWith("chủ đề") || lowerLine.startsWith("nội dung chính")) {
      const parts = line.split(/[:\-]/);
      if (parts.length > 1) {
        title = parts[1].trim();
      }
    }

    if (lowerLine.includes("thời gian") || lowerLine.includes("địa điểm") || lowerLine.includes("ngày tổ chức") || lowerLine.includes("ngày giờ")) {
      if (!timeLocation) {
        const parts = line.split(/[:\-]/);
        timeLocation = parts.length > 1 ? parts.slice(1).join(':').trim() : line;
      }
    }

    if (lowerLine.includes("chủ trì") || lowerLine.includes("chủ tọa") || lowerLine.includes("người chủ trì")) {
      const parts = line.split(/[:\-]/);
      if (parts.length > 1) host = parts[1].trim();
    }

    if (lowerLine.includes("thư ký") || lowerLine.includes("người ghi chép")) {
      const parts = line.split(/[:\-]/);
      if (parts.length > 1) secretary = parts[1].trim();
    }

    if (lowerLine.includes("thành phần tham dự") || lowerLine.includes("người tham gia") || lowerLine.includes("nhân sự tham gia")) {
      const parts = line.split(/[:\-]/);
      if (parts.length > 1) {
        participants = parts[1].split(/[,;]/).map(p => p.trim()).filter(Boolean);
      }
    }
  }

  // Fallback metadata values
  if (!meetingId) {
    const today = new Date();
    const yyyymmdd = today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
    meetingId = `MEET_${yyyymmdd}_AUTO`;
  }
  if (!title) {
    // Find the first line that is not a meeting ID or metadata
    const cleanFirstLine = lines.find(l => !l.toLowerCase().includes("meet_") && !l.includes(":") && l.length > 5);
    title = cleanFirstLine ? cleanFirstLine.substring(0, 80) : "Biên Bản Họp " + new Date().toLocaleDateString("vi-VN");
  }
  if (!timeLocation) {
    timeLocation = new Date().toLocaleString("vi-VN") + " - Trực tuyến";
  }

  // Try to find sections
  let currentSection = 0; // 1: goal/summary, 2: tasks, 3: decisions/issues, 4: ideas

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check Section Title changes
    if (lowerLine.includes("tóm lược") || lowerLine.includes("mục tiêu") || lowerLine.includes("executive summary")) {
      currentSection = 1;
      continue;
    }
    if (lowerLine.includes("nhiệm vụ") || lowerLine.includes("tiến độ") || lowerLine.includes("action items") || lowerLine.includes("đầu việc")) {
      currentSection = 2;
      continue;
    }
    if (lowerLine.includes("quyết định") || lowerLine.includes("vấn đề") || lowerLine.includes("decisions") || lowerLine.includes("risks")) {
      currentSection = 3;
      continue;
    }
    if (lowerLine.includes("ý tưởng") || lowerLine.includes("sáng kiến") || lowerLine.includes("insights") || lowerLine.includes("brainstorming")) {
      currentSection = 4;
      continue;
    }

    // Process line depending on section
    if (currentSection === 1) {
      if (lowerLine.includes("mục tiêu:") || lowerLine.startsWith("mục tiêu")) {
        const parts = line.split(":");
        goal = parts.length > 1 ? parts[1].trim() : line;
      } else if (lowerLine.includes("tóm tắt") || lowerLine.startsWith("tóm tắt cốt lõi") || summary.length === 0) {
        if (!line.includes(":") && line.length > 15) {
          summary += (summary ? " " : "") + line;
        } else if (line.includes(":")) {
          const parts = line.split(":");
          if (parts[1]?.trim().length > 10) {
            summary += (summary ? " " : "") + parts[1].trim();
          }
        }
      }
    } else if (currentSection === 2) {
      // Check if line represents a task. Tasks often start with bullet points or numberings, e.g. "- Triển khai...", "1. Làm..."
      // Let's filter typical header rows
      if (lowerLine.includes("đầu việc") || lowerLine.includes("người làm") || lowerLine.includes("hạn chót") || lowerLine.includes("stt")) {
        continue;
      }
      
      // Parse list lines or rows
      if (line.match(/^[\-\*\+\d\.]/) || line.includes("|") || line.includes("\t")) {
        let taskName = "";
        let assignee = "";
        let deadline = "";
        let priority = "MEDIUM";
        let status = "TODO";

        if (line.includes("|")) {
          // Table layout format e.g.: STT | Đầu việc | Người làm | Hạn chót | Độ ưu tiên
          const cells = line.split("|").map(c => c.trim());
          if (cells.length >= 3) {
            taskName = cells[1] || cells[0];
            assignee = cells[2] || "";
            deadline = cells[3] || "";
            const prioStr = (cells[4] || "").toLowerCase();
            if (prioStr.includes("cao")) priority = "HIGH";
            else if (prioStr.includes("khẩn")) priority = "URGENT";
            else if (prioStr.includes("thấp")) priority = "LOW";
          }
        } else {
          // Bullet point parsing: e.g. "- Triển khai thiết kế (Nguyễn A) - Hạn: 30/05/2026 - Cao"
          const cleanLine = line.replace(/^[\-\*\+\s\d\.]+\s*/, "");
          taskName = cleanLine;

          // Try to extract Assignee inside parentheses (e.g. Nguyễn Văn A)
          const assigneeMatch = cleanLine.match(/\(([^)]+)\)/);
          if (assigneeMatch) {
            assignee = assigneeMatch[1];
            taskName = taskName.replace(/\([^)]+\)/g, "").trim();
          }

          // Try to extract deadline like "30/05/2026" or "hạn: 30/05"
          const deadlineMatch = cleanLine.match(/(\d{1,2}\/\d{1,2}\/\d{4})|(\d{1,2}\/\d{1,2})/);
          if (deadlineMatch) {
            deadline = deadlineMatch[0];
          }

          // Priority keywords
          const lowerTask = cleanLine.toLowerCase();
          if (lowerTask.includes("khẩn cấp") || lowerTask.includes("khẩn")) priority = "URGENT";
          else if (lowerTask.includes("ưu tiên cao") || lowerTask.includes("độ ưu tiên: cao") || lowerTask.includes(" - cao")) priority = "HIGH";
          else if (lowerTask.includes("ưu tiên thấp") || lowerTask.includes(" - thấp")) priority = "LOW";
        }

        if (taskName.length > 5 && !taskName.toLowerCase().includes("nhiệm vụ")) {
          actionItems.push({
            name: taskName.trim(),
            assignee: assignee.trim() || "Chưa giao",
            deadline: deadline.trim() || new Date(Date.now() + 86400000 * 3).toLocaleDateString("vi-VN"), // Default 3 days out
            status: status,
            priority: priority
          });
        }
      }
    } else if (currentSection === 3) {
      if (lowerLine.includes("đã chốt") || lowerLine.startsWith("quyết định") || lowerLine.startsWith("-") || lowerLine.startsWith("✓")) {
        const clean = line.replace(/^[✓\-\*\+\s\d\.]+\s*/, "").trim();
        if (clean.length > 5 && !clean.toLowerCase().includes("quyết định")) {
          decisions.push(clean);
        }
      } else if (lowerLine.includes("tồn đọng") || lowerLine.includes("rủi ro") || lowerLine.includes("tranh luận") || lowerLine.startsWith("⚠")) {
        const clean = line.replace(/^[⚠\-\*\+\s\d\.]+\s*/, "").trim();
        if (clean.length > 5 && !clean.toLowerCase().includes("vấn đề")) {
          issues.push(clean);
        }
      }
    } else if (currentSection === 4) {
      if (line.match(/^[\-\*\+\d\.]/) || line.length > 10) {
        const clean = line.replace(/^[\-\*\+\s\d\.]+\s*/, "").trim();
        if (clean.length > 5 && !clean.toLowerCase().includes("đóng góp") && !clean.toLowerCase().includes("ý tưởng")) {
          ideas.push(clean);
        }
      }
    }
  }

  // Default placeholders if sections were completely missed
  if (!goal) goal = "Đưa ra kế hoạch triển khai công việc sắp tới.";
  if (!summary) summary = "Cuộc họp diễn ra tốt đẹp. Các thành viên đã thảo luận về kế hoạch công việc và thống nhất các nhiệm vụ cần thực hiện.";
  if (actionItems.length === 0) {
    actionItems.push({ name: "Theo dõi và cập nhật tiến độ công việc", assignee: host || "Cả đội", deadline: new Date(Date.now() + 86400000 * 7).toLocaleDateString("vi-VN"), status: "TODO", priority: "MEDIUM" });
  }

  return {
    meetingId,
    title,
    timeLocation,
    attendees: {
      host: host || "Chưa xác định",
      secretary: secretary || "Chưa xác định",
      participants: participants.length > 0 ? participants : [host || "Thành viên"]
    },
    goal,
    summary: summary.substring(0, 400),
    actionItems,
    issuesDecisions: {
      decisions: decisions.length > 0 ? decisions : ["Thông qua kế hoạch hoạt động của nhóm."],
      issues: issues.length > 0 ? issues : ["Chưa ghi nhận rủi ro lớn."]
    },
    ideasInsights: {
      ideas: ideas.length > 0 ? ideas : ["Tăng cường truyền thông đa kênh."]
    }
  };
}

// 2. Save Meeting Minutes to the Database (Create or Update)
export async function saveMeetingMinutes(data: MeetingMinutesInput) {
  try {
    const existing = await prisma.meetingMinutes.findUnique({
      where: { meetingId: data.meetingId }
    });

    if (existing) {
      const updated = await prisma.meetingMinutes.update({
        where: { meetingId: data.meetingId },
        data: {
          title: data.title,
          timeLocation: data.timeLocation,
          attendees: data.attendees as any,
          goal: data.goal,
          summary: data.summary,
          actionItems: data.actionItems as any,
          issuesDecisions: data.issuesDecisions as any,
          ideasInsights: data.ideasInsights as any
        }
      });
      revalidatePath('/workspace/meeting-minutes');
      return { success: true, data: updated, isNew: false };
    } else {
      const created = await prisma.meetingMinutes.create({
        data: {
          meetingId: data.meetingId,
          title: data.title,
          timeLocation: data.timeLocation,
          attendees: data.attendees as any,
          goal: data.goal,
          summary: data.summary,
          actionItems: data.actionItems as any,
          issuesDecisions: data.issuesDecisions as any,
          ideasInsights: data.ideasInsights as any
        }
      });
      revalidatePath('/workspace/meeting-minutes');
      return { success: true, data: created, isNew: true };
    }
  } catch (error) {
    console.error("Lỗi khi lưu biên bản họp:", error);
    return { success: false, error: "Không thể lưu trữ biên bản họp vào cơ sở dữ liệu." };
  }
}

// 3. Get all meeting minutes list
export async function getMeetingMinutesList() {
  try {
    return await prisma.meetingMinutes.findMany({
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Lỗi khi tải danh sách biên bản:", error);
    return [];
  }
}

// 4. Delete meeting minutes by meetingId
export async function deleteMeetingMinutes(meetingId: string) {
  try {
    await prisma.meetingMinutes.delete({
      where: { meetingId }
    });
    revalidatePath('/workspace/meeting-minutes');
    return { success: true };
  } catch (error) {
    console.error("Lỗi khi xóa biên bản họp:", error);
    return { success: false, error: "Không thể xóa biên bản họp." };
  }
}
