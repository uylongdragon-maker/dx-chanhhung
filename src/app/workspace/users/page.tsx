// src/app/workspace/users/page.tsx
import { prisma } from "@/utils/prisma";

export default async function UsersPage() {
  // Lấy dữ liệu người dùng cùng số lượng task đang làm
  const users = await prisma.user.findMany({
    include: {
      pool: true,
      _count: {
        select: { tasks: true },
      },
    },
  });

  return (
    <div className="flex flex-col h-full relative">
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-on-surface tracking-tight mb-2">Quản lý Nhân sự</h2>
          <p className="text-on-surface-variant">Danh sách thành viên thuộc Pool Chung</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-gradient-to-r from-primary to-primary-container text-white rounded-full px-6 py-2.5 flex items-center gap-2 font-medium hover:shadow-[0_8px_16px_rgba(0,87,190,0.2)] transition-all shadow-sm">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Mời thành viên
          </button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl border border-white/50 shadow-sm flex-1">
        {/* Desktop Table View */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-surface-container">
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Hồ sơ
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Email
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-center">
                  Không gian làm việc
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-center">
                  Nhiệm vụ đang giữ
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-surface-container-lowest/50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          user.avatarUrl ||
                          "https://lh3.googleusercontent.com/aida-public/AB6AXuCn9tQqxyV4vryHRxYSIsUCFz6Xqu2PyE5_JfnU0NhAsviX0A_iGX8fYb5xCShPnyV3IITG1Jr30D_zTsbyfhyuuaAavkeqsxM50RDsMTqTUHPt6F7F5qjwVWZzCxCLyxlgFOjjk7nyYat67TvLd84PVC12MYK-7A5HfIyEHk59lNSnsm6u_WswvwzB7okjMqA-kKNQtSa0yQlQTyWkax6xXk3CL-wfp4Wj6WIyAwQ7m3Si6DVGU8RkW-dDo2YKbppMZ6Gr9SMStDU"
                        }
                        alt={user.name || "User"}
                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                      />
                      <div>
                        <div className="font-semibold text-on-surface">{user.name}</div>
                        <div className="text-[10px] text-on-surface-variant mt-0.5 uppercase tracking-wider font-bold">
                          {user.role || "Chưa phân luồng"}
                        </div>
                        <div className="text-[10px] text-on-surface-variant/70 italic">
                          {user.unit}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-on-surface-variant">{user.email}</td>
                  <td className="py-4 px-6 text-center">
                     <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                       {user.pool?.name || "Global Pool"}
                     </span>
                  </td>
                  <td className="py-4 px-6 text-center text-sm font-medium">
                     {user._count.tasks} thẻ việc
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-high">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-full hover:bg-surface-container-high">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View */}
        <div className="grid grid-cols-1 md:hidden gap-4 p-4">
           {users.map((user) => (
             <div key={user.id} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/10 flex flex-col gap-3">
                <div className="flex items-center gap-4">
                    <img
                      src={user.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCn9tQqxyV4vryHRxYSIsUCFz6Xqu2PyE5_JfnU0NhAsviX0A_iGX8fYb5xCShPnyV3IITG1Jr30D_zTsbyfhyuuaAavkeqsxM50RDsMTqTUHPt6F7F5qjwVWZzCxCLyxlgFOjjk7nyYat67TvLd84PVC12MYK-7A5HfIyEHk59lNSnsm6u_WswvwzB7okjMqA-kKNQtSa0yQlQTyWkax6xXk3CL-wfp4Wj6WIyAwQ7m3Si6DVGU8RkW-dDo2YKbppMZ6Gr9SMStDU"}
                      alt={user.name || "User"}
                      className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
                    />
                    <div>
                      <div className="font-bold text-base text-on-surface">{user.name}</div>
                      <div className="text-[10px] uppercase font-bold text-primary mt-0.5">{user.role}</div>
                      <div className="text-[10px] text-on-surface-variant italic">{user.unit}</div>
                      <div className="text-[10px] text-on-surface-variant/50">{user.email}</div>
                    </div>
                </div>
                
                <div className="flex justify-between items-center mt-2 border-t border-surface-container pt-3">
                   <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">Pool</span>
                      <span className="text-sm font-medium text-primary">{user.pool?.name?.substring(0,20)}...</span>
                   </div>
                   <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">Công việc</span>
                      <span className="text-sm font-bold text-on-surface bg-surface-container-high px-2 py-0.5 rounded-md">{user._count.tasks} task</span>
                   </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                    <button className="flex-1 bg-surface-container-high hover:bg-surface-variant text-on-surface-variant py-2 rounded-lg transition-colors text-sm font-medium flex justify-center items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">edit</span> Sửa
                    </button>
                    <button className="flex-1 bg-error-container/20 hover:bg-error-container text-error py-2 rounded-lg transition-colors text-sm font-medium flex justify-center items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">delete</span> Xóa
                    </button>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
