import { NextResponse, NextRequest } from 'next/server'
import { todoDB } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updated = todoDB.updateSubtask(id, body)

    if (!updated) {
      return NextResponse.json(
        { error: 'Subtask not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('PATCH /api/subtasks/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update subtask' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    todoDB.deleteSubtask(id)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('DELETE /api/subtasks/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete subtask' },
      { status: 500 }
    )
  }
}
