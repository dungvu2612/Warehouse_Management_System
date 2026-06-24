import { env } from '../../../shared/lib/env'

export function getNotificationRealtimeUrl(token: string) {
  const baseUrl = env.apiBaseUrl || window.location.origin
  const url = new URL(baseUrl, window.location.origin)

  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/notifications/ws'
  url.search = ''
  url.searchParams.set('token', token)
  url.hash = ''

  return url.toString()
}
