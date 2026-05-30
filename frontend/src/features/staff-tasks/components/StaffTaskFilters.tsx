/*
Senior Handover Note:
- Purpose: Search/filter compact cho danh sach task PDA.
- Dependencies: MUI TextField/Chip.
- HT730 screen assumptions: Controls must fit 480px width without horizontal scrolling.
- Responsive rules: Mobile-first vertical stack, chips wrap, no multi-column table filters.
- Scanner workflow: Filtering is separate from scan order action to keep scan button primary.
- Maintenance notes: Add only high-value filters; detail fields belong in picking detail.
*/

import { Chip, Stack, TextField } from '@mui/material'
import type { StaffTaskStatus } from '../types/staffTasks.types'

interface StaffTaskFiltersProps {
  search: string
  status: StaffTaskStatus | 'ALL'
  count: number
  onSearchChange: (value: string) => void
  onStatusChange: (value: StaffTaskStatus | 'ALL') => void
}

export function StaffTaskFilters({ search, status, count, onSearchChange, onStatusChange }: StaffTaskFiltersProps) {
  const statuses: Array<StaffTaskStatus | 'ALL'> = ['ALL', 'PENDING', 'PICKING']

  return (
    <Stack spacing={1}>
      <TextField
        size="small"
        fullWidth
        label="Tìm đơn"
        placeholder="Mã đơn hoặc tên khách"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        slotProps={{ htmlInput: { style: { fontSize: 15 } } }}
      />
      <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        {statuses.map((item) => (
          <Chip
            key={item}
            label={item}
            color={status === item ? 'primary' : 'default'}
            onClick={() => onStatusChange(item)}
            sx={{ minHeight: 36, fontWeight: 800 }}
          />
        ))}
        <Chip label={`Tổng ${count}`} color="secondary" sx={{ minHeight: 36, fontWeight: 800 }} />
      </Stack>
    </Stack>
  )
}
