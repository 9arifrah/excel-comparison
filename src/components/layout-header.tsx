'use client'

import { usePathname } from 'next/navigation'
import { UserMenu } from '@/components/user-menu'
import { FileSpreadsheet } from 'lucide-react'

export function LayoutHeader() {
  const pathname = usePathname()

  // Hide header on login page
  if (pathname === '/login') {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Excel Comparison
          </h1>
        </div>

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  )
}
