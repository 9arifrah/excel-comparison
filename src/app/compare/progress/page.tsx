'use client'

import { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/page-layout/PageHeader'
import { ArrowLeft, Loader2, Zap, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PAGE_THEMES, BUTTON_GRADIENTS, BACKGROUNDS, BORDERS, SPACING, SHADOWS, TYPOGRAPHY, COLORS, RADIUS } from '@/lib/constants/design-system'

function ProgressScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState({
    stage: 'initializing' as 'initializing' | 'parsing' | 'building-index' | 'comparing' | 'complete',
    current: 0,
    total: 100,
    message: 'Initializing comparison...'
  })

  // Validate comparison ID on mount
  useEffect(() => {
    const id = searchParams.get('id')
    if (!id) {
      router.push('/')
    }
  }, [router, searchParams])

  // Simulate comparison progress
  useEffect(() => {
    const id = searchParams.get('id')
    if (!id) return

    let mounted = true
    let current = 0

    const stages = [
      { name: 'parsing', target: 30, message: 'Reading Excel files...' },
      { name: 'building-index', target: 60, message: 'Building index...' },
      { name: 'comparing', target: 90, message: 'Comparing data...' },
      { name: 'complete', target: 100, message: 'Finalizing...' }
    ]

    let stageIndex = 0

    const progressInterval = setInterval(() => {
      if (!mounted) {
        clearInterval(progressInterval)
        return
      }

      if (stageIndex >= stages.length) {
        clearInterval(progressInterval)
        // Redirect to results after a short delay
        setTimeout(() => {
          if (mounted) {
            router.push(`/compare/results?id=${id}`)
          }
        }, 1000)
        return
      }

      const stage = stages[stageIndex]

      if (current < stage.target) {
        current += Math.random() * 5
        if (current > stage.target) current = stage.target

        setProgress(prev => ({
          ...prev,
          stage: stage.name as any,
          current: Math.round(current),
          message: stage.message
        }))
      } else {
        stageIndex++
      }
    }, 200)

    return () => {
      mounted = false
      clearInterval(progressInterval)
    }
  }, [router, searchParams])

  const progressPercentage = Math.round((progress.current / progress.total) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <PageHeader
          title="Comparing Files"
          subtitle="Please wait while we process your files"
          icon={<Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          themeGradient={PAGE_THEMES.progress}
          showBackButton={true}
          rightActions={
            <div className="flex items-center gap-2 py-4 px-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <div className="flex-1 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <div className="flex-1 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm animate-pulse">
                3
              </div>
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-sm">
                4
              </div>
            </div>
          }
        />

        {/* Progress Card */}
        <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl animate-pulse" />
                <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 relative z-10 animate-spin" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                Processing Your Files
              </span>
            </CardTitle>
            <CardDescription className="text-base text-slate-600 dark:text-slate-400">
              {progress.stage === 'parsing' && 'Reading Excel files and extracting data...'}
              {progress.stage === 'building-index' && 'Building search index for efficient comparison...'}
              {progress.stage === 'comparing' && 'Comparing data and calculating similarities...'}
              {progress.stage === 'complete' && 'Finalizing comparison results...'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-4">
              <Progress
                value={progressPercentage}
                className="h-4 bg-slate-200 dark:bg-slate-700 data-[state=complete]:bg-gradient-to-r data-[state=complete]:from-blue-500 data-[state=complete]:to-purple-500"
              />
              <div className="flex justify-between items-center text-base font-medium text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  {progress.message}
                </span>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {progressPercentage}%
                </span>
              </div>
            </div>

            {/* Stage Indicators */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  progress.stage === 'parsing' || ['building-index', 'comparing', 'complete'].includes(progress.stage)
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {progress.stage === 'parsing' || ['building-index', 'comparing', 'complete'].includes(progress.stage) ? '✓' : '1'}
                </div>
                <span className={`text-sm font-semibold ${
                  progress.stage === 'parsing' || ['building-index', 'comparing', 'complete'].includes(progress.stage)
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400 dark:text-slate-600'
                }`}>
                  Reading Files
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  progress.stage === 'building-index' || ['comparing', 'complete'].includes(progress.stage)
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {progress.stage === 'building-index' || ['comparing', 'complete'].includes(progress.stage) ? '✓' : '2'}
                </div>
                <span className={`text-sm font-semibold ${
                  progress.stage === 'building-index' || ['comparing', 'complete'].includes(progress.stage)
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400 dark:text-slate-600'
                }`}>
                  Building Index
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  progress.stage === 'comparing' || progress.stage === 'complete'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {progress.stage === 'comparing' || progress.stage === 'complete' ? '✓' : '3'}
                </div>
                <span className={`text-sm font-semibold ${
                  progress.stage === 'comparing' || progress.stage === 'complete'
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400 dark:text-slate-600'
                }`}>
                  Comparing Data
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  progress.stage === 'complete'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {progress.stage === 'complete' ? '✓' : '4'}
                </div>
                <span className={`text-sm font-semibold ${
                  progress.stage === 'complete'
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400 dark:text-slate-600'
                }`}>
                  Finalizing
                </span>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    This may take a few moments
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Large files with many rows may take longer. Please don't close this page.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ProgressPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 backdrop-blur-sm shadow-2xl">
            <CardContent className="p-12 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <ProgressScreen />
    </Suspense>
  )
}