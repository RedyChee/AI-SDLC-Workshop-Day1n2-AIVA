import { NextResponse, NextRequest } from 'next/server'
import { UpdateTagSchema } from '@/lib/validation'
import { tagDB } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tag = await tagDB.getById(id)

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tag,
    })
  } catch (error) {
    console.error('GET /api/tags/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = UpdateTagSchema.parse(body)

    const tag = await tagDB.getById(id)
    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    const updated = tagDB.update(id, validated)

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('PATCH /api/tags/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update tag' },
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
    const tag = await tagDB.getById(id)
    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    tagDB.delete(id)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('DELETE /api/tags/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    )
  }
}
