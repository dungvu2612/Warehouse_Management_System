/*
Senior Handover Note:
- File nay la bang presentation cho man Stock Transactions.
- Phu thuoc vao type `StockTransactionDisplayItem`; page truyen states de render loading/error/empty.
- Component nay chi render UI read-only, khong goi API truc tiep.
*/

import { Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type {
  StockTransactionDisplayItem,
  StockTransactionType,
} from '../types/stockTransactionTypes'

interface StockTransactionsTableProps {
  rows: StockTransactionDisplayItem[]
  isLoading: boolean
  isError: boolean
}

const badgeConfig: Record<StockTransactionType, { label: string; color: 'success' | 'error' | 'warning' }> = {
  IMPORT: { label: 'Nhập kho', color: 'success' },
  EXPORT: { label: 'Xuất kho', color: 'error' },
  ADJUST: { label: 'Điều chỉnh', color: 'warning' },
  ROLLBACK: { label: 'Rollback', color: 'warning' },
}

export function StockTransactionsTable({ rows, isLoading, isError }: StockTransactionsTableProps) {
  return (
    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>Thời gian</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Loại giao dịch</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Sản phẩm</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Số lượng</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Trước</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Sau</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Mã tham chiếu</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={7}>Đang tải lịch sử giao dịch kho...</TableCell>
            </TableRow>
          )}

          {isError && (
            <TableRow>
              <TableCell colSpan={7}>Không tải được lịch sử giao dịch kho.</TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>Chưa có giao dịch kho.</TableCell>
            </TableRow>
          )}

          {rows.map((row) => {
            const config = badgeConfig[row.transaction_type]

            return (
              <TableRow key={row.id} hover>
                <TableCell>{new Date(row.created_at).toLocaleString('vi-VN')}</TableCell>
                <TableCell>
                  {/* Senior Handover: Render transaction type badge block cho IMPORT / EXPORT / ADJUST. */}
                  <Chip size="small" color={config.color} label={config.label} sx={{ fontWeight: 800 }} />
                </TableCell>
                <TableCell>
                  {row.product_code} - {row.product_name}
                </TableCell>
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
                <TableCell>{row.reference_code || '-'}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
