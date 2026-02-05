# Todo App - Next.js 16 Implementation

A complete Todo application implementing PRPs 01-10 with priority, recurring todos, reminders, subtasks, tags, templates, search, export/import, and calendar view.

## Features Implemented

### Core Features (PRPs 01-02)
- ✅ **Todo CRUD Operations** - Create, read, update, delete todos with Singapore timezone support
- ✅ **Priority System** - Three-level priority (High/Medium/Low) with color-coded badges and automatic sorting

### Advanced Features (PRPs 03-07)
- 🔄 **Recurring Todos** - Daily, weekly, monthly, yearly patterns with automatic next instance creation
- 🔔 **Reminders & Notifications** - Configurable reminders (15m to 1 week before)
- ✓ **Subtasks & Progress** - Checklist functionality with progress bars
- 🏷️ **Tag System** - Color-coded labels with many-to-many relationships
- 📋 **Templates** - Save and reuse todo patterns with customizable offsets

### Productivity Features (PRPs 08-10)
- 🔍 **Search & Filtering** - Real-time text search with advanced criteria
- 📤 **Export/Import** - JSON-based backup/restore with data validation
- 📅 **Calendar View** - Monthly calendar display with Singapore public holidays

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite via better-sqlite3
- **Styling**: Tailwind CSS 4
- **Testing**: Playwright (E2E)
- **Timezone**: Singapore (Asia/Singapore)
- **Validation**: Zod

## Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

## Docker Deployment

From the repository root:

```bash
docker compose up --build
```

The app will be available at `http://localhost:3000`.

## Project Structure

```
.
├── app/
│   ├── api/                    # API routes
│   │   ├── todos/             # Todo CRUD endpoints
│   │   ├── tags/              # Tag management
│   │   └── templates/         # Template endpoints
│   ├── components/            # React components
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── lib/
│   ├── db.ts                 # Database initialization & helpers
│   ├── types.ts              # TypeScript types
│   ├── validation.ts         # Zod schemas
│   └── timezone.ts           # Singapore timezone utilities
├── public/                   # Static assets
├── tests/
│   └── e2e/                  # Playwright tests
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## Database Schema

### Core Tables
- **users** - User accounts
- **todos** - Main todo items with priority, due dates, recurrence
- **subtasks** - Checklist items for todos
- **tags** - Custom labels/categories
- **todo_tags** - Many-to-many relationship
- **templates** - Reusable todo patterns
- **reminders** - Notification settings per todo

All timestamps are in Singapore timezone (Asia/Singapore).

## API Endpoints

### Todos
- `GET /api/todos` - List all todos
- `POST /api/todos` - Create todo
- `GET /api/todos/:id` - Get single todo
- `PATCH /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo

### Tags
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create tag
- `GET /api/tags/:id` - Get single tag
- `PATCH /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag

### Templates
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template

## Running Tests

```bash
# Run E2E tests
npm test

# Run with UI
npm run test:ui

# Debug mode
npm run test:debug
```

## Singapore Timezone

All date/time operations use Singapore timezone (Asia/Singapore). Utility functions are provided in `lib/timezone.ts`:

- `getNowSingapore()` - Get current time in Singapore
- `toSingaporeDateString(date)` - Convert to YYYY-MM-DD format
- `isOverdue(dueDate)` - Check if todo is overdue
- `getNextRecurrenceDate(lastDate, pattern)` - Calculate next recurrence

## Environment Variables

```
DATABASE_URL=file:./app.db
NEXT_PUBLIC_APP_NAME=Todo App
NEXT_PUBLIC_APP_URL=http://localhost:3000
TZ=Asia/Singapore
```

## Development

### Build
```bash
npm run build
npm start
```

### Code Quality
- TypeScript for type safety
- Zod for runtime validation
- Tailwind CSS for styling
- Better-sqlite3 for synchronous database operations (no async/await)

## Notes

- **Database Operations**: All DB operations are synchronous (better-sqlite3)
- **User Context**: Currently using mock user ID. Replace with actual session/auth
- **Client Components**: All interactive components use `'use client'`
- **Server Actions**: Use `'use server'` for server-side operations

## Next Steps for Production

1. Implement WebAuthn authentication (PRP 11)
2. Add session management with JWT
3. Replace mock user ID with actual session data
4. Set up database migrations
5. Configure production database
6. Add email notifications for reminders
7. Deploy to Railway or Vercel

## Related Documentation

- See `../PRPs/README.md` for detailed feature specifications
- See `.github/copilot-instructions.md` for coding patterns
