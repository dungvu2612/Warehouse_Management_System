/*
Senior Handover Note:
- Purpose: Reusable Previous/Next pagination control for WMS tables and card lists.
- Dependencies: MUI Button/Stack/Typography and shared pagination helpers.
- HT730 scanner behavior: Keeps PDA/staff task lists short and stable after scanner updates.
- API callback contract: No API calls; parent owns currentPage and paginated data.
- Maintenance notes: Default page size is fixed at 10 for predictable HT730 and desktop UX.
*/

import { Button, Stack, Typography } from '@mui/material'
import { DEFAULT_PAGE_SIZE, clampPage, getPageCount } from '../lib/pagination'

interface ListPaginationProps {
  currentPage: number
  totalItems: number
  pageSize?: number
  onPageChange: (page: number) => void
}

export function ListPagination({
  currentPage,
  totalItems,
  pageSize = DEFAULT_PAGE_SIZE,
  onPageChange,
}: ListPaginationProps) {
  const pageCount = getPageCount(totalItems, pageSize)
  const safePage = clampPage(currentPage, totalItems, pageSize)
  const canGoPrevious = safePage > 1
  const canGoNext = safePage < pageCount

  if (totalItems <= pageSize) return null

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'flex-end', mt: 1.5 }}>
      {/* Senior Handover: Default WMS list page size is fixed at 10 for predictable HT730 and desktop UX. */}
      <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
        Trang {safePage} / {pageCount} - Tổng {totalItems} mục
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
