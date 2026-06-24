/*
- File nay la bang hien thi danh sach inventory, thuoc presentation layer.
- Phu thuoc vao type `InventoryDisplayItem`; trang truyen states va callbacks adjust.
- Component nay khong goi API truc tiep de dam bao clean architecture.
*/

import { WarningAmberOutlined } from '@mui/icons-material'
import { Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery, useTheme } from '@mui/material'
import { ProductImageThumb } from '../../../shared/components/ProductImageThumb'
import { formatDateTimeVN } from '../../../shared/lib/datetime'
import type { InventoryDisplayItem } from '../types/inventoryTypes'

interface InventoryTableProps {
  inventory: InventoryDisplayItem[]
  isLoading: boolean
  isError: boolean
  isAdmin: boolean
  showActions?: boolean
  onOpenAdjust: (item: InventoryDisplayItem) => void
}

export function InventoryTable({
  inventory,
  isLoading,
  isError,
  isAdmin,
  showActions = true,
  onOpenAdjust,
}: InventoryTableProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  if (isMobile) {
    if (isLoading || isError || inventory.length === 0) {
      return (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Typography variant="body2">
            {isLoading
              ? 'Đang tải danh sách tồn kho...'
              : isError
                ? 'Không tải được danh sách tồn kho.'
                : 'Chưa có dữ liệu tồn kho.'}
          </Typography>
        </Paper>
      )
    }

    return (
      <Stack spacing={1.25}>
        {inventory.map((item) => (
          <Paper key={item.id} variant="outlined" sx={{ p: 1.25 }}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <ProductImageThumb src={item.product_image_url} alt={item.product_name} size={44} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    {item.product_code}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {item.product_name}
                  </Typography>
                </Box>
              </Stack>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                Khay: {item.tray_code}
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                Vị trí: {item.location_code}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>SL: {item.quantity}</Typography>
                {item.is_low_stock ? (
                  <Chip icon={<WarningAmberOutlined />} size="small" color="warning" label="Tồn thấp" />
                ) : (
                  <Chip size="small" color="success" label="Ổn định" />
                )}
              </Stack>
              {showActions && (
                <Button
                  size="small"
                  variant="contained"
                  disabled={!isAdmin || item.is_virtual_row}
                  onClick={() => onOpenAdjust(item)}
                >
                  Điều chỉnh
                </Button>
              )}
            </Stack>
          </Paper>
        ))}
      </Stack>
    )
  }

  return (
    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>ID</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Ảnh</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Sản phẩm</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Khay</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Vị trí</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'left' }}>Số lượng</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'left' }}>Tồn tối thiểu</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Cảnh báo</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Cập nhật</TableCell>
            {showActions && <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Thao tác</TableCell>}
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading && (
            <TableRow>
              {/* Ghi chú: Trạng thái đang tải khi query GET /inventory chua hoan tat. */}
              <TableCell colSpan={showActions ? 10 : 9}>Đang tải danh sách tồn kho...</TableCell>
            </TableRow>
          )}

          {isError && (
            <TableRow>
              {/* Ghi chú: Trạng thái lỗi khi fetch inventory that bai. */}
              <TableCell colSpan={showActions ? 10 : 9}>Không tải được danh sách tồn kho.</TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && inventory.length === 0 && (
            <TableRow>
              {/* Ghi chú: Trạng thái rỗng khi inventory list rong. */}
              <TableCell colSpan={showActions ? 10 : 9}>Chưa có dữ liệu tồn kho.</TableCell>
            </TableRow>
          )}

          {inventory.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>#{item.id}</TableCell>
              <TableCell>
                <ProductImageThumb src={item.product_image_url} alt={item.product_name} size={52} />
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  color="secondary"
                  label={`${item.product_code} - ${item.product_name}`}
                />
              </TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{item.tray_code}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>
                {item.location_code}
                {item.location_description ? ` - ${item.location_description}` : ''}
              </TableCell>
              <TableCell sx={{ textAlign: 'left', fontWeight: 900 }}>{item.quantity}</TableCell>
              <TableCell sx={{ textAlign: 'left' }}>{item.min_stock}</TableCell>
              <TableCell>
                {item.is_low_stock ? (
                  <Chip
                    icon={<WarningAmberOutlined />}
                    size="small"
                    color="warning"
                    label="Tồn thấp"
                  />
                ) : (
                  <Chip size="small" color="success" label="Ổn định" />
                )}
              </TableCell>
              <TableCell>{formatDateTimeVN(item.updated_at)}</TableCell>
              {showActions && (
                <TableCell sx={{ textAlign: 'center' }}>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={!isAdmin || item.is_virtual_row}
                    onClick={() => onOpenAdjust(item)}
                  >
                    Điều chỉnh
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
