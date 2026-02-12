import * as XLSX from 'xlsx'
import {
  jaroWinklerSimilarity,
  calculateAverageSimilarity,
  calculateFieldSimilarities,
  generatePhoneticHashKey
} from './similarity'

export interface CompareOptions {
  masterColumns: string[]
  secondaryColumns: string[]
  enableFuzzyMatching?: boolean
  similarityThreshold?: number
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
    similarityScore?: number
    columnSimilarities?: { [key: string]: number }
    data: any
  }>
  totalRows: number
  matchedRows: number
  unmatchedRows: number
  comparisonMethod: 'exact' | 'fuzzy'
  similarityThreshold?: number
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
    enableFuzzyMatching = false,
    similarityThreshold = 85,
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

  // Use fuzzy matching or exact match based on option
  if (enableFuzzyMatching) {
    return performFuzzyComparison(
      masterData,
      secondaryData,
      masterColumns,
      secondaryColumns,
      similarityThreshold,
      onProgress
    )
  } else {
    return performExactComparison(
      masterData,
      secondaryData,
      masterColumns,
      secondaryColumns,
      caseSensitive,
      trimWhitespace,
      onProgress
    )
  }
}

/**
 * Perform exact match comparison using hash-based indexing
 */
function performExactComparison(
  masterData: any[],
  secondaryData: any[],
  masterColumns: string[],
  secondaryColumns: string[],
  caseSensitive: boolean,
  trimWhitespace: boolean,
  onProgress?: (progress: ProgressInfo) => void
): ComparisonResult {
  // Stage 3: Build hash index for master data
  onProgress?.({
    stage: 'building-index',
    current: 30,
    total: 100,
    message: `Building hash index for ${masterData.length} master rows...`
  })

  const masterIndex = new Map<string, any>()
  const chunkSize = 10000

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
        message: `Comparing: ${i}/${secondaryData.length} rows processed...`
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
    totalRows: secondaryData.length,
    matchedRows,
    unmatchedRows,
    comparisonMethod: 'exact'
  }
}

/**
 * Perform fuzzy matching using Jaro-Winkler similarity with phonetic indexing
 * Optimized with phonetic pre-filtering to reduce comparison complexity
 */
function performFuzzyComparison(
  masterData: any[],
  secondaryData: any[],
  masterColumns: string[],
  secondaryColumns: string[],
  similarityThreshold: number,
  onProgress?: (progress: ProgressInfo) => void
): ComparisonResult {
  // Stage 3: Build phonetic index for master data
  onProgress?.({
    stage: 'building-index',
    current: 30,
    total: 100,
    message: `Building phonetic index for ${masterData.length} master rows...`
  })

  const phoneticIndex = new Map<string, any[]>()
  const chunkSize = 10000

  for (let i = 0; i < masterData.length; i++) {
    const row = masterData[i]
    const phoneticKey = generatePhoneticHashKey(row, masterColumns)
    
    if (!phoneticIndex.has(phoneticKey)) {
      phoneticIndex.set(phoneticKey, [])
    }
    phoneticIndex.get(phoneticKey)!.push(row)

    // Report progress every chunk
    if (i % chunkSize === 0) {
      const progress = 30 + Math.floor((i / masterData.length) * 20)
      onProgress?.({
        stage: 'building-index',
        current: progress,
        total: 100,
        message: `Building phonetic index: ${i}/${masterData.length} rows processed...`
      })
    }
  }

  // Stage 4: Perform fuzzy matching
  onProgress?.({
    stage: 'comparing',
    current: 50,
    total: 100,
    message: 'Performing fuzzy matching...'
  })

  const comparisonData: Array<{
    row: number
    matched: boolean
    similarityScore?: number
    columnSimilarities?: { [key: string]: number }
    data: any
  }> = []

  let matchedRows = 0
  let unmatchedRows = 0

  for (let i = 0; i < secondaryData.length; i++) {
    const secondaryRow = secondaryData[i]
    const secondaryPhoneticKey = generatePhoneticHashKey(secondaryRow, secondaryColumns)
    
    // Get candidate matches from phonetic index
    const candidates = phoneticIndex.get(secondaryPhoneticKey) || []
    
    let bestMatch: any = null
    let bestSimilarityScore = 0
    let bestColumnSimilarities: { [key: string]: number } = {}

    // Extract values from secondary row
    const secondaryValues = secondaryColumns.map(col => String(secondaryRow[col] || ''))

    if (candidates.length > 0) {
      // Compare with candidates to find best match
      for (const candidate of candidates) {
        const masterValues = masterColumns.map(col => String(candidate[col] || ''))
        
        // Calculate average similarity
        const avgSimilarity = calculateAverageSimilarity(masterValues, secondaryValues)
        
        if (avgSimilarity > bestSimilarityScore) {
          bestSimilarityScore = avgSimilarity
          bestMatch = candidate
          
          // Calculate per-column similarities
          const fieldSimilarities = calculateFieldSimilarities(masterValues, secondaryValues)
          bestColumnSimilarities = {}
          masterColumns.forEach((col, idx) => {
            bestColumnSimilarities[col] = fieldSimilarities[idx]
          })
        }
      }
    } else {
      // No candidates in phonetic index, try with some variations
      // This is a fallback for cases that don't match phonetically
      // We only check a random sample of master data to maintain performance
      const sampleSize = Math.min(100, masterData.length)
      const step = Math.floor(masterData.length / sampleSize)
      
      for (let j = 0; j < masterData.length && j < sampleSize * step; j += step) {
        const candidate = masterData[j]
        const masterValues = masterColumns.map(col => String(candidate[col] || ''))
        const avgSimilarity = calculateAverageSimilarity(masterValues, secondaryValues)
        
        if (avgSimilarity > bestSimilarityScore) {
          bestSimilarityScore = avgSimilarity
          bestMatch = candidate
          
          const fieldSimilarities = calculateFieldSimilarities(masterValues, secondaryValues)
          bestColumnSimilarities = {}
          masterColumns.forEach((col, idx) => {
            bestColumnSimilarities[col] = fieldSimilarities[idx]
          })
        }
      }
    }

    const isMatched = bestSimilarityScore >= similarityThreshold

    if (isMatched) {
      matchedRows++
    } else {
      unmatchedRows++
    }

    comparisonData.push({
      row: i + 1,
      matched: isMatched,
      similarityScore: bestSimilarityScore,
      columnSimilarities: bestColumnSimilarities,
      data: secondaryRow
    })

    // Report progress every chunk
    if (i % chunkSize === 0) {
      const progress = 50 + Math.floor((i / secondaryData.length) * 50)
      onProgress?.({
        stage: 'comparing',
        current: progress,
        total: 100,
        message: `Fuzzy matching: ${i}/${secondaryData.length} rows processed...`
      })
    }
  }

  // Stage 5: Complete
  onProgress?.({
    stage: 'complete',
    current: 100,
    total: 100,
    message: 'Fuzzy matching complete!'
  })

  return {
    masterData,
    secondaryData,
    comparisonData,
    totalRows: secondaryData.length,
    matchedRows,
    unmatchedRows,
    comparisonMethod: 'fuzzy',
    similarityThreshold
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
  const columns = allData.length > 0 && typeof allData[0] === 'object' && allData[0] !== null 
    ? Object.keys(allData[0]) 
    : []

  return {
    type,
    totalRows,
    columns,
    sampleData
  }
}
