'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/page-layout/PageHeader'
import { StatsCard } from '@/components/page-layout/StatsCard'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft,
  CheckCircle, 
  XCircle, 
  BarChart3, 
  Download, 
  Plus,
  History,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronLeft as ChevronsLeft,
  ChevronRight as ChevronsRight
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PAGE_THEMES, BUTTON_GRADIENTS, BACKGROUNDS, BORDERS, SPACING, SHADOWS, TYPOGRAPHY, COLORS, RADIUS } from '@/lib/constants/design-system'

export default function ResultsScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filterStatus, setFilterStatus] = useState<'all' | 'matched' | 'unmatched'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [comparisonResult, setComparisonResult] = useState<any>(null)
  const [comparisonData, setComparisonData] = useState<any[]>([])

  // Fetch comparison data from API
  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const id = searchParams.get('id') || 'sample'
        // Fetch without server-side pagination to do client-side filtering
        const response = await fetch(`/api/comparison/${id}?page=1&limit=10000&filter=all`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch comparison')
        }
        
        const data = await response.json()
        
        setComparisonResult(data)
        setComparisonData(data.comparisonData || [])
      } catch (error) {
        console.error('Error fetching comparison:', error)
        setComparisonResult(null)
        setComparisonData([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchComparison()
  }, [searchParams])

  // Reset to page 1 when search query or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus])

  // Show loading state while fetching data
  if (isLoading || !comparisonResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-lg animate-pulse">
                <CardContent className="p-6 h-32" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const matchRate = ((comparisonResult.matchedRows / comparisonResult.totalRows) * 100).toFixed(1)

  // Filter data based on status and search query
  const filteredData = comparisonData.filter(item => {
    // Filter by status
    if (filterStatus !== 'all') {
      if (filterStatus === 'matched' && !item.matched) return false
      if (filterStatus === 'unmatched' && item.matched) return false
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const searchText = Object.values(item.data).join(' ').toLowerCase()
      if (!searchText.includes(query)) return false
    }
    
    return true
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)

  const getFieldNames = () => {
    if (comparisonData.length === 0) return []
    return Object.keys(comparisonData[0].data)
  }

  const getSimilarityColor = (score?: number) => {
    if (score === undefined) return 'text-slate-500'
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const handleExport = async () => {
    try {
      const id = searchParams.get('id')
      if (!id) {
        alert('No comparison ID found')
        return
      }
      
      const response = await fetch(`/api/export/${id}`)
      if (!response.ok) {
        throw new Error('Failed to export')
      }
      
      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `comparison_result_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Failed to export results')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <PageHeader
          title="Comparison Complete!"
          subtitle={`${comparisonResult.masterFile} vs ${comparisonResult.secondaryFile}`}
          icon={<CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />}
          themeGradient={PAGE_THEMES.results}
          showBackButton={true}
          onBack={() => router.push('/compare/settings')}
          rightActions={
            <div className="flex items-center gap-2 py-4 px-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <div className="flex-1 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <div className="flex-1 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <div className="flex-1 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                ✓
              </div>
            </div>
          }
        />

        {/* Results Card */}
        <Card className="mb-8 border-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 blur-xl" />
                <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400 relative z-10" />
              </div>
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
                Comparison Results
              </span>
            </CardTitle>
            <CardDescription className="text-base text-slate-600 dark:text-slate-400">
              {comparisonResult.comparisonMethod === 'fuzzy' && (
                <Badge className="bg-purple-500 text-white ml-2">
                  Fuzzy Matching ({comparisonResult.similarityThreshold}%)
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {comparisonResult.totalRows.toLocaleString()}
                </div>
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">Total Rows</div>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {comparisonResult.matchedRows.toLocaleString()}
                </div>
                <div className="text-sm font-semibold text-green-600 dark:text-green-400 mt-1">Matched</div>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  {comparisonResult.unmatchedRows.toLocaleString()}
                </div>
                <div className="text-sm font-semibold text-red-600 dark:text-red-400 mt-1">Unmatched</div>
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
                className="h-4 bg-slate-200 dark:bg-slate-700 data-[state=complete]:bg-gradient-to-r data-[state=complete]:from-blue-500 data-[state=complete]:to-purple-500" 
              />
            </div>

            {/* Comparison Table */}
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                    Detailed Results
                  </span>
                </CardTitle>
                <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                  {filteredData.length} rows displayed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filter Buttons */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => setFilterStatus('all')}
                      variant={filterStatus === 'all' ? 'default' : 'outline'}
                      className={filterStatus === 'all' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md' 
                        : 'bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 shadow-sm hover:shadow-md'
                      }
                    >
                      All ({comparisonData.length})
                    </Button>
                    <Button
                      onClick={() => setFilterStatus('matched')}
                      variant={filterStatus === 'matched' ? 'default' : 'outline'}
                      className={filterStatus === 'matched'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md'
                        : 'bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 shadow-sm hover:shadow-md'
                      }
                    >
                      Matched ({comparisonResult.matchedRows})
                    </Button>
                    <Button
                      onClick={() => setFilterStatus('unmatched')}
                      variant={filterStatus === 'unmatched' ? 'default' : 'outline'}
                      className={filterStatus === 'unmatched'
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-md'
                        : 'bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-600 hover:border-red-400 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 shadow-sm hover:shadow-md'
                      }
                    >
                      Unmatched ({comparisonResult.unmatchedRows})
                    </Button>
                  </div>
                </div>

                {/* Search and Rows Per Page */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1 w-full md:w-auto">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Search all columns..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Rows per page:</span>
                    <Select value={rowsPerPage.toString()} onValueChange={(value) => setRowsPerPage(Number(value))}>
                      <SelectTrigger className="w-32 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 rows</SelectItem>
                        <SelectItem value="25">25 rows</SelectItem>
                        <SelectItem value="50">50 rows</SelectItem>
                        <SelectItem value="100">100 rows</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Table with pagination info */}
                <div className="overflow-x-auto border-2 border-slate-200 dark:border-slate-700 rounded-xl">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 bg-slate-100/50 dark:bg-slate-800/50">
                        <TableHead className="sticky left-0 z-20 w-16 font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 shadow-md">Row #</TableHead>
                        <TableHead className="sticky left-16 z-20 w-48 pr-6 font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 shadow-md">Status</TableHead>
                        {getFieldNames().map((fieldName) => (
                          <TableHead key={fieldName} className="font-bold text-slate-700 dark:text-slate-300 min-w-[120px] pl-6">
                            {fieldName}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((item) => (
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
                          <TableCell className="sticky left-16 z-20 w-48 pr-6 bg-green-50/30 dark:bg-green-900/10 shadow-sm">
                            <div className="space-y-1">
                              <Badge className={`${item.matched ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-orange-500'} text-white border-0 shadow-md`}>
                                {item.matched ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                {item.matched ? 'Matched' : 'Unmatched'}
                              </Badge>
                              {item.similarityScore !== undefined && (
                                <div className={`text-sm font-bold ${getSimilarityColor(item.similarityScore)}`}>
                                  {item.similarityScore.toFixed(1)}%
                                </div>
                              )}
                            </div>
                          </TableCell>
                          {getFieldNames().map((fieldName) => {
                            const value = (item.data as any)[fieldName]
                            const displayValue = value !== undefined && value !== null && value !== '' ? String(value) : 'N/A'
                            const colSimilarity = item.columnSimilarities?.[fieldName]
                            return (
                              <TableCell 
                                key={`${item.row}-${fieldName}`}
                                className="text-slate-700 dark:text-slate-300 min-w-[120px] pl-6"
                              >
                                {displayValue}
                                {colSimilarity !== undefined && (
                                  <div className={`text-xs font-medium ${getSimilarityColor(colSimilarity)}`}>
                                    {colSimilarity.toFixed(1)}%
                                  </div>
                                )}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} rows
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      variant="outline"
                      className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 p-2"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="outline"
                      className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 px-3 py-2"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-slate-300 dark:border-slate-700">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Page</span>
                      <Input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={currentPage}
                        onChange={(e) => {
                          const page = Math.min(Math.max(1, parseInt(e.target.value) || 1), totalPages)
                          setCurrentPage(page)
                        }}
                        className="w-16 text-center font-bold bg-transparent border-0 p-0 focus-visible:ring-0"
                      />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">of {totalPages}</span>
                    </div>
                    <Button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      variant="outline"
                      className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 px-3 py-2"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage >= totalPages}
                      variant="outline"
                      className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 p-2"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button 
                variant="outline"
                onClick={() => router.push('/history')}
                className="flex-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <History className="w-5 h-5 mr-2" />
                View History
              </Button>
              <Button 
                onClick={handleExport}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Download className="w-5 h-5 mr-2" />
                Export Results
              </Button>
              <Button 
                onClick={() => router.push('/')}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Comparison
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}