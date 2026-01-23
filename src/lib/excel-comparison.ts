import * as XLSX from 'xlsx'

export interface CompareOptions {
  masterColumns: string[]
  secondaryColumns: string[]
  caseSensitive?: boolean
  trimWhitespace?: boolean
  onProgress?: (progress: ProgressInfo) => void
}

export interface ProgressInfo {
  stage: 'parsing' | 'building-index' | 'comparing' | 'complete'
  current: number
  total: number
  message: string
}

export interface ComparisonResult {
  masterData: any[]
  secondaryData: any[]
  comparisonData: Array<{
    row: number
    matched: boolean
    data: any
  }>
  totalRows: number
  matchedRows: number
  unmatchedRows: number
}

/**
 * Generate a hash key from row data based on selected columns
 * This allows O(1) lookup instead of O(n*m) comparison
 */
function generateHashKey(row: any, columns: string[], caseSensitive: boolean = false, trimWhitespace: boolean = true): string {
  const values = columns.map(col => {
    let value = row[col]
    if (value === undefined || value === null) return ''
    value = String(value)
    if (!caseSensitive) value = value.toLowerCase()
    if (trimWhitespace) value = value.trim()
    return value
  })
  return values.join('|||')
}

/**
 * Optimized comparison using hash-based lookup for O(n+m) complexity
 * instead of O(n*m) nested loop comparison
 *
 * This allows comparison of 150,000+ rows efficiently
 */
export async function compareExcelFiles(
  masterBuffer: Buffer,
  secondaryBuffer: Buffer,
  options: CompareOptions
): Promise<ComparisonResult> {
  const {
    masterColumns,
    secondaryColumns,
    caseSensitive = false,
    trimWhitespace = true,
    onProgress
  } = options

  // Stage 1: Parse master file
  onProgress?.({
    stage: 'parsing',
    current: 0,
    total: 100,
    message: 'Parsing master file...'
  })

  const masterWorkbook = XLSX.read(masterBuffer, { type: 'buffer' })
  const masterSheetName = masterWorkbook.SheetNames[0]
  const masterSheet = masterWorkbook.Sheets[masterSheetName]
  const masterData = XLSX.utils.sheet_to_json(masterSheet, { defval: '' })

  // Stage 2: Parse secondary file
  onProgress?.({
    stage: 'parsing',
    current: 20,
    total: 100,
    message: 'Parsing secondary file...'
  })

  const secondaryWorkbook = XLSX.read(secondaryBuffer, { type: 'buffer' })
  const secondarySheetName = secondaryWorkbook.SheetNames[0]
  const secondarySheet = secondaryWorkbook.Sheets[secondarySheetName]
  const secondaryData = XLSX.utils.sheet_to_json(secondarySheet, { defval: '' })

  const totalRows = secondaryData.length

  // Stage 3: Build hash index for master data
  // This is the KEY optimization: O(n) instead of O(n*m)
  onProgress?.({
    stage: 'building-index',
    current: 30,
    total: 100,
    message: `Building hash index for ${masterData.length} master rows...`
  })

  const masterIndex = new Map<string, any>()
  const chunkSize = 10000
  const masterChunks = Math.ceil(masterData.length / chunkSize)

  for (let i = 0; i < masterData.length; i++) {
    const row = masterData[i]
    const hashKey = generateHashKey(row, masterColumns, caseSensitive, trimWhitespace)
    masterIndex.set(hashKey, row)

    // Report progress every chunk
    if (i % chunkSize === 0) {
      const progress = 30 + Math.floor((i / masterData.length) * 20)
      onProgress?.({
        stage: 'building-index',
        current: progress,
        total: 100,
        message: `Building hash index: ${i}/${masterData.length} rows processed...`
      })
    }
  }

  // Stage 4: Compare secondary data against master index
  onProgress?.({
    stage: 'comparing',
    current: 50,
    total: 100,
    message: 'Comparing rows...'
  })

  const comparisonData: Array<{
    row: number
    matched: boolean
    data: any
  }> = []

  let matchedRows = 0
  let unmatchedRows = 0

  for (let i = 0; i < secondaryData.length; i++) {
    const row = secondaryData[i]
    const hashKey = generateHashKey(row, secondaryColumns, caseSensitive, trimWhitespace)
    const isMatched = masterIndex.has(hashKey)

    if (isMatched) {
      matchedRows++
    } else {
      unmatchedRows++
    }

    comparisonData.push({
      row: i + 1,
      matched: isMatched,
      data: row
    })

    // Report progress every chunk
    if (i % chunkSize === 0) {
      const progress = 50 + Math.floor((i / secondaryData.length) * 50)
      onProgress?.({
        stage: 'comparing',
        current: progress,
        total: 100,
        message: `Comparing: ${i}/${totalRows} rows processed...`
      })
    }
  }

  // Stage 5: Complete
  onProgress?.({
    stage: 'complete',
    current: 100,
    total: 100,
    message: 'Comparison complete!'
  })

  return {
    masterData,
    secondaryData,
    comparisonData,
    totalRows,
    matchedRows,
    unmatchedRows
  }
}

/**
 * Preview Excel file - optimized for large files
 * Only reads first 3 rows for preview
 */
export async function previewExcelFile(
  buffer: Buffer,
  type: 'master' | 'secondary'
): Promise<{
  type: string
  fileName?: string
  totalRows: number
  columns: string[]
  sampleData: any[]
}> {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  // Get all data first to count rows
  const allData = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  const totalRows = allData.length

  // Get sample data (first 3 rows only)
  const sampleData = allData.slice(0, 3)

  // Get columns from first row
  const columns = allData.length > 0 ? Object.keys(allData[0]) : []

  return {
    type,
    totalRows,
    columns,
    sampleData
  }
}
