import { z } from 'zod'

export const CreateTodoSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  recurrence_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  subtasks: z.array(z.string().min(1).max(500)).default([]),
  tag_ids: z.array(z.string().uuid()).default([]),
  reminder_minutes: z.number().int().min(15).max(10080).optional(),
})

export const UpdateTodoSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  is_completed: z.boolean().optional(),
  is_recurring: z.boolean().optional(),
  recurrence_pattern: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  recurrence_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
  reminder_minutes: z.number().int().min(15).max(10080).nullable().optional(),
})

export const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).default('#3b82f6'),
})

export const UpdateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
})

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  category: z.string().max(50).optional(),
  subtasks: z.array(z.string().min(1).max(500)).default([]),
  due_date_offset_days: z.number().int().min(0).max(365).optional(),
})

export const CreateReminderSchema = z.object({
  minutes_before: z.number().int().min(15).max(10080), // 15 min to 1 week
  is_enabled: z.boolean().default(true),
})

export type CreateTodo = z.infer<typeof CreateTodoSchema>
export type UpdateTodo = z.infer<typeof UpdateTodoSchema>
export type CreateTag = z.infer<typeof CreateTagSchema>
export type CreateTemplate = z.infer<typeof CreateTemplateSchema>
export type CreateReminder = z.infer<typeof CreateReminderSchema>
