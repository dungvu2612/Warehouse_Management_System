import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getRealtimeUrl } from './realtimeUrl'
import type { RealtimeEvent } from './realtimeTypes'

const reconnectDelayMs = 3000
const invalidateDelayMs = 250

// Mở WebSocket một lần ở cấp app và reload React Query cache khi backend báo dữ liệu thay đổi.
export function useRealtimeInvalidation() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let socket: WebSocket | null = null
    let reconnectTimer: number | undefined
    let invalidateTimer: number | undefined
    let stopped = false

    const scheduleInvalidate = () => {
      window.clearTimeout(invalidateTimer)
      invalidateTimer = window.setTimeout(() => {
        queryClient.invalidateQueries()
      }, invalidateDelayMs)
    }

    const connect = () => {
      socket = new WebSocket(getRealtimeUrl())

      socket.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as RealtimeEvent
          if (event.type === 'DATA_CHANGED') {
            scheduleInvalidate()
          }
        } catch {
          scheduleInvalidate()
        }
      }

      socket.onerror = () => {
        socket?.close()
      }

      socket.onclose = () => {
        if (!stopped) {
          reconnectTimer = window.setTimeout(connect, reconnectDelayMs)
        }
      }
    }

    connect()

    return () => {
      stopped = true
      window.clearTimeout(reconnectTimer)
      window.clearTimeout(invalidateTimer)
      socket?.close()
    }
  }, [queryClient])
}
