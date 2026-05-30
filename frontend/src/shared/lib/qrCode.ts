/*
Senior Handover Note:
- Purpose: Tao QR image data URL tu gia tri text de scan bang PDA/scanner.
- Dependencies: package `qrcode`.
- API contract: Khong call backend; utility thuần frontend.
- Warehouse business rules: QR image phai map 1-1 voi qr_code text duoc backend cap.
- Scanner workflow notes: Mau QR render do phan giai vua du de HT730 scan nhanh.
- Maintenance notes: Neu can doi density/margin, sua opts trong ham toQrDataUrl.
*/

import QRCode from 'qrcode'

export async function toQrDataUrl(value: string): Promise<string> {
  const normalized = value.trim()
  if (!normalized) return ''

  return QRCode.toDataURL(normalized, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 256,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })
}
