'use client'

import { usePathname } from 'next/navigation'
import { UserMenu } from '@/components/user-menu'

export function LayoutHeader() {
  const pathname = usePathname()

  // Hide header on login page
  if (pathname === '/login') {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">Excel Comparison</span>
        </div>
        <UserMenu />
      </div>
    </header>
  )
}
