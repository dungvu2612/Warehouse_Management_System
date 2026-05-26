/*
Senior Handover Note:
- File nay la bang hien thi danh sach inventory, thuoc presentation layer.
- Phu thuoc vao type `InventoryDisplayItem`; page truyen states va callbacks adjust.
- Component nay khong goi API truc tiep de dam bao clean architecture.
*/

import { WarningAmberOutlined } from '@mui/icons-material'
import { Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { InventoryDisplayItem } from '../types/inventoryTypes'

interface InventoryTableProps {
  inventory: InventoryDisplayItem[]
  isLoading: boolean
  isError: boolean
  isAdmin: boolean
  onOpenAdjust: (item: InventoryDisplayItem) => void
}

export function InventoryTable({
  inventory,
  isLoading,
  isError,
  isAdmin,
  onOpenAdjust,
}: InventoryTableProps) {
  return (
    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>ID</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Sản phẩm</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Khay</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Vị trí</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Số lượng</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Tồn tối thiểu</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Cảnh báo</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Cập nhật</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Thao tác</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading && (
            <TableRow>
              {/* Senior Handover: Loading state khi query GET /inventory chua hoan tat. */}
              <TableCell colSpan={9}>Đang tải danh sách tồn kho...</TableCell>
            </TableRow>
          )}

          {isError && (
            <TableRow>
              {/* Senior Handover: Error state khi fetch inventory that bai. */}
              <TableCell colSpan={9}>Không tải được danh sách tồn kho.</TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && inventory.length === 0 && (
            <TableRow>
              {/* Senior Handover: Empty state khi inventory list rong. */}
              <TableCell colSpan={9}>Chưa có dữ liệu tồn kho.</TableCell>
            </TableRow>
          )}

          {inventory.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>#{item.id}</TableCell>
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
              <TableCell sx={{ textAlign: 'right', fontWeight: 900 }}>{item.quantity}</TableCell>
              <TableCell sx={{ textAlign: 'right' }}>{item.min_stock}</TableCell>
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
              <TableCell>{new Date(item.updated_at).toLocaleString('vi-VN')}</TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
