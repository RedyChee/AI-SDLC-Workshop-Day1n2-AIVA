import { NextRequest, NextResponse } from 'next/server'
import { templateDB, todoDB } from '@/lib/db'
import { getNowSingapore, toSingaporeDateString } from '@/lib/timezone'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const template = await templateDB.getById(id)

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const now = getNowSingapore()
    const dueDate = template.due_date_offset_days !== undefined
      ? (() => {
          const date = new Date(now)
          date.setDate(date.getDate() + (template.due_date_offset_days || 0))
          return toSingaporeDateString(date)
        })()
      : undefined

    const subtasks = template.subtasks_json ? JSON.parse(template.subtasks_json) : []
    const created = todoDB.create({
      title: template.title,
      description: template.description,
      priority: template.priority,
      due_date: dueDate,
      subtasks,
    })

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error) {
    console.error('POST /api/templates/[id]/use error:', error)
    return NextResponse.json({ error: 'Failed to use template' }, { status: 400 })
  }
}
