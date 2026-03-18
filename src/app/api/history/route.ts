import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparisons } from '@/lib/db/schema'
import { desc, eq, sql } from 'drizzle-orm'
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
      // Super admin: use raw SQL to ensure RLS is bypassed properly
      const { data, error } = await supabase
        .from('comparisons')
        .select(`
          id,
          master_file,
          secondary_file,
          total_rows,
          matched_rows,
          unmatched_rows,
          master_columns,
          secondary_columns,
          comparison_method,
          fuzzy_algorithm,
          similarity_threshold,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Super admin query error:', error)
        throw error
      }

      result = data || []
    } else {
      // Regular user: use Drizzle with user filter
      result = await db
        .select({
          id: comparisons.id,
          masterFile: comparisons.masterFile,
          secondaryFile: comparisons.secondaryFile,
          totalRows: comparisons.totalRows,
          matchedRows: comparisons.matchedRows,
          unmatchedRows: comparisons.unmatchedRows,
          masterColumns: comparisons.masterColumns,
          secondaryColumns: comparisons.secondaryColumns,
          comparisonMethod: comparisons.comparisonMethod,
          fuzzyAlgorithm: comparisons.fuzzyAlgorithm,
          similarityThreshold: comparisons.similarityThreshold,
          createdAt: comparisons.createdAt,
          userId: comparisons.userId
        })
        .from(comparisons)
        .where(eq(comparisons.userId, userId))
        .orderBy(desc(comparisons.createdAt))
    }

    // Transform response to camelCase
    const transformedComparisons = (result as any[]).map(comp => ({
      id: comp.id,
      masterFile: comp.master_file || comp.masterFile,
      secondaryFile: comp.secondary_file || comp.secondaryFile,
      totalRows: comp.total_rows || comp.totalRows,
      matchedRows: comp.matched_rows || comp.matchedRows,
      unmatchedRows: comp.unmatched_rows || comp.unmatchedRows,
      masterColumns: comp.master_columns || comp.masterColumns ? JSON.parse(comp.master_columns || comp.masterColumns) : [],
      secondaryColumns: comp.secondary_columns || comp.secondaryColumns ? JSON.parse(comp.secondary_columns || comp.secondaryColumns) : [],
      comparisonMethod: comp.comparison_method || comp.comparisonMethod,
      fuzzyAlgorithm: comp.fuzzy_algorithm || comp.fuzzyAlgorithm,
      similarityThreshold: comp.similarity_threshold || comp.similarityThreshold,
      createdAt: comp.created_at || comp.createdAt,
      userId: comp.user_id || comp.userId
    }))

    return NextResponse.json(transformedComparisons)
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
