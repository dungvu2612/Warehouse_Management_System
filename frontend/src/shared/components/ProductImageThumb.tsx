/*
Thông tin handover:
- File nay la component thumbnail ảnh sản phẩm dùng chung cho nhiều bảng/dialog.
- Phụ thuộc vào hằng số ảnh sản phẩm và helper validate URL ảnh.
- Lưu ý bảo trì: dùng thống nhất component này để giữ 1 chuẩn hiển thị ảnh toàn hệ thống.
*/

import { Avatar, Box } from '@mui/material'
import { PRODUCT_IMAGE_PLACEHOLDER, PRODUCT_IMAGE_SIZE } from '../constants/productImage'
import { isValidProductImageURL } from '../lib/productImage'

interface ProductImageThumbProps {
  src?: string | null
  alt: string
  size?: number
}

export function ProductImageThumb({ src, alt, size = PRODUCT_IMAGE_SIZE }: ProductImageThumbProps) {
  const candidateSrc = typeof src === 'string' ? src : ''
  const finalSrc = isValidProductImageURL(candidateSrc) ? candidateSrc : PRODUCT_IMAGE_PLACEHOLDER

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <Avatar
        variant="rounded"
        src={finalSrc}
        alt={alt}
        sx={{
          width: size,
          height: size,
          borderRadius: 1.5,
          bgcolor: 'grey.100',
          border: '1px solid #e2e8f0',
        }}
        slotProps={{ img: { style: { objectFit: 'cover' } } }}
      />
    </Box>
  )
}
