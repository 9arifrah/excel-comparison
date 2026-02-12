# 📚 Backend API Documentation - Excel Comparison

Technical documentation for implementing frontend redesign with new design and layout.

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [API Reference](#api-reference)
4. [Database Schema](#database-schema)
5. [Data Structures & Types](#data-structures--types)
6. [Implementation Details](#implementation-details)
7. [Integration Examples](#integration-examples)
8. [Environment Configuration](#environment-configuration)

---

## Overview

The Excel Comparison API is a Next.js 16 application using App Router pattern, providing high-performance Excel file comparison capabilities optimized for files with 150,000+ rows.

**Base URL**: `http://localhost:3000/api` (development)

**Features**:
- Hash-based comparison algorithm (O(n+m) complexity)
- Real-time progress tracking via WebSocket
- Paginated results for large datasets
- Export functionality with MATCH_STATUS column
- Persistent comparison history

---

## Tech Stack

### Backend Framework
- **Next.js 16.1.6** with App Router
- **TypeScript 5**
- **Node.js 18+**

### Database
- **Drizzle ORM 0.45.1**
- **PostgreSQL** (via Supabase)
- **pg** driver

### Excel Processing
- **XLSX (SheetJS) 0.18.5**

### Real-Time Communication
- **Socket.IO** for WebSocket progress tracking (port 3003)

---

## API Reference

### 1. Preview Excel File

**Endpoint**: `POST /api/preview`

**Description**: Preview columns and data from an uploaded Excel file before comparison.

#### Request

```http
POST /api/preview
Content-Type: multipart/form-data
```

**FormData Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| file | File | Yes | Excel file (.xlsx or .xls) |
| type | string | Yes | "master" or "secondary" |

#### Response (Success - 200)

```json
{
  "columns": ["ID", "Name", "Email", "Phone"],
  "data": [
    { "ID": 1, "Name": "John Doe", "Email": "john@example.com", "Phone": "123-456-7890" },
    { "ID": 2, "Name": "Jane Smith", "Email": "jane@example.com", "Phone": "098-765-4321" }
  ],
  "rowCount": 1000,
  "fileName": "master_file.xlsx"
}
```

#### Response (Error - 400)

```json
{
  "error": "Invalid file format. Please upload an Excel file (.xlsx or .xls)"
}
```

#### Response (Error - 500)

```json
{
  "error": "Failed to preview file: [error message]"
}
```

---

### 2. Compare Excel Files

**Endpoint**: `POST /api/compare`

**Description**: Start comparison process between two Excel files using selected columns.

#### Request

```http
POST /api/compare
Content-Type: multipart/form-data
```

**FormData Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| masterFile | File | Yes | Master/reference Excel file |
| secondaryFile | File | Yes | Secondary/target Excel file |
| masterColumns | string (JSON) | Yes | JSON array of column names from master file |
| secondaryColumns | string (JSON) | Yes | JSON array of column names from secondary file |
| jobId | string | No | Optional job ID for tracking (auto-generated if not provided) |

#### Validation Rules
- Both files must be provided
- Both column arrays must be provided and non-empty
- Files must be .xlsx or .xls format
- Columns must be arrays of strings

#### Progress Tracking

The comparison process emits progress events to a WebSocket service (development mode only):
- **initialize-job**: Start new comparison job
- **update-progress**: { stage, current, total, message }
- **complete-job**: Mark job as complete

Progress stages:
1. `parsing_master`: Reading master file
2. `parsing_secondary`: Reading secondary file
3. `building_index`: Creating hash lookup table
4. `comparing`: Processing rows against index

#### Response (Success - 200)

```json
{
  "id": "uuid-v4-id",
  "masterFile": "master_file.xlsx",
  "secondaryFile": "secondary_file.xlsx",
  "masterColumns": ["ID", "Name"],
  "secondaryColumns": ["ID", "Name"],
  "totalRows": 1000,
  "matchedRows": 850,
  "unmatchedRows": 150
}
```

#### Response (Error - 400)

```json
{
  "error": "Both master and secondary files are required"
}
```

```json
{
  "error": "At least one column must be selected from each file"
}
```

#### Response (Error - 500)

```json
{
  "error": "Internal server error: [error message]"
}
```

---

### 3. Get Comparison Details

**Endpoint**: `GET /api/comparison/[id]`

**Description**: Retrieve detailed comparison results with pagination and filtering.

#### Request

```http
GET /api/comparison/{id}?page=1&limit=50&filter=all
```

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Comparison ID (UUID) |

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 50 | Rows per page |
| filter | string | all | Filter: "all", "matched", "unmatched" |

#### Response (Success - 200)

```json
{
  "id": "uuid-v4-id",
  "masterFile": "master_file.xlsx",
  "secondaryFile": "secondary_file.xlsx",
  "totalRows": 1000,
  "matchedRows": 850,
  "unmatchedRows": 150,
  "masterColumns": ["ID", "Name"],
  "secondaryColumns": ["ID", "Name"],
  "masterData": [
    { "ID": 1, "Name": "John Doe", "Email": "john@example.com" },
    { "ID": 2, "Name": "Jane Smith", "Email": "jane@example.com" }
  ],
  "secondaryData": [
    { "ID": 1, "Name": "John Doe", "Email": "john@example.com" },
    { "ID": 2, "Name": "Jane Smith", "Email": "jane@example.com" }
  ],
  "comparisonData": [
    {
      "matched": true,
      "masterRow": { "ID": 1, "Name": "John Doe" },
      "secondaryRow": { "ID": 1, "Name": "John Doe" }
    },
    {
      "matched": false,
      "masterRow": null,
      "secondaryRow": { "ID": 999, "Name": "Unknown" }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalItems": 1000,
    "totalPages": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Response (Error - 404)

```json
{
  "error": "Comparison not found"
}
```

#### Response (Error - 500)

```json
{
  "error": "Internal server error"
}
```

---

### 4. Export Comparison Results

**Endpoint**: `GET /api/export/[id]`

**Description**: Export comparison results to Excel file with MATCH_STATUS column.

#### Request

```http
GET /api/export/{id}
```

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Comparison ID (UUID) |

#### Response (Success - 200)

**Content-Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Headers**:
```
Content-Disposition: attachment; filename="comparison_result_2024-01-15.xlsx"
```

**File Content**:
- Excel file (.xlsx format)
- Contains all columns from secondary data
- Additional `MATCH_STATUS` column with values: "Matched" or "Unmatched"

#### Response (Error - 404)

```json
{
  "error": "Comparison not found"
}
```

#### Response (Error - 500)

```json
{
  "error": "Internal server error"
}
```

---

### 5. Get Comparison History

**Endpoint**: `GET /api/history`

**Description**: Retrieve list of all completed comparisons, ordered by creation date (newest first).

#### Request

```http
GET /api/history
```

No parameters required.

#### Response (Success - 200)

```json
[
  {
    "id": "uuid-v4-id-1",
    "masterFile": "master_file.xlsx",
    "secondaryFile": "secondary_file.xlsx",
    "totalRows": 1000,
    "matchedRows": 850,
    "unmatchedRows": 150,
    "masterColumns": ["ID", "Name"],
    "secondaryColumns": ["ID", "Name"],
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "uuid-v4-id-2",
    "masterFile": "master_file2.xlsx",
    "secondaryFile": "secondary_file2.xlsx",
    "totalRows": 500,
    "matchedRows": 400,
    "unmatchedRows": 100,
    "masterColumns": ["Email"],
    "secondaryColumns": ["Email"],
    "createdAt": "2024-01-14T15:45:00.000Z"
  }
]
```

#### Response (Error - 500)

```json
{
  "error": "Internal server error"
}
```

---

### 6. Delete Comparison

**Endpoint**: `DELETE /api/history/[id]`

**Description**: Delete a specific comparison from history.

#### Request

```http
DELETE /api/history/{id}
```

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Comparison ID (UUID) |

#### Response (Success - 200)

```json
{
  "success": true
}
```

#### Response (Error - 404)

```json
{
  "error": "Comparison not found"
}
```

#### Response (Error - 500)

```json
{
  "error": "Internal server error"
}
```

---

## Database Schema

### Table: `comparisons**

```typescript
import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core'

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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  createdAtIndex: index('comparisons_created_at_idx').on(table.createdAt),
  masterFileIndex: index('comparisons_master_file_idx').on(table.masterFile),
  secondaryFileIndex: index('comparisons_secondary_file_idx').on(table.secondaryFile),
}))
```

### Field Descriptions

| Column | Type | Null | Description |
|--------|------|------|-------------|
| id | text (UUID) | NO | Primary key, auto-generated UUID |
| masterFile | text | NO | Filename of master file |
| secondaryFile | text | NO | Filename of secondary file |
| totalRows | integer | NO | Total number of rows compared |
| matchedRows | integer | NO | Number of matched rows |
| unmatchedRows | integer | NO | Number of unmatched rows |
| masterData | text (JSON) | NO | Master file data as JSON string |
| secondaryData | text (JSON) | NO | Secondary file data as JSON string |
| comparisonData | text (JSON) | NO | Comparison results as JSON string |
| masterColumns | text (JSON) | YES | Selected master columns as JSON string |
| secondaryColumns | text (JSON) | YES | Selected secondary columns as JSON string |
| createdAt | timestamp | NO | Record creation timestamp |
| updatedAt | timestamp | NO | Record last update timestamp |

### Indexes

- `comparisons_created_at_idx`: Optimizes queries ordering by creation date
- `comparisons_master_file_idx`: Optimizes filtering by master filename
- `comparisons_secondary_file_idx`: Optimizes filtering by secondary filename

---

## Data Structures & Types

### TypeScript Interfaces

#### Comparison Record

```typescript
export type Comparison = {
  id: string
  masterFile: string
  secondaryFile: string
  totalRows: number
  matchedRows: number
  unmatchedRows: number
  masterData: string // JSON string
  secondaryData: string // JSON string
  comparisonData: string // JSON string
  masterColumns: string | null // JSON string
  secondaryColumns: string | null // JSON string
  createdAt: Date
  updatedAt: Date
}
```

#### Preview Response

```typescript
export interface PreviewResponse {
  columns: string[]
  data: Record<string, any>[]
  rowCount: number
  fileName: string
}
```

#### Compare Request (FormData)

```typescript
export interface CompareRequest {
  masterFile: File
  secondaryFile: File
  masterColumns: string[]
  secondaryColumns: string[]
  jobId?: string
}
```

#### Compare Response

```typescript
export interface CompareResponse {
  id: string
  masterFile: string
  secondaryFile: string
  masterColumns: string[]
  secondaryColumns: string[]
  totalRows: number
  matchedRows: number
  unmatchedRows: number
}
```

#### Comparison Detail Response

```typescript
export interface ComparisonDetailResponse {
  id: string
  masterFile: string
  secondaryFile: string
  totalRows: number
  matchedRows: number
  unmatchedRows: number
  masterColumns: string[]
  secondaryColumns: string[]
  masterData: Record<string, any>[]
  secondaryData: Record<string, any>[]
  comparisonData: ComparisonItem[]
  pagination: PaginationInfo
  createdAt: string
  updatedAt: string
}
```

#### Comparison Item

```typescript
export interface ComparisonItem {
  matched: boolean
  masterRow: Record<string, any> | null
  secondaryRow: Record<string, any> | null
}
```

#### Pagination Info

```typescript
export interface PaginationInfo {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}
```

#### History Response

```typescript
export interface HistoryResponse {
  id: string
  masterFile: string
  secondaryFile: string
  totalRows: number
  matchedRows: number
  unmatchedRows: number
  masterColumns: string[]
  secondaryColumns: string[]
  createdAt: string
}
```

#### Progress Event

```typescript
export interface ProgressEvent {
  action: 'initialize-job' | 'update-progress' | 'complete-job'
  jobId?: string
  stage?: string
  current?: number
  total?: number
  message?: string
}
```

---

## Implementation Details

### Comparison Algorithm

The backend uses a hash-based comparison algorithm with O(n+m) complexity:

1. **Parse Master File**: Read and extract data from master Excel file
2. **Build Hash Index**: 
   - For each master row, generate hash key from selected columns
   - Store in JavaScript Map: `hashKey -> rowData`
   - Case-insensitive matching with whitespace trimming
3. **Compare Secondary File**:
   - For each secondary row, generate hash key
   - Look up in Map (O(1) operation)
   - Mark as matched if found, unmatched if not found

**Performance**:
- Traditional O(n*m): 150,000 × 150,000 = 22.5 billion comparisons
- Optimized O(n+m): 150,000 + 150,000 = 300,000 operations

### Pagination Logic

Pagination is applied server-side for performance:

```typescript
// Filter data
let filteredData = comparisonData
if (filter === 'matched') {
  filteredData = comparisonData.filter(item => item.matched)
} else if (filter === 'unmatched') {
  filteredData = comparisonData.filter(item => !item.matched)
}

// Calculate pagination
const startIndex = (page - 1) * limit
const endIndex = startIndex + limit
const paginatedData = filteredData.slice(startIndex, endIndex)
const totalPages = Math.ceil(filteredData.length / limit)
```

### Progress Tracking (Development Mode)

In development mode, the backend communicates with a WebSocket progress service:

```typescript
async function notifyProgressService(action: string, data: any) {
  if (process.env.NODE_ENV === 'production') {
    return // Disabled in production
  }

  try {
    await fetch('http://localhost:3004', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...data })
    })
  } catch (error) {
    console.error('Error notifying progress service:', error)
  }
}
```

**Production Note**: Progress tracking is disabled in production. Frontend should implement polling or alternative progress mechanism if needed.

### Error Handling

All endpoints follow consistent error handling:

```typescript
try {
  // API logic
} catch (error) {
  console.error('Error description:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

**Common Error Codes**:
- `400`: Bad Request (invalid input, missing parameters)
- `404`: Not Found (comparison not found)
- `500`: Internal Server Error (unexpected errors)

---

## Integration Examples

### 1. Preview File

```typescript
async function previewFile(file: File, type: 'master' | 'secondary') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)

  const response = await fetch('/api/preview', {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to preview file')
  }

  return await response.json()
}

// Usage
const masterFile = fileInput.files[0]
const preview = await previewFile(masterFile, 'master')
console.log('Columns:', preview.columns)
console.log('Row count:', preview.rowCount)
```

### 2. Compare Files

```typescript
async function compareFiles(
  masterFile: File,
  secondaryFile: File,
  masterColumns: string[],
  secondaryColumns: string[]
) {
  const formData = new FormData()
  formData.append('masterFile', masterFile)
  formData.append('secondaryFile', secondaryFile)
  formData.append('masterColumns', JSON.stringify(masterColumns))
  formData.append('secondaryColumns', JSON.stringify(secondaryColumns))

  const response = await fetch('/api/compare', {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to compare files')
  }

  return await response.json()
}

// Usage
const result = await compareFiles(
  masterFile,
  secondaryFile,
  ['ID', 'Name'],
  ['ID', 'Name']
)
console.log('Comparison ID:', result.id)
console.log('Matched:', result.matchedRows, '/', result.totalRows)
```

### 3. Get Comparison Details with Pagination

```typescript
async function getComparisonDetails(
  id: string,
  page: number = 1,
  limit: number = 50,
  filter: 'all' | 'matched' | 'unmatched' = 'all'
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    filter
  })

  const response = await fetch(`/api/comparison/${id}?${params}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch comparison')
  }

  return await response.json()
}

// Usage
const details = await getComparisonDetails(result.id, 1, 50, 'matched')
console.log('Data:', details.comparisonData)
console.log('Pagination:', details.pagination)
```

### 4. Export Results

```typescript
async function exportComparison(id: string) {
  const response = await fetch(`/api/export/${id}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to export')
  }

  // Get blob and create download link
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `comparison_${id}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

// Usage
await exportComparison(result.id)
```

### 5. Get History

```typescript
async function getHistory() {
  const response = await fetch('/api/history')

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch history')
  }

  return await response.json()
}

// Usage
const history = await getHistory()
console.log('Comparisons:', history.length)
```

### 6. Delete Comparison

```typescript
async function deleteComparison(id: string) {
  const response = await fetch(`/api/history/${id}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete comparison')
  }

  return await response.json()
}

// Usage
await deleteComparison(comparisonId)
```

### 7. Complete Example with Error Handling

```typescript
async function runFullComparison(
  masterFile: File,
  secondaryFile: File,
  masterColumns: string[],
  secondaryColumns: string[]
) {
  try {
    // Step 1: Compare files
    const compareResult = await compareFiles(
      masterFile,
      secondaryFile,
      masterColumns,
      secondaryColumns
    )

    console.log('Comparison started:', compareResult.id)

    // Step 2: Get first page of results
    const details = await getComparisonDetails(compareResult.id)
    console.log('Match rate:', 
      ((details.matchedRows / details.totalRows) * 100).toFixed(2) + '%'
    )

    // Step 3: Export results
    await exportComparison(compareResult.id)
    console.log('Export complete')

    return details
  } catch (error) {
    console.error('Comparison failed:', error)
    throw error
  }
}

// Usage
try {
  const master = document.querySelector('#master-file') as HTMLInputElement
  const secondary = document.querySelector('#secondary-file') as HTMLInputElement
  
  if (master.files?.[0] && secondary.files?.[0]) {
    const result = await runFullComparison(
      master.files[0],
      secondary.files[0],
      ['ID', 'Name'],
      ['ID', 'Name']
    )
    // Update UI with results
  }
} catch (error) {
  // Show error to user
  alert('Comparison failed: ' + error.message)
}
```

### 8. React Hook Example

```typescript
import { useState, useEffect } from 'react'

export function useComparisonDetails(id: string, page = 1, filter = 'all') {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const result = await getComparisonDetails(id, page, 50, filter)
        setData(result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, page, filter])

  return { data, loading, error }
}

// Usage in component
function ComparisonView({ id }) {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const { data, loading, error } = useComparisonDetails(id, page, filter)

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <div>
        {data.pagination.totalItems} total items
      </div>
      {/* Render comparison data */}
    </div>
  )
}
```

---

## Environment Configuration

### Required Environment Variables

Create a `.env.local` file in the project root:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@host:5432/database"
# Or use Supabase
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-supabase-anon-key"

# Application Configuration
NODE_ENV="development" # or "production"
```

### Database Setup

Using Drizzle ORM:

```bash
# Generate migration
npm run db:generate

# Push schema to database
npm run db:push

# Run migrations
npm run db:migrate
```

### Development Server Configuration

The application uses multiple services:

```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "dev:sockets": "node mini-services/comparison-service/index.js",
    "stop": "killall node"
  }
}
```

**Port Configuration**:
- Next.js API: `3000`
- WebSocket Service: `3003`
- Progress API: `3004`

### Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Ensure all environment variables are set
3. Build the application: `npm run build`
4. Start production server: `npm start`

**Note**: WebSocket progress service is disabled in production mode.

---

## Additional Notes

### File Size Limitations

- **Recommended**: Files up to 100MB
- **Maximum**: Files up to 500MB with increased Node.js memory
- **Row Count**: Optimized for 150,000+ rows

### Performance Tips

1. **Use Pagination**: Always request data in chunks (50-100 rows per page)
2. **Filter Early**: Use API filters instead of client-side filtering
3. **Lazy Loading**: Load comparison details only when needed
4. **Memory Management**: Close unused comparison pages

### Security Considerations

- File type validation (.xlsx, .xls only)
- Input sanitization via Drizzle ORM
- No sensitive data stored
- Local processing only (no external APIs)

### Troubleshooting

#### "Comparison not found"
- Verify the comparison ID is correct
- Check database connection
- Ensure comparison wasn't deleted

#### "Internal server error"
- Check server logs for detailed error
- Verify database connection
- Ensure all dependencies are installed

#### "Failed to preview file"
- Verify file format is .xlsx or .xls
- Check file isn't corrupted
- Ensure file is not too large

---

## Contact & Support

For technical issues or questions:
- Check server logs: Check Next.js terminal output
- Review error messages: All endpoints return descriptive errors
- Verify configuration: Ensure environment variables are set correctly

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
**Backend Version**: Next.js 16.1.6