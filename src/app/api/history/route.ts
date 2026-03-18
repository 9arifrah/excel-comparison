import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparisons } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'

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

    const result = await db
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
        createdAt: comparisons.createdAt
      })
      .from(comparisons)
      .where(eq(comparisons.userId, userId))
      .orderBy(desc(comparisons.createdAt))

    // Parse JSON columns
    const parsedComparisons = result.map(comp => ({
      ...comp,
      masterColumns: comp.masterColumns ? JSON.parse(comp.masterColumns) : [],
      secondaryColumns: comp.secondaryColumns ? JSON.parse(comp.secondaryColumns) : []
    }))

    return NextResponse.json(parsedComparisons)
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
