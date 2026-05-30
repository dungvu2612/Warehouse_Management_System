/*
Thong tin handover:
- File nay la dialog hien thi chi tiet 1 phieu nhap (header + items), thuoc presentation layer.
- Phu thuoc vao type `ImportReceipt`; page truyen state loading/error va du lieu receipt detail.
- Component nay khong goi API truc tiep de dam bao clean architecture.
*/

import {
  Alert,
  Button,
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
  Typography,
} from '@mui/material'
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
  isLoading: boolean
  isError: boolean
  onClose: () => void
}

export function ImportReceiptDetailDialog({
  open,
  receipt,
  products,
  isLoading,
  isError,
  onClose,
}: ImportReceiptDetailDialogProps) {
  const productMap = new Map(products.map((product) => [product.id, product]))

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

            <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mt: 1 }}>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>ID dòng</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Sản phẩm</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>ID khay</TableCell>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Số lượng</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {receipt.items.map((item) => {
                    const product = productMap.get(item.product_id)
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
                        <TableCell>{item.tray_id}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontWeight: 800 }}>{item.quantity}</TableCell>
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
