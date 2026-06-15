export type RealtimeEvent = {
  type: 'DATA_CHANGED'
  resource: string
  action: string
  method?: string
  path?: string
  at: string
}
