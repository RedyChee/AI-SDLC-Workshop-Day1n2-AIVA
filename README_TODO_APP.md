# Todo App - AI-Augmented SDLC Workshop

A modern, feature-rich todo application built with Next.js 16, React 19, and SQLite. This app demonstrates the implementation of a complete CRUD system with priority management, recurring tasks, and Singapore timezone support.

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### Development Login

For development and testing purposes, click the "Login as Test User" button on the home page. This creates a test user session without requiring WebAuthn authentication.

## ✨ Features Implemented

### Phase 1: Todo CRUD Operations (Current)

✅ **Create Todos**
- Add todos with title, priority, and optional due date
- Title validation (non-empty, trimmed)
- Due date validation (must be at least 1 minute in future, Singapore timezone)
- Priority levels: Low, Medium, High

✅ **Read Todos**
- Fetch all todos for authenticated user
- Organized into sections: Overdue, Pending, Completed
- Automatic sorting by priority, due date, and creation time

✅ **Update Todos**
- Edit todo title, priority, and due date
- Toggle completion status with checkbox
- Recurring todo support (creates next instance on completion)
- Optimistic UI updates for instant feedback

✅ **Delete Todos**
- Delete todos with confirmation
- Cascade deletion of subtasks and tag associations
- Optimistic UI removal

## 🗄️ Database Schema

### Tables Created
- `users` - User accounts
- `authenticators` - WebAuthn credentials
- `todos` - Todo items with priority, due dates, recurrence
- `subtasks` - Checklist items for todos
- `tags` - Color-coded labels
- `todo_tags` - Many-to-many relationship
- `templates` - Reusable todo patterns
- `holidays` - Singapore public holidays

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19, Tailwind CSS 4
- **Database**: SQLite via better-sqlite3 (synchronous)
- **Authentication**: JWT sessions (WebAuthn ready)
- **Timezone**: Asia/Singapore throughout
- **Testing**: Playwright (E2E tests ready)

### Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── dev-login/        # Development authentication
│   │   └── todos/
│   │       ├── route.ts           # GET /api/todos, POST /api/todos
│   │       └── [id]/route.ts      # GET, PUT, DELETE /api/todos/:id
│   ├── globals.css                # Tailwind styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main todo page (2200+ lines)
├── lib/
│   ├── db.ts                      # Database schema & operations (~700 lines)
│   ├── auth.ts                    # Session management
│   └── timezone.ts                # Singapore timezone utilities
├── PRPs/                          # Product Requirement Prompts
│   ├── 01-todo-crud-operations.md
│   └── ...                        # Additional feature PRPs
└── todos.db                       # SQLite database (auto-created)
```

## 🌏 Singapore Timezone

All date/time operations use `Asia/Singapore` timezone:
- Due date validation
- Overdue calculation
- Date formatting
- Recurring todo scheduling

**Never use `new Date()` directly** - always use `getSingaporeNow()` from `lib/timezone.ts`.

## 🔧 API Endpoints

### Todos

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | Fetch all user's todos |
| POST | `/api/todos` | Create new todo |
| GET | `/api/todos/:id` | Get specific todo |
| PUT | `/api/todos/:id` | Update todo |
| DELETE | `/api/todos/:id` | Delete todo |

### Authentication (Development)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/dev-login` | Create test user session |

## 📝 Usage Examples

### Creating a Todo

```typescript
POST /api/todos
{
  "title": "Complete project report",
  "priority": "high",
  "due_date": "2026-02-10T14:00:00"
}
```

### Updating a Todo

```typescript
PUT /api/todos/1
{
  "completed": true,
  "priority": "medium"
}
```

### UI Features

**Form Controls:**
- Title input: Required, auto-trimmed
- Priority selector: Low, Medium, High (default: Medium)
- Due date picker: Optional, enforces future dates (Singapore time)
- Add button: Disabled during submission

**Todo Display:**
- Color-coded priority badges (Red/Yellow/Blue)
- Urgency indicators for due dates:
  - Red: Overdue or < 1 hour
  - Orange: < 24 hours
  - Yellow: < 7 days
  - Blue: 7+ days
- Checkbox: Toggle completion
- Edit button: Opens modal with current values
- Delete button: Confirms before deletion

**Sections:**
- Overdue: Incomplete todos past due date
- Pending: Incomplete todos not yet overdue
- Completed: All completed todos

## 🧪 Testing

### E2E Testing with Playwright

```bash
# Run all tests
npx playwright test

# Run in UI mode
npx playwright test --ui

# Run specific test file
npx playwright test tests/01-todo-crud.spec.ts

# View test report
npx playwright show-report
```

### Manual Testing Checklist

- [ ] Create todo with only title
- [ ] Create todo with title + priority + due date
- [ ] Reject empty title
- [ ] Reject past due date
- [ ] Edit todo details
- [ ] Toggle completion status
- [ ] Delete todo
- [ ] Verify section organization

## 🔐 Authentication

**Current State:** Development login bypass for testing

**Future:** WebAuthn/Passkeys authentication
- No passwords required
- Biometric authentication (fingerprint, Face ID)
- Secure credential storage
- See `PRPs/11-authentication-webauthn.md`

## 📚 Documentation

- **[USER_GUIDE.md](USER_GUIDE.md)**: Comprehensive 2000+ line user guide
- **[PRPs/](PRPs/)**: Detailed Product Requirement Prompts for each feature
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)**: AI agent instructions

## 🚧 Next Steps

Refer to `PRPs/README.md` for implementation priorities:

**Phase 2: Core Features**
- Recurring Todos (PRP-03)
- Reminders & Notifications (PRP-04)
- Subtasks & Progress Tracking (PRP-05)

**Phase 3: Organization**
- Tag System (PRP-06)
- Search & Filtering (PRP-08)

**Phase 4: Productivity**
- Template System (PRP-07)
- Export & Import (PRP-09)
- Calendar View (PRP-10)

**Phase 5: Authentication**
- WebAuthn/Passkeys (PRP-11)

## 🛠️ Development Guidelines

### Critical Patterns

1. **Singapore Timezone**: Always use `lib/timezone.ts` functions
2. **Async Params**: In Next.js 16, route params are promises: `const { id } = await params`
3. **Synchronous DB**: better-sqlite3 operations don't use async/await
4. **Null Coalescing**: Use `?? 0` or `|| null` for potentially undefined DB fields
5. **Optimistic Updates**: Update UI immediately, revert on API failure

### Code Conventions

- Database operations in `lib/db.ts`
- All business logic in API routes
- Client components for UI (`'use client'`)
- Export types from `lib/db.ts`

## 📄 License

MIT

## 👥 Contributing

This project is part of the AI-Augmented SDLC Workshop. See PRPs for detailed implementation guides.

---

**Last Updated:** February 6, 2026  
**Version:** 1.0.0  
**Status:** Phase 1 Complete ✅
