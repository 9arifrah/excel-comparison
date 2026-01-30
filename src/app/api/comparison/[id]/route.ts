import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparisons } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Parse query parameters for pagination
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const filter = searchParams.get('filter') || 'all' // all, matched, unmatched

    // Get comparison
    const result = await db
      .select()
      .from(comparisons)
      .where(eq(comparisons.id, id))
      .limit(1)

    const comparison = result[0]

    if (!comparison) {
      return NextResponse.json({ error: 'Comparison not found' }, { status: 404 })
    }

    // Parse comparison data
    const comparisonData = JSON.parse(comparison.comparisonData)
    const secondaryData = JSON.parse(comparison.secondaryData)
    const masterData = JSON.parse(comparison.masterData)
    const masterColumns = comparison.masterColumns ? JSON.parse(comparison.masterColumns) : []
    const secondaryColumns = comparison.secondaryColumns ? JSON.parse(comparison.secondaryColumns) : []

    // Apply filter
    let filteredData = comparisonData
    if (filter === 'matched') {
      filteredData = comparisonData.filter((item: any) => item.matched)
    } else if (filter === 'unmatched') {
      filteredData = comparisonData.filter((item: any) => !item.matched)
    }

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedData = filteredData.slice(startIndex, endIndex)
    const totalPages = Math.ceil(filteredData.length / limit)

    return NextResponse.json({
      id: comparison.id,
      masterFile: comparison.masterFile,
      secondaryFile: comparison.secondaryFile,
      totalRows: comparison.totalRows,
      matchedRows: comparison.matchedRows,
      unmatchedRows: comparison.unmatchedRows,
      masterColumns,
      secondaryColumns,
      masterData,
      secondaryData,
      comparisonData: paginatedData,
      pagination: {
        page,
        limit,
        totalItems: filteredData.length,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      createdAt: comparison.createdAt,
      updatedAt: comparison.updatedAt
    })
  } catch (error) {
    console.error('Error fetching comparison:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
