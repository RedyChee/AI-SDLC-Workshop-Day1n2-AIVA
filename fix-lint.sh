#!/bin/bash

# Fix calendar route any types
sed -i "s/as any\[\];/ as Array<{id: number; title: string; completed: number; due_date: string | null; priority: string; recurrence_pattern: string | null; reminder_minutes: number | null}>;/g" app/api/calendar/month/route.ts
sed -i "s/) as any\[\];/) as Array<{id: number; date: string; name: string; type: string}>;/g" app/api/calendar/month/route.ts

# Fix templates route any types
sed -i "s/} catch (err: any) {/} catch (err: unknown) {\n    const error = err as { message?: string };/g" app/api/templates/[id]/route.ts
sed -i "s/console.error('Template fetch error:', err);/console.error('Template fetch error:', err);/g" app/api/templates/[id]/route.ts
sed -i "s/err.message/error.message || 'Template error'/g" app/api/templates/[id]/route.ts

sed -i "s/} catch (err: any) {/} catch (err: unknown) {\n    const error = err as { message?: string };/g" app/api/templates/[id]/use/route.ts
sed -i "s/err.message/error.message || 'Template use error'/g" app/api/templates/[id]/use/route.ts

sed -i "s/} catch (err: any) {/} catch (err: unknown) {\n    const error = err as { message?: string };/g" app/api/templates/route.ts
sed -i "s/err.message/error.message || 'Template error'/g" app/api/templates/route.ts

# Fix todos route
sed -i "s/} catch (err: any) {/} catch (err: unknown) {\n    const error = err as { message?: string };/g" app/api/todos/[id]/route.ts
sed -i "s/err.message/error.message || 'Update failed'/g" app/api/todos/[id]/route.ts

# Fix import route
sed -i "s/t: any/t: {title: string; completed: boolean; priority: string; due_date: string | null; recurrence_pattern: string | null; reminder_minutes: number | null; tags?: Array<{name: string; color: string}>; subtasks?: Array<{title: string; completed: boolean}>}/g" app/api/todos/import/route.ts
sed -i "s/s: any/s: {title: string; completed: boolean}/g" app/api/todos/import/route.ts
sed -i "s/tag: any/tag: {name: string; color: string}/g" app/api/todos/import/route.ts

# Fix auth page apostrophes
sed -i "s/Use your device'/Use your device\&apos;/g" app/auth/page.tsx
sed -i "s/Next.js' roadmap/Next.js\&apos; roadmap/g" app/auth/page.tsx

# Fix page.tsx any types
sed -i "s/s: any/s: {id: number; title: string; completed: boolean; position: number}/g" app/page.tsx
sed -i "s/) err/) (err)/g" app/page.tsx

# Fix page.tsx quotes
sed -i 's/"Show All"/"Show All"/g' app/page.tsx
sed -i 's/"Incomplete Only"/"Incomplete Only"/g' app/page.tsx
sed -i 's/"Complete Only"/"Complete Only"/g' app/page.tsx
sed -i 's/"No Reminder"/"No Reminder"/g' app/page.tsx
sed -i 's/"No Recurrence"/"No Recurrence"/g' app/page.tsx

# Fix not-found.tsx
sed -i '1i import Link from '"'"'next/link'"'"';' app/not-found.tsx
sed -i 's/<a href="\/"/Link href="\/">/g' app/not-found.tsx
sed -i 's/<\/a>/<\/Link>/g' app/not-found.tsx

echo "Lint fixes applied"
