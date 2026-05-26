/*
Senior Handover Note:
- File nay la bang hien thi danh sach trays, thuoc presentation layer.
- Phu thuoc vao type `TrayDisplay`; page truyen san loading/error/empty states va actions de render.
- Component nay khong goi API truc tiep de dam bao clean architecture.
*/

import { DeleteOutlined, EditOutlined } from '@mui/icons-material'
import {
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material'
import type { TrayDisplay } from '../types/trayTypes'

interface TrayTableProps {
  trays: TrayDisplay[]
  isLoading: boolean
  isError: boolean
  isAdmin: boolean
  onEdit: (tray: TrayDisplay) => void
  onDelete: (tray: TrayDisplay) => void
}

export function TrayTable({ trays, isLoading, isError, isAdmin, onEdit, onDelete }: TrayTableProps) {
  return (
    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>ID</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Mã khay</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>ID sản phẩm</TableCell>
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
              {/* Senior Handover: Loading state khi query GET /trays chua hoan tat. */}
              <TableCell colSpan={11}>Đang tải danh sách khay...</TableCell>
            </TableRow>
          )}

          {isError && (
            <TableRow>
              {/* Senior Handover: Error state khi fetch danh sach trays that bai. */}
              <TableCell colSpan={11}>Không tải được danh sách khay.</TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && trays.length === 0 && (
            <TableRow>
              {/* Senior Handover: Empty state khi API tra danh sach rong. */}
              <TableCell colSpan={11}>Chưa có khay nào.</TableCell>
            </TableRow>
          )}

          {trays.map((tray) => (
            <TableRow key={tray.id} hover>
              <TableCell>#{tray.id}</TableCell>
              <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{tray.tray_code}</TableCell>
              <TableCell>{tray.product_id}</TableCell>
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
              <TableCell>{new Date(tray.created_at).toLocaleString('vi-VN')}</TableCell>
              <TableCell>{new Date(tray.updated_at).toLocaleString('vi-VN')}</TableCell>
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
  )
}
