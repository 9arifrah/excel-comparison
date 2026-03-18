'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function OAuthErrorHandler() {
  const searchParams = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const oauthError = searchParams.get('error')
    const errorDescription = searchParams.get('description')

    if (oauthError) {
      setError(errorDescription || 'Authentication failed. Please try again.')
      // Clear URL params after reading
      window.history.replaceState({}, '', '/login')
    }
  }, [searchParams])

  if (!error) return null

  return (
    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl">
      <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
    </div>
  )
}

export function OAuthErrorWrapper() {
  return (
    <Suspense fallback={null}>
      <OAuthErrorHandler />
    </Suspense>
  )
}
