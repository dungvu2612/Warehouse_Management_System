
/*
- Mục đích: Bang danh sach san pham va thao tac QR (View/Copy/Print label).
- Phụ thuộc: ProductImageThumb + qrCode helper + Product types.
- Hợp đồng API: Nhan data products da fetch tu trang/hooks, component khong goi API truc tiep.
- Quy tắc nghiệp vụ: QR su dung operational identifier product.qr_code (fallback product_code).
- Ghi chú phân quyền: Edit/Delete chi mo cho role co quyen (isAdmin do trang truyen vao).
- Ghi chú bảo trì: Neu doi layout label in, cap nhat ham printLabel tai file nay.
*/

import {
  Box,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  ContentCopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PrintOutlined,
  QrCode2Outlined,
} from '@mui/icons-material'
import { ProductImageThumb } from '../../../shared/components/ProductImageThumb'
import type { Product } from '../types/productTypes'
import { useEffect, useState } from 'react'
import { toQrDataUrl } from '../../../shared/lib/qrCode'

interface ProductTableProps {
  products: Product[]
  isLoading: boolean
  isError: boolean
  isAdmin: boolean
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  selectedIds: number[]
  onToggleSelect: (productId: number) => void
  onToggleSelectAll: (productIds: number[]) => void
}

// Bảng hiển thị danh sách sản phẩm.
export function ProductTable({
  products,
  isLoading,
  isError,
  isAdmin,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: ProductTableProps) {
  const [selectedQR, setSelectedQR] = useState<Product | null>(null)
  const [selectedQRImage, setSelectedQRImage] = useState('')

  const formatDifficulty = (value: number) => Number(value || 1).toLocaleString('vi-VN', { maximumFractionDigits: 2 })

  const copyQR = async (value: string) => {
    await navigator.clipboard.writeText(value)
  }

  const printLabel = (product: Product) => {
    const qrValue = product.qr_code || product.product_code
    void toQrDataUrl(qrValue).then((qrImage) => {
      const printWindow = window.open('', '_blank', 'width=500,height=700')
      if (!printWindow) return
      printWindow.document.write(`
        <html>
          <head><title>Product QR Label</title></head>
          <body style="font-family: Arial, sans-serif; padding: 16px;">
            <h3>${product.product_code}</h3>
            <p>${product.product_name}</p>
            <p>Đơn vị: ${product.unit || '-'}</p>
            <img src="${qrImage}" alt="Product QR" style="width:220px;height:220px;display:block;margin:8px 0;" />
            <div style="font-family: monospace; font-size: 16px;">${qrValue}</div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    })
  }

  useEffect(() => {
    if (!selectedQR) {
      setSelectedQRImage('')
      return
    }

    const qrValue = selectedQR.qr_code || selectedQR.product_code
    void toQrDataUrl(qrValue).then(setSelectedQRImage).catch(() => setSelectedQRImage(''))
  }, [selectedQR])

  const selectedCountInPage = products.filter((product) => selectedIds.includes(product.id)).length
  const allSelectedInPage = products.length > 0 && selectedCountInPage === products.length

  return (
    <>
      <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allSelectedInPage}
                  indeterminate={selectedCountInPage > 0 && !allSelectedInPage}
                  onChange={() => onToggleSelectAll(products.map((product) => product.id))}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Ảnh</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Mã SP</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>QR</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Tên sản phẩm</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Loại</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Đơn vị</TableCell>
              <TableCell sx={{ fontWeight: 800, textAlign: 'left' }}>Min stock</TableCell>
              <TableCell sx={{ fontWeight: 800, textAlign: 'left' }}>Giá</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Độ khó</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Mô tả</TableCell>
              <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={12}>Đang tải dữ liệu...</TableCell>
              </TableRow>
            )}

            {isError && (
              <TableRow>
                <TableCell colSpan={12}>Không tải được dữ liệu sản phẩm.</TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && products.length === 0 && (
              <TableRow>
                <TableCell colSpan={12}>Không có sản phẩm phù hợp.</TableCell>
              </TableRow>
            )}

            {products.map((product) => (
              <TableRow key={product.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox checked={selectedIds.includes(product.id)} onChange={() => onToggleSelect(product.id)} />
                </TableCell>
                <TableCell>
                  <ProductImageThumb src={product.image_url} alt={product.product_name} size={56} />
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'secondary.main' }}>
                  {product.product_code}
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{product.qr_code || product.product_code}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{product.product_name}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={product.product_type === 'FINISHED_GOOD' ? 'secondary' : 'default'}
                    label={product.product_type === 'FINISHED_GOOD' ? 'Thành phẩm' : 'Linh kiện'}
                  />
                </TableCell>
                <TableCell>{product.unit}</TableCell>
                <TableCell sx={{ textAlign: 'left' }}>{product.min_stock}</TableCell>
                <TableCell sx={{ textAlign: 'left', fontWeight: 700 }}>
                  {Number(product.price).toLocaleString('vi-VN')} đ
                </TableCell>
                <TableCell>{formatDifficulty(product.difficulty_weight)}</TableCell>
                <TableCell>{product.description || '-'}</TableCell>
                <TableCell sx={{ textAlign: 'center', minWidth: 96 }}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 32px)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <Tooltip title="Sửa sản phẩm">
                      <span>
                        <IconButton
                          size="small"
                          color="primary"
                          disabled={!isAdmin}
                          onClick={() => onEdit(product)}
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip title="Xem QR">
                      <IconButton size="small" onClick={() => setSelectedQR(product)}>
                        <QrCode2Outlined fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Copy QR">
                      <IconButton size="small" onClick={() => copyQR(product.qr_code || product.product_code)}>
                        <ContentCopyOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="In nhãn QR">
                      <IconButton size="small" onClick={() => printLabel(product)}>
                        <PrintOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Box sx={{ gridColumn: '1 / -1', justifySelf: 'center' }}>
                      <Tooltip title="Xóa sản phẩm">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={!isAdmin}
                            onClick={() => onDelete(product)}
                          >
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={Boolean(selectedQR)} onClose={() => setSelectedQR(null)} maxWidth="xs" fullWidth>
        <DialogTitle>QR sản phẩm</DialogTitle>
        <DialogContent>
          {selectedQR && (
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 800 }}>{selectedQR.product_code}</Typography>
              <Typography>{selectedQR.product_name}</Typography>
              {selectedQRImage && (
                <img
                  src={selectedQRImage}
                  alt="Product QR"
                  style={{ width: 220, height: 220, alignSelf: 'center', objectFit: 'contain' }}
                />
              )}
              <Typography sx={{ fontFamily: 'monospace', p: 1.2, border: '1px solid #ddd', borderRadius: 1 }}>
                {selectedQR.qr_code || selectedQR.product_code}
              </Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
