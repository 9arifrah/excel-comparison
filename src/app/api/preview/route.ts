import { NextRequest, NextResponse } from 'next/server'
import { previewExcelFile } from '@/lib/excel-comparison'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!type || (type !== 'master' && type !== 'secondary')) {
      return NextResponse.json({ error: 'Invalid type. Must be "master" or "secondary"' }, { status: 400 })
    }

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]

    const isValidType = validTypes.includes(file.type) ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')

    if (!isValidType) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      )
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Preview file
    const preview = await previewExcelFile(buffer, type)

    // Add fileName to response
    return NextResponse.json({
      ...preview,
      fileName: file.name
    })
  } catch (error) {
    console.error('Error previewing file:', error)
    return NextResponse.json(
      { error: 'Failed to preview file: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
