import { useEffect } from 'react'

interface ReminderPayload {
  id: string
  title: string
  due_date: string
  minutes_before: number
}

export function useNotifications() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    const ensurePermission = async () => {
      if (Notification.permission === 'default') {
        await Notification.requestPermission()
      }
    }

    const poll = async () => {
      try {
        await ensurePermission()
        if (Notification.permission !== 'granted') return

        const response = await fetch('/api/notifications/check')
        if (!response.ok) return
        const payload = await response.json()
        const reminders = (payload.data || []) as ReminderPayload[]
        reminders.forEach(reminder => {
          new Notification('Todo reminder', {
            body: `${reminder.title} is due soon (${reminder.minutes_before}m)`
          })
        })
      } catch (error) {
        console.error('Notification polling failed:', error)
      }
    }

    const interval = window.setInterval(poll, 60_000)
    poll()

    return () => window.clearInterval(interval)
  }, [])
}
