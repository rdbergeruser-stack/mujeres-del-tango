import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://placeholder.supabase.co';

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    'placeholder-service-key';

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
