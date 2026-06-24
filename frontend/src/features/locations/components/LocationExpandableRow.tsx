/*
- Mục đích: Table row có thể expand để hiển thị khay của location.
- Phụ thuộc: LocationTrayDropdown, Location type, permission flag từ page.
- Ghi chú bảo trì: Component này không gọi API, chỉ phát sự kiện toggle/retry/action.
*/

import { Fragment } from 'react'
import { KeyboardArrowDown, KeyboardArrowRight, DeleteOutlined, EditOutlined } from '@mui/icons-material'
import {
  Chip,
  Collapse,
  IconButton,
  TableCell,
  TableRow,
  Tooltip,
} from '@mui/material'
import { LocationTrayDropdown } from './LocationTrayDropdown'
import { formatDateTimeVN } from '../../../shared/lib/datetime'
import type { Location, LocationTray } from '../types/locationTypes'

interface LocationExpandableRowProps {
  location: Location
  expanded: boolean
  trays?: LocationTray[]
  isLoading: boolean
  error?: string
  isAdmin: boolean
  onToggle: (location: Location) => void
  onRetry: (location: Location) => void
  onEdit: (location: Location) => void
  onDelete: (location: Location) => void
}

export function LocationExpandableRow({
  location,
  expanded,
  trays,
  isLoading,
  error,
  isAdmin,
  onToggle,
  onRetry,
  onEdit,
  onDelete,
}: LocationExpandableRowProps) {
  return (
    <Fragment>
      <TableRow
        hover
        selected={expanded}
        sx={{
          cursor: 'pointer',
          '&.Mui-selected': { bgcolor: 'rgba(14, 165, 233, 0.08)' },
          '&.Mui-selected:hover': { bgcolor: 'rgba(14, 165, 233, 0.12)' },
        }}
        onClick={() => onToggle(location)}
      >
        <TableCell sx={{ width: 52 }}>
          <IconButton
            size="small"
            aria-label={expanded ? 'Thu danh sách khay' : 'Mở danh sách khay'}
            onClick={(event) => {
              event.stopPropagation()
              onToggle(location)
            }}
          >
            {expanded ? <KeyboardArrowDown fontSize="small" /> : <KeyboardArrowRight fontSize="small" />}
          </IconButton>
        </TableCell>
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
        <TableCell>{formatDateTimeVN(location.created_at)}</TableCell>
        <TableCell>{formatDateTimeVN(location.updated_at)}</TableCell>
        <TableCell sx={{ textAlign: 'center' }} onClick={(event) => event.stopPropagation()}>
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
      <TableRow>
        <TableCell colSpan={9} sx={{ p: 0, borderBottom: expanded ? '1px solid #e2e8f0' : 0 }}>
          <Collapse in={expanded} timeout={180} unmountOnExit>
            <LocationTrayDropdown
              trays={trays}
              isLoading={isLoading}
              error={error}
              onRetry={() => onRetry(location)}
            />
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  )
}
