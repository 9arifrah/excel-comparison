import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const comparisons = await db.comparison.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        masterFile: true,
        secondaryFile: true,
        totalRows: true,
        matchedRows: true,
        unmatchedRows: true,
        masterColumns: true,
        secondaryColumns: true,
        createdAt: true
      }
    })

    // Parse JSON columns
    const parsedComparisons = comparisons.map(comp => ({
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
