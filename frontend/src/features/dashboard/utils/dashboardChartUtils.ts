export function formatCurrencyVND(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export function formatCompactVND(value: number): string {
  const normalized = Math.round(Number(value || 0))
  const sign = normalized < 0 ? '-' : ''
  const absoluteValue = Math.abs(normalized)

  if (absoluteValue < 1_000) {
    return `${sign}${absoluteValue}đ`
  }

  if (absoluteValue < 1_000_000) {
    return `${sign}${Math.floor(absoluteValue / 1_000)}k`
  }

  if (absoluteValue < 1_000_000_000) {
    const millions = Math.floor(absoluteValue / 1_000_000)
    const thousands = Math.floor((absoluteValue % 1_000_000) / 1_000)
    return thousands > 0 ? `${sign}${millions}tr${String(thousands).padStart(3, '0')}` : `${sign}${millions}tr`
  }

  const billions = Math.floor(absoluteValue / 1_000_000_000)
  const millions = Math.floor((absoluteValue % 1_000_000_000) / 1_000_000)
  return millions > 0 ? `${sign}${billions}tỷ${String(millions).padStart(3, '0')}` : `${sign}${billions}tỷ`
}

export function mapOrderStatusLabel(status: string): string {
  if (status === 'PENDING') return 'Chờ xử lý'
  if (status === 'PICKING') return 'Đang picking'
  if (status === 'COMPLETED') return 'Hoàn thành'
  if (status === 'CANCELLED') return 'Đã hủy'
  return status
}
