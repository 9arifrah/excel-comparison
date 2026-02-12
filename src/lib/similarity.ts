/**
 * Similarity Algorithms for Fuzzy Matching
 * Implements Jaro-Winkler and phonetic indexing for optimized comparison
 */

/**
 * Jaro-Winkler Similarity Algorithm
 * Optimized for comparing names and strings that may have typos
 * 
 * @param s1 - First string
 * @param s2 - Second string
 * @returns Similarity score between 0 and 1
 */
export function jaroWinklerSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0
  if (s1 === s2) return 1

  // Normalize strings
  const str1 = s1.trim().toLowerCase()
  const str2 = s2.trim().toLowerCase()

  if (str1 === str2) return 1

  const len1 = str1.length
  const len2 = str2.length

  // Calculate match distance
  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1
  if (matchDistance < 0) return 0

  const str1Matches = new Array(len1).fill(false)
  const str2Matches = new Array(len2).fill(false)

  let matches = 0
  let transpositions = 0

  // Find matching characters
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance)
    const end = Math.min(i + matchDistance + 1, len2)

    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue
      str1Matches[i] = true
      str2Matches[j] = true
      matches++
      break
    }
  }

  if (matches === 0) return 0

  // Count transpositions
  let k = 0
  for (let i = 0; i < len1; i++) {
    if (!str1Matches[i]) continue
    while (!str2Matches[k]) k++
    if (str1[i] !== str2[k]) transpositions++
    k++
  }

  // Calculate Jaro similarity
  const jaro = (
    (matches / len1) +
    (matches / len2) +
    ((matches - transpositions / 2) / matches)
  ) / 3

  // Calculate Jaro-Winkler similarity
  // Give more weight to common prefix
  let prefixLength = 0
  const maxPrefixLength = Math.min(4, len1, len2)
  while (prefixLength < maxPrefixLength && str1[prefixLength] === str2[prefixLength]) {
    prefixLength++
  }

  const scalingFactor = 0.1
  const jaroWinkler = jaro + (prefixLength * scalingFactor * (1 - jaro))

  return Math.min(1, jaroWinkler)
}

/**
 * Calculate average similarity across multiple fields
 * 
 * @param values1 - Array of values from first row
 * @param values2 - Array of values from second row (same length as values1)
 * @returns Average similarity score (0-100)
 */
export function calculateAverageSimilarity(
  values1: string[],
  values2: string[]
): number {
  if (values1.length !== values2.length) {
    throw new Error('Value arrays must have the same length')
  }

  if (values1.length === 0) return 0

  let totalSimilarity = 0

  for (let i = 0; i < values1.length; i++) {
    const similarity = jaroWinklerSimilarity(values1[i], values2[i])
    totalSimilarity += similarity
  }

  return (totalSimilarity / values1.length) * 100
}

/**
 * Calculate similarity for individual fields
 * 
 * @param values1 - Array of values from first row
 * @param values2 - Array of values from second row (same length as values1)
 * @returns Array of similarity scores (0-100) for each field
 */
export function calculateFieldSimilarities(
  values1: string[],
  values2: string[]
): number[] {
  if (values1.length !== values2.length) {
    throw new Error('Value arrays must have the same length')
  }

  return values1.map((value, index) => 
    jaroWinklerSimilarity(value, values2[index]) * 100
  )
}

/**
 * Generate Metaphone code for phonetic indexing
 * Simplified implementation that focuses on English phonetics
 * 
 * @param str - Input string
 * @returns Metaphone code
 */
export function metaphone(str: string): string {
  if (!str) return ''

  const s = str.trim().toUpperCase()
  let result = ''
  
  if (s.length === 0) return result

  let current = s
  
  // Apply metaphone rules in order
  current = current.replace(/^KN/, 'N')
  current = current.replace(/^GN/, 'N')
  current = current.replace(/^PN/, 'N')
  current = current.replace(/^WR/, 'R')
  current = current.replace(/^WH/, 'W')
  current = current.replace(/X/g, 'K')
  current = current.replace(/Q/g, 'K')
  current = current.replace(/C([EIY])/g, 'S$1')
  current = current.replace(/CH/g, 'X')
  current = current.replace(/C/g, 'K')
  current = current.replace(/DGE/g, 'J')
  current = current.replace(/DGI/g, 'J')
  current = current.replace(/DGY/g, 'J')
  current = current.replace(/PH/g, 'F')
  current = current.replace(/H([^AEIOU])/g, '$1')
  current = current.replace(/K/g, 'K')
  current = current.replace(/G([^EY])/g, 'K$1')
  current = current.replace(/S([IO])/g, 'X$1')
  current = current.replace(/SH/g, 'X')
  current = current.replace(/T([IO])/g, 'X$1')
  current = current.replace(/TH/g, '0')
  current = current.replace(/V/g, 'F')
  current = current.replace(/Y([AEIOU])/g, 'Y$1')
  current = current.replace(/Z/g, 'S')

  // Remove duplicates and vowels (except first character)
  let previous = ''
  for (let i = 0; i < current.length; i++) {
    const char = current[i]
    if (char !== previous && (i === 0 || !'AEIOU'.includes(char))) {
      result += char
    }
    previous = char
  }

  return result
}

/**
 * Generate Soundex code for phonetic indexing
 * 
 * @param str - Input string
 * @returns Soundex code (4 characters)
 */
export function soundex(str: string): string {
  if (!str) return ''

  const s = str.trim().toUpperCase()
  if (s.length === 0) return '0000'

  const codes: { [key: string]: string } = {
    'B': '1', 'F': '1', 'P': '1', 'V': '1',
    'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
    'D': '3', 'T': '3',
    'L': '4',
    'M': '5', 'N': '5',
    'R': '6'
  }

  // Keep first letter
  let result = s[0]
  
  // Convert to soundex codes
  let previousCode = codes[s[0]] || ''
  for (let i = 1; i < s.length; i++) {
    const char = s[i]
    const code = codes[char] || ''
    
    // Skip if same as previous code or no code (vowels, h, w, y)
    if (code === previousCode || code === '') continue
    
    result += code
    previousCode = code
  }

  // Pad or truncate to 4 characters
  result = result.padEnd(4, '0').substring(0, 4)
  
  return result
}

/**
 * Generate phonetic keys for a row based on selected columns
 * Uses both Metaphone and Soundex for better coverage
 * 
 * @param row - Data row object
 * @param columns - Array of column names to index
 * @returns Array of phonetic keys
 */
export function generatePhoneticKeys(
  row: any,
  columns: string[]
): { metaphone: string, soundex: string } {
  const values = columns.map(col => String(row[col] || ''))
  const joined = values.join(' ')
  
  return {
    metaphone: metaphone(joined),
    soundex: soundex(joined)
  }
}

/**
 * Generate combined hash key using phonetic indexing
 * This allows efficient pre-filtering before full similarity calculation
 * 
 * @param row - Data row object
 * @param columns - Array of column names
 * @returns Hash key for indexing
 */
export function generatePhoneticHashKey(
  row: any,
  columns: string[]
): string {
  const phonetic = generatePhoneticKeys(row, columns)
  return `${phonetic.metaphone}|${phonetic.soundex}`
}