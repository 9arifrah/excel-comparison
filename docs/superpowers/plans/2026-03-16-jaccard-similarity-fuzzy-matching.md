# Jaccard Similarity Fuzzy Matching Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Jaccard Similarity algorithm as a new fuzzy matching option alongside existing Jaro-Winkler, with two-step UI selection (Exact Match → Fuzzy → choose algorithm)

**Architecture:** Extend existing fuzzy matching infrastructure with algorithm parameter passed through comparison flow, new database column for storage, and radio button selector in UI

**Tech Stack:** TypeScript, Next.js 16, Drizzle ORM, PostgreSQL, XLSX library, shadcn/ui components

---

## File Structure

### Files to Modify

| File | Responsibility |
|------|---------------|
| `src/lib/similarity.ts` | Add `jaccardSimilarity()` function, update `calculateAverageSimilarity()` and `calculateFieldSimilarities()` to accept algorithm parameter |
| `src/lib/excel-comparison.ts` | Add `fuzzyAlgorithm` to `CompareOptions` interface, add to `ComparisonResult`, pass through comparison logic |
| `src/app/api/compare/route.ts` | Accept `fuzzyAlgorithm` parameter, validate, add to API response, also add `comparisonMethod` to response |
| `src/app/api/history/route.ts` | Fetch `comparisonMethod`, `fuzzyAlgorithm`, `similarityThreshold` from database |
| `src/lib/db/schema.ts` | Add `fuzzyAlgorithm` column to comparisons table schema |
| `src/app/compare/new/page.tsx` | Add `fuzzyAlgorithm` state, algorithm selector radio buttons, form submission |
| `src/app/history/page.tsx` | Add `fuzzyAlgorithm` to `HistoryItem` interface, update badge display |

### Files to Create

| File | Responsibility |
|------|---------------|
| `drizzle/0002_add_fuzzy_algorithm.sql` | Database migration to add `fuzzy_algorithm` column |
| `src/lib/__tests__/similarity.test.ts` | Unit tests for Jaccard similarity algorithm |

---

## Chunk 1: Backend - Similarity Algorithm Implementation

### Task 1: Add Jaccard Similarity Function

**Files:**
- Modify: `src/lib/similarity.ts`

- [ ] **Step 1: Write the failing test for Jaccard similarity**

First, create the test file. Run: `mkdir -p src/lib/__tests__`

Add to `src/lib/__tests__/similarity.test.ts`:
```typescript
import { jaccardSimilarity } from '../similarity'

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

  it('should return 0 for both empty strings', () => {
    expect(jaccardSimilarity('', '')).toBe(0)
  })

  it('should be case-insensitive', () => {
    expect(jaccardSimilarity('Hello World', 'hello world')).toBe(1.0)
  })

  it('should handle special characters', () => {
    expect(jaccardSimilarity('hello-world', 'hello world')).toBeCloseTo(0, 0.01)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/__tests__/similarity.test.ts`
Expected: FAIL with "jaccardSimilarity is not defined"

- [ ] **Step 3: Write minimal implementation**

Add to `src/lib/similarity.ts` after the existing functions:
```typescript
/**
 * Jaccard Similarity Algorithm
 * Word/set-based similarity for phrases and word order variations
 *
 * @param s1 - First string
 * @param s2 - Second string
 * @returns Similarity score between 0 and 1
 */
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/__tests__/similarity.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/similarity.ts src/lib/__tests__/similarity.test.ts
git commit -m "feat: add Jaccard similarity algorithm for fuzzy matching

- Add jaccardSimilarity() function to similarity.ts
- Word/set-based similarity for phrases and word order variations
- Consistent with existing jaroWinklerSimilarity patterns
- Add comprehensive unit tests

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### Task 2: Update calculateAverageSimilarity to Accept Algorithm Parameter

**Files:**
- Modify: `src/lib/similarity.ts:90-108`

- [ ] **Step 1: Write failing test for algorithm parameter**

Add to `src/lib/__tests__/similarity.test.ts`:
```typescript
import { calculateAverageSimilarity } from '../similarity'

describe('Algorithm Selection', () => {
  it('should use Jaro-Winkler by default', () => {
    const result = calculateAverageSimilarity(['test'], ['tets'])
    expect(result).toBeGreaterThan(0.8) // Jaro-Winkler handles typos well
  })

  it('should use Jaccard when specified', () => {
    const result = calculateAverageSimilarity(['hello world'], ['world hello'], 'jaccard')
    expect(result).toBe(100) // Jaccard returns perfect match for same words
  })

  it('should use Jaro-Winkler when specified', () => {
    const result = calculateAverageSimilarity(['test'], ['tets'], 'jaro-winkler')
    expect(result).toBeGreaterThan(0.8)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/__tests__/similarity.test.ts`
Expected: FAIL (function doesn't accept algorithm parameter yet)

- [ ] **Step 3: Update calculateAverageSimilarity function**

Find and replace the existing `calculateAverageSimilarity` function in `src/lib/similarity.ts` (around line 90-108):
```typescript
/**
 * Calculate average similarity across multiple fields
 *
 * @param values1 - Array of values from first row
 * @param values2 - Array of values from second row (same length as values1)
 * @param algorithm - Similarity algorithm to use ('jaro-winkler' | 'jaccard')
 * @returns Average similarity score (0-100)
 */
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/__tests__/similarity.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/similarity.ts src/lib/__tests__/similarity.test.ts
git commit -m "feat: add algorithm parameter to calculateAverageSimilarity

- Add optional algorithm parameter ('jaro-winkler' | 'jaccard')
- Default to 'jaro-winkler' for backward compatibility
- Pass algorithm to appropriate similarity function
- Add tests for algorithm selection

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### Task 3: Update calculateFieldSimilarities to Accept Algorithm Parameter

**Files:**
- Modify: `src/lib/similarity.ts:117-128`

- [ ] **Step 1: Write failing test for calculateFieldSimilarities with algorithm**

Add to `src/lib/__tests__/similarity.test.ts`:
```typescript
import { calculateFieldSimilarities } from '../similarity'

describe('Field Similarities with Algorithm', () => {
  it('should use Jaccard when specified', () => {
    const result = calculateFieldSimilarities(['hello world'], ['world hello'], 'jaccard')
    expect(result[0]).toBe(100)
  })

  it('should use Jaro-Winkler by default', () => {
    const result = calculateFieldSimilarities(['test'], ['tets'])
    expect(result[0]).toBeGreaterThan(80)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/__tests__/similarity.test.ts`
Expected: FAIL (function doesn't accept algorithm parameter yet)

- [ ] **Step 3: Update calculateFieldSimilarities function**

Find and replace the existing `calculateFieldSimilarities` function in `src/lib/similarity.ts` (around line 117-128):
```typescript
/**
 * Calculate similarity for individual fields
 *
 * @param values1 - Array of values from first row
 * @param values2 - Array of values from second row (same length as values1)
 * @param algorithm - Similarity algorithm to use ('jaro-winkler' | 'jaccard')
 * @returns Array of similarity scores (0-100) for each field
 */
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/__tests__/similarity.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/similarity.ts src/lib/__tests__/similarity.test.ts
git commit -m "feat: add algorithm parameter to calculateFieldSimilarities

- Add optional algorithm parameter ('jaro-winkler' | 'jaccard')
- Default to 'jaro-winkler' for backward compatibility
- Add tests for algorithm-specific field similarities

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 2: Backend - Comparison Logic Integration

### Task 4: Update CompareOptions Interface

**Files:**
- Modify: `src/lib/excel-comparison.ts:9-17`

- [ ] **Step 1: Update CompareOptions interface**

Find the `CompareOptions` interface in `src/lib/excel-comparison.ts` (around line 9-17) and add `fuzzyAlgorithm`:
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

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/excel-comparison.ts
git commit -m "feat: add fuzzyAlgorithm to CompareOptions interface

- Add fuzzyAlgorithm option ('jaro-winkler' | 'jaccard')
- Prepare for algorithm selection in comparison flow

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### Task 5: Update ComparisonResult Interface

**Files:**
- Modify: `src/lib/excel-comparison.ts:26-41`

- [ ] **Step 1: Update ComparisonResult interface**

Find the `ComparisonResult` interface in `src/lib/excel-comparison.ts` (around line 26-41) and add `fuzzyAlgorithm`:
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

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/excel-comparison.ts
git commit -m "feat: add fuzzyAlgorithm to ComparisonResult interface

- Add fuzzyAlgorithm field to store which algorithm was used
- Only present for fuzzy matches
- Enables display in history and results

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### Task 6: Update compareExcelFiles to Use Selected Algorithm

**Files:**
- Modify: `src/lib/excel-comparison.ts:65-200`

- [ ] **Step 1: Add fuzzyAlgorithm destructuring with default**

Find the `compareExcelFiles` function in `src/lib/excel-comparison.ts` (around line 65-80) and update the destructuring:
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
```

- [ ] **Step 2: Find where fuzzy matching is performed and add fuzzyAlgorithm parameter**

Search for where `calculateAverageSimilarity` is called in fuzzy matching logic (around line 180-200) and update:
```typescript
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
```

Note: The exact location may vary. Look for the existing fuzzy matching logic where `calculateAverageSimilarity` is called.

- [ ] **Step 3: Update return statement to include fuzzyAlgorithm**

Find the return statement at the end of `compareExcelFiles` function and add `fuzzyAlgorithm`:
```typescript
return {
  masterData,
  secondaryData,
  comparisonData,
  totalRows,
  matchedRows,
  unmatchedRows,
  comparisonMethod: enableFuzzyMatching ? 'fuzzy' : 'exact',
  fuzzyAlgorithm: enableFuzzyMatching ? fuzzyAlgorithm : undefined,  // NEW
  similarityThreshold: enableFuzzyMatching ? similarityThreshold : undefined
}
```

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/excel-comparison.ts
git commit -m "feat: integrate fuzzyAlgorithm into comparison flow

- Add fuzzyAlgorithm parameter with default 'jaro-winkler'
- Pass algorithm to calculateAverageSimilarity and calculateFieldSimilarities
- Include fuzzyAlgorithm in ComparisonResult return value
- Maintain backward compatibility with existing code

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 3: API Routes Updates

### Task 7: Update Compare API Route

**Files:**
- Modify: `src/app/api/compare/route.ts`

- [ ] **Step 1: Read the compare API route**

Run: `cat src/app/api/compare/route.ts`
Familiarize yourself with the current implementation

- [ ] **Step 2: Add fuzzyAlgorithm parameter extraction and validation**

Find where other parameters are extracted from formData (around line 34-50) and add:
```typescript
const fuzzyAlgorithmStr = formData.get('fuzzyAlgorithm') as string | null

// Validate fuzzy algorithm
const validAlgorithms = ['jaro-winkler', 'jaccard']
const fuzzyAlgorithm = fuzzyAlgorithmStr && validAlgorithms.includes(fuzzyAlgorithmStr)
  ? fuzzyAlgorithmStr as 'jaro-winkler' | 'jaccard'
  : 'jaro-winkler'  // Default
```

- [ ] **Step 3: Pass fuzzyAlgorithm to compareExcelFiles**

Find where `compareExcelFiles` is called (around line 100-120) and add the parameter:
```typescript
const result = await compareExcelFiles(masterBuffer, secondaryBuffer, {
  masterColumns,
  secondaryColumns,
  enableFuzzyMatching,
  fuzzyAlgorithm,  // NEW
  similarityThreshold,
  caseSensitive,
  trimWhitespace,
  onProgress: (progress) => {
    // existing progress logic
  }
})
```

- [ ] **Step 4: Update API response to include comparisonMethod and fuzzyAlgorithm**

Find the return statement (around line 140-155) and update:
```typescript
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
```

- [ ] **Step 5: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Test API endpoint manually**

Run: `npm run dev`
Test with: `curl -X POST http://localhost:3000/api/compare -F "masterFile=@test1.xlsx" -F "secondaryFile=@test2.xlsx" -F "masterColumns=[\"name\"]" -F "secondaryColumns=[\"name\"]" -F "enableFuzzyMatching=true" -F "fuzzyAlgorithm=jaccard"`
Expected: 200 OK response with fuzzyAlgorithm in result

- [ ] **Step 7: Commit**

```bash
git add src/app/api/compare/route.ts
git commit -m "feat: add fuzzyAlgorithm support to compare API

- Accept and validate fuzzyAlgorithm parameter
- Default to 'jaro-winkler' if not provided or invalid
- Pass through to compareExcelFiles function
- Include comparisonMethod and fuzzyAlgorithm in API response

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### Task 8: Update History API Route

**Files:**
- Modify: `src/app/api/history/route.ts`

- [ ] **Step 1: Read the history API route**

Run: `cat src/app/api/history/route.ts`
Familiarize yourself with the current implementation

- [ ] **Step 2: Add import for desc from drizzle-orm**

Add to imports at top of file:
```typescript
import { desc } from 'drizzle-orm'
```

- [ ] **Step 3: Update database query to fetch new fields**

Find the db.select() call (around line 15-25) and update:
```typescript
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
```

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Test API endpoint manually**

Run: `npm run dev`
Test with: `curl http://localhost:3000/api/history`
Expected: 200 OK response with comparisonMethod, fuzzyAlgorithm, similarityThreshold fields

- [ ] **Step 6: Commit**

```bash
git add src/app/api/history/route.ts
git commit -m "feat: fetch comparison method and algorithm in history API

- Add comparisonMethod, fuzzyAlgorithm, similarityThreshold to select
- Enable history page to display fuzzy matching details
- Remove hardcoded default values from frontend

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 4: Database Schema Updates

### Task 9: Create Database Migration

**Files:**
- Create: `drizzle/0002_add_fuzzy_algorithm.sql`

- [ ] **Step 1: Create migration file**

Create `drizzle/0002_add_fuzzy_algorithm.sql`:
```sql
-- Add fuzzy_algorithm column to comparisons table
ALTER TABLE comparisons
ADD COLUMN fuzzy_algorithm VARCHAR(20)
DEFAULT 'jaro-winkler'
CHECK (fuzzy_algorithm IN ('jaro-winkler', 'jaccard'));

COMMENT ON COLUMN comparisons.fuzzy_algorithm IS
'Fuzzy matching algorithm used: jaro-winkler or jaccard';
```

- [ ] **Step 2: Verify migration syntax**

Run: `cat drizzle/0002_add_fuzzy_algorithm.sql`
Expected: SQL content matches above

- [ ] **Step 3: Commit**

```bash
git add drizzle/0002_add_fuzzy_algorithm.sql
git commit -m "feat: add fuzzy algorithm column to comparisons table

- Add fuzzy_algorithm VARCHAR(20) with DEFAULT 'jaro-winkler'
- Add CHECK constraint to validate values
- Maintain backward compatibility with existing data

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### Task 10: Update Drizzle Schema

**Files:**
- Modify: `src/lib/db/schema.ts`

- [ ] **Step 1: Read the current schema**

Run: `cat src/lib/db/schema.ts`
Familiarize yourself with the current comparisons table structure

- [ ] **Step 2: Add fuzzyAlgorithm to the comparisons table**

Find the `comparisons` pgTable definition (around line 3-25) and add the field after `comparisonMethod`:
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

- [ ] **Step 3: Generate Drizzle migration**

Run: `npm run db:generate`
Expected: Migration SQL generated based on schema changes

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/schema.ts drizzle
git commit -m "feat: add fuzzyAlgorithm to Drizzle schema

- Add fuzzy_algorithm column to comparisons table
- Default value 'jaro-winkler' for backward compatibility
- Nullable field (only relevant for fuzzy matches)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### Task 11: Apply Database Migration

**Files:**
- Database: PostgreSQL

- [ ] **Step 1: Run database migration**

Run: `npm run db:push`
Expected: Schema updated successfully

- [ ] **Step 2: Verify column exists**

Run: `npm run db:studio` then check the comparisons table schema
Or connect to database and run: `\d comparisons`
Expected: fuzzy_algorithm column exists with CHECK constraint

- [ ] **Step 3: No commit needed** (database changes are applied separately)

---

## Chunk 5: Frontend - New Comparison Page

### Task 12: Add Fuzzy Algorithm State and UI

**Files:**
- Modify: `src/app/compare/new/page.tsx`

- [ ] **Step 1: Read the new comparison page**

Run: `cat src/app/compare/new/page.tsx`
Familiarize yourself with the current state and structure

- [ ] **Step 2: Add fuzzyAlgorithm state declaration**

Find the state declarations (around line 22-35) and add:
```typescript
const [fuzzyAlgorithm, setFuzzyAlgorithm] = useState<'jaro-winkler' | 'jaccard'>('jaro-winkler')
```

- [ ] **Step 3: Add algorithm selector UI component**

Find the similarity threshold section (around line 422-480) and add AFTER it:
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

- [ ] **Step 4: Update form submission to include fuzzyAlgorithm**

Find the `handleCompare` function (around line 136-183) and add to FormData:
```typescript
formData.append('fuzzyAlgorithm', fuzzyAlgorithm)
```

Place this near the other formData.append calls after line 161.

- [ ] **Step 5: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Test UI manually**

Run: `npm run dev`
Navigate to http://localhost:3000/compare/new
Toggle fuzzy matching and verify algorithm selector appears
Click both options to verify selection works

- [ ] **Step 7: Commit**

```bash
git add src/app/compare/new/page.tsx
git commit -m "feat: add fuzzy algorithm selector to new comparison page

- Add fuzzyAlgorithm state with default 'jaro-winkler'
- Add radio button UI for algorithm selection
- Only visible when fuzzy matching is enabled
- Include fuzzyAlgorithm in form submission

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 6: Frontend - History Page

### Task 13: Update History Interface and Display

**Files:**
- Modify: `src/app/history/page.tsx`

- [ ] **Step 1: Read the history page**

Run: `cat src/app/history/page.tsx`
Familiarize yourself with the current implementation

- [ ] **Step 2: Add fuzzyAlgorithm to HistoryItem interface**

Find the HistoryItem interface (around line 23-33) and add:
```typescript
interface HistoryItem {
  id: string
  masterFile: string
  secondaryFile: string
  totalRows: number
  matchedRows: number
  unmatchedRows: number
  createdAt: string
  comparisonMethod: 'exact' | 'fuzzy'
  fuzzyAlgorithm?: 'jaro-winkler' | 'jaccard'  // NEW
  similarityThreshold?: number  // ADD (was hardcoded before)
}
```

- [ ] **Step 3: Remove hardcoded defaults from data transformation**

Find where the API data is transformed (around line 55-65) and remove the hardcoded defaults:
```typescript
const transformedData: HistoryItem[] = data.map((item: any) => ({
  id: item.id,
  masterFile: item.masterFile,
  secondaryFile: item.secondaryFile,
  totalRows: item.totalRows,
  matchedRows: item.matchedRows,
  unmatchedRows: item.unmatchedRows,
  createdAt: item.createdAt,
  comparisonMethod: item.comparisonMethod,  // Now from API
  fuzzyAlgorithm: item.fuzzyAlgorithm,  // Now from API
  similarityThreshold: item.similarityThreshold  // Now from API
}))
```

- [ ] **Step 4: Update badge display to show algorithm and threshold**

Find the badge display section (around line 239-243) and update:
```tsx
{item.comparisonMethod === 'fuzzy' && (
  <Badge className="bg-purple-500 text-white">
    Fuzzy ({item.fuzzyAlgorithm === 'jaccard' ? 'Jaccard' : 'Jaro-Winkler'}, {item.similarityThreshold}%)
  </Badge>
)}
```

- [ ] **Step 5: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Test history page manually**

Run: `npm run dev`
Navigate to http://localhost:3000/history
Verify badge shows algorithm and threshold for fuzzy matches
Verify exact matches show no fuzzy badge

- [ ] **Step 7: Commit**

```bash
git add src/app/history/page.tsx
git commit -m "feat: display fuzzy algorithm and threshold in history

- Add fuzzyAlgorithm to HistoryItem interface
- Remove hardcoded comparisonMethod default
- Update badge to show: 'Fuzzy (Jaccard, 85%)'
- Include similarityThreshold from API

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 7: Testing and Verification

### Task 14: Run Unit Tests

**Files:**
- Test: `src/lib/__tests__/similarity.test.ts`

- [ ] **Step 1: Run all similarity tests**

Run: `npm test -- src/lib/__tests__/similarity.test.ts`
Expected: All tests pass

- [ ] **Step 2: Verify test coverage**

Run: `npm test -- --coverage src/lib/__tests__/similarity.test.ts`
Expected: Good coverage for jaccardSimilarity and updated functions

- [ ] **Step 3: No commit needed** (tests already committed with implementation)

### Task 15: Manual Testing Checklist

**Files:**
- Manual testing

- [ ] **Step 1: Test two-step selection flow**

Run: `npm run dev`
Navigate to http://localhost:3000/compare/new
1. Toggle fuzzy matching OFF → Algorithm selector should disappear
2. Toggle fuzzy matching ON → Algorithm selector should appear
3. Click Jaro-Winkler → Should be selected
4. Click Jaccard → Should be selected
5. Switch back to Jaro-Winkler → Should work

- [ ] **Step 2: Test threshold slider with both algorithms**

1. Select Jaro-Winkler algorithm
2. Move threshold slider to 95%
3. Select Jaccard algorithm
4. Verify threshold stays at 95%
5. Test comparison with both algorithms

- [ ] **Step 3: Test algorithm behavior differences**

1. Create test file with names (e.g., "John Smith" vs "John Smit")
2. Test with Jaro-Winkler → Should have high similarity
3. Create test file with phrases (e.g., "Smith John" vs "John Smith")
4. Test with Jaccard → Should have perfect similarity (same words)

- [ ] **Step 4: Test history display**

1. Run comparison with Jaro-Winkler fuzzy
2. Run comparison with Jaccard fuzzy
3. Navigate to http://localhost:3000/history
4. Verify both show correct badges with algorithm names

- [ ] **Step 5: Test API with invalid algorithm**

Run: `curl -X POST http://localhost:3000/api/compare -F "masterFile=@test1.xlsx" -F "secondaryFile=@test2.xlsx" -F "masterColumns=[\"name\"]" -F "secondaryColumns=[\"name\"]" -F "enableFuzzyMatching=true" -F "fuzzyAlgorithm=invalid"`
Expected: 400 error or default to 'jaro-winkler'

- [ ] **Step 6: Test backward compatibility**

1. Query database for existing comparisons (before migration)
2. Run migration
3. Verify existing records show as 'jaro-winkler' by default
4. New comparisons should store selected algorithm

- [ ] **Step 7: No commit needed** (manual testing verification)

---

## Chunk 8: Documentation and Final Verification

### Task 16: Update Documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README with new algorithm information**

Add to the Fuzzy Matching section in README.md (around line 15-25):
```markdown
### Matching Modes
- ✅ **Exact Match**: Precise matching with case-insensitive comparison
- ✅ **Fuzzy Matching - Jaro-Winkler**: Character-based similarity for names/typos
- ✅ **Fuzzy Matching - Jaccard**: Word-based similarity for phrases/lists

### Fuzzy Matching Algorithms
- **Jaro-Winkler**: Best for names and typos (character-based, handles transpositions)
- **Jaccard Similarity**: Best for phrases and word order variations (word/set-based)
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document Jaccard similarity algorithm

- Add Jaccard to matching modes section
- Document use cases for each algorithm
- Explain algorithm differences

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### Task 17: Final Verification

**Files:**
- Verification

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run linter**

Run: `npm run lint`
Expected: No errors (or acceptable warnings)

- [ ] **Step 4: Build production bundle**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Verify git status**

Run: `git status`
Expected: No uncommitted changes (all work is committed)

- [ ] **Step 6: No commit needed** (final verification)

---

## Completion Criteria

The implementation is complete when:
- ✅ Jaccard similarity algorithm is implemented and tested
- ✅ Two-step UI selection works (Exact Match → Fuzzy → choose algorithm)
- ✅ Default algorithm is Jaro-Winkler (backward compatible)
- ✅ Shared threshold works for both algorithms
- ✅ Algorithm labels show name and description
- ✅ Database schema updated with fuzzy_algorithm column
- ✅ History displays algorithm and threshold in badges
- ✅ All tests pass
- ✅ TypeScript check passes
- ✅ Manual testing checklist complete
