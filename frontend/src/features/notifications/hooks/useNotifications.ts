import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { notificationService } from '../api/notificationService'
import { getNotificationRealtimeUrl } from '../lib/notificationRealtimeUrl'
import type { NotificationItem } from '../types/notificationTypes'

const pollIntervalMs = 30000
const reconnectDelayMs = 3000
const maxItems = 20

function mergeItems(current: NotificationItem[], incoming: NotificationItem[]) {
  const map = new Map<string, NotificationItem>()
  for (const item of incoming) map.set(item.id, item)
  for (const item of current) {
    if (!map.has(item.id)) map.set(item.id, item)
  }
  return [...map.values()]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, maxItems)
}

export function useNotifications(token: string | null) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set())
  const [isConnected, setIsConnected] = useState(false)
  const [connectionMessage, setConnectionMessage] = useState('')
  const [latestItem, setLatestItem] = useState<NotificationItem | null>(null)
  const stoppedRef = useRef(false)
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | undefined>(undefined)

  const loadSummary = useCallback(async () => {
    if (!token) return
    try {
      const summary = await notificationService.getSummary()
      setItems((current) => mergeItems(current, summary.items || []))
    } catch {
      setConnectionMessage('Không tải được thông báo, hệ thống sẽ thử lại.')
    }
  }, [token])

  useEffect(() => {
    void loadSummary()
    if (!token) return undefined
    const intervalId = window.setInterval(() => {
      void loadSummary()
    }, pollIntervalMs)
    return () => window.clearInterval(intervalId)
  }, [loadSummary, token])

  useEffect(() => {
    if (!token) {
      socketRef.current?.close()
      setItems([])
      setReadIds(new Set())
      return undefined
    }

    stoppedRef.current = false

    const connect = () => {
      if (stoppedRef.current) return
      const socket = new WebSocket(getNotificationRealtimeUrl(token))
      socketRef.current = socket

      socket.onopen = () => {
        setIsConnected(true)
        setConnectionMessage('')
      }

      socket.onmessage = (message) => {
        try {
          const item = JSON.parse(message.data) as NotificationItem
          if (!item?.id) return
          if (item.type === 'NOTIFICATIONS_REFRESH') {
            void loadSummary()
            return
          }
          setItems((current) => mergeItems(current, [item]))
          setLatestItem(item)
        } catch {
          void loadSummary()
        }
      }

      socket.onerror = () => {
        socket.close()
      }

      socket.onclose = () => {
        setIsConnected(false)
        if (!stoppedRef.current) {
          setConnectionMessage('Mất kết nối thông báo, đang thử kết nối lại')
          reconnectTimerRef.current = window.setTimeout(connect, reconnectDelayMs)
        }
      }
    }

    connect()

    return () => {
      stoppedRef.current = true
      window.clearTimeout(reconnectTimerRef.current)
      socketRef.current?.close()
    }
  }, [loadSummary, token])

  const unreadCount = useMemo(() => items.filter((item) => !readIds.has(item.id)).length, [items, readIds])

  const markAllRead = useCallback(async () => {
    setReadIds(new Set(items.map((item) => item.id)))
    try {
      await notificationService.markAllRead()
    } catch {
      // Giai đoạn chưa lưu trạng thái đọc ở DB, local state vẫn là nguồn chính cho badge.
    }
  }, [items])

  const markRead = useCallback((id: string) => {
    setReadIds((current) => {
      const next = new Set(current)
      next.add(id)
      return next
    })
  }, [])

  const dismissLatest = useCallback(() => {
    setLatestItem(null)
  }, [])

  return {
    items,
    unreadCount,
    isConnected,
    connectionMessage,
    latestItem,
    loadSummary,
    markRead,
    markAllRead,
    dismissLatest,
  }
}
