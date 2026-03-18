'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, FileSpreadsheet, Lock, Mail, User, ArrowRight } from 'lucide-react'

type AuthMode = 'signin' | 'signup'

export default function LoginPageV2() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const oauthError = searchParams.get('error')
  const errorDescription = searchParams.get('description')

  if (oauthError && !error) {
    setError(errorDescription || 'Authentication failed. Please try again.')
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user && !data.session) {
      setSuccessMessage('Account created! Please check your email to confirm your account.')
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/')
      router.refresh()
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth-callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleGithubAuth = async () => {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth-callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError('')
    setSuccessMessage('')
    setFullName('')
    setEmail('')
    setPassword('')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      {/* Left Side - Minimal Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-white dark:text-black" />
            </div>
            <span className="text-xl font-semibold text-slate-900 dark:text-slate-100">Excel Comparison</span>
          </div>

          {/* Minimal Copy */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Compare Excel data with precision.
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Advanced fuzzy matching algorithms for intelligent data comparison and analysis.
            </p>
          </div>

          {/* Features - Minimal */}
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <div className="w-5 h-5 rounded bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-white dark:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm">Fuzzy matching algorithms</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <div className="w-5 h-5 rounded bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-white dark:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm">150,000+ rows processing</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <div className="w-5 h-5 rounded bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-white dark:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm">Enterprise-grade security</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Clean Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-white dark:text-black" />
            </div>
            <span className="text-xl font-semibold text-slate-900 dark:text-slate-100">Excel Comparison</span>
          </div>

          {/* Mode Toggle - Minimal */}
          <div className="mb-8">
            {mode === 'signin' ? (
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Welcome back
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Don't have an account?{' '}
                  <button
                    onClick={() => switchMode('signup')}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Create account
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Already have an account?{' '}
                  <button
                    onClick={() => switchMode('signin')}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-400">{successMessage}</p>
            </div>
          )}

          {/* Social Auth - Minimal */}
          <div className="space-y-3 mb-6">
            <Button
              onClick={handleGoogleAuth}
              disabled={loading}
              variant="outline"
              className="w-full h-10 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continue with Google
            </Button>
            <Button
              onClick={handleGithubAuth}
              disabled={loading}
              variant="outline"
              className="w-full h-10 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              )}
              Continue with GitHub
            </Button>
          </div>

          {/* Divider - Minimal */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                or
              </span>
            </div>
          </div>

          {/* Auth Form - Minimal */}
          <form onSubmit={mode === 'signin' ? handleEmailLogin : handleEmailSignup} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1">
                <Label htmlFor="fullName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={mode === 'signup'}
                  disabled={loading}
                  className="h-10"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-10"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </Label>
                {mode === 'signin' && (
                  <a href="#" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    Forgot?
                  </a>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder={mode === 'signin' ? 'Enter password' : 'Create a password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                className="h-10"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Terms */}
          {mode === 'signup' && (
            <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
              By signing up, you agree to our{' '}
              <a href="#" className="text-slate-700 dark:text-slate-300 hover:underline">
                Terms
              </a>{' '}
              and{' '}
              <a href="#" className="text-slate-700 dark:text-slate-300 hover:underline">
                Privacy
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
