'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-layout/PageHeader'
import { Loader2, FileSpreadsheet, Upload, BarChart3, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PAGE_THEMES, BUTTON_GRADIENTS, BACKGROUNDS, BORDERS, SPACING, SHADOWS, TYPOGRAPHY, COLORS, RADIUS } from '@/lib/constants/design-system'

export default function UploadScreen() {
  const router = useRouter()
  const [masterFile, setMasterFile] = useState<File | null>(null)
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null)
  const [isPreviewing, setIsPreviewing] = useState<{ master: boolean; secondary: boolean }>({
    master: false,
    secondary: false
  })
  const [selectedMasterColumns, setSelectedMasterColumns] = useState<string[]>([])
  const [selectedSecondaryColumns, setSelectedSecondaryColumns] = useState<string[]>([])

  // Mock data - in real app, this would come from API
  const masterPreview = masterFile ? {
    fileName: masterFile.name,
    totalRows: 1250,
    columns: ['Name', 'Email', 'Phone', 'Address', 'City']
  } : null

  const secondaryPreview = secondaryFile ? {
    fileName: secondaryFile.name,
    totalRows: 1180,
    columns: ['Name', 'Email', 'Phone', 'Address', 'City']
  } : null

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'master' | 'secondary') => {
    const file = event.target.files?.[0]
    if (!file) return

    if (type === 'master') {
      setMasterFile(file)
      setSelectedMasterColumns([])
    } else {
      setSecondaryFile(file)
      setSelectedSecondaryColumns([])
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

  const canProceed = masterFile && secondaryFile &&
    selectedMasterColumns.length > 0 &&
    selectedSecondaryColumns.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <PageHeader
          title="Upload Files"
          subtitle="Upload your Excel files and select columns to compare"
          icon={<FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          themeGradient={PAGE_THEMES.upload}
          showBackButton={true}
          onBack={() => router.push('/')}
          rightActions={
            <div className="flex items-center gap-2 py-4 px-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div className="flex-1 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-sm">
                4
              </div>
            </div>
          }
        />

        {/* File Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Master File */}
          <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none group-hover:scale-105 transition-transform duration-300">
                  <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-3 flex-shrink-0" />
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center px-4">
                    {masterFile ? masterFile.name : 'Click or drag file here'}
                  </span>
                </div>
                {isPreviewing.master && (
                  <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
                    <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
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
                              className="w-5 h-5 border-slate-300 dark:border-slate-600 data-[state=checked]:bg-blue-500"
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
                        <Badge key={col} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-md">
                          {col}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Secondary File */}
          <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none group-hover:scale-105 transition-transform duration-300">
                  <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-3 flex-shrink-0" />
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center px-4">
                    {secondaryFile ? secondaryFile.name : 'Click or drag file here'}
                  </span>
                </div>
                {isPreviewing.secondary && (
                  <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
                    <Loader2 className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin" />
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
                              className="w-5 h-5 border-slate-300 dark:border-slate-600 data-[state=checked]:bg-purple-500"
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
                        <Badge key={col} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-md">
                          {col}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center">
          <Button
            onClick={() => router.push('/compare/settings')}
            disabled={!canProceed}
            size="lg"
            className="px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next: Settings
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}