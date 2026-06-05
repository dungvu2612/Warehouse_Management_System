/*
- Mục đích: Reusable QR block cho order print template va cac man hinh order.
- Phụ thuộc: `toQrDataUrl` helper tu shared/lib/qrCode.
- Hợp đồng API: Khong goi backend; QR value duoc truyen tu order.qr_code/order.order_code.
- Quy tắc nghiệp vụ: QR phai encode dung operational identifier de staff scan load picking list.
- Ghi chú phân quyền: Chỉ xem render component.
- Ghi chú bảo trì: Neu doi kich thuoc QR, cap nhat prop `size` va style tai day.
*/

import { useEffect, useState } from 'react'
import { toQrDataUrl } from '../../../shared/lib/qrCode'

interface OrderQrCodeProps {
  value: string
  dataUrl?: string
  size?: number
  className?: string
}

export function OrderQrCode({ value, dataUrl, size = 160, className }: OrderQrCodeProps) {
  const [generatedDataUrl, setGeneratedDataUrl] = useState(dataUrl || '')

  useEffect(() => {
    if (dataUrl) {
      setGeneratedDataUrl(dataUrl)
      return
    }

    if (!value.trim()) {
      setGeneratedDataUrl('')
      return
    }

    void toQrDataUrl(value).then(setGeneratedDataUrl).catch(() => setGeneratedDataUrl(''))
  }, [dataUrl, value])

  if (!generatedDataUrl) return null

  return (
    <img
      src={generatedDataUrl}
      alt="Order QR"
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  )
}
