import { env } from '../lib/env'

// Lấy WebSocket URL từ API base URL để dev/prod không phải cấu hình thêm biến mới.
export function getRealtimeUrl() {
  const baseUrl = env.apiBaseUrl || window.location.origin
  const url = new URL(baseUrl, window.location.origin)

  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/ws'
  url.search = ''
  url.hash = ''

  return url.toString()
}
