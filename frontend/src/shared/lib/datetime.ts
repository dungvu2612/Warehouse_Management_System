const VN_TIMEZONE = 'Asia/Ho_Chi_Minh'

export function formatDateTimeVN(value?: string | Date | null): string {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('vi-VN', { timeZone: VN_TIMEZONE })
}

export function formatDateVN(value?: string | Date | null): string {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('vi-VN', { timeZone: VN_TIMEZONE })
}
