import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if comparison exists
    const comparison = await db.comparison.findUnique({
      where: { id }
    })

    if (!comparison) {
      return NextResponse.json({ error: 'Comparison not found' }, { status: 404 })
    }

    // Delete comparison
    await db.comparison.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comparison:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
