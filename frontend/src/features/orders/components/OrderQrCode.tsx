/*
Senior Handover Note:
- Purpose: Reusable QR block cho order print template va cac man hinh order.
- Dependencies: `toQrDataUrl` helper tu shared/lib/qrCode.
- API contract: Khong goi backend; QR value duoc truyen tu order.qr_code/order.order_code.
- Business rules: QR phai encode dung operational identifier de staff scan load picking list.
- Permission notes: Read-only render component.
- Maintenance notes: Neu doi kich thuoc QR, cap nhat prop `size` va style tai day.
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
