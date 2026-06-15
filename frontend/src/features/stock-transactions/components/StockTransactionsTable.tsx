/*
- File nay la bang presentation cho man Stock Transactions.
- Phu thuoc vao type `StockTransactionDisplayItem`; trang truyen states de render loading/error/empty.
- Component nay chi render UI chỉ xem, khong goi API truc tiep.
*/

import { Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery, useTheme } from '@mui/material'
import type {
  StockTransactionDisplayItem,
  StockTransactionType,
} from '../types/stockTransactionTypes'
import { formatDateTimeVN } from '../../../shared/lib/datetime'

interface StockTransactionsTableProps {
  rows: StockTransactionDisplayItem[]
  isLoading: boolean
  isError: boolean
}

const badgeConfig: Record<StockTransactionType, { label: string; color: 'success' | 'error' | 'warning' }> = {
  IMPORT: { label: 'Nhập kho', color: 'success' },
  EXPORT: { label: 'Xuất kho', color: 'error' },
  ADJUST: { label: 'Điều chỉnh', color: 'warning' },
  ROLLBACK: { label: 'Hoàn tác', color: 'warning' },
}

function signedQuantity(row: StockTransactionDisplayItem) {
  if (row.transaction_type === 'EXPORT') return -Math.abs(row.quantity)
  if (row.transaction_type === 'IMPORT') return Math.abs(row.quantity)
  return row.quantity
}

function formatSignedQuantity(value: number) {
  return value > 0 ? `+${value}` : `${value}`
}

export function StockTransactionsTable({ rows, isLoading, isError }: StockTransactionsTableProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  if (isMobile) {
    if (isLoading || isError || rows.length === 0) {
      return (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Typography variant="body2">
            {isLoading
              ? 'Đang tải lịch sử giao dịch kho...'
              : isError
                ? 'Không tải được lịch sử giao dịch kho.'
                : 'Chưa có giao dịch kho.'}
          </Typography>
        </Paper>
      )
    }

    return (
      <Stack spacing={1.25}>
        {rows.map((row) => {
          const config = badgeConfig[row.transaction_type]
          const displayQuantity = signedQuantity(row)
          return (
            <Paper key={row.id} variant="outlined" sx={{ p: 1.25 }}>
              <Stack spacing={0.75}>
                <Typography variant="caption" color="text.secondary">
                  {formatDateTimeVN(row.created_at)}
                </Typography>
                <Chip size="small" color={config.color} label={config.label} sx={{ fontWeight: 800, alignSelf: 'flex-start' }} />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {row.product_code} - {row.product_name}
                </Typography>
                <Typography variant="body2">
                  Số lượng: <strong>{formatSignedQuantity(displayQuantity)}</strong>
                </Typography>
                <Typography variant="body2">Trước/Sau: {row.before_quantity} → {row.after_quantity}</Typography>
                <Typography variant="body2">Mã tham chiếu: {row.reference_code || '-'}</Typography>
              </Stack>
            </Paper>
          )
        })}
      </Stack>
    )
  }

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
            const displayQuantity = signedQuantity(row)

            return (
              <TableRow key={row.id} hover>
                <TableCell>{formatDateTimeVN(row.created_at)}</TableCell>
                <TableCell>
                  {/* Ghi chú: Render transaction type badge block cho IMPORT / EXPORT / ADJUST. */}
                  <Chip size="small" color={config.color} label={config.label} sx={{ fontWeight: 800 }} />
                </TableCell>
                <TableCell>
                  {row.product_code} - {row.product_name}
                </TableCell>
                <TableCell
                  sx={{
                    textAlign: 'right',
                    fontWeight: 900,
                    color: displayQuantity >= 0 ? 'success.main' : 'error.main',
                  }}
                >
                  {formatSignedQuantity(displayQuantity)}
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
