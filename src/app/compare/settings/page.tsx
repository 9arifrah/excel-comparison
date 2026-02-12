'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/page-layout/PageHeader'
import { ArrowRight, Settings, Sliders, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PAGE_THEMES, BUTTON_GRADIENTS, BACKGROUNDS, BORDERS, SPACING, SHADOWS, TYPOGRAPHY, COLORS, RADIUS } from '@/lib/constants/design-system'

type ThresholdPreset = 'strict' | 'high' | 'medium' | 'low' | 'custom'

export default function SettingsScreen() {
  const router = useRouter()
  const [enableFuzzyMatching, setEnableFuzzyMatching] = useState(false)
  const [similarityThreshold, setSimilarityThreshold] = useState(85)
  const [thresholdPreset, setThresholdPreset] = useState<ThresholdPreset>('high')
  const [isComparing, setIsComparing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasData, setHasData] = useState(false)

  // Check if we have data from upload page
  useEffect(() => {
    const uploadData = localStorage.getItem('comparisonData')
    if (!uploadData) {
      // Redirect to upload if no data
      router.push('/compare/upload')
    } else {
      setHasData(true)
    }
  }, [router])

  const handleCompare = async () => {
    setError(null)
    setIsComparing(true)

    try {
      // Get data from localStorage
      const uploadDataStr = localStorage.getItem('comparisonData')
      if (!uploadDataStr) {
        setError('No data found. Please upload files first.')
        setIsComparing(false)
        return
      }

      const uploadData = JSON.parse(uploadDataStr)

      // Create FormData
      const formData = new FormData()
      
      // Note: We need to pass the actual file data, but localStorage can't store Files
      // For now, we'll redirect to progress and let the user know this needs to be fixed
      // This is a known limitation that will be addressed by restructuring the flow
      
      // As a temporary workaround, alert the user
      alert('File data cannot be passed between pages. Please restructure the flow to use a server-side approach or pass file data differently.')
      
      setIsComparing(false)
    } catch (err) {
      console.error('Error starting comparison:', err)
      setError('Failed to start comparison. Please try again.')
      setIsComparing(false)
    }
  }

  const handleThresholdPresetChange = (preset: ThresholdPreset) => {
    setThresholdPreset(preset)
    switch (preset) {
      case 'strict':
        setSimilarityThreshold(95)
        break
      case 'high':
        setSimilarityThreshold(85)
        break
      case 'medium':
        setSimilarityThreshold(75)
        break
      case 'low':
        setSimilarityThreshold(50)
        break
      case 'custom':
        break
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <PageHeader
          title="Comparison Settings"
          subtitle="Configure how files are compared"
          icon={<Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          themeGradient={PAGE_THEMES.settings}
          showBackButton={true}
          onBack={() => router.push('/compare/upload')}
          rightActions={
            <div className="flex items-center gap-2 py-4 px-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <div className="flex-1 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
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

        {/* Settings Card */}
        <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
                <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400 relative z-10" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                Matching Configuration
              </span>
            </CardTitle>
            <CardDescription className="text-base text-slate-600 dark:text-slate-400">
              Choose between exact match or fuzzy matching for flexible comparison
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Matching Mode Toggle */}
            <div className="flex items-center justify-between p-6 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <div className="space-y-2">
                <Label className="text-lg font-bold text-slate-700 dark:text-slate-300">Matching Mode</Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {enableFuzzyMatching 
                    ? 'Fuzzy matching finds similar data based on similarity percentages' 
                    : 'Exact match requires identical values for a match'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${!enableFuzzyMatching ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                    Exact Match
                  </span>
                  <Switch
                    checked={enableFuzzyMatching}
                    onCheckedChange={setEnableFuzzyMatching}
                    className="data-[state=checked]:bg-purple-500"
                  />
                  <span className={`text-sm font-semibold ${enableFuzzyMatching ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    Fuzzy Matching
                  </span>
                </div>
              </div>
            </div>

            {/* Similarity Threshold - Only show when fuzzy matching is enabled */}
            {enableFuzzyMatching && (
              <div className="space-y-6 p-6 bg-white/50 dark:bg-slate-800/50 rounded-xl border-2 border-purple-200/50 dark:border-purple-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <Label className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
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

                {/* Preset Buttons */}
                <div className="space-y-2 mb-6">
                  <Label className="text-base font-semibold text-slate-700 dark:text-slate-300">Quick Presets</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button
                      onClick={() => handleThresholdPresetChange('strict')}
                      variant={thresholdPreset === 'strict' ? 'default' : 'outline'}
                      size="lg"
                      className={thresholdPreset === 'strict'
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-md border-0 py-6'
                        : 'border-slate-300 dark:border-slate-600 py-6'
                      }
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold">Strict</span>
                        <span className="text-sm opacity-80">95%+</span>
                      </div>
                    </Button>
                    <Button
                      onClick={() => handleThresholdPresetChange('high')}
                      variant={thresholdPreset === 'high' ? 'default' : 'outline'}
                      size="lg"
                      className={thresholdPreset === 'high'
                        ? 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 shadow-md border-0 py-6'
                        : 'border-slate-300 dark:border-slate-600 py-6'
                      }
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold">High</span>
                        <span className="text-sm opacity-80">85%+</span>
                      </div>
                    </Button>
                    <Button
                      onClick={() => handleThresholdPresetChange('medium')}
                      variant={thresholdPreset === 'medium' ? 'default' : 'outline'}
                      size="lg"
                      className={thresholdPreset === 'medium'
                        ? 'bg-gradient-to-r from-yellow-500 to-green-500 hover:from-yellow-600 hover:to-green-600 shadow-md border-0 py-6'
                        : 'border-slate-300 dark:border-slate-600 py-6'
                      }
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold">Medium</span>
                        <span className="text-sm opacity-80">75%+</span>
                      </div>
                    </Button>
                    <Button
                      onClick={() => handleThresholdPresetChange('low')}
                      variant={thresholdPreset === 'low' ? 'default' : 'outline'}
                      size="lg"
                      className={thresholdPreset === 'low'
                        ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-md border-0 py-6'
                        : 'border-slate-300 dark:border-slate-600 py-6'
                      }
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold">Low</span>
                        <span className="text-sm opacity-80">50%+</span>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Visual Threshold Indicator */}
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Strictness Level</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {similarityThreshold}%
                    </span>
                  </div>
                  <Progress
                    value={similarityThreshold}
                    className={`h-4 ${
                      similarityThreshold >= 90 ? 'data-[state=complete]:bg-gradient-to-r data-[state=complete]:from-red-500 data-[state=complete]:to-orange-500' :
                      similarityThreshold >= 75 ? 'data-[state=complete]:bg-gradient-to-r data-[state=complete]:from-orange-500 data-[state=complete]:to-yellow-500' :
                      similarityThreshold >= 60 ? 'data-[state=complete]:bg-gradient-to-r data-[state=complete]:from-yellow-500 data-[state=complete]:to-green-500' :
                      'data-[state=complete]:bg-gradient-to-r data-[state=complete]:from-green-500 data-[state=complete]:to-blue-500'
                    } bg-slate-200 dark:bg-slate-700`}
                  />
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500" />
                      <span>Loose</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500" />
                      <span>Strict</span>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center flex-shrink-0">
                      <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Higher threshold = More strict matching
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Use High (85%+) for general data, or Strict (95%+) for critical matches
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end items-center mt-8">
          <Button
            onClick={() => router.push('/compare/progress')}
            size="lg"
            className="px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Start Comparison
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}