# Jaccard Similarity Fuzzy Matching Feature Design

**Date:** 2026-03-16
**Author:** Claude
**Status:** Approved (Round 3) - Ready for Implementation

## Overview

Add Jaccard Similarity algorithm as a new fuzzy matching option alongside the existing Jaro-Winkler algorithm. Users can select between the two algorithms through a two-step UI flow in the Matching Settings.

## Requirements

### Functional Requirements

1. **Two-Step Selection:**
   - Step 1: Toggle between Exact Match vs Fuzzy Matching
   - Step 2: When fuzzy matching is enabled, choose algorithm (Jaro-Winkler vs Jaccard)

2. **Default Algorithm:** Jaro-Winkler (for backward compatibility)

3. **Shared Threshold:** Single similarity threshold slider (0-100%) applies to both algorithms

4. **Algorithm Labels:** Display both algorithm name and description:
   - "Jaro-Winkler" - "Character-based (Best for names/typos)"
   - "Jaccard Similarity" - "Word-based (Best for phrases/lists)"

### Non-Functional Requirements

- Backward compatibility with existing comparisons
- Performance optimization for large files (150,000+ rows)
- Clear user feedback on algorithm selection
- Proper error handling for edge cases

## Algorithm Comparison

| Aspect | Jaro-Winkler | Jaccard Similarity |
|--------|--------------|-------------------|
| **Basis** | Character-based | Word/set-based |
| **Best For** | Names, typos, transpositions | Phrases, word order variations |
| **Example** | "Smith" vs "Smtih" = High | "John Smith" vs "Smith John" = Perfect |
| **Complexity** | O(n²) where n = string length | O(n + m + w) where n,m = word counts, w = total words |
| **Empty Behavior** | Returns 0 (no match) | Returns 0 (no meaningful content to compare) |

## Architecture

### Backend Changes

#### 1. Similarity Module (`src/lib/similarity.ts`)

**New Function:**
```typescript
export function jaccardSimilarity(s1: string, s2: string): number {
  // Consistent with jaroWinklerSimilarity: check for falsy/empty strings
  if (!s1 || !s2) return 0
  if (s1 === s2) return 1

  // Normalize: trim and lowercase (consistent with existing pattern)
  const str1 = s1.trim().toLowerCase()
  const str2 = s2.trim().toLowerCase()

  if (str1 === str2) return 1

  // Tokenize into words
  const words1 = new Set(str1.split(/\s+/).filter(w => w))
  const words2 = new Set(str2.split(/\s+/).filter(w => w))

  // Handle empty sets after splitting
  if (words1.size === 0 || words2.size === 0) return 0

  // Calculate Jaccard index: |intersection| / |union|
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])

  return intersection.size / union.size
}
```

**Updated Function:**
```typescript
export function calculateAverageSimilarity(
  values1: string[],
  values2: string[],
  algorithm: 'jaro-winkler' | 'jaccard' = 'jaro-winkler'
): number {
  if (values1.length !== values2.length) {
    throw new Error('Value arrays must have the same length')
  }

  if (values1.length === 0) return 0

  let totalSimilarity = 0

  for (let i = 0; i < values1.length; i++) {
    const similarity = algorithm === 'jaccard'
      ? jaccardSimilarity(values1[i], values2[i])
      : jaroWinklerSimilarity(values1[i], values2[i])
    totalSimilarity += similarity
  }

  return (totalSimilarity / values1.length) * 100
}
```

**Also Updated Function:**
```typescript
export function calculateFieldSimilarities(
  values1: string[],
  values2: string[],
  algorithm: 'jaro-winkler' | 'jaccard' = 'jaro-winkler'
): number[] {
  if (values1.length !== values2.length) {
    throw new Error('Value arrays must have the same length')
  }

  return values1.map((value, index) =>
    (algorithm === 'jaccard'
      ? jaccardSimilarity(value, values2[index])
      : jaroWinklerSimilarity(value, values2[index])
    ) * 100
  )
}
```

#### 2. Comparison Options (`src/lib/excel-comparison.ts`)

**Extended Interface:**
```typescript
export interface CompareOptions {
  masterColumns: string[]
  secondaryColumns: string[]
  enableFuzzyMatching?: boolean
  fuzzyAlgorithm?: 'jaro-winkler' | 'jaccard'  // NEW
  similarityThreshold?: number
  caseSensitive?: boolean
  trimWhitespace?: boolean
  onProgress?: (progress: ProgressInfo) => void
}
```

**Updated Result Interface:**
```typescript
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
  fuzzyAlgorithm?: 'jaro-winkler' | 'jaccard'  // NEW
  similarityThreshold?: number
}
```

**Implementation:**
```typescript
export async function compareExcelFiles(
  masterBuffer: Buffer,
  secondaryBuffer: Buffer,
  options: CompareOptions
): Promise<ComparisonResult> {
  const {
    masterColumns,
    secondaryColumns,
    enableFuzzyMatching = false,
    fuzzyAlgorithm = 'jaro-winkler',  // NEW with default
    similarityThreshold = 85,
    caseSensitive = false,
    trimWhitespace = true,
    onProgress
  } = options

  // ... existing parsing logic

  // When fuzzy matching is enabled, use selected algorithm
  if (enableFuzzyMatching) {
    // Use fuzzyAlgorithm parameter in similarity calculations
    const similarity = calculateAverageSimilarity(
      masterValues,
      secondaryValues,
      fuzzyAlgorithm  // Pass algorithm selection
    )

    // Calculate per-field similarities with algorithm selection
    const columnSimilarities = calculateFieldSimilarities(
      masterValues,
      secondaryValues,
      fuzzyAlgorithm  // Pass algorithm selection
    )
  }

  // ... rest of comparison logic

  return {
    // ... existing fields
    fuzzyAlgorithm: enableFuzzyMatching ? fuzzyAlgorithm : undefined
  }
}
```

### Database Changes

#### Schema Migration (`drizzle/0002_add_fuzzy_algorithm.sql`)

```sql
-- Add fuzzy_algorithm column to comparisons table
ALTER TABLE comparisons
ADD COLUMN fuzzy_algorithm VARCHAR(20)
DEFAULT 'jaro-winkler'
CHECK (fuzzy_algorithm IN ('jaro-winkler', 'jaccard'));

COMMENT ON COLUMN comparisons.fuzzy_algorithm IS
'Fuzzy matching algorithm used: jaro-winkler or jaccard';
```

**Rollback Migration:**
```sql
-- Rollback: Remove fuzzy_algorithm column
ALTER TABLE comparisons DROP COLUMN IF EXISTS fuzzy_algorithm;
```

#### Drizzle Schema (`src/lib/db/schema.ts`)

```typescript
export const comparisons = pgTable('comparisons', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  masterFile: text('master_file').notNull(),
  secondaryFile: text('secondary_file').notNull(),
  totalRows: integer('total_rows').notNull(),
  matchedRows: integer('matched_rows').notNull(),
  unmatchedRows: integer('unmatched_rows').notNull(),
  masterData: text('master_data').notNull(),
  secondaryData: text('secondary_data').notNull(),
  comparisonData: text('comparison_data').notNull(),
  masterColumns: text('master_columns'),
  secondaryColumns: text('secondary_columns'),
  comparisonMethod: text('comparison_method').notNull().default('exact'),
  fuzzyAlgorithm: text('fuzzy_algorithm').default('jaro-winkler'),  // NEW
  similarityThreshold: integer('similarity_threshold'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  createdAtIndex: index('comparisons_created_at_idx').on(table.createdAt),
  masterFileIndex: index('comparisons_master_file_idx').on(table.masterFile),
  secondaryFileIndex: index('comparisons_secondary_file_idx').on(table.secondaryFile),
  comparisonMethodIndex: index('comparisons_comparison_method_idx').on(table.comparisonMethod),
}))
```

### Frontend Changes

#### Matching Settings UI (`src/app/compare/new/page.tsx`)

**New State:**
```typescript
const [fuzzyAlgorithm, setFuzzyAlgorithm] = useState<'jaro-winkler' | 'jaccard'>('jaro-winkler')
```

**Algorithm Selector Component:**
```tsx
{/* Fuzzy Algorithm Selection - Only show when fuzzy matching is enabled */}
{enableFuzzyMatching && (
  <div className="space-y-3 p-6 bg-white/50 dark:bg-slate-800/50 rounded-xl border-2 border-purple-200/50 dark:border-purple-700/50">
    <Label className="text-lg font-bold flex items-center gap-2">
      <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      Fuzzy Matching Algorithm
    </Label>

    {/* Radio Buttons */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Jaro-Winkler Option */}
      <button
        onClick={() => setFuzzyAlgorithm('jaro-winkler')}
        className={`p-4 rounded-xl border-2 text-left transition-all ${
          fuzzyAlgorithm === 'jaro-winkler'
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600'
        }`}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            fuzzyAlgorithm === 'jaro-winkler' ? 'border-purple-500' : 'border-slate-300 dark:border-slate-600'
          }`}>
            {fuzzyAlgorithm === 'jaro-winkler' && <div className="w-3 h-3 rounded-full bg-purple-500" />}
          </div>
          <span className="font-bold text-slate-700 dark:text-slate-300">Jaro-Winkler</span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 pl-8">
          Character-based (Best for names/typos)
        </p>
      </button>

      {/* Jaccard Option */}
      <button
        onClick={() => setFuzzyAlgorithm('jaccard')}
        className={`p-4 rounded-xl border-2 text-left transition-all ${
          fuzzyAlgorithm === 'jaccard'
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600'
        }`}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            fuzzyAlgorithm === 'jaccard' ? 'border-purple-500' : 'border-slate-300 dark:border-slate-600'
          }`}>
            {fuzzyAlgorithm === 'jaccard' && <div className="w-3 h-3 rounded-full bg-purple-500" />}
          </div>
          <span className="font-bold text-slate-700 dark:text-slate-300">Jaccard Similarity</span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 pl-8">
          Word-based (Best for phrases/lists)
        </p>
      </button>
    </div>
  </div>
)}
```

**Form Submission:**
```typescript
formData.append('fuzzyAlgorithm', fuzzyAlgorithm)
```

#### History Display (`src/app/history/page.tsx`)

```typescript
interface HistoryItem {
  // ... existing fields
  fuzzyAlgorithm?: 'jaro-winkler' | 'jaccard'  // NEW
}

// Display algorithm badge (shows both algorithm and threshold)
{item.comparisonMethod === 'fuzzy' && (
  <Badge className="bg-purple-500 text-white">
    Fuzzy ({item.fuzzyAlgorithm === 'jaccard' ? 'Jaccard' : 'Jaro-Winkler'}, {item.similarityThreshold}%)
  </Badge>
)}
```

### API Changes

#### Compare Route (`src/app/api/compare/route.ts`)

```typescript
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const fuzzyAlgorithmStr = formData.get('fuzzyAlgorithm') as string | null

    // Validate fuzzy algorithm
    const validAlgorithms = ['jaro-winkler', 'jaccard']
    const fuzzyAlgorithm = fuzzyAlgorithmStr && validAlgorithms.includes(fuzzyAlgorithmStr)
      ? fuzzyAlgorithmStr as 'jaro-winkler' | 'jaccard'
      : 'jaro-winkler'  // Default

    // Pass to comparison function
    const result = await compareExcelFiles(masterBuffer, secondaryBuffer, {
      // ... other options
      fuzzyAlgorithm
    })

    // Return result with fuzzyAlgorithm included
    // NOTE: Also adding comparisonMethod to API response (not currently returned)
    return NextResponse.json({
      id: comparison.id,
      masterFile: masterFile.name,
      secondaryFile: secondaryFile.name,
      masterColumns,
      secondaryColumns,
      totalRows: result.totalRows,
      matchedRows: result.matchedRows,
      unmatchedRows: result.unmatchedRows,
      comparisonMethod: result.comparisonMethod,   // ADD (currently not returned)
      fuzzyAlgorithm: result.fuzzyAlgorithm,       // NEW
      similarityThreshold: result.similarityThreshold
    })
  } catch (error) {
    // ... error handling
  }
}
```

#### History Route (`src/app/api/history/route.ts`)

**Current Issue:** The history API route doesn't fetch `comparisonMethod`, `similarityThreshold`, or the new `fuzzyAlgorithm` fields from the database.

**Required Update:**

```typescript
import { desc } from 'drizzle-orm'

export async function GET() {
  try {
    const result = await db
      .select({
        id: comparisons.id,
        masterFile: comparisons.masterFile,
        secondaryFile: comparisons.secondaryFile,
        totalRows: comparisons.totalRows,
        matchedRows: comparisons.matchedRows,
        unmatchedRows: comparisons.unmatchedRows,
        createdAt: comparisons.createdAt,
        comparisonMethod: comparisons.comparisonMethod,      // ADD
        fuzzyAlgorithm: comparisons.fuzzyAlgorithm,          // NEW
        similarityThreshold: comparisons.similarityThreshold  // ADD
      })
      .from(comparisons)
      .orderBy(desc(comparisons.createdAt))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Note:** The current history page hardcodes `comparisonMethod: 'exact'` as a temporary workaround. This update will fix that.

### Error Handling

**Edge Cases:**

1. **Empty strings:** Return 0 similarity (intentional - empty strings have no meaningful content for fuzzy matching)
2. **Exact matches:** Return 1.0 similarity
3. **Special characters/Unicode:** Normalize strings before comparison
4. **Multiple spaces/whitespace:** Trim and normalize
5. **Missing column data:** Treat as empty string

**Validation:**

```typescript
// API validation
if (enableFuzzyMatching && fuzzyAlgorithmStr) {
  if (!validAlgorithms.includes(fuzzyAlgorithmStr)) {
    return NextResponse.json(
      { error: 'Invalid fuzzy matching algorithm' },
      { status: 400 }
    )
  }
}
```

### Testing Strategy

#### Unit Tests (`src/lib/__tests__/similarity.test.ts`)

```typescript
describe('Jaccard Similarity', () => {
  it('should return 1.0 for identical strings', () => {
    expect(jaccardSimilarity('hello world', 'hello world')).toBe(1.0)
  })

  it('should handle word order variations', () => {
    expect(jaccardSimilarity('John Smith', 'Smith John')).toBe(1.0)
  })

  it('should handle partial matches', () => {
    expect(jaccardSimilarity('John Smith', 'John Doe')).toBe(0.5)
  })

  it('should handle empty strings', () => {
    expect(jaccardSimilarity('', 'test')).toBe(0)
  })

  it('should handle multiple spaces', () => {
    expect(jaccardSimilarity('hello  world', 'hello world')).toBe(1.0)
  })
})

describe('Algorithm Selection', () => {
  it('should use Jaro-Winkler by default', () => {
    const result = calculateAverageSimilarity(['test'], ['tets'])
    expect(result).toBeGreaterThan(0.8)
  })

  it('should use Jaccard when specified', () => {
    const result = calculateAverageSimilarity(['hello world'], ['world hello'], 'jaccard')
    expect(result).toBe(100)
  })
})
```

#### Manual Testing Checklist

- [ ] Toggle fuzzy matching on/off
- [ ] Switch between Jaro-Winkler and Jaccard
- [ ] Verify threshold slider affects both algorithms
- [ ] Test with names (Jaro-Winkler should perform better)
- [ ] Test with phrases (Jaccard should perform better)
- [ ] Verify history shows correct algorithm badge
- [ ] Test API with invalid algorithm value

## Performance Considerations

**Memory Impact:**
- Jaccard creates 4 Set objects per comparison (words1, words2, intersection, union)
- For 150,000+ rows with multiple fields, this may increase GC pressure
- Consider reusing Set objects where possible

**Performance Notes:**
- Jaccard is generally faster than Jaro-Winkler for longer strings (O(n+m) vs O(n²))
- Set operations in JavaScript are highly optimized (V8 engine)
- For very large datasets, consider batching to reduce memory overhead

**Benchmarking Targets:**
- Process 150,000 rows in under 30 seconds with Jaccard
- Memory usage should not exceed 2x baseline (Jaro-Winkler)

## Implementation Order

1. **Backend**
   - Add `jaccardSimilarity()` function to `similarity.ts`
   - Update `calculateAverageSimilarity()` to accept algorithm parameter
   - Update `calculateFieldSimilarities()` to accept algorithm parameter
   - Extend `CompareOptions` and `ComparisonResult` interfaces
   - Update `compareExcelFiles()` to use selected algorithm
   - Update compare API route to accept and validate `fuzzyAlgorithm`
   - Update compare API response to include `comparisonMethod` and `fuzzyAlgorithm`
   - **IMPORTANT:** Update history API route to fetch `comparisonMethod`, `fuzzyAlgorithm`, and `similarityThreshold`

2. **Database**
   - Create migration file `0002_add_fuzzy_algorithm.sql`
   - Run migration to add `fuzzy_algorithm` column
   - Update Drizzle schema

3. **Frontend**
   - Add `fuzzyAlgorithm` state to new comparison page
   - Add algorithm selector UI component
   - Update form submission to include algorithm
   - Update history display to show algorithm badge

4. **Testing**
   - Write unit tests for Jaccard similarity
   - Write integration tests for algorithm selection
   - Perform manual testing

## Backward Compatibility

- Existing comparisons without `fuzzyAlgorithm` will default to 'jaro-winkler'
- No data migration needed (new column has default value)
- API accepts optional `fuzzyAlgorithm` parameter
- Frontend defaults to 'jaro-winkler' when not specified

## Future Considerations

- Add more similarity algorithms (Levenshtein, Cosine, etc.)
- Allow users to adjust algorithm-specific parameters
- Add hybrid approach (try multiple algorithms and use best result)
- Performance benchmarking for very large datasets
