/*
Mo ta file:
- Utility sinh product_code preview o frontend theo format PREFIX-ABBREVIATION-SEQ.
- File nay phuc vu UX: nguoi dung thay ma du kien ngay khi nhap ten/chon loai.

Luong xu ly:
1) Chuan hoa chuoi tieng Viet (bo dau).
2) Tao abbreviation tu ten san pham.
3) Tra preview dang PREFIX-ABBR-001 (so thu tu cuoi cung se do backend quyet dinh khi save).
*/

import type { ProductType } from '../types/productTypes'

function normalizeVietnamese(value: string): string {
  const lower = value.trim().toLowerCase()
  if (!lower) return ''

  return lower
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripVowels(value: string): string {
  return value.replace(/[aeiouy]/g, '')
}

function keepOnlyAlnum(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '')
}

function buildAbbreviation(productName: string): string {
  const normalized = normalizeVietnamese(productName)
  if (!normalized) return ''

  const words = normalized.split(' ').filter(Boolean)
  if (words.length === 0) return ''

  const parts = words
    .map((word) => {
      const head = word.slice(0, 1)
      return keepOnlyAlnum(head.toUpperCase())
    })
    .filter(Boolean)

  if (parts.length === 0) return ''

  let abbr = parts.join('')
  if (abbr.length < 3) {
    const tails = words
      .map((word) => keepOnlyAlnum(stripVowels(word.slice(1)).toUpperCase()))
      .filter(Boolean)

    for (const tail of tails) {
      abbr += tail
      if (abbr.length >= 3) break
    }
  }

  return abbr.slice(0, 10)
}

export function generateProductCodePreview(productType: ProductType, name: string): string {
  const abbr = buildAbbreviation(name)
  if (!abbr) return ''

  const prefix = productType === 'FINISHED_GOOD' ? 'TP' : 'LK'
  return `${prefix}-${abbr}-001`
}
