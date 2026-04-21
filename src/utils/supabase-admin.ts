import { createClient } from "@supabase/supabase-js";

// Sử dụng SERVICE_ROLE_KEY để có quyền Admin tối cao (Bypass RLS)
// CHỈ SỬ DỤNG TRONG SERVER ACTIONS HOẶC API ROUTES. KHÔNG ĐƯA RA CLIENT.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
