import { NextResponse, NextRequest } from 'next/server'
import { CreateTemplateSchema } from '@/lib/validation'
import { templateDB } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get user_id from query params or use default
    const userId = request.nextUrl.searchParams.get('user_id') || 'user-1'
    const templates = await templateDB.getAll(userId)

    return NextResponse.json({
      success: true,
      data: templates,
    })
  } catch (error) {
    console.error('GET /api/templates error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = CreateTemplateSchema.parse(body)

    // Get user_id from request body or use default
    const userId = body.user_id || 'user-1'

    const template = await templateDB.create(userId, {
      name: validated.name,
      title: validated.title,
      description: validated.description,
      priority: validated.priority,
      category: validated.category,
      subtasks: validated.subtasks,
      due_date_offset_days: validated.due_date_offset_days,
    })

    return NextResponse.json(
      {
        success: true,
        data: template,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/templates error:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 400 }
    )
  }
}
