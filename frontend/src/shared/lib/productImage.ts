/*
Thông tin handover:
- File nay chua helper xu ly ảnh sản phẩm phía frontend (resize/crop và chuẩn hóa URL).
- Phụ thuộc vào browser APIs: FileReader, Image, Canvas.
- Lưu ý bảo trì: đây là điểm chuẩn hóa ảnh về cùng kích thước trước khi lưu vào backend.
*/

import { PRODUCT_IMAGE_SIZE } from '../constants/productImage'

const DATA_URL_PREFIX = 'data:image/'

// Senior Handover: Chỉ cho phép định dạng ảnh thông dụng để giảm rủi ro payload bất thường.
export function isSupportedProductImageType(file: File): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
}

// Senior Handover: Chuẩn hóa ảnh đầu vào về 1 kích thước vuông cố định bằng center-crop + canvas.
export async function resizeProductImageToDataUrl(
  file: File,
  size: number = PRODUCT_IMAGE_SIZE,
): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(dataUrl)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Trình duyệt không hỗ trợ xử lý ảnh bằng canvas.')
  }

  const scale = Math.max(size / image.width, size / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  const offsetX = (size - drawWidth) / 2
  const offsetY = (size - drawHeight) / 2

  ctx.clearRect(0, 0, size, size)
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)

  return canvas.toDataURL('image/jpeg', 0.9)
}

// Senior Handover: Kiem tra nhanh du lieu image_url hop le de tranh render chuoi khong phai URL/data URL.
export function isValidProductImageURL(value: string | undefined | null): boolean {
  if (!value) return false
  if (value.startsWith(DATA_URL_PREFIX)) return true

  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Không đọc được file ảnh.'))
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Dữ liệu ảnh không hợp lệ.'))
        return
      }
      resolve(result)
    }
    reader.readAsDataURL(file)
  })
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Không tải được ảnh để xử lý.'))
    image.src = dataUrl
  })
}
