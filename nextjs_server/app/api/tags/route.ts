import { NextResponse, NextRequest } from 'next/server'
import { CreateTagSchema } from '@/lib/validation'
import { tagDB } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get user_id from query params or use default
    const userId = request.nextUrl.searchParams.get('user_id') || 'user-1'
    const tags = await tagDB.getAll(userId)

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

    // Get user_id from request body or use default
    const userId = body.user_id || 'user-1'

    const tag = await tagDB.create(userId, validated.name, validated.color)

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
