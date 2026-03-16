import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Import the schema
    const { comparisons } = await import('@/lib/db/schema')

    // Check if comparison exists
    const existingComparisons = await db.select().from(comparisons).where(eq(comparisons.id, id))

    if (existingComparisons.length === 0) {
      return NextResponse.json({ error: 'Comparison not found' }, { status: 404 })
    }

    // Delete comparison
    await db.delete(comparisons).where(eq(comparisons.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comparison:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
