/*
- Mục đích: Dòng nhỏ hiển thị tray trong dropdown của location.
- Phụ thuộc: LocationTray type, MUI primitives.
- Ghi chú bảo trì: Không gọi API tại đây; chỉ render dữ liệu đã aggregate từ backend.
*/

import { Box, Chip, Stack, Typography } from '@mui/material'
import type { LocationTray } from '../types/locationTypes'

export function TrayMiniRow({ tray }: { tray: LocationTray }) {
  const hasStock = Number(tray.total_quantity || 0) > 0

  return (
    <Box
      sx={{
        px: 1.25,
        py: 1,
        border: '1px solid #e2e8f0',
        borderRadius: 1.5,
        bgcolor: 'white',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: 'monospace', fontWeight: 900 }} noWrap>
            {tray.tray_code}
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            {tray.description || 'Chưa có tên/mô tả khay'}
          </Typography>
          {tray.qr_code && (
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontFamily: 'monospace' }}>
              QR: {tray.qr_code}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
          <Chip size="small" color={tray.is_active ? 'success' : 'default'} label={tray.is_active ? 'Active' : 'Inactive'} />
          <Chip size="small" variant="outlined" label={hasStock ? `${tray.products_count} sản phẩm` : 'Chưa có hàng'} />
          <Chip size="small" color="info" variant="outlined" label={`Tổng tồn ${Number(tray.total_quantity || 0).toLocaleString('vi-VN')}`} />
        </Stack>
      </Stack>
    </Box>
  )
}
