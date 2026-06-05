/*
- Mục đích: Reusable Previous/Next pagination control for WMS tables and card lists.
- Phụ thuộc: MUI Button/Stack/Typography and shared pagination helpers.
- Hành vi máy quét HT730: Giữ danh sách tác vụ PDA/staff ngắn và ổn định sau khi máy quét cập nhật dữ liệu.
- Hợp đồng callback API: Không gọi API; component cha quản lý currentPage và dữ liệu đã phân trang.
- Ghi chú bảo trì: Default trang size is fixed at 10 for predictable HT730 and desktop UX.
*/

import { Button, Stack, Typography } from '@mui/material'
import { DEFAULT_PAGE_SIZE, clampPage, getPageCount } from '../lib/pagination'

interface ListPaginationProps {
  currentPage: number
  totalItems: number
  trangSize?: number
  onPageChange: (trang: number) => void
}

export function ListPagination({
  currentPage,
  totalItems,
  trangSize = DEFAULT_PAGE_SIZE,
  onPageChange,
}: ListPaginationProps) {
  const trangCount = getPageCount(totalItems, trangSize)
  const safePage = clampPage(currentPage, totalItems, trangSize)
  const canGoPrevious = safePage > 1
  const canGoNext = safePage < trangCount

  if (totalItems <= trangSize) return null

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'flex-end', mt: 1.5 }}>
      {/* Ghi chú: Kích thước trang danh sách WMS mặc định cố định 10 dòng để UX trên HT730 và desktop ổn định. */}
      <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
        Trang {safePage} / {trangCount} - Tổng {totalItems} mục
      </Typography>
      <Button type="button" variant="outlined" disabled={!canGoPrevious} onClick={() => onPageChange(safePage - 1)}>
        Previous
      </Button>
      <Button type="button" variant="outlined" disabled={!canGoNext} onClick={() => onPageChange(safePage + 1)}>
        Next
      </Button>
    </Stack>
  )
}
