import { NextResponse, NextRequest } from 'next/server'
import { todoDB } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title } = body

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Subtask title is required' },
        { status: 400 }
      )
    }

    const todo = await todoDB.getById(id)
    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      )
    }

    const newSubtask = await todoDB.addSubtask(id, title.trim())

    return NextResponse.json(
      {
        success: true,
        data: newSubtask,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/todos/[id]/subtasks error:', error)
    return NextResponse.json(
      { error: 'Failed to create subtask' },
      { status: 400 }
    )
  }
}
