import { useState, useEffect, useCallback } from 'react';
import { formatSingaporeDate } from '@/lib/timezone';

export interface PendingNotification {
  id: number;
  title: string;
  due_date: string;
  reminder_minutes: number;
}

/**
 * Hook for managing browser notifications
 * Handles permission requests, notification display, and polling for reminders
 */
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [enabled, setEnabled] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  // Check initial permission state
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      setEnabled(Notification.permission === 'granted');
      
      // Check localStorage for explicit disable
      const savedState = localStorage.getItem('notifications-enabled');
      if (savedState === 'false') {
        setEnabled(false);
      }
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      setEnabled(true);
      localStorage.setItem('notifications-enabled', 'true');
      return true;
    } else {
      setEnabled(false);
      localStorage.setItem('notifications-enabled', 'false');
      return false;
    }
  }, []);

  // Show a single notification
  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (enabled && permission === 'granted') {
      new Notification(title, options);
    }
  }, [enabled, permission]);

  // Check for pending notifications from API
  const checkNotifications = useCallback(async () => {
    if (!enabled || permission !== 'granted') {
      return;
    }

    try {
      const response = await fetch('/api/notifications/check');
      
      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, stop polling
          setIsPolling(false);
          return;
        }
        throw new Error('Failed to check notifications');
      }

      const data = await response.json();
      const notifications: PendingNotification[] = data.notifications || [];

      // Show browser notification for each pending reminder
      notifications.forEach((notification) => {
        const formattedDueDate = formatSingaporeDate(notification.due_date);
        showNotification(notification.title, {
          body: `Due: ${formattedDueDate}`,
          icon: '/favicon.ico',
          tag: `todo-${notification.id}`, // Prevents duplicate notifications
          requireInteraction: false,
        });
      });
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  }, [enabled, permission, showNotification]);

  // Start polling for notifications (every minute)
  useEffect(() => {
    if (!enabled || permission !== 'granted' || !isPolling) {
      return;
    }

    // Check immediately
    checkNotifications();

    // Then check every minute
    const interval = setInterval(checkNotifications, 60 * 1000);

    return () => clearInterval(interval);
  }, [enabled, permission, isPolling, checkNotifications]);

  // Start/stop polling
  const startPolling = useCallback(() => {
    if (enabled && permission === 'granted') {
      setIsPolling(true);
    }
  }, [enabled, permission]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  return {
    permission,
    enabled,
    isPolling,
    requestPermission,
    showNotification,
    checkNotifications,
    startPolling,
    stopPolling,
  };
}
