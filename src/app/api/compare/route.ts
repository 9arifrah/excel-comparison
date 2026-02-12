import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparisons } from '@/lib/db/schema'
import { compareExcelFiles } from '@/lib/excel-comparison'
import { v4 as uuidv4 } from 'uuid'

// HTTP client to communicate with comparison progress service
// Only enabled in development mode
async function notifyProgressService(action: string, data: any) {
  // Skip progress service in production
  if (process.env.NODE_ENV === 'production') {
    return
  }

  try {
    const response = await fetch('http://localhost:3004', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action, ...data })
    })

    if (!response.ok) {
      console.error(`[Compare API] Failed to notify progress service: ${action}`)
    }
  } catch (error) {
    console.error(`[Compare API] Error notifying progress service:`, error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const masterFile = formData.get('masterFile') as File
    const secondaryFile = formData.get('secondaryFile') as File
    const masterColumnsStr = formData.get('masterColumns') as string
    const secondaryColumnsStr = formData.get('secondaryColumns') as string
    const jobIdStr = formData.get('jobId') as string | null
    const enableFuzzyMatchingStr = formData.get('enableFuzzyMatching') as string | null
    const similarityThresholdStr = formData.get('similarityThreshold') as string | null

    // Validate files
    if (!masterFile || !secondaryFile) {
      return NextResponse.json(
        { error: 'Both master and secondary files are required' },
        { status: 400 }
      )
    }

    // Validate columns
    if (!masterColumnsStr || !secondaryColumnsStr) {
      return NextResponse.json(
        { error: 'Master and secondary columns are required' },
        { status: 400 }
      )
    }

    const masterColumns = JSON.parse(masterColumnsStr)
    const secondaryColumns = JSON.parse(secondaryColumnsStr)

    if (!Array.isArray(masterColumns) || !Array.isArray(secondaryColumns)) {
      return NextResponse.json(
        { error: 'Columns must be arrays' },
        { status: 400 }
      )
    }

    if (masterColumns.length === 0 || secondaryColumns.length === 0) {
      return NextResponse.json(
        { error: 'At least one column must be selected from each file' },
        { status: 400 }
      )
    }

    // Parse fuzzy matching parameters
    const enableFuzzyMatching = enableFuzzyMatchingStr === 'true'
    const similarityThreshold = similarityThresholdStr ? parseInt(similarityThresholdStr, 10) : 85

    // Validate similarity threshold if fuzzy matching is enabled
    if (enableFuzzyMatching && (similarityThreshold < 0 || similarityThreshold > 100)) {
      return NextResponse.json(
        { error: 'Similarity threshold must be between 0 and 100' },
        { status: 400 }
      )
    }

    // Use job ID from frontend or generate new one
    const jobId = jobIdStr || uuidv4()
    console.log('[Compare API] Job ID:', jobId)

    // Initialize job in progress service via HTTP
    await notifyProgressService('initialize-job', { jobId })
    console.log('[Compare API] Emitted initialize-job for:', jobId)

    // Read file buffers
    const masterBuffer = Buffer.from(await masterFile.arrayBuffer())
    const secondaryBuffer = Buffer.from(await secondaryFile.arrayBuffer())

    // Perform comparison with progress tracking
    const result = await compareExcelFiles(masterBuffer, secondaryBuffer, {
      masterColumns,
      secondaryColumns,
      enableFuzzyMatching,
      similarityThreshold,
      caseSensitive: false,
      trimWhitespace: true,
      onProgress: (progress) => {
        console.log('[Compare API] Progress:', progress.stage, progress.current, progress.total)
        notifyProgressService('update-progress', {
          jobId,
          stage: progress.stage,
          current: progress.current,
          total: progress.total,
          message: progress.message
        })
      }
    })

    // Mark job as complete
    console.log('[Compare API] Marking job as complete:', jobId)
    await notifyProgressService('complete-job', { jobId })

    // Save comparison to database
    const [comparison] = await db.insert(comparisons).values({
      masterFile: masterFile.name,
      secondaryFile: secondaryFile.name,
      totalRows: result.totalRows,
      matchedRows: result.matchedRows,
      unmatchedRows: result.unmatchedRows,
      masterData: JSON.stringify(result.masterData),
      secondaryData: JSON.stringify(result.secondaryData),
      comparisonData: JSON.stringify(result.comparisonData),
      masterColumns: JSON.stringify(masterColumns),
      secondaryColumns: JSON.stringify(secondaryColumns),
      comparisonMethod: result.comparisonMethod,
      similarityThreshold: result.similarityThreshold
    }).returning()

    // Return result summary
    return NextResponse.json({
      id: comparison.id,
      masterFile: masterFile.name,
      secondaryFile: secondaryFile.name,
      masterColumns,
      secondaryColumns,
      totalRows: result.totalRows,
      matchedRows: result.matchedRows,
      unmatchedRows: result.unmatchedRows,
      comparisonMethod: result.comparisonMethod,
      similarityThreshold: result.similarityThreshold
    })
  } catch (error) {
    console.error('Error comparing files:', error)

    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
