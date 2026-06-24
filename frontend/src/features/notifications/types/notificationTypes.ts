export type NotificationLevel = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'

export interface NotificationItem {
  id: string
  type: string
  level: NotificationLevel
  title: string
  message: string
  created_at: string
  link: string
}

export interface NotificationSummary {
  unread_count: number
  items: NotificationItem[]
}
