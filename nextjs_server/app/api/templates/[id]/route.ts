import { NextRequest, NextResponse } from 'next/server'
import { templateDB } from '@/lib/db'
import { CreateTemplateSchema } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const template = await templateDB.getById(id)

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: template })
  } catch (error) {
    console.error('GET /api/templates/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = CreateTemplateSchema.partial().parse(body)

    const updated = templateDB.update(id, {
      ...validated,
      subtasks_json: validated.subtasks?.length ? JSON.stringify(validated.subtasks) : undefined,
    })

    if (!updated) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/templates/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await templateDB.getById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    templateDB.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/templates/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
