/*
Thông tin ghi chú:
- File này là bảng hiển thị danh sách locations, thuộc presentation layer.
- Phụ thuộc vào type `Location` và chỉ nhận data/flags từ trang để render loading/error/empty.
- Không gọi API trực tiếp trong component này để tránh trộn logic data và UI.
*/

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { LocationExpandableRow } from './LocationExpandableRow'
import type { Location, LocationTray } from '../types/locationTypes'

interface LocationTableProps {
  locations: Location[]
  isLoading: boolean
  isError: boolean
  isAdmin: boolean
  expandedLocationId: number | null
  traysByLocationId: Record<number, LocationTray[]>
  loadingLocationId: number | null
  errorByLocationId: Record<number, string>
  onToggleLocation: (location: Location) => void
  onRetryLocationTrays: (location: Location) => void
  onEdit: (location: Location) => void
  onDelete: (location: Location) => void
}

export function LocationTable({
  locations,
  isLoading,
  isError,
  isAdmin,
  expandedLocationId,
  traysByLocationId,
  loadingLocationId,
  errorByLocationId,
  onToggleLocation,
  onRetryLocationTrays,
  onEdit,
  onDelete,
}: LocationTableProps) {
  return (
    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ width: 52 }} />
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
              {/* Ghi chú: Trạng thái đang tải khi query GET /locations chưa hoàn tất. */}
              <TableCell colSpan={9}>Đang tải danh sách vị trí...</TableCell>
            </TableRow>
          )}

          {isError && (
            <TableRow>
              {/* Ghi chú: Trạng thái lỗi khi fetch locations thất bại. */}
              <TableCell colSpan={9}>Không tải được danh sách vị trí.</TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && locations.length === 0 && (
            <TableRow>
              {/* Ghi chú: Trạng thái rỗng khi API trả danh sách rỗng. */}
              <TableCell colSpan={9}>Chưa có vị trí nào.</TableCell>
            </TableRow>
          )}

          {locations.map((location) => (
            <LocationExpandableRow
              key={location.id}
              location={location}
              expanded={expandedLocationId === location.id}
              trays={traysByLocationId[location.id]}
              isLoading={loadingLocationId === location.id}
              error={errorByLocationId[location.id]}
              isAdmin={isAdmin}
              onToggle={onToggleLocation}
              onRetry={onRetryLocationTrays}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
