/**
 * Design System Constants
 * Centralized design tokens for consistent UI across all pages
 */

export const PAGE_THEMES = {
  landing: 'from-blue-600 via-purple-600 to-pink-600',
  upload: 'from-blue-600 to-purple-600',
  settings: 'from-purple-600 to-pink-600',
  progress: 'from-blue-600 to-purple-600',
  results: 'from-green-600 to-emerald-600',
  history: 'from-purple-600 to-pink-600'
} as const

export const CARD_GRADIENTS = {
  primary: 'from-blue-500/10 to-purple-500/10',
  secondary: 'from-purple-500/10 to-pink-500/10',
  success: 'from-green-500/10 to-emerald-500/10',
  darkPrimary: 'dark:from-blue-500/20 dark:to-purple-500/20',
  darkSecondary: 'dark:from-purple-500/20 dark:to-pink-500/20',
  darkSuccess: 'dark:from-green-500/20 dark:to-emerald-500/20'
} as const

export const BUTTON_GRADIENTS = {
  primary: 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
  secondary: 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
  success: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
  danger: 'from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
} as const

export const TYPOGRAPHY = {
  pageHeading: 'text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
  pageSubtitle: 'text-base text-slate-600 dark:text-slate-400',
  cardTitle: 'text-xl font-bold',
  cardDescription: 'text-base text-slate-600 dark:text-slate-400',
  sectionLabel: 'text-base font-bold text-slate-700 dark:text-slate-300',
  sectionLabelSmall: 'text-sm font-semibold text-slate-700 dark:text-slate-300'
} as const

export const SPACING = {
  pagePadding: 'py-12',
  containerPadding: 'px-4',
  cardPadding: 'p-6',
  cardInnerPadding: 'p-4',
  cardGap: 'space-y-4',
  sectionGap: 'space-y-6',
  headerGap: 'space-y-2'
} as const

export const ICON_SIZES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  xxl: 'w-10 h-10',
  page: 'w-10 h-10',
  card: 'w-8 h-8'
} as const

export const SHADOWS = {
  card: 'shadow-lg',
  cardHover: 'hover:shadow-xl transition-shadow duration-300',
  cardScale: 'hover:scale-105 transition-all duration-300',
  button: 'shadow-lg hover:shadow-xl transition-all duration-300',
  buttonLarge: 'shadow-2xl hover:shadow-3xl transition-all duration-300'
} as const

export const BORDERS = {
  card: 'border border-slate-200/50 dark:border-slate-700/50',
  cardNone: 'border-0',
  button: 'border-slate-300 dark:border-slate-600'
} as const

export const BACKGROUNDS = {
  card: 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm',
  cardSection: 'bg-white/50 dark:bg-slate-800/50',
  input: 'bg-white/50 dark:bg-slate-800/50',
  page: 'bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950'
} as const

export const RADIUS = {
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full'
} as const

export const COLORS = {
  text: {
    primary: 'text-slate-700 dark:text-slate-300',
    secondary: 'text-slate-600 dark:text-slate-400',
    muted: 'text-slate-500 dark:text-slate-400'
  },
  bg: {
    info: 'bg-blue-50 dark:bg-blue-900/20',
    success: 'bg-green-50 dark:bg-green-900/20',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
    danger: 'bg-red-50 dark:bg-red-900/20'
  },
  icon: {
    primary: 'text-blue-600 dark:text-blue-400',
    secondary: 'text-purple-600 dark:text-purple-400',
    success: 'text-green-600 dark:text-green-400',
    danger: 'text-red-600 dark:text-red-400'
  }
} as const