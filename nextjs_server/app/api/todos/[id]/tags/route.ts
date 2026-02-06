import { NextRequest, NextResponse } from 'next/server'
import { tagDB, todoDB } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const tagId = body?.tag_id as string | undefined

    if (!tagId) {
      return NextResponse.json({ error: 'tag_id is required' }, { status: 400 })
    }

    const todo = await todoDB.getById(id)
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    const tag = await tagDB.getById(tagId)
    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    const nextTags = todo.tags.some((t: any) => t.id === tagId)
      ? todo.tags
      : [...todo.tags, tag]

    const updated = await todoDB.update(id, { tags: nextTags } as any)

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('POST /api/todos/[id]/tags error:', error)
    return NextResponse.json({ error: 'Failed to add tag' }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const tagId = body?.tag_id as string | undefined

    if (!tagId) {
      return NextResponse.json({ error: 'tag_id is required' }, { status: 400 })
    }

    const todo = await todoDB.getById(id)
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    const nextTags = todo.tags.filter((tag: any) => tag.id !== tagId)
    const updated = await todoDB.update(id, { tags: nextTags } as any)

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('DELETE /api/todos/[id]/tags error:', error)
    return NextResponse.json({ error: 'Failed to remove tag' }, { status: 400 })
  }
}
