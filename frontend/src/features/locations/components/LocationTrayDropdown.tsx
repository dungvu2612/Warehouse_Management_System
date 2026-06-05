/*
- Mục đích: Dropdown danh sách khay thuộc một location.
- Phụ thuộc: TrayMiniRow và data đã được page fetch/cache theo location_id.
- Trạng thái UI: loading, empty, error có nút thử lại.
*/

import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { TrayMiniRow } from './TrayMiniRow'
import type { LocationTray } from '../types/locationTypes'

interface LocationTrayDropdownProps {
  trays?: LocationTray[]
  isLoading: boolean
  error?: string
  onRetry: () => void
}

export function LocationTrayDropdown({ trays = [], isLoading, error, onRetry }: LocationTrayDropdownProps) {
  return (
    <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
      {isLoading && <Typography color="text.secondary">Đang tải danh sách khay...</Typography>}

      {!isLoading && error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              Thử lại
            </Button>
          }
        >
          Không tải được danh sách khay. Thử lại
        </Alert>
      )}

      {!isLoading && !error && trays.length === 0 && (
        <Typography color="text.secondary">Vị trí này chưa có khay</Typography>
      )}

      {!isLoading && !error && trays.length > 0 && (
        <Stack spacing={1}>
          {trays.map((tray) => (
            <TrayMiniRow key={tray.id} tray={tray} />
          ))}
        </Stack>
      )}
    </Box>
  )
}
