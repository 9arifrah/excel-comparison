'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/page-layout/PageHeader'
import { 
  ArrowLeft,
  Plus,
  FileSpreadsheet,
  Trash2,
  Eye,
  Search,
  Filter,
  ArrowDownUp,
  CheckCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PAGE_THEMES, BUTTON_GRADIENTS, BACKGROUNDS, BORDERS, SPACING, SHADOWS, TYPOGRAPHY, COLORS, RADIUS } from '@/lib/constants/design-system'

interface HistoryItem {
  id: string
  masterFile: string
  secondaryFile: string
  totalRows: number
  matchedRows: number
  unmatchedRows: number
  createdAt: string
  comparisonMethod: 'exact' | 'fuzzy'
  similarityThreshold?: number
}

export default function HistoryScreen() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'matchRate'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Fetch history data from API
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/history')
        if (!response.ok) {
          throw new Error('Failed to fetch history')
        }
        const data = await response.json()
        
        // Transform API data to match HistoryItem interface
        const transformedData: HistoryItem[] = data.map((item: any) => ({
          id: item.id,
          masterFile: item.masterFile,
          secondaryFile: item.secondaryFile,
          totalRows: item.totalRows,
          matchedRows: item.matchedRows,
          unmatchedRows: item.unmatchedRows,
          createdAt: item.createdAt,
          comparisonMethod: 'exact' as 'exact' | 'fuzzy', // Default to exact for now
          similarityThreshold: undefined // Not stored in current schema
        }))
        
        setHistory(transformedData)
      } catch (error) {
        console.error('Error fetching history:', error)
        setHistory([]) // Set empty array on error
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchHistory()
  }, [])

  const handleDelete = async (id: string) => {
    const confirmed = confirm('Are you sure you want to delete this comparison? This action cannot be undone.')
    if (!confirmed) return
    setDeletingId(id)
    try {
      // In real app, call API to delete
      setHistory(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting comparison:', error)
      alert('Failed to delete comparison')
    } finally {
      setDeletingId(null)
    }
  }

  const handleView = (item: HistoryItem) => {
    router.push(`/compare/results?id=${item.id}`)
  }

  const filteredAndSortedHistory = history
    .filter(item => {
      const searchLower = searchQuery.toLowerCase()
      return (
        item.masterFile.toLowerCase().includes(searchLower) ||
        item.secondaryFile.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (sortBy === 'name') {
        comparison = a.masterFile.localeCompare(b.masterFile)
      } else if (sortBy === 'matchRate') {
        const rateA = (a.matchedRows / a.totalRows) * 100
        const rateB = (b.matchedRows / b.totalRows) * 100
        comparison = rateA - rateB
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const getMatchRate = (item: HistoryItem) => {
    return ((item.matchedRows / item.totalRows) * 100).toFixed(1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / 86400000)
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <PageHeader
          title="Comparison History"
          subtitle="View and manage your past comparisons"
          icon={<FileSpreadsheet className="w-10 h-10 text-purple-600 dark:text-purple-400" />}
          themeGradient={PAGE_THEMES.history}
          showBackButton={true}
          rightActions={
            <Button
              onClick={() => router.push('/')}
              className={`bg-gradient-to-r ${BUTTON_GRADIENTS.primary} shadow-lg`}
            >
              <Plus className="w-5 h-5 mr-2" />
              New Comparison
            </Button>
          }
        />

        {/* Filters */}
        <Card className="mb-8 border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search comparisons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                >
                  <option value="date">Date</option>
                  <option value="name">Name</option>
                  <option value="matchRate">Match Rate</option>
                </select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {sortOrder === 'asc' ? <ArrowDownUp className="w-4 h-4" /> : <ArrowDownUp className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-lg animate-pulse">
                <CardContent className="p-6 h-32" />
              </Card>
            ))}
          </div>
        ) : filteredAndSortedHistory.length === 0 ? (
          <Card className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-lg">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mx-auto mb-6">
                <FileSpreadsheet className="w-10 h-10 text-slate-400 dark:text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No comparison history yet
              </h3>
              <p className="text-base text-slate-500 dark:text-slate-400 mb-6">
                Upload and compare files to see them here
              </p>
              <Button
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Start Comparison
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedHistory.map((item) => (
              <Card key={item.id} className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-bold text-lg bg-gradient-to-r from-slate-700 to-slate-600 dark:from-slate-300 dark:to-slate-400 bg-clip-text text-transparent">
                          {item.masterFile} vs {item.secondaryFile}
                        </h3>
                        {item.comparisonMethod === 'fuzzy' && (
                          <Badge className="bg-purple-500 text-white">
                            Fuzzy ({item.similarityThreshold}%)
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
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

                      <Progress
                        value={parseFloat(getMatchRate(item))}
                        className="h-2.5 bg-slate-200 dark:bg-slate-700 data-[state=complete]:bg-gradient-to-r data-[state=complete]:from-blue-500 data-[state=complete]:to-purple-500 mb-2"
                      />
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Match Rate: {getMatchRate(item)}%</span>
                        </div>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleView(item)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-600 hover:border-red-400 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {deletingId === item.id ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent animate-spin rounded-full" /> : <Trash2 className="w-4 h-4" />}
              </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}