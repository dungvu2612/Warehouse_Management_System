/*
Thông tin ghi chú:
- File nay la bang hien thi danh sach phieu nhap, thuoc presentation layer.
- Phu thuoc vao type `ImportReceiptDisplay`; trang truyen states va callback xem chi tiet.
- Component nay khong goi API truc tiep de dam bao clean architecture.
*/

import { Button, Chip, LinearProgress, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { ImportReceiptDisplay } from '../types/importReceiptTypes'

interface ImportReceiptTableProps {
  receipts: ImportReceiptDisplay[]
  isLoading: boolean
  isError: boolean
  onViewDetail: (id: number) => void
}

export function ImportReceiptTable({
  receipts,
  isLoading,
  isError,
  onViewDetail,
}: ImportReceiptTableProps) {
  const statusLabel: Record<string, string> = {
    WAITING: 'Chờ nhận',
    PROCESSING: 'Đang nhập',
    COMPLETED: 'Hoàn thành',
  }

  return (
    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>Mã phiếu</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Nhà cung cấp</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Số dòng</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Số lượng dự kiến</TableCell>
            <TableCell sx={{ fontWeight: 800, minWidth: 180 }}>Tiến độ nhập</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Ngày tạo</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Thao tác</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={8}>Đang tải danh sách phiếu nhập...</TableCell>
            </TableRow>
          )}

          {isError && (
            <TableRow>
              <TableCell colSpan={8}>Không tải được danh sách phiếu nhập.</TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && receipts.length === 0 && (
            <TableRow>
              <TableCell colSpan={8}>Chưa có phiếu nhập nào.</TableCell>
            </TableRow>
          )}

          {receipts.map((receipt) => (
            <TableRow key={receipt.id} hover>
              <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800 }}>{receipt.receipt_code}</TableCell>
              <TableCell>{receipt.supplier_name || '-'}</TableCell>
              <TableCell sx={{ textAlign: 'right' }}>{receipt.item_count}</TableCell>
              <TableCell sx={{ textAlign: 'right', fontWeight: 800 }}>{receipt.total_quantity}</TableCell>
              <TableCell>
                <Stack spacing={0.5}>
                  <span>
                    {receipt.total_actual_quantity}/{receipt.total_quantity}
                  </span>
                  <LinearProgress
                    variant="determinate"
                    value={receipt.total_quantity > 0 ? Math.min(100, (receipt.total_actual_quantity / receipt.total_quantity) * 100) : 0}
                    sx={{ height: 7, borderRadius: 99 }}
                  />
                </Stack>
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  color={receipt.status === 'COMPLETED' ? 'success' : receipt.status === 'PROCESSING' ? 'info' : 'warning'}
                  label={statusLabel[receipt.status] || receipt.status || 'Chờ nhận'}
                  sx={{ fontWeight: 800 }}
                />
              </TableCell>
              <TableCell>{new Date(receipt.created_at).toLocaleString('vi-VN')}</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>
                <Button size="small" variant="outlined" onClick={() => onViewDetail(receipt.id)}>
                  Xem chi tiết
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
