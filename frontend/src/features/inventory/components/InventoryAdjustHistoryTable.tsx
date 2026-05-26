/*
Senior Handover Note:
- File nay la bang lich su dieu chinh ton kho (stock transactions loai ADJUST), nam duoi bang inventory.
- Phu thuoc vao type `StockTransactionDisplayItem`; page truyen states de render loading/error/empty.
- Component nay chi presentation, khong goi API truc tiep.
*/

import { Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { StockTransactionDisplayItem } from '../types/inventoryTypes'

interface InventoryAdjustHistoryTableProps {
  rows: StockTransactionDisplayItem[]
  isLoading: boolean
  isError: boolean
}

export function InventoryAdjustHistoryTable({
  rows,
  isLoading,
  isError,
}: InventoryAdjustHistoryTableProps) {
  return (
    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>Thời gian</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Sản phẩm</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Khay</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Vị trí</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Biến động</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Trước</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Sau</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Ghi chú</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading && (
            <TableRow>
              {/* Senior Handover: Loading state khi query GET /stock-transactions chua xong. */}
              <TableCell colSpan={8}>Đang tải lịch sử điều chỉnh tồn...</TableCell>
            </TableRow>
          )}

          {isError && (
            <TableRow>
              {/* Senior Handover: Error state khi fetch lich su dieu chinh that bai. */}
              <TableCell colSpan={8}>Không tải được lịch sử điều chỉnh tồn.</TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && rows.length === 0 && (
            <TableRow>
              {/* Senior Handover: Empty state khi chua co giao dich adjust nao. */}
              <TableCell colSpan={8}>Chưa có lịch sử điều chỉnh tồn.</TableCell>
            </TableRow>
          )}

          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{new Date(row.created_at).toLocaleString('vi-VN')}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  color="secondary"
                  label={`${row.product_code} - ${row.product_name}`}
                />
              </TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{row.tray_code}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{row.location_code}</TableCell>
              <TableCell
                sx={{
                  textAlign: 'right',
                  fontWeight: 900,
                  color: row.quantity >= 0 ? 'success.main' : 'error.main',
                }}
              >
                {row.quantity >= 0 ? `+${row.quantity}` : row.quantity}
              </TableCell>
              <TableCell sx={{ textAlign: 'right' }}>{row.before_quantity}</TableCell>
              <TableCell sx={{ textAlign: 'right', fontWeight: 800 }}>{row.after_quantity}</TableCell>
              <TableCell>{row.note || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
