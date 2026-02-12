'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-layout/PageHeader'
import { Loader2, FileSpreadsheet, Upload, ArrowRight, Settings, Sliders, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PAGE_THEMES } from '@/lib/constants/design-system'
import { X } from 'lucide-react'

type ThresholdPreset = 'strict' | 'high' | 'medium' | 'low' | 'custom'

export default function NewComparisonScreen() {
  const router = useRouter()
  const [masterFile, setMasterFile] = useState<File | null>(null)
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null)
  const [selectedMasterColumns, setSelectedMasterColumns] = useState<string[]>([])
  const [selectedSecondaryColumns, setSelectedSecondaryColumns] = useState<string[]>([])
  const [enableFuzzyMatching, setEnableFuzzyMatching] = useState(false)
  const [similarityThreshold, setSimilarityThreshold] = useState(85)
  const [thresholdPreset, setThresholdPreset] = useState<ThresholdPreset>('high')
  const [isComparing, setIsComparing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState<{ master: boolean; secondary: boolean }>({
    master: false,
    secondary: false
  })

  // Mock data for preview
  const [masterPreview, setMasterPreview] = useState<any>(null)
  const [secondaryPreview, setSecondaryPreview] = useState<any>(null)

  const masterFileInputRef = useRef<HTMLInputElement>(null)
  const secondaryFileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'master' | 'secondary') => {
    const file = event.target.files?.[0]
    if (!file) return

    if (type === 'master') {
      setMasterFile(file)
      setIsAnalyzing(prev => ({ ...prev, master: true }))
      setSelectedMasterColumns([])
      setMasterPreview({
        fileName: file.name,
        totalRows: 1250,
        columns: ['Name', 'Email', 'Phone', 'Address', 'City']
      })
      setTimeout(() => setIsAnalyzing(prev => ({ ...prev, master: false })), 500)
    } else {
      setSecondaryFile(file)
      setIsAnalyzing(prev => ({ ...prev, secondary: true }))
      setSelectedSecondaryColumns([])
      setSecondaryPreview({
        fileName: file.name,
        totalRows: 1180,
        columns: ['Name', 'Email', 'Phone', 'Address', 'City']
      })
      setTimeout(() => setIsAnalyzing(prev => ({ ...prev, secondary: false })), 500)
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

  const handleThresholdPresetChange = (preset: ThresholdPreset) => {
    setThresholdPreset(preset)
    switch (preset) {
      case 'strict': setSimilarityThreshold(95); break
      case 'high': setSimilarityThreshold(85); break
      case 'medium': setSimilarityThreshold(75); break
      case 'low': setSimilarityThreshold(50); break
      case 'custom': break
    }
  }

  const handleCompare = async () => {
    setError(null)
    setIsComparing(true)

    try {
      // Validate
      if (!masterFile || !secondaryFile) {
        setError('Please upload both files')
        setIsComparing(false)
        return
      }

      if (selectedMasterColumns.length === 0 || selectedSecondaryColumns.length === 0) {
        setError('Please select at least one column from each file')
        setIsComparing(false)
        return
      }

      // Create FormData
      const formData = new FormData()
      formData.append('masterFile', masterFile)
      formData.append('secondaryFile', secondaryFile)
      formData.append('masterColumns', JSON.stringify(selectedMasterColumns))
      formData.append('secondaryColumns', JSON.stringify(selectedSecondaryColumns))
      formData.append('enableFuzzyMatching', String(enableFuzzyMatching))
      formData.append('similarityThreshold', String(similarityThreshold))

      // Call API
      const response = await fetch('/api/compare', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Comparison failed')
      }

      const data = await response.json()

      // Redirect to progress page with comparison ID
      router.push(`/compare/progress?id=${data.id}`)
    } catch (err) {
      console.error('Error starting comparison:', err)
      setError((err as Error).message || 'Failed to start comparison. Please try again.')
      setIsComparing(false)
    }
  }

  const canCompare = masterFile && secondaryFile &&
    selectedMasterColumns.length > 0 &&
    selectedSecondaryColumns.length > 0 &&
    !isComparing

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <PageHeader
          title="New Comparison"
          subtitle="Upload files and configure comparison settings"
          icon={<FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          themeGradient={PAGE_THEMES.upload}
          showBackButton={true}
          onBack={() => router.push('/')}
        />

        {/* Error Alert */}
        {error && (
          <Card className="mb-6 border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-100">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Master File */}
          <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                  Master Data
                </span>
                {isAnalyzing.master && (
                  <Badge className="ml-2 bg-blue-500 text-white animate-pulse">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Processing
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Upload your reference Excel file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="relative group min-h-[140px]">
                <div className="absolute inset-0 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-colors duration-300 pointer-events-none" />
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileUpload(e, 'master')}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  ref={masterFileInputRef}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none">
                  {masterFile ? (
                    <>
                      <Upload className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-3" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center">
                        {masterFile.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-3" />
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center">
                        Click or drag file here
                      </span>
                    </>
                  )}
                </div>
              </div>

              {masterPreview && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-blue-500/10 dark:bg-blue-500/20 rounded-lg p-3">
                    <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                      {masterPreview.fileName}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400">
                      {masterPreview.totalRows.toLocaleString()} rows
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Select Columns</Label>
                      <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-xs">
                        {selectedMasterColumns.length} selected
                      </Badge>
                    </div>
                    <ScrollArea className="h-52 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 p-4">
                      <div className="space-y-3">
                        {masterPreview.columns.map(column => (
                          <div key={column} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-500/10 dark:hover:bg-blue-500/20">
                            <Checkbox
                              id={`master-${column}`}
                              checked={selectedMasterColumns.includes(column)}
                              onCheckedChange={() => handleColumnToggle(column, 'master')}
                            />
                            <Label htmlFor={`master-${column}`} className="text-sm cursor-pointer flex-1">
                              {column}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Secondary File */}
          <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                  Secondary Data
                </span>
                {isAnalyzing.secondary && (
                  <Badge className="ml-2 bg-purple-500 text-white animate-pulse">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Processing
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Upload your comparison Excel file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="relative group min-h-[140px]">
                <div className="absolute inset-0 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl group-hover:border-purple-400 dark:group-hover:border-purple-500 transition-colors duration-300 pointer-events-none" />
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileUpload(e, 'secondary')}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  ref={secondaryFileInputRef}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none">
                  {secondaryFile ? (
                    <>
                      <Upload className="w-10 h-10 text-purple-600 dark:text-purple-400 mb-3" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center">
                        {secondaryFile.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-3" />
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center">
                        Click or drag file here
                      </span>
                    </>
                  )}
                </div>
              </div>

              {secondaryPreview && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-purple-500/10 dark:bg-purple-500/20 rounded-lg p-3">
                    <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                      {secondaryPreview.fileName}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-400">
                      {secondaryPreview.totalRows.toLocaleString()} rows
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Select Columns</Label>
                      <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-xs">
                        {selectedSecondaryColumns.length} selected
                      </Badge>
                    </div>
                    <ScrollArea className="h-52 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 p-4">
                      <div className="space-y-3">
                        {secondaryPreview.columns.map(column => (
                          <div key={column} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-purple-500/10 dark:hover:bg-purple-500/20">
                            <Checkbox
                              id={`secondary-${column}`}
                              checked={selectedSecondaryColumns.includes(column)}
                              onCheckedChange={() => handleColumnToggle(column, 'secondary')}
                            />
                            <Label htmlFor={`secondary-${column}`} className="text-sm cursor-pointer flex-1">
                              {column}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Settings Card */}
        <Card className="mb-8 border-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                Matching Settings
              </span>
            </CardTitle>
            <CardDescription>Configure comparison behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex items-center justify-between p-6 bg-white/50 dark:bg-slate-800/50 rounded-xl">
              <div className="space-y-2">
                <Label className="text-lg font-bold">Matching Mode</Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {enableFuzzyMatching ? 'Fuzzy matching finds similar data' : 'Exact match requires identical values'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${!enableFuzzyMatching ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                  Exact
                </span>
                <Switch
                  checked={enableFuzzyMatching}
                  onCheckedChange={setEnableFuzzyMatching}
                />
                <span className={`text-sm font-semibold ${enableFuzzyMatching ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`}>
                  Fuzzy
                </span>
              </div>
            </div>

            {enableFuzzyMatching && (
              <div className="space-y-6 p-6 bg-white/50 dark:bg-slate-800/50 rounded-xl border-2 border-purple-200/50 dark:border-purple-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <Label className="text-lg font-bold flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      Similarity Threshold
                    </Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Minimum similarity percentage to consider a match
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={similarityThreshold}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10)
                        if (!isNaN(value) && value >= 0 && value <= 100) {
                          setSimilarityThreshold(value)
                          setThresholdPreset('custom')
                        }
                      }}
                      className="w-24 text-right font-bold text-lg"
                    />
                    <span className="text-xl font-bold text-slate-600 dark:text-slate-400">%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { preset: 'strict' as ThresholdPreset, label: 'Strict', threshold: 95, color: 'from-red-500 to-orange-500' },
                    { preset: 'high' as ThresholdPreset, label: 'High', threshold: 85, color: 'from-orange-500 to-yellow-500' },
                    { preset: 'medium' as ThresholdPreset, label: 'Medium', threshold: 75, color: 'from-yellow-500 to-green-500' },
                    { preset: 'low' as ThresholdPreset, label: 'Low', threshold: 50, color: 'from-green-500 to-blue-500' },
                  ].map(({ preset, label, threshold, color }) => (
                    <Button
                      key={preset}
                      onClick={() => handleThresholdPresetChange(preset)}
                      variant={thresholdPreset === preset ? 'default' : 'outline'}
                      className={`p-4 ${thresholdPreset === preset ? `bg-gradient-to-r ${color} border-0 shadow-md` : 'border-slate-300 dark:border-slate-600'}`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold">{label}</span>
                        <span className="text-sm opacity-80">{threshold}%+</span>
                      </div>
                    </Button>
                  ))}
                </div>

                <Progress
                  value={similarityThreshold}
                  className="h-4"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end items-center">
          <Button
            onClick={handleCompare}
            disabled={!canCompare}
            size="lg"
            className="px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {isComparing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Starting Comparison...
              </>
            ) : (
              <>
                Start Comparison
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}