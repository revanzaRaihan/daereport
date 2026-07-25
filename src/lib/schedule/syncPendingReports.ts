import { SupabaseClient } from '@supabase/supabase-js'

export async function syncPendingReports(supabase: SupabaseClient, userId: string) {
  try {
    // Completely clear all pending reports and disable automatic generation
    await supabase
      .from('pending_reports')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
  } catch (e) {
    console.error('Error clearing pending reports:', e)
  }
}
