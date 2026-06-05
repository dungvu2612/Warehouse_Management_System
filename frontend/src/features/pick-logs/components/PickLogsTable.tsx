/* Bảng hiển thị pick logs cho màn hình chi tiết/audit. */

import { ContentCopy } from '@mui/icons-material'
import {
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material'
import type { PickLogDisplayItem } from '../types/pickLogTypes'
import { formatDateTimeVN } from '../../../shared/lib/datetime'

interface PickLogsTableProps {
  rows: PickLogDisplayItem[]
  isLoading: boolean
  isError: boolean
  onCopyTrayCode: (code: string) => void
}

export function PickLogsTable({ rows, isLoading, isError, onCopyTrayCode }: PickLogsTableProps) {
  return (
    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>Thời gian lấy hàng</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Mã đơn</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Sản phẩm</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Khay</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>SL đã lấy</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Nhân viên</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Ghi chú</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={8}>Đang tải nhật ký nhặt...</TableCell>
            </TableRow>
          )}

          {isError && (
            <TableRow>
              <TableCell colSpan={8}>Không tải được nhật ký nhặt.</TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={8}>Chưa có lịch sử nhặt cho đơn này.</TableCell>
            </TableRow>
          )}

          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{formatDateTimeVN(row.picked_at)}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{row.order_code}</TableCell>
              <TableCell>
                {row.product_code} - {row.product_name}
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace' }}>{row.tray_code}</span>
                  <Tooltip title="Copy mã khay">
                    <IconButton size="small" onClick={() => onCopyTrayCode(row.tray_code)}>
                      <ContentCopy fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
              <TableCell sx={{ textAlign: 'right', fontWeight: 900 }}>{row.picked_quantity}</TableCell>
              <TableCell>{row.picked_by_label}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.6}>
                  <Chip size="small" color="info" label="ĐÃ NHẶT" sx={{ fontWeight: 800 }} />
                  {row.verified && (
                    <Chip size="small" color="success" label="ĐÃ XÁC NHẬN" sx={{ fontWeight: 800 }} />
                  )}
                </Stack>
              </TableCell>
              <TableCell>{row.note || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
