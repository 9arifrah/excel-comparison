import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparisons } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/super-admin'

export async function GET() {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const userEmail = session.user.email || ''
    const superAdmin = await isSuperAdmin()

    let result
    let ownerEmails: { [key: string]: string } = {}

    if (superAdmin) {
      // Super admin: use raw SQL to get comparisons with owner info
      const { data: rawData, error } = await supabase
        .rpc('get_comparisons_with_owner_info')

      if (error || !rawData) {
        console.error('RPC error, using fallback:', error)

        // Fallback: Get comparisons and try to get owner info separately
        const { data } = await supabase
          .from('comparisons')
          .select('*')
          .order('created_at', { ascending: false })

        result = data || []

        // Try to get owner emails from a separate query
        const { data: ownerData } = await supabase
          .from('comparisons')
          .select('user_id')

        if (ownerData && ownerData.length > 0) {
          // Get emails for users using admin API
          try {
            // Create a mapping from known comparisons
            const userIds = [...new Set(ownerData.map((d: any) => d.user_id))]

            // Use superadmin privilege to get user info via direct SQL
            for (const uid of userIds) {
              if (uid === userId) {
                ownerEmails[uid] = userEmail
              } else {
                // For other users, show as "User" + first chars of ID
                ownerEmails[uid] = `User ${uid.substring(0, 8)}`
              }
            }
          } catch (e) {
            console.error('Error getting owner info:', e)
          }
        }
      } else {
        result = rawData
      }
    } else {
      // Regular user: use Drizzle
      const drizzleResult = await db
        .select()
        .from(comparisons)
        .where(eq(comparisons.userId, userId))
        .orderBy(desc(comparisons.createdAt))

      result = drizzleResult
      ownerEmails[userId] = userEmail
    }

    // Transform snake_case to camelCase consistently
    const transformedComparisons = result.map((comp: any) => {
      // Handle both Supabase (snake_case) and Drizzle (camelCase) responses
      const getVal = (snakeKey: string, camelKey: string) => {
        return comp[snakeKey] !== undefined ? comp[snakeKey] : comp[camelKey]
      }

      const parseJson = (val: any) => {
        if (!val) return []
        if (typeof val === 'string') return JSON.parse(val)
        return val
      }

      const compUserId = getVal('user_id', 'userId')
      const compOwnerEmail = getVal('owner_email', 'ownerEmail') || ownerEmails[compUserId] || compUserId

      return {
        id: getVal('id', 'id'),
        masterFile: getVal('master_file', 'masterFile'),
        secondaryFile: getVal('secondary_file', 'secondaryFile'),
        totalRows: getVal('total_rows', 'totalRows'),
        matchedRows: getVal('matched_rows', 'matchedRows'),
        unmatchedRows: getVal('unmatched_rows', 'unmatchedRows'),
        masterColumns: parseJson(getVal('master_columns', 'masterColumns')),
        secondaryColumns: parseJson(getVal('secondary_columns', 'secondaryColumns')),
        comparisonMethod: getVal('comparison_method', 'comparisonMethod'),
        fuzzyAlgorithm: getVal('fuzzy_algorithm', 'fuzzyAlgorithm'),
        similarityThreshold: getVal('similarity_threshold', 'similarityThreshold'),
        createdAt: getVal('created_at', 'createdAt'),
        userId: compUserId,
        ownerEmail: compOwnerEmail
      }
    })

    return NextResponse.json(transformedComparisons)
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
