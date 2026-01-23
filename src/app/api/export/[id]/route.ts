import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Get comparison
    const comparison = await db.comparison.findUnique({
      where: { id }
    })

    if (!comparison) {
      return NextResponse.json({ error: 'Comparison not found' }, { status: 404 })
    }

    // Parse comparison data
    const comparisonData = JSON.parse(comparison.comparisonData)
    const secondaryData = JSON.parse(comparison.secondaryData)

    // Create worksheet with MATCH_STATUS column
    const worksheetData: any[] = []

    if (secondaryData.length > 0) {
      // Get columns from secondary data
      const columns = Object.keys(secondaryData[0])

      // Add header row with MATCH_STATUS
      worksheetData.push([...columns, 'MATCH_STATUS'])

      // Add data rows
      comparisonData.forEach((item: any, index: number) => {
        const row = secondaryData[index] || {}
        const rowData = columns.map(col => row[col] || '')
        rowData.push(item.matched ? 'Matched' : 'Unmatched')
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
