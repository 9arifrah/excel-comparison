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

    // Return sample data for demo purposes
    if (id === 'sample') {
      const sampleData = [
        { row: 1, matched: true, similarityScore: 100, columnSimilarities: { Name: 100, Email: 100 }, data: { Name: 'John Doe', Email: 'john@example.com', Phone: '123-456-7890', Address: '123 Main St', City: 'New York' } },
        { row: 2, matched: true, similarityScore: 100, columnSimilarities: { Name: 100, Email: 100 }, data: { Name: 'Jane Smith', Email: 'jane@example.com', Phone: '234-567-8901', Address: '456 Oak Ave', City: 'Los Angeles' } },
        { row: 3, matched: true, similarityScore: 95.5, columnSimilarities: { Name: 100, Email: 91 }, data: { Name: 'Bob Johnson', Email: 'bob.johnson@example.com', Phone: '345-678-9012', Address: '789 Pine Rd', City: 'Chicago' } },
        { row: 4, matched: false, similarityScore: 45.2, columnSimilarities: { Name: 50, Email: 40.4 }, data: { Name: 'Alice Williams', Email: 'alice.w@example.com', Phone: '456-789-0123', Address: '321 Elm St', City: 'Houston' } },
        { row: 5, matched: true, similarityScore: 88.7, columnSimilarities: { Name: 100, Email: 77.4 }, data: { Name: 'Charlie Brown', Email: 'charlie.b@example.com', Phone: '567-890-1234', Address: '654 Maple Dr', City: 'Phoenix' } },
        { row: 6, matched: false, similarityScore: 32.1, columnSimilarities: { Name: 40, Email: 24.2 }, data: { Name: 'Diana Prince', Email: 'diana.p@other.com', Phone: '678-901-2345', Address: '987 Cedar Ln', City: 'Philadelphia' } },
        { row: 7, matched: true, similarityScore: 100, columnSimilarities: { Name: 100, Email: 100 }, data: { Name: 'Edward Davis', Email: 'edward@example.com', Phone: '789-012-3456', Address: '147 Birch Way', City: 'San Antonio' } },
        { row: 8, matched: true, similarityScore: 92.3, columnSimilarities: { Name: 100, Email: 84.6 }, data: { Name: 'Fiona Green', Email: 'fiona.green@example.com', Phone: '890-123-4567', Address: '258 Spruce St', City: 'San Diego' } },
        { row: 9, matched: false, similarityScore: 55.8, columnSimilarities: { Name: 60, Email: 51.6 }, data: { Name: 'George Hill', Email: 'george.h@web.com', Phone: '901-234-5678', Address: '369 Oak Ln', City: 'Dallas' } },
        { row: 10, matched: true, similarityScore: 100, columnSimilarities: { Name: 100, Email: 100 }, data: { Name: 'Hannah White', Email: 'hannah@example.com', Phone: '012-345-6789', Address: '741 Pine Ave', City: 'San Jose' } },
      ]

      let filteredData = sampleData
      if (filter === 'matched') {
        filteredData = sampleData.filter((item: any) => item.matched)
      } else if (filter === 'unmatched') {
        filteredData = sampleData.filter((item: any) => !item.matched)
      }

      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedData = filteredData.slice(startIndex, endIndex)
      const totalPages = Math.ceil(filteredData.length / limit)

      const matchedRows = sampleData.filter((item: any) => item.matched).length
      const unmatchedRows = sampleData.filter((item: any) => !item.matched).length

      return NextResponse.json({
        id: 'sample',
        masterFile: 'master_data.xlsx',
        secondaryFile: 'secondary_data.xlsx',
        totalRows: sampleData.length,
        matchedRows,
        unmatchedRows,
        masterColumns: ['Name', 'Email'],
        secondaryColumns: ['Name', 'Email'],
        masterData: sampleData.map((item: any) => item.data),
        secondaryData: sampleData.map((item: any) => item.data),
        comparisonData: paginatedData,
        pagination: {
          page,
          limit,
          totalItems: filteredData.length,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        comparisonMethod: 'fuzzy',
        similarityThreshold: 85,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

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
