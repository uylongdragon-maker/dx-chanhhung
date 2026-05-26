import { getMeetingMinutesList } from "@/app/actions/meeting-minutes";
import { prisma } from "@/utils/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import MeetingMinutesClient from "@/components/meetings/MeetingMinutesClient";
import { FileText } from "lucide-react";

export const revalidate = 0; // Disable cache to get real-time meeting minutes sync on upload

export default async function MeetingMinutesPage() {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  if (!supabaseUser) return redirect("/login");

  const currentUser = await prisma.user.findUnique({ where: { id: supabaseUser.id } });
  if (!currentUser) return redirect("/login");

  // Load saved minutes
  const savedMinutes = await getMeetingMinutesList();

  return (
    <div className="flex flex-col gap-6 pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#7360f2] text-xs font-black uppercase tracking-widest mb-1">
            <FileText size={14} /> Hồ sơ cuộc họp
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Biên Bản Cuộc Họp</h1>
          <p className="text-slate-500 text-xs font-bold mt-1">
            Tải lên biên bản (.docx) để tự động phân tích dữ liệu chỉ số, hành động, quyết định, và lưu trữ vĩnh viễn.
          </p>
        </div>
      </div>

      {/* Main client component */}
      <MeetingMinutesClient
        initialMinutes={savedMinutes as any}
        currentUser={currentUser}
      />
    </div>
  );
}
