import { http } from '../../../shared/lib/http'
import type { NotificationItem, NotificationSummary } from '../types/notificationTypes'

export const notificationService = {
  getSummary: async (): Promise<NotificationSummary> => {
    const { data } = await http.get<NotificationSummary>('/notifications/summary')
    return data
  },

  getNotifications: async (): Promise<NotificationItem[]> => {
    const { data } = await http.get<{ items: NotificationItem[] }>('/notifications')
    return data.items || []
  },

  markAllRead: async (): Promise<void> => {
    await http.post('/notifications/read-all')
  },
}
