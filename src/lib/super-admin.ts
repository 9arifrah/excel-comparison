import { createClient } from './supabase/server'

/**
 * Check if the current user is a super admin
 * @returns true if user is a super admin, false otherwise
 */
export async function isSuperAdmin(): Promise<boolean> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return false
  }

  const { data } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return !!data
}

/**
 * Get the super admin status for a user
 * @param userId - The user ID to check
 * @returns true if user is a super admin, false otherwise
 */
export async function isUserSuperAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', userId)
    .single()

  return !!data
}
