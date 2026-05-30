/*
Thong tin handover:
- Dialog hien thi danh sach linh kien cua 1 BOM.
- Phu thuoc vao types BOM/BOMItem va state tu BOM page (khong goi API truc tiep).
- Luu y bao tri: item component_product can render anh de dong nhat voi cac bang co san pham khac trong he thong.
*/

import {
  Alert,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import type { BOM, BOMItem } from '../types/bomTypes'
import { ProductImageThumb } from '../../../shared/components/ProductImageThumb'

interface BOMItemsDialogProps {
  open: boolean
  bom: BOM | null
  items: BOMItem[]
  isLoading: boolean
  isError: boolean
  onClose: () => void
}

// Dialog chi tiet items cua BOM.
export function BOMItemsDialog({
  open,
  bom,
  items,
  isLoading,
  isError,
  onClose,
}: BOMItemsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 900 }}>Chi tiết linh kiện BOM</DialogTitle>

      <DialogContent>
        <Stack spacing={1.4} sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            BOM: {bom?.bom_name || '-'}
          </Typography>

          <Stack direction="row" spacing={1}>
            <Chip
              size="small"
              color="secondary"
              label={
                bom?.product
                  ? `${bom.product.product_code} - ${bom.product.product_name}`
                  : `Product #${bom?.product_id ?? '-'}`
              }
            />
            <Chip size="small" label={`BOM ID: ${bom?.id ?? '-'}`} />
          </Stack>

          {bom?.description && (
            <Typography variant="body2" color="text.secondary">
              {bom.description}
            </Typography>
          )}
        </Stack>

        <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Ảnh</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Mã linh kiện</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Tên linh kiện</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Số lượng</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5}>Đang tải BOM items...</TableCell>
                </TableRow>
              )}

              {isError && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Alert severity="error">Không tải được chi tiết BOM items.</Alert>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !isError && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>BOM chưa có linh kiện.</TableCell>
                </TableRow>
              )}

              {items.map((item, index) => (
                <TableRow key={item.id || `${item.component_product_id}-${index}`} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {/* Senior Handover: Render thumbnail linh kien theo image_url de doi van hanh nhan dien hang hoa nhanh. */}
                    <ProductImageThumb
                      src={item.component_product?.image_url}
                      alt={item.component_product?.product_name || `Linh kiện ${item.component_product_id}`}
                      size={38}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    {item.component_product?.product_code || `#${item.component_product_id}`}
                  </TableCell>
                  <TableCell>{item.component_product?.product_name || '-'}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button variant="contained" onClick={onClose}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  )
}
