import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparisons } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  try {
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
        createdAt: comparisons.createdAt
      })
      .from(comparisons)
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
