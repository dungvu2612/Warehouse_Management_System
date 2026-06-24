export const PRODUCT_DIFFICULTY_OPTIONS = [
  { label: 'Dễ', value: 1.0 },
  { label: 'Trung bình', value: 1.2 },
  { label: 'Khó', value: 1.5 },
  { label: 'Rất khó', value: 2.0 },
] as const

export function productDifficultyLabel(value: number | undefined | null): string {
  const weight = Number(value || 1.0)
  const option = PRODUCT_DIFFICULTY_OPTIONS.find((item) => Math.abs(item.value - weight) < 0.001)
  if (option) return option.label
  return `Hệ số ${weight.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}`
}
