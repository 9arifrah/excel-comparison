import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check authentication
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Import the schema
    const { comparisons } = await import('@/lib/db/schema')

    // Check if comparison exists and belongs to user
    const existingComparisons = await db.select().from(comparisons).where(eq(comparisons.id, id))

    if (existingComparisons.length === 0) {
      return NextResponse.json({ error: 'Comparison not found' }, { status: 404 })
    }

    const comparison = existingComparisons[0]

    // Check ownership
    if (comparison.userId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this comparison' },
        { status: 403 }
      )
    }

    // Delete comparison
    await db.delete(comparisons).where(and(eq(comparisons.id, id), eq(comparisons.userId, userId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comparison:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
