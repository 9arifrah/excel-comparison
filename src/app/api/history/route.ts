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
    const superAdmin = await isSuperAdmin()

    let result

    if (superAdmin) {
      // Super admin: use Supabase client
      const { data, error } = await supabase
        .from('comparisons')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Super admin query error:', error)
        throw error
      }

      result = data || []
    } else {
      // Regular user: use Drizzle
      const drizzleResult = await db
        .select()
        .from(comparisons)
        .where(eq(comparisons.userId, userId))
        .orderBy(desc(comparisons.createdAt))

      result = drizzleResult
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
        userId: getVal('user_id', 'userId')
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
