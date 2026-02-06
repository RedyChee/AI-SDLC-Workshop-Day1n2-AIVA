# Quick Start Guide - Phase 1

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Server will start at: **http://localhost:3000**

### 3. Create Your First User
1. Open browser to http://localhost:3000
2. You'll be redirected to `/register`
3. Enter a username (e.g., "demo")
4. Click "Register with Passkey"
5. Follow browser prompts to create passkey (Face ID/Touch ID/Windows Hello)
6. Automatically logged in!

---

## ✅ What's Working

### Phase 1 Features (PRPs 01-02)
- ✅ **Todo CRUD**: Create, Read, Update, Delete todos
- ✅ **Priority System**: High/Medium/Low with color-coded badges
- ✅ **Smart Sections**: Overdue (red) / Pending / Completed
- ✅ **Time Display**: Color-coded urgency (red/orange/yellow/blue)
- ✅ **Filtering**: Search by title, filter by priority
- ✅ **Authentication**: WebAuthn/Passkeys (no passwords!)
- ✅ **Singapore Timezone**: All dates in Asia/Singapore
- ✅ **Dark Mode**: Full support with adapted colors

---

## 📋 Quick Test Checklist

Try these after logging in:

1. **Create a todo**: Enter title, click "Add"
2. **Set priority**: Choose High/Medium/Low from dropdown
3. **Add due date**: Use datetime picker, must be future date
4. **Edit todo**: Click "Edit" button, modify, click "Update"
5. **Complete todo**: Click checkbox → moves to Completed
6. **Delete todo**: Click "Delete" button (no confirmation)
7. **Filter by priority**: Use "Priority Filter" dropdown
8. **Search**: Type in search box to filter by title
9. **Toggle dark mode**: Use system preferences

---

## 🎯 Example Workflows

### Create High Priority Task with Due Date
1. Type: "Submit quarterly report"
2. Select Priority: **High**
3. Set due date: Tomorrow at 5:00 PM
4. Click "Add"
5. **Result**: Todo appears in Pending with red "high" badge

### Filter High Priority Items
1. Create several todos with different priorities
2. Click "Priority Filter" dropdown
3. Select "High Priority"
4. **Result**: Only high priority todos visible

### Complete and Uncomplete
1. Click checkbox on any todo
2. **Result**: Moves to Completed section
3. Click checkbox again
4. **Result**: Returns to Pending or Overdue

---

## 🔧 Environment Variables

Located in `.env.local`:
```env
JWT_SECRET=dev-secret-key-change-in-production
RP_ID=localhost
ORIGIN=http://localhost:3000
```

For production, update `RP_ID` and `ORIGIN` to your domain.

---

## 📁 Key Files

- **Main Page**: `app/page.tsx` (550+ lines, all todo features)
- **Database**: `lib/db.ts` (schema + operations)
- **API Routes**: `app/api/todos/**` and `app/api/auth/**`
- **Authentication**: `lib/auth.ts` (JWT sessions)
- **Timezone**: `lib/timezone.ts` (Singapore timezone)

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Clean cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

### WebAuthn not working
- Use **Chrome, Edge, or Safari** (Firefox may require config)
- Must use **localhost** or **HTTPS** (WebAuthn requirement)
- Check browser console for errors

### Database issues
```bash
# Delete database and restart (fresh start)
rm todos.db
npm run dev
```

### TypeScript errors
```bash
# Rebuild type definitions
npm run build
```

---

## 📚 Documentation

- **Full Implementation Details**: [PHASE1_IMPLEMENTATION.md](PHASE1_IMPLEMENTATION.md)
- **User Guide**: [USER_GUIDE.md](USER_GUIDE.md)
- **PRP 01**: [PRPs/01-todo-crud-operations.md](PRPs/01-todo-crud-operations.md)
- **PRP 02**: [PRPs/02-priority-system.md](PRPs/02-priority-system.md)

---

## 🎉 You're Ready!

Phase 1 is complete and working. Start creating todos and explore the features!

**Next**: Implement Phase 2 features (recurring todos, reminders, subtasks) using the remaining PRPs.
