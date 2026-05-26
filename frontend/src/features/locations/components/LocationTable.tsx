/*
Senior Handover Note:
- File này là bảng hiển thị danh sách locations, thuộc presentation layer.
- Phụ thuộc vào type `Location` và chỉ nhận data/flags từ page để render loading/error/empty.
- Không gọi API trực tiếp trong component này để tránh trộn logic data và UI.
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
import type { Location } from '../types/locationTypes'

interface LocationTableProps {
  locations: Location[]
  isLoading: boolean
  isError: boolean
  isAdmin: boolean
  onEdit: (location: Location) => void
  onDelete: (location: Location) => void
}

export function LocationTable({
  locations,
  isLoading,
  isError,
  isAdmin,
  onEdit,
  onDelete,
}: LocationTableProps) {
  return (
    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>ID</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Mã vị trí</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Kệ</TableCell>
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
              {/* Senior Handover: Loading state khi query GET /locations chưa hoàn tất. */}
              <TableCell colSpan={8}>Đang tải danh sách vị trí...</TableCell>
            </TableRow>
          )}

          {isError && (
            <TableRow>
              {/* Senior Handover: Error state khi fetch locations thất bại. */}
              <TableCell colSpan={8}>Không tải được danh sách vị trí.</TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && locations.length === 0 && (
            <TableRow>
              {/* Senior Handover: Empty state khi API trả danh sách rỗng. */}
              <TableCell colSpan={8}>Chưa có vị trí nào.</TableCell>
            </TableRow>
          )}

          {locations.map((location) => (
            <TableRow key={location.id} hover>
              <TableCell>#{location.id}</TableCell>
              <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                {location.location_code}
              </TableCell>
              <TableCell>{location.shelf || '-'}</TableCell>
              <TableCell>{location.description || '-'}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={location.is_active ? 'Đang dùng' : 'Ngưng dùng'}
                  color={location.is_active ? 'success' : 'default'}
                />
              </TableCell>
              <TableCell>{new Date(location.created_at).toLocaleString('vi-VN')}</TableCell>
              <TableCell>{new Date(location.updated_at).toLocaleString('vi-VN')}</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>
                <Tooltip title="Sửa vị trí">
                  <span>
                    <IconButton
                      color="primary"
                      size="small"
                      disabled={!isAdmin}
                      onClick={() => onEdit(location)}
                    >
                      <EditOutlined fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Xóa vị trí">
                  <span>
                    <IconButton
                      color="error"
                      size="small"
                      disabled={!isAdmin}
                      onClick={() => onDelete(location)}
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
