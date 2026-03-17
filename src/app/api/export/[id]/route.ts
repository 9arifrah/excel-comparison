import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparisons } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import * as XLSX from 'xlsx'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
    const masterData = JSON.parse(comparison.masterData)
    const secondaryData = JSON.parse(comparison.secondaryData)
    const masterColumns = comparison.masterColumns ? JSON.parse(comparison.masterColumns) : []
    const secondaryColumns = comparison.secondaryColumns ? JSON.parse(comparison.secondaryColumns) : []

    // Create worksheet with master and secondary data
    const worksheetData: any[] = []

    if (comparisonData.length > 0) {
      // Create header row with Master columns, Secondary columns, and status
      const headers: string[] = []

      // Add master column headers
      masterColumns.forEach((col: string) => {
        headers.push(`Master: ${col}`)
      })

      // Add secondary column headers
      secondaryColumns.forEach((col: string) => {
        headers.push(`Secondary: ${col}`)
      })

      // Add status columns
      headers.push('MATCH_STATUS', 'SIMILARITY_SCORE')

      worksheetData.push(headers)

      // Add data rows
      comparisonData.forEach((item: any, index: number) => {
        const rowData: any[] = []

        // Add master data values (from matched master row)
        if (item.masterRow) {
          masterColumns.forEach((col: string) => {
            rowData.push(item.masterRow[col] !== undefined && item.masterRow[col] !== null ? item.masterRow[col] : '')
          })
        } else {
          masterColumns.forEach(() => {
            rowData.push('')
          })
        }

        // Add secondary data values
        const row = secondaryData[index] || {}
        secondaryColumns.forEach((col: string) => {
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
