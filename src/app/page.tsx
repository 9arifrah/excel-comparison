'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  BarChart3,
  Zap,
  Columns,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { io } from 'socket.io-client'

// Types
interface FilePreview {
  type: 'master' | 'secondary'
  fileName: string
  totalRows: number
  columns: string[]
  sampleData: any[]
}

interface ComparisonResult {
  id: string
  masterFile: string
  secondaryFile: string
  totalRows: number
  matchedRows: number
  unmatchedRows: number
  createdAt: string
  masterColumns?: string[]
  secondaryColumns?: string[]
}

interface ComparisonDetail {
  id: string
  masterFile: string
  secondaryFile: string
  totalRows: number
  matchedRows: number
  unmatchedRows: number
  comparisonData: Array<{
    row: number
    matched: boolean
    data: any
  }>
  masterColumns?: string[]
  secondaryColumns?: string[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  createdAt: string
}

export default function Home() {
  // File upload state
  const [masterFile, setMasterFile] = useState<File | null>(null)
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null)

  // Preview state
  const [masterPreview, setMasterPreview] = useState<FilePreview | null>(null)
  const [secondaryPreview, setSecondaryPreview] = useState<FilePreview | null>(null)
  const [isPreviewing, setIsPreviewing] = useState<{ master: boolean; secondary: boolean }>({
    master: false,
    secondary: false
  })

  // Column selection state
  const [selectedMasterColumns, setSelectedMasterColumns] = useState<string[]>([])
  const [selectedSecondaryColumns, setSelectedSecondaryColumns] = useState<string[]>([])

  // Comparison state
  const [isComparing, setIsComparing] = useState(false)
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
  const [comparisonDetail, setComparisonDetail] = useState<ComparisonDetail | null>(null)
  const [isLoadingComparisonDetail, setIsLoadingComparisonDetail] = useState(false)

  // Progress state
  const [progress, setProgress] = useState<{
    stage: string
    current: number
    total: number
    message: string
  } | null>(null)
  const [socket, setSocket] = useState<any>(null)

  // History state
  const [history, setHistory] = useState<ComparisonResult[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // UI state
  const [activeTab, setActiveTab] = useState<'compare' | 'history'>('compare')
  const [filterStatus, setFilterStatus] = useState<'all' | 'matched' | 'unmatched'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  // Get all unique field names from comparison data
  const getAllFieldNames = () => {
    if (!comparisonDetail || comparisonDetail.comparisonData.length === 0) return []
    const firstRow = comparisonDetail.comparisonData[0]
    return Object.keys(firstRow.data)
  }

  // Initialize WebSocket connection
  useEffect(() => {
    const socketInstance = io('http://localhost:3003', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    socketInstance.on('connect', () => {
      console.log('[Frontend] Connected to progress service at http://localhost:3003')
    })

    socketInstance.on('connect_error', (error) => {
      console.error('[Frontend] WebSocket connection error:', error)
    })

    socketInstance.on('job-initialized', (data: any) => {
      console.log('[Frontend] Job initialized:', data)
    })

    socketInstance.on('progress', (data: any) => {
      console.log('[Frontend] Progress update:', data)
      setProgress({
        stage: data.stage,
        current: data.current,
        total: data.total,
        message: data.message
      })
    })

    socketInstance.on('complete', (data: any) => {
      console.log('[Frontend] Comparison complete:', data)
      setProgress(null)
      setIsComparing(false)
    })

    socketInstance.on('error', (data: any) => {
      console.error('[Frontend] Comparison error:', data.error)
      setProgress(null)
      setIsComparing(false)
      alert('Error during comparison: ' + data.error)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  // Fetch history on mount
  useEffect(() => {
    fetchHistory()
  }, [])

  // Fetch comparison detail when viewing a history item
  useEffect(() => {
    if (comparisonResult) {
      fetchComparisonDetail(comparisonResult.id)
    }
  }, [comparisonResult?.id, currentPage, filterStatus])

  // Debug: Log comparison detail structure
  useEffect(() => {
    if (comparisonDetail && comparisonDetail.comparisonData.length > 0) {
      console.log('=== COMPARISON DETAIL DEBUG ===')
      console.log('First row:', comparisonDetail.comparisonData[0])
      console.log('First row data:', comparisonDetail.comparisonData[0].data)
      console.log('Master columns:', comparisonDetail.masterColumns)
      console.log('Secondary columns:', comparisonDetail.secondaryColumns)
    }
  }, [comparisonDetail])

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history')
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'master' | 'secondary') => {
    const file = event.target.files?.[0]

    if (!file) return

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]

    const isValidType = validTypes.includes(file.type) ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')

    if (!isValidType) {
      alert('Please upload a valid Excel file (.xlsx or .xls)')
      return
    }

    if (type === 'master') {
      setMasterFile(file)
      setMasterPreview(null)
      setSelectedMasterColumns([])
      await previewFile(file, 'master')
    } else {
      setSecondaryFile(file)
      setSecondaryPreview(null)
      setSelectedSecondaryColumns([])
      await previewFile(file, 'secondary')
    }
  }

  const previewFile = async (file: File, type: 'master' | 'secondary') => {
    setIsPreviewing(prev => ({ ...prev, [type]: true }))

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/preview', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const preview = await response.json()
        if (type === 'master') {
          setMasterPreview(preview)
        } else {
          setSecondaryPreview(preview)
        }
      } else {
        const error = await response.json()
        alert('Error previewing file: ' + error.error)
      }
    } catch (error) {
      console.error('Error previewing file:', error)
      alert('Error previewing file')
    } finally {
      setIsPreviewing(prev => ({ ...prev, [type]: false }))
    }
  }

  const handleColumnToggle = (column: string, type: 'master' | 'secondary') => {
    if (type === 'master') {
      setSelectedMasterColumns(prev =>
        prev.includes(column)
          ? prev.filter(col => col !== column)
          : [...prev, column]
      )
    } else {
      setSelectedSecondaryColumns(prev =>
        prev.includes(column)
          ? prev.filter(col => col !== column)
          : [...prev, column]
      )
    }
  }

  const handleCompare = async () => {
    if (!masterFile || !secondaryFile) {
      alert('Please upload both master and secondary files')
      return
    }

    if (selectedMasterColumns.length === 0 || selectedSecondaryColumns.length === 0) {
      alert('Please select at least one column from each file for comparison')
      return
    }

    // Generate unique job ID for this comparison
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    console.log('[Frontend] Generated job ID:', jobId)

    // Join job room for progress updates via WebSocket
    if (socket) {
      socket.emit('join-job', { jobId })
      console.log('[Frontend] Joined job room:', jobId)
    }

    setIsComparing(true)
    setProgress({
      stage: 'initializing',
      current: 0,
      total: 100,
      message: 'Initializing comparison...'
    })
    setCurrentPage(1)
    setComparisonDetail(null)

    try {
      const formData = new FormData()
      formData.append('masterFile', masterFile)
      formData.append('secondaryFile', secondaryFile)
      formData.append('masterColumns', JSON.stringify(selectedMasterColumns))
      formData.append('secondaryColumns', JSON.stringify(selectedSecondaryColumns))
      formData.append('jobId', jobId)

      const response = await fetch('/api/compare', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[Frontend] Comparison result:', result)
        setComparisonResult(result)
        await fetchHistory()
      } else {
        const error = await response.json()
        alert(`Error comparing files: ${error.error}`)
        setProgress(null)
        setIsComparing(false)
      }
    } catch (error) {
      console.error('[Frontend] Error:', error)
      alert('Error comparing files')
      setProgress(null)
      setIsComparing(false)
    }
  }

  const fetchComparisonDetail = async (id: string) => {
    setIsLoadingComparisonDetail(true)
    try {
      const response = await fetch(`/api/comparison/${id}?page=${currentPage}&limit=50&filter=${filterStatus}`)
      if (response.ok) {
        const detail = await response.json()
        setComparisonDetail(detail)
      }
    } catch (error) {
      console.error('Error fetching comparison detail:', error)
    } finally {
      setIsLoadingComparisonDetail(false)
    }
  }

  const handleExport = async () => {
    if (!comparisonResult) return

    setIsExporting(true)
    try {
      const response = await fetch(`/api/export/${comparisonResult.id}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `comparison_result_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting file:', error)
      alert('Error exporting file')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = confirm('Are you sure you want to delete this comparison? This action cannot be undone.')
    if (!confirmed) return

    setDeletingId(id)

    try {
      const response = await fetch(`/api/history/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchHistory()
        if (comparisonResult?.id === id) {
          setComparisonResult(null)
          setComparisonDetail(null)
        }
      } else {
        const error = await response.json()
        alert(`Failed to delete comparison: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting comparison:', error)
      alert('Failed to delete comparison')
    } finally {
      setDeletingId(null)
    }
  }

  const handleViewHistory = async (item: ComparisonResult) => {
    setComparisonResult(item)
    setCurrentPage(1)
    setFilterStatus('all')
    setActiveTab('compare')
  }

  const matchRate = comparisonResult
    ? ((comparisonResult.matchedRows / comparisonResult.totalRows) * 100).toFixed(1)
    : '0'

  const toggleRowExpansion = (rowNumber: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rowNumber)) {
        newSet.delete(rowNumber)
      } else {
        newSet.add(rowNumber)
      }
      return newSet
    })
  }

  const isExpanded = (rowNumber: number) => expandedRows.has(rowNumber)

  const filterComparisonData = () => {
    if (!comparisonDetail) return []
    
    return comparisonDetail.comparisonData.filter(item => {
      if (filterStatus === 'all') return true
      if (filterStatus === 'matched') return item.matched
      if (filterStatus === 'unmatched') return !item.matched
      return true
    })
  }

  const getMatchStatusColor = (matched: boolean) => {
    return matched 
      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
      : 'bg-gradient-to-r from-red-500 to-orange-500'
  }

  const getMatchStatusText = (matched: boolean) => {
    return matched ? 'Matched' : 'Unmatched'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
              <FileSpreadsheet className="w-16 h-16 text-blue-600 dark:text-blue-400 relative z-10" />
            </div>
            <h1 className="ml-5 text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
              Excel Data Comparison
            </h1>
            {/* Global Loading Indicator */}
            {(isLoadingHistory || isLoadingComparisonDetail) && (
              <div className="absolute -right-8 top-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-xl animate-pulse rounded-full" />
                  <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin relative z-10" />
                </div>
              </div>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-xl font-medium">
            High-performance Excel comparison tool optimized for large files
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>150,000+ rows in seconds</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Hash-based O(n+m) algorithm</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'compare' | 'history')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg min-h-[60px]">
            <TabsTrigger value="compare" className="flex items-center gap-3 text-base py-3 data-[state=active]:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:border-0">
              <Columns className="w-5 h-5" />
              <span className="font-semibold">Compare Files</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-3 text-base py-3 data-[state=active]:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:border-0">
              <BarChart3 className="w-5 h-5" />
              <span className="font-semibold">History</span>
            </TabsTrigger>
          </TabsList>

          {/* Compare Files Tab */}
          <TabsContent value="compare">
            {/* Progress Bar */}
            {progress && (
              <Card className="mb-8 border-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 backdrop-blur-sm shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 blur-xl animate-pulse" />
                      <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400 relative z-10" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                      Processing Your Files
                    </span>
                  </CardTitle>
                  <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                    {progress.stage === 'parsing' && 'Reading Excel files...'}
                    {progress.stage === 'building-index' && 'Building hash index for fast comparison...'}
                    {progress.stage === 'comparing' && 'Comparing data rows...'}
                    {progress.stage === 'complete' && 'Finalizing results...'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress 
                    value={(progress.current / progress.total) * 100} 
                    className="h-3 bg-slate-200 dark:bg-slate-700 data-[state=complete]:bg-gradient-to-r data-[state=complete]:from-blue-500 data-[state=complete]:to-purple-500 data-[state=complete]:shadow-lg" 
                  />
                  <div className="flex justify-between items-center text-base font-medium text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      {progress.message}
                    </span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {Math.round((progress.current / progress.total) * 100)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Display */}
            {comparisonResult && !isComparing && (
              <Card className="mb-8 border-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 backdrop-blur-sm shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500/20 blur-xl" />
                      <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400 relative z-10" />
                    </div>
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
                      Comparison Complete!
                    </span>
                  </CardTitle>
                  <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                    {comparisonResult.masterFile} vs {comparisonResult.secondaryFile}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl transition-shadow duration-300">
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-center mb-3">
                          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {comparisonResult.totalRows.toLocaleString()}
                        </div>
                        <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">
                          Total Rows
                        </div>
                      </div>
                    </div>
                    <div className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl transition-shadow duration-300">
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-green-500/10 rounded-full blur-2xl" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-center mb-3">
                          <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                        <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {comparisonResult.matchedRows.toLocaleString()}
                        </div>
                        <div className="text-sm font-semibold text-green-600 dark:text-green-400 mt-1">
                          Matched
                        </div>
                      </div>
                    </div>
                    <div className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl transition-shadow duration-300">
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-500/10 rounded-full blur-2xl" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-center mb-3">
                          <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                          </div>
                        </div>
                        <div className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                          {comparisonResult.unmatchedRows.toLocaleString()}
                        </div>
                        <div className="text-sm font-semibold text-red-600 dark:text-red-400 mt-1">
                          Unmatched
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Match Rate */}
                  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-base font-semibold text-slate-700 dark:text-slate-300">Match Rate</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${parseFloat(matchRate) >= 80 ? 'bg-green-500' : parseFloat(matchRate) >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {matchRate}%
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={parseFloat(matchRate)} 
                      className="h-4 bg-slate-200 dark:bg-slate-700 data-[state=complete]:bg-gradient-to-r data-[state=complete]:from-blue-500 data-[state=complete]:to-purple-500 data-[state=complete]:shadow-lg" 
                    />
                  </div>

                  {/* Comparison Detail Table */}
                  {comparisonDetail && (
                    <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl">
                          <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                            <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400 relative z-10" />
                          </div>
                          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                            Comparison Details
                          </span>
                        </CardTitle>
                        <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                          {comparisonDetail.pagination.totalItems.toLocaleString()} total rows · Showing {filterComparisonData().length} rows
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 relative">
                        {/* Loading Overlay */}
                        {isLoadingComparisonDetail && (
                          <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
                            <div className="flex flex-col items-center gap-3">
                              <div className="relative">
                                <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
                                <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin relative z-10" />
                              </div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Loading comparison data...
                              </span>
                            </div>
                          </div>
                        )}
                        {/* Loading Skeleton for Comparison Detail */}
                        {isLoadingComparisonDetail ? (
                          <>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <div className="flex gap-2 flex-wrap">
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-28" />
                                <Skeleton className="h-10 w-32" />
                              </div>
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-16" />
                                <Skeleton className="h-10 w-16" />
                              </div>
                            </div>
                            {/* Table Skeleton */}
                            <div className="overflow-x-auto border-2 border-slate-200 dark:border-slate-700 rounded-xl">
                              <div className="space-y-3 p-4 min-w-full">
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <div key={i} className="flex gap-4 items-center min-w-full">
                                    <Skeleton className="h-12 w-16 flex-shrink-0" />
                                    <Skeleton className="h-12 w-32 flex-shrink-0 pr-6" />
                                    {getAllFieldNames().map((_, idx) => (
                                      <Skeleton key={idx} className="h-12 min-w-[120px] flex-1 pl-6" />
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  onClick={() => setFilterStatus('all')}
                                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                                  className={filterStatus === 'all' 
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md hover:shadow-lg' 
                                    : 'border-slate-300 dark:border-slate-600'
                                  }
                                >
                                  All ({comparisonDetail.pagination.totalItems})
                                </Button>
                                <Button
                                  onClick={() => setFilterStatus('matched')}
                                  variant={filterStatus === 'matched' ? 'default' : 'outline'}
                                  className={filterStatus === 'matched'
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md hover:shadow-lg'
                                    : 'border-slate-300 dark:border-slate-600'
                                  }
                                >
                                  Matched ({comparisonResult.matchedRows})
                                </Button>
                                <Button
                                  onClick={() => setFilterStatus('unmatched')}
                                  variant={filterStatus === 'unmatched' ? 'default' : 'outline'}
                                  className={filterStatus === 'unmatched'
                                    ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-md hover:shadow-lg'
                                    : 'border-slate-300 dark:border-slate-600'
                                  }
                                >
                                  Unmatched ({comparisonResult.unmatchedRows})
                                </Button>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                  disabled={!comparisonDetail.pagination.hasPrevPage}
                                  variant="outline"
                                  size="sm"
                                  className="border-slate-300 dark:border-slate-600"
                                >
                                  Previous
                                </Button>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 px-2">
                                  Page {comparisonDetail.pagination.page} of {comparisonDetail.pagination.totalPages}
                                </span>
                                <Button
                                  onClick={() => setCurrentPage(prev => prev + 1)}
                                  disabled={!comparisonDetail.pagination.hasNextPage}
                                  variant="outline"
                                  size="sm"
                                  className="border-slate-300 dark:border-slate-600"
                                >
                                  Next
                                </Button>
                              </div>
                            </div>

                            {/* Comparison Data Table */}
                            {filterComparisonData().length === 0 ? (
                              <div className="text-center py-12 text-slate-500">
                                <Eye className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-600" />
                                <p className="text-base font-medium">No data to display</p>
                                <p className="text-sm">Try changing filter or viewing a different page</p>
                              </div>
                            ) : (
                              <div className="overflow-x-auto border-2 border-slate-200 dark:border-slate-700 rounded-xl">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 bg-slate-100/50 dark:bg-slate-800/50">
                                      <TableHead className="sticky left-0 z-20 w-16 font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 shadow-md">Row #</TableHead>
                                      <TableHead className="sticky left-16 z-20 w-32 pr-6 font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 shadow-md">Status</TableHead>
                                      {getAllFieldNames().map((fieldName) => (
                                        <TableHead key={fieldName} className="font-bold text-slate-700 dark:text-slate-300 min-w-[120px] pl-6">
                                          {fieldName}
                                        </TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {filterComparisonData().map((item) => (
                                      <TableRow 
                                        key={item.row}
                                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 ${
                                          item.matched 
                                            ? 'bg-green-50/30 dark:bg-green-900/10' 
                                            : 'bg-red-50/30 dark:bg-red-900/10'
                                        }`}
                                      >
                                        <TableCell className="sticky left-0 z-20 font-medium text-slate-700 dark:text-slate-300 bg-green-50/30 dark:bg-green-900/10 shadow-sm">
                                          #{item.row}
                                        </TableCell>
                                        <TableCell className="sticky left-16 z-20 w-32 pr-6 bg-green-50/30 dark:bg-green-900/10 shadow-sm">
                                          <Badge className={`${getMatchStatusColor(item.matched)} text-white border-0 shadow-md hover:shadow-lg transition-all duration-200`}>
                                            {item.matched ? (
                                              <CheckCircle className="w-3 h-3 mr-1" />
                                            ) : (
                                              <XCircle className="w-3 h-3 mr-1" />
                                            )}
                                            {getMatchStatusText(item.matched)}
                                          </Badge>
                                        </TableCell>
                                        {getAllFieldNames().map((fieldName) => {
                                          const value = (item.data as any)[fieldName]
                                          const displayValue = value !== undefined && value !== null && value !== '' ? String(value) : 'N/A'
                                          
                                          return (
                                            <TableCell 
                                              key={`${item.row}-${fieldName}`}
                                              className="text-slate-700 dark:text-slate-300 min-w-[120px] pl-6"
                                            >
                                              {displayValue}
                                            </TableCell>
                                          )
                                        })}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button 
                      onClick={handleExport} 
                      disabled={isExporting}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base py-6 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5 mr-2" />
                          Export Results
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* File Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Master File Upload */}
              <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                      <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-blue-400 relative z-10" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">Master Data</span>
                    {isPreviewing.master && (
                      <Badge className="ml-2 bg-blue-500 text-white animate-pulse">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Processing
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-base text-slate-600 dark:text-slate-400">Upload your reference Excel file</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="relative group min-h-[140px]">
                    <div className="absolute inset-0 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-colors duration-300 pointer-events-none" />
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => handleFileUpload(e, 'master')}
                      disabled={isComparing}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none group-hover:scale-105 transition-transform duration-300">
                      <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-3 flex-shrink-0" />
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center px-4">
                        {masterFile ? masterFile.name : 'Click or drag file here'}
                      </span>
                    </div>
                    {/* Loading Overlay */}
                    {isPreviewing.master && (
                      <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
                            <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin relative z-10" />
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Uploading & Previewing...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {masterPreview && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-blue-500/10 dark:bg-blue-500/20 rounded-lg p-3">
                        <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-md">{masterPreview.fileName}</Badge>
                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400">
                          <BarChart3 className="w-4 h-4" />
                          {masterPreview.totalRows.toLocaleString()} rows
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold text-slate-700 dark:text-slate-300">
                            Select Columns to Compare
                          </Label>
                          <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-xs font-medium px-2 py-1">
                            {selectedMasterColumns.length} selected
                          </Badge>
                        </div>
                        <ScrollArea className="h-52 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-4">
                          <div className="space-y-3">
                            {masterPreview.columns.map(column => (
                              <div key={column} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-colors duration-200">
                                <Checkbox
                                  id={`master-${column}`}
                                  checked={selectedMasterColumns.includes(column)}
                                  onCheckedChange={() => handleColumnToggle(column, 'master')}
                                  disabled={isComparing}
                                  className="w-5 h-5 border-slate-300 dark:border-slate-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                />
                                <Label
                                  htmlFor={`master-${column}`}
                                  className="text-sm cursor-pointer flex-1 font-medium"
                                >
                                  {column}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      {selectedMasterColumns.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedMasterColumns.map(col => (
                            <Badge key={col} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
                              {col}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {isPreviewing.master && (
                    <Skeleton className="h-32 w-full" />
                  )}
                </CardContent>
              </Card>

              {/* Secondary File Upload */}
              <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
                      <FileSpreadsheet className="w-6 h-6 text-purple-600 dark:text-purple-400 relative z-10" />
                    </div>
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">Secondary Data</span>
                    {isPreviewing.secondary && (
                      <Badge className="ml-2 bg-purple-500 text-white animate-pulse">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Processing
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-base text-slate-600 dark:text-slate-400">Upload your comparison Excel file</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="relative group min-h-[140px]">
                    <div className="absolute inset-0 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl group-hover:border-purple-400 dark:group-hover:border-purple-500 transition-colors duration-300 pointer-events-none" />
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => handleFileUpload(e, 'secondary')}
                      disabled={isComparing}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none group-hover:scale-105 transition-transform duration-300">
                      <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-3 flex-shrink-0" />
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center px-4">
                        {secondaryFile ? secondaryFile.name : 'Click or drag file here'}
                      </span>
                    </div>
                    {/* Loading Overlay */}
                    {isPreviewing.secondary && (
                      <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full animate-pulse" />
                            <Loader2 className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin relative z-10" />
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Uploading & Previewing...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {secondaryPreview && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-purple-500/10 dark:bg-purple-500/20 rounded-lg p-3">
                        <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-md">{secondaryPreview.fileName}</Badge>
                        <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-400">
                          <BarChart3 className="w-4 h-4" />
                          {secondaryPreview.totalRows.toLocaleString()} rows
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold text-slate-700 dark:text-slate-300">
                            Select Columns to Compare
                          </Label>
                          <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-xs font-medium px-2 py-1">
                            {selectedSecondaryColumns.length} selected
                          </Badge>
                        </div>
                        <ScrollArea className="h-52 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-4">
                          <div className="space-y-3">
                            {secondaryPreview.columns.map(column => (
                              <div key={column} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-purple-500/10 dark:hover:bg-purple-500/20 transition-colors duration-200">
                                <Checkbox
                                  id={`secondary-${column}`}
                                  checked={selectedSecondaryColumns.includes(column)}
                                  onCheckedChange={() => handleColumnToggle(column, 'secondary')}
                                  disabled={isComparing}
                                  className="w-5 h-5 border-slate-300 dark:border-slate-600 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                                />
                                <Label
                                  htmlFor={`secondary-${column}`}
                                  className="text-sm cursor-pointer flex-1 font-medium"
                                >
                                  {column}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      {selectedSecondaryColumns.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedSecondaryColumns.map(col => (
                            <Badge key={col} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
                              {col}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {isPreviewing.secondary && (
                    <Skeleton className="h-32 w-full" />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Compare Button */}
            <div className="text-center">
              <Button
                onClick={handleCompare}
                disabled={isComparing || !masterPreview || !secondaryPreview}
                size="lg"
                className="px-12 py-6 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isComparing ? (
                  <>
                    <Zap className="w-5 h-5 mr-2 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Compare Files Now
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
                    <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400 relative z-10" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                    Comparison History
                  </span>
                </CardTitle>
                <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                  View and manage your past comparisons
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-purple-500/10 blur-3xl rounded-full" />
                      <FileSpreadsheet className="w-20 h-20 text-slate-300 dark:text-slate-600 relative z-10" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      No comparison history yet
                    </h3>
                    <p className="text-base text-slate-500 dark:text-slate-400">
                      Upload and compare files to see them here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <Card key={item.id} className="border-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-bold text-base mb-3 bg-gradient-to-r from-slate-700 to-slate-600 dark:from-slate-300 dark:to-slate-400 bg-clip-text text-transparent">
                                {item.masterFile} vs {item.secondaryFile}
                              </h3>
                              <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total</div>
                                  <div className="font-bold text-lg text-slate-700 dark:text-slate-200">
                                    {item.totalRows.toLocaleString()}
                                  </div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                                  <div className="text-xs text-green-600 dark:text-green-400 mb-1">Matched</div>
                                  <div className="font-bold text-lg text-green-600 dark:text-green-400">
                                    {item.matchedRows.toLocaleString()}
                                  </div>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                                  <div className="text-xs text-red-600 dark:text-red-400 mb-1">Unmatched</div>
                                  <div className="font-bold text-lg text-red-600 dark:text-red-400">
                                    {item.unmatchedRows.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Progress
                                  value={(item.matchedRows / item.totalRows) * 100}
                                  className="h-2.5 bg-slate-200 dark:bg-slate-700 data-[state=complete]:bg-gradient-to-r data-[state=complete]:from-blue-500 data-[state=complete]:to-purple-500 data-[state=complete]:shadow-md"
                                />
                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                  <span>Match Rate: {((item.matchedRows / item.totalRows) * 100).toFixed(1)}%</span>
                                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleViewHistory(item)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(item.id)}
                                disabled={deletingId === item.id}
                                className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                              >
                                {deletingId === item.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
