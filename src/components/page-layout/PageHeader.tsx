'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { BUTTON_GRADIENTS, BORDERS, ICON_SIZES, SHADOWS, TYPOGRAPHY } from '@/lib/constants/design-system'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  themeGradient?: string
  showBackButton?: boolean
  backHref?: string
  onBack?: () => void
  rightActions?: ReactNode
}

export function PageHeader({
  title,
  subtitle,
  icon,
  themeGradient = 'from-blue-600 to-purple-600',
  showBackButton = false,
  backHref,
  onBack,
  rightActions
}: PageHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backHref) {
      window.location.href = backHref
    } else {
      window.history.back()
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {showBackButton && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-5 h-5 mr-2 text-slate-600 dark:text-slate-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Back</span>
          </Button>
        )}
        {rightActions && (
          <div className="flex gap-2">
            {rightActions}
          </div>
        )}
        {(!showBackButton && !rightActions) && <div className="flex-1" />}
      </div>

      <div className={`flex items-center justify-center gap-3`}>
        {icon && (
          <div className={`relative`}>
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
            <div className={ICON_SIZES.page + ' rounded-full bg-blue-500/10 flex items-center justify-center relative z-10'}>
              {icon}
            </div>
          </div>
        )}
        <h1 className={`text-3xl font-bold bg-gradient-to-r ${themeGradient} bg-clip-text text-transparent`}>
          {title}
        </h1>
      </div>

      {subtitle && (
        <p className={TYPOGRAPHY.pageSubtitle + ' text-center text-lg mt-2'}>
          {subtitle}
        </p>
      )}
    </div>
  )
}