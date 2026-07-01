  /*
Thông tin ghi chú:
- File nay la bang hien thi danh sach trays, thuoc presentation layer.
- Phu thuoc vao type `TrayDisplay`; trang truyen san loading/error/empty states va actions de render.
- Component nay khong goi API truc tiep de dam bao clean architecture.
*/

import { DeleteOutlined, EditOutlined } from '@mui/icons-material'
import {
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
import { ProductImageThumb } from '../../../shared/components/ProductImageThumb'
import type { TrayDisplay } from '../types/trayTypes'
import { ContentCopyOutlined, PrintOutlined, QrCode2Outlined } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { formatDateTimeVN } from '../../../shared/lib/datetime'
import { toQrDataUrl } from '../../../shared/lib/qrCode'

interface TrayTableProps {
  trays: TrayDisplay[]
  isLoading: boolean
  isError: boolean
  isAdmin: boolean
  onEdit: (tray: TrayDisplay) => void
  onDelete: (tray: TrayDisplay) => void
}

export function TrayTable({ trays, isLoading, isError, isAdmin, onEdit, onDelete }: TrayTableProps) {
  const [selectedQR, setSelectedQR] = useState<TrayDisplay | null>(null)
  const [selectedQRImage, setSelectedQRImage] = useState('')

  const copyQR = async (value: string) => {
    await navigator.clipboard.writeText(value)
  }

  const printLabel = (tray: TrayDisplay) => {
    const qrValue = tray.qr_code || tray.tray_code
    void toQrDataUrl(qrValue).then((qrImage) => {
      const printWindow = window.open('', '_blank', 'width=500,height=700')
      if (!printWindow) return
      printWindow.document.write(`
        <html>
          <head><title>Tray QR Label</title></head>
          <body style="font-family: Arial, sans-serif; padding: 16px;">
            <h3>${tray.tray_code}</h3>
            <p>Vị trí: ${tray.location_code || '-'}</p>
            <p>Sản phẩm: ${tray.product_code || '-'} - ${tray.product_name || '-'}</p>
            <img src="${qrImage}" alt="Tray QR" style="width:220px;height:220px;display:block;margin:8px 0;" />
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
    const qrValue = selectedQR.qr_code || selectedQR.tray_code
    void toQrDataUrl(qrValue).then(setSelectedQRImage).catch(() => setSelectedQRImage(''))
  }, [selectedQR])

  return (
    <>
      <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Table>
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>ID</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Mã khay</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Sản phẩm</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Mã vị trí</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Mô tả vị trí</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Mã QR</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Mô tả</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Ngày tạo</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Cập nhật</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Thao tác</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading && (
            <TableRow>
              {/* Ghi chú: Trạng thái đang tải khi query GET /trays chua hoan tat. */}
              <TableCell colSpan={11}>Đang tải danh sách khay...</TableCell>
            </TableRow>
          )}

          {isError && (
            <TableRow>
              {/* Ghi chú: Trạng thái lỗi khi fetch danh sach trays that bai. */}
              <TableCell colSpan={11}>Không tải được danh sách khay.</TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && trays.length === 0 && (
            <TableRow>
              {/* Ghi chú: Trạng thái rỗng khi API tra danh sach rong. */}
              <TableCell colSpan={11}>Chưa có khay nào.</TableCell>
            </TableRow>
          )}

          {trays.map((tray) => (
            <TableRow key={tray.id} hover>
              <TableCell>#{tray.id}</TableCell>
              <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{tray.tray_code}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <ProductImageThumb src={tray.product_image_url} alt={tray.product_name} size={40} />
                  <span>
                    {tray.product_code} - {tray.product_name}
                  </span>
                </Stack>
              </TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{tray.location_code}</TableCell>
              <TableCell>{tray.location_description || '-'}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{tray.qr_code}</TableCell>
              <TableCell>{tray.description || '-'}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={tray.is_active ? 'Đang dùng' : 'Ngưng dùng'}
                  color={tray.is_active ? 'success' : 'default'}
                />
              </TableCell>
              <TableCell>{formatDateTimeVN(tray.created_at)}</TableCell>
              <TableCell>{formatDateTimeVN(tray.updated_at)}</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>
                <Tooltip title="Sửa khay">
                  <span>
                    <IconButton
                      color="primary"
                      size="small"
                      disabled={!isAdmin}
                      onClick={() => onEdit(tray)}
                    >
                      <EditOutlined fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Xem QR">
                  <span>
                    <IconButton size="small" onClick={() => setSelectedQR(tray)}>
                      <QrCode2Outlined fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Copy QR">
                  <span>
                    <IconButton size="small" onClick={() => copyQR(tray.qr_code || tray.tray_code)}>
                      <ContentCopyOutlined fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="In nhãn QR">
                  <span>
                    <IconButton size="small" onClick={() => printLabel(tray)}>
                      <PrintOutlined fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Xóa khay">
                  <span>
                    <IconButton
                      color="error"
                      size="small"
                      disabled={!isAdmin}
                      onClick={() => onDelete(tray)}
                    >
                      <DeleteOutlined fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </TableContainer>

      <Dialog open={Boolean(selectedQR)} onClose={() => setSelectedQR(null)} maxWidth="xs" fullWidth>
        <DialogTitle>QR khay</DialogTitle>
        <DialogContent>
          {selectedQR && (
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 800 }}>{selectedQR.tray_code}</Typography>
              <Typography>Vị trí: {selectedQR.location_code || '-'}</Typography>
              <Typography>Sản phẩm: {selectedQR.product_code || '-'} - {selectedQR.product_name || '-'}</Typography>
              {selectedQRImage && (
                <img
                  src={selectedQRImage}
                  alt="Tray QR"
                  style={{ width: 220, height: 220, alignSelf: 'center', objectFit: 'contain' }}
                />
              )}
              <Typography sx={{ fontFamily: 'monospace', p: 1.2, border: '1px solid #ddd', borderRadius: 1 }}>
                {selectedQR.qr_code || selectedQR.tray_code}
              </Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
