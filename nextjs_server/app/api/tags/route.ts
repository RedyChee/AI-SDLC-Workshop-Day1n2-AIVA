import { NextResponse, NextRequest } from 'next/server'
import { CreateTagSchema } from '@/lib/validation'
import { tagDB } from '@/lib/db'

export async function GET() {
  try {
    const tags = await tagDB.getAll('user-1')

    return NextResponse.json({
      success: true,
      data: tags,
    })
  } catch (error) {
    console.error('GET /api/tags error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = CreateTagSchema.parse(body)

    const tag = await tagDB.create({
      name: validated.name,
      color: validated.color,
    })

    return NextResponse.json(
      {
        success: true,
        data: tag,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/tags error:', error)
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 400 }
    )
  }
}
