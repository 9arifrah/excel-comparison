import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparisons } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Check ownership
    if (comparison.userId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to export this comparison' },
        { status: 403 }
      )
    }

    // Parse comparison data
    const comparisonData = JSON.parse(comparison.comparisonData)
    const masterData = JSON.parse(comparison.masterData)
    const secondaryData = JSON.parse(comparison.secondaryData)
    const masterColumns = comparison.masterColumns ? JSON.parse(comparison.masterColumns) : []
    const secondaryColumns = comparison.secondaryColumns ? JSON.parse(comparison.secondaryColumns) : []

    // Create worksheet with master and secondary data
    const worksheetData: any[] = []

    if (comparisonData.length > 0) {
      // Get ALL columns from master and secondary data (not just selected ones)
      const allMasterColumns = masterData.length > 0 ? Object.keys(masterData[0]) : []
      const allSecondaryColumns = secondaryData.length > 0 ? Object.keys(secondaryData[0]) : []

      // Create header row with ALL Master columns, ALL Secondary columns, and status
      const headers: string[] = []

      // Add ALL master column headers
      allMasterColumns.forEach((col: string) => {
        headers.push(`Master: ${col}`)
      })

      // Add ALL secondary column headers
      allSecondaryColumns.forEach((col: string) => {
        headers.push(`Secondary: ${col}`)
      })

      // Add status columns
      headers.push('MATCH_STATUS', 'SIMILARITY_SCORE')

      worksheetData.push(headers)

      // Add data rows
      comparisonData.forEach((item: any, index: number) => {
        const rowData: any[] = []

        // Add ALL master data values (from matched master row)
        if (item.masterRow) {
          allMasterColumns.forEach((col: string) => {
            rowData.push(item.masterRow[col] !== undefined && item.masterRow[col] !== null ? item.masterRow[col] : '')
          })
        } else {
          allMasterColumns.forEach(() => {
            rowData.push('')
          })
        }

        // Add ALL secondary data values
        const row = secondaryData[index] || {}
        allSecondaryColumns.forEach((col: string) => {
          rowData.push(row[col] !== undefined && row[col] !== null ? row[col] : '')
        })

        // Add status columns
        rowData.push(item.matched ? 'Matched' : 'Unmatched')
        rowData.push(item.similarityScore !== undefined ? item.similarityScore.toFixed(2) + '%' : '')

        worksheetData.push(rowData)
      })
    }

    // Create workbook
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Comparison Results')

    // Generate buffer
    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx'
    })

    // Return file
    const filename = `comparison_result_${new Date().toISOString().split('T')[0]}.xlsx`
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error exporting comparison:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
