/*
Thông tin ghi chú:
- File nay la bang hien thi danh sach phieu nhap, thuoc presentation layer.
- Phu thuoc vao type `ImportReceiptDisplay`; trang truyen states va callback xem chi tiet.
- Component nay khong goi API truc tiep de dam bao clean architecture.
*/

import { DeleteOutlined, EditOutlined, VisibilityOutlined } from '@mui/icons-material'
import {
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material'
import { formatDateTimeVN } from '../../../shared/lib/datetime'
import type { ImportReceiptDisplay } from '../types/importReceiptTypes'

interface ImportReceiptTableProps {
  receipts: ImportReceiptDisplay[]
  isLoading: boolean
  isError: boolean
  canManage: boolean
  onViewDetail: (id: number) => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

export function ImportReceiptTable({
  receipts,
  isLoading,
  isError,
  canManage,
  onViewDetail,
  onEdit,
  onDelete,
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
            <TableCell sx={{ fontWeight: 800, textAlign: 'left' }}>Số dòng</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'left' }}>Số lượng dự kiến</TableCell>
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

          {receipts.map((receipt) => {
            const canEditReceipt = canManage && receipt.status === 'WAITING' && receipt.total_actual_quantity === 0
            return (
              <TableRow key={receipt.id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800 }}>{receipt.receipt_code}</TableCell>
                <TableCell>{receipt.supplier_name || '-'}</TableCell>
                <TableCell sx={{ textAlign: 'left' }}>{receipt.item_count}</TableCell>
                <TableCell sx={{ textAlign: 'left', fontWeight: 800 }}>{receipt.total_quantity}</TableCell>
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
                <TableCell>{formatDateTimeVN(receipt.created_at)}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Tooltip title="Xem chi tiết">
                    <IconButton size="small" color="primary" onClick={() => onViewDetail(receipt.id)}>
                      <VisibilityOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {canManage && (
                    <>
                      <Tooltip title={canEditReceipt ? 'Sửa phiếu nhập' : 'Chỉ sửa được phiếu đang chờ nhận'}>
                        <span>
                          <IconButton
                            size="small"
                            color="warning"
                            disabled={!canEditReceipt}
                            onClick={() => onEdit(receipt.id)}
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={canEditReceipt ? 'Xóa phiếu nhập' : 'Chỉ xóa được phiếu đang chờ nhận'}>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={!canEditReceipt}
                            onClick={() => onDelete(receipt.id)}
                          >
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
