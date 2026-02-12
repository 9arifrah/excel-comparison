'use client'

import { ReactNode } from 'react'
import { COLORS, ICON_SIZES, TYPOGRAPHY } from '@/lib/constants/design-system'

interface StatsCardProps {
  value: string | number
  label: string
  icon?: ReactNode
  colorType?: 'info' | 'success' | 'warning' | 'danger'
}

export function StatsCard({ value, label, icon, colorType = 'info' }: StatsCardProps) {
  const getIconContainerClass = () => {
    switch (colorType) {
      case 'info':
        return 'bg-blue-500/10'
      case 'success':
        return 'bg-green-500/10'
      case 'warning':
        return 'bg-yellow-500/10'
      case 'danger':
        return 'bg-red-500/10'
      default:
        return 'bg-blue-500/10'
    }
  }

  const getIconColor = () => {
    switch (colorType) {
      case 'info':
        return COLORS.icon.primary
      case 'success':
        return COLORS.icon.success
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'danger':
        return COLORS.icon.danger
      default:
        return COLORS.icon.primary
    }
  }

  const getCardBg = () => {
    switch (colorType) {
      case 'info':
        return COLORS.bg.info
      case 'success':
        return COLORS.bg.success
      case 'warning':
        return COLORS.bg.warning
      case 'danger':
        return COLORS.bg.danger
      default:
        return COLORS.bg.info
    }
  }

  const getValueClass = () => {
    switch (colorType) {
      case 'info':
        return 'bg-gradient-to-r from-blue-600 to-purple-600'
      case 'success':
        return 'bg-gradient-to-r from-green-600 to-emerald-600'
      case 'warning':
        return 'bg-gradient-to-r from-yellow-600 to-orange-600'
      case 'danger':
        return 'bg-gradient-to-r from-red-600 to-orange-600'
      default:
        return 'bg-gradient-to-r from-blue-600 to-purple-600'
    }
  }

  return (
    <div className={`${getCardBg()} rounded-xl p-6 shadow-lg`}>
      <div className="flex items-center justify-center mb-3">
        {icon ? (
          <div className={`w-12 h-12 rounded-lg ${getIconContainerClass()} flex items-center justify-center`}>
            {icon}
          </div>
        ) : null}
      </div>
      <div className={`text-4xl font-bold ${getValueClass()} bg-clip-text text-transparent`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className={`text-sm font-semibold mt-1 ${
        colorType === 'success' ? 'text-green-600 dark:text-green-400' :
        colorType === 'danger' ? 'text-red-600 dark:text-red-400' :
        'text-slate-600 dark:text-slate-400'
      }`}>
        {label}
      </div>
    </div>
  )
}