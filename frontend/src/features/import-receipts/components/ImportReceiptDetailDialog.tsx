/*
Thông tin ghi chú:
- File nay la dialog hien thi chi tiet 1 phieu nhap (header + items), thuoc presentation layer.
- Phu thuoc vao type `ImportReceipt`; trang truyen state loading/error va du lieu receipt detail.
- Component nay khong goi API truc tiep de dam bao clean architecture.
*/

import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { ProductImageThumb } from '../../../shared/components/ProductImageThumb'
import type { ImportReceipt } from '../types/importReceiptTypes'

interface ImportReceiptDetailDialogProps {
  open: boolean
  receipt: ImportReceipt | null
  products: Array<{
    id: number
    product_code: string
    product_name: string
    image_url: string
  }>
  trays: Array<{
    id: number
    tray_code: string
  }>
  staffOptions: Array<{
    id: number
    username: string
    full_name: string
  }>
  canManageAssignment: boolean
  isLoading: boolean
  isError: boolean
  onClose: () => void
  onAssign: (itemId: number, staffId: number) => void
  onUnassign: (itemId: number) => void
}

export function ImportReceiptDetailDialog({
  open,
  receipt,
  products,
  trays,
  staffOptions,
  canManageAssignment,
  isLoading,
  isError,
  onClose,
  onAssign,
  onUnassign,
}: ImportReceiptDetailDialogProps) {
  const [staffByItemId, setStaffByItemId] = useState<Record<number, number>>({})
  const productMap = new Map(products.map((product) => [product.id, product]))
  const trayMap = new Map(trays.map((tray) => [tray.id, tray]))
  const staffMap = new Map(staffOptions.map((staff) => [staff.id, staff]))
  const itemStatusLabel: Record<string, string> = {
    WAITING: 'Chờ nhận',
    IMPORTING: 'Đang nhập',
    PARTIAL: 'Nhập thiếu',
    DONE: 'Hoàn thành',
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 900 }}>Chi tiết phiếu nhập</DialogTitle>
      <DialogContent>
        {isLoading && <Typography>Đang tải chi tiết phiếu nhập...</Typography>}

        {isError && <Alert severity="error">Không tải được chi tiết phiếu nhập.</Alert>}

        {!isLoading && !isError && receipt && (
          <Stack spacing={1.2}>
            <Typography variant="body2">
              <strong>Mã phiếu:</strong> {receipt.receipt_code}
            </Typography>
            <Typography variant="body2">
              <strong>Nhà cung cấp:</strong> {receipt.supplier_name || '-'}
            </Typography>
            <Typography variant="body2">
              <strong>Ghi chú:</strong> {receipt.note || '-'}
            </Typography>
            <Typography variant="body2">
              <strong>Ngày tạo:</strong> {new Date(receipt.created_at).toLocaleString('vi-VN')}
            </Typography>
            <Typography variant="body2">
              <strong>Trạng thái phiếu:</strong> {receipt.status || 'WAITING'}
            </Typography>

            <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mt: 1 }}>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>ID dòng</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Sản phẩm</TableCell>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Dự kiến</TableCell>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Đã nhập</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Khay thực nhập</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Người phụ trách</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Hoàn thành</TableCell>
                    {canManageAssignment && <TableCell sx={{ fontWeight: 800 }}>Phân công</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {receipt.items.map((item) => {
                    const product = productMap.get(item.product_id)
                    const actualTray = item.actual_tray_id ? trayMap.get(item.actual_tray_id) : null
                    const assignedStaff = item.assigned_to ? staffMap.get(item.assigned_to) : null
                    const selectedStaffId = staffByItemId[item.id] || item.assigned_to || 0
                    const hasImported = (item.actual_quantity || 0) > 0
                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>#{item.id}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <ProductImageThumb
                              src={product?.image_url || ''}
                              alt={product?.product_name || `Sản phẩm ${item.product_id}`}
                              size={40}
                            />
                            <span>
                              {product ? `${product.product_code} - ${product.product_name}` : `#${item.product_id}`}
                            </span>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right', fontWeight: 800 }}>{item.quantity}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontWeight: 800 }}>{item.actual_quantity || 0}</TableCell>
                        <TableCell>{actualTray?.tray_code || (item.actual_tray_id ? `#${item.actual_tray_id}` : '-')}</TableCell>
                        <TableCell>
                          {assignedStaff
                            ? assignedStaff.full_name || assignedStaff.username
                            : item.assigned_to
                              ? `#${item.assigned_to}`
                              : 'Chưa có người nhận'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={item.status === 'DONE' ? 'success' : item.status === 'WAITING' ? 'warning' : 'info'}
                            label={itemStatusLabel[item.status] || item.status || 'Chờ nhận'}
                            sx={{ fontWeight: 800 }}
                          />
                        </TableCell>
                        <TableCell>
                          {item.completed_at ? new Date(item.completed_at).toLocaleString('vi-VN') : '-'}
                        </TableCell>
                        {canManageAssignment && (
                          <TableCell>
                            <Stack spacing={0.75} sx={{ minWidth: 210 }}>
                              <TextField
                                select
                                label="Chọn nhân viên"
                                value={selectedStaffId}
                                onChange={(event) =>
                                  setStaffByItemId((prev) => ({
                                    ...prev,
                                    [item.id]: Number(event.target.value),
                                  }))
                                }
                                slotProps={{ select: { native: true } }}
                                size="small"
                                disabled={hasImported || item.status === 'DONE'}
                              >
                                <option value={0}>Chọn nhân viên</option>
                                {staffOptions.map((staff) => (
                                  <option key={staff.id} value={staff.id}>
                                    {staff.full_name || staff.username}
                                  </option>
                                ))}
                              </TextField>
                              <Stack direction="row" spacing={0.75}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  disabled={hasImported || item.status === 'DONE' || !selectedStaffId}
                                  onClick={() => onAssign(item.id, Number(selectedStaffId))}
                                >
                                  Gán
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                  disabled={hasImported || item.status === 'DONE' || !item.assigned_to}
                                  onClick={() => onUnassign(item.id)}
                                >
                                  Gỡ
                                </Button>
                              </Stack>
                            </Stack>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  )
}
