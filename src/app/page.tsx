'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileSpreadsheet,
  BarChart3,
  ArrowRight,
  Zap,
  CheckCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
              <FileSpreadsheet className="w-20 h-20 text-blue-600 dark:text-blue-400 relative z-10" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Excel Data Comparison
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xl font-medium mb-8">
            Perbandingan Excel berkinerja tinggi dengan dukungan fuzzy matching
          </p>
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span>Fuzzy Matching Diaktifkan</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Dukungan 150.000+ baris</span>
            </div>
          </div>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* New Comparison Card */}
          <Card 
            className="border-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 backdrop-blur-sm shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 cursor-pointer"
            onClick={() => router.push('/compare/upload')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                  <FileSpreadsheet className="w-8 h-8 text-blue-600 dark:text-blue-400 relative z-10" />
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold text-2xl">
                  New Comparison
                </span>
              </CardTitle>
              <CardDescription className="text-lg text-slate-600 dark:text-slate-400">
                Upload dan bandingkan file Excel Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Upload File</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Upload file Excel master dan sekunder
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-800/50 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Konfigurasi Pengaturan</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Pilih exact match atau fuzzy matching
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Mulai Perbandingan
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* History Card */}
          <Card 
            className="border-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 backdrop-blur-sm shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 cursor-pointer"
            onClick={() => router.push('/history')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
                  <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400 relative z-10" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold text-2xl">
                  View History
                </span>
              </CardTitle>
              <CardDescription className="text-lg text-slate-600 dark:text-slate-400">
                Akses perbandingan sebelumnya
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-800/50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Perbandingan Sebelumnya</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Lihat dan analisis hasil sebelumnya
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-800/50 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Akses Cepat</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Gunakan ulang pengaturan dan export hasil
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Lihat Riwayat
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">
                  Fuzzy Matching
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Bandingkan data dengan ambang kemiripan yang dapat dikonfigurasi menggunakan algoritma Jaro-Winkler
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">
                  Kinerja Tinggi
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Dioptimalkan dengan indeks fonetik untuk menangani file dengan 150.000+ baris
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">
                  UX Multi-Layar
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Antarmuka step-by-step yang bersih dengan navigasi intuitif
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Section */}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Alur Kerja Aplikasi
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Ikuti 4 langkah sederhana untuk membandingkan data Excel Anda
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 dark:from-blue-500/20 dark:to-blue-500/10 backdrop-blur-sm shadow-lg">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FileSpreadsheet className="w-8 h-8 text-white" />
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center mx-auto mb-4 border-4 border-blue-500">
                  <span className="font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300 mb-3">Upload File</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Upload file Excel master dan sekunder yang ingin dibandingkan
                </p>
                <div className="flex items-center justify-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>File Excel (.xlsx, .xls)</span>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-purple-500/5 dark:from-purple-500/20 dark:to-purple-500/10 backdrop-blur-sm shadow-lg">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center mx-auto mb-4 border-4 border-purple-500">
                  <span className="font-bold text-purple-600 dark:text-purple-400">2</span>
                </div>
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300 mb-3">Pilih Kolom</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Pilih kolom dari kedua file yang ingin dibandingkan
                </p>
                <div className="flex items-center justify-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-medium">
                  <CheckCircle className="w-3 h-3" />
                  <span>Pilih kolom kunci</span>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="border-0 bg-gradient-to-br from-pink-500/10 to-pink-500/5 dark:from-pink-500/20 dark:to-pink-500/10 backdrop-blur-sm shadow-lg">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-800 flex items-center justify-center mx-auto mb-4 border-4 border-pink-500">
                  <span className="font-bold text-pink-600 dark:text-pink-400">3</span>
                </div>
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300 mb-3">Konfigurasi</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Pilih exact match atau fuzzy matching dengan ambang kemiripan yang diinginkan
                </p>
                <div className="flex items-center justify-center gap-1 text-xs text-pink-600 dark:text-pink-400 font-medium">
                  <Zap className="w-3 h-3" />
                  <span>Mode perbandingan</span>
                </div>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 dark:from-emerald-500/20 dark:to-emerald-500/10 backdrop-blur-sm shadow-lg">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center mx-auto mb-4 border-4 border-emerald-500">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">4</span>
                </div>
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300 mb-3">Lihat Hasil</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Lihat hasil perbandingan, analisis data, dan export ke Excel
                </p>
                <div className="flex items-center justify-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <BarChart3 className="w-3 h-3" />
                  <span>Analisis & export</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}