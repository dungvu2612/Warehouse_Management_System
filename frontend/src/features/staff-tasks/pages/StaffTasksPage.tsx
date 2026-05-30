/*
Senior Handover Note:
- Purpose: Trang danh sach cong viec can lam cho staff warehouse.
- Dependencies: staffTasksApi + StaffTaskList + centralized scanner + order scan endpoint.
- API contract: GET /staff/tasks, GET /orders/scan/:qr_code.
- Business rules: staff task list is the entry point for warehouse workers.
- Replacement refactor notes: replacement refactor, no duplicate picking flow.
- HT730 scanner behavior: TagAccess Keyboard types QR into focused hidden input and sends Enter.
- API callback contract: ORDER mode calls GET /orders/scan/:qr_code.
- Permission notes: ADMIN/WAREHOUSE duoc vao route nay.
- HT730 screen assumptions: 480x800 portrait, no table, no visible scanner input by default.
- Responsive rules: PdaLayout maxes content to 480px and action buttons are >=48px.
- Maintenance notes: Neu can assign task theo user sau nay, mo rong filter tai page nay.
*/

import { useEffect, useMemo, useState } from 'react'
import { Alert, Paper, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { staffTasksApi } from '../api/staffTasks.api'
import type { StaffTaskStatus } from '../types/staffTasks.types'
import { StaffTaskList } from '../components/StaffTaskList'
import { StaffTaskFilters } from '../components/StaffTaskFilters'
import { PdaLayout } from '../../pda/layout/PdaLayout'
import { ListPagination } from '../../../shared/components/ListPagination'
import { DEFAULT_PAGE_SIZE, paginateItems } from '../../../shared/lib/pagination'

export function StaffTasksPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StaffTaskStatus | 'ALL'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)

  const tasksQuery = useQuery({
    queryKey: ['staff-tasks'],
    queryFn: staffTasksApi.getTasks,
  })

  const filteredTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return (tasksQuery.data || []).filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false
      if (!keyword) return true
      return item.order_code.toLowerCase().includes(keyword) || item.customer_name.toLowerCase().includes(keyword)
    })
  }, [search, statusFilter, tasksQuery.data])

  useEffect(() => {
    // Senior Handover: Reset page to 1 whenever search/filter changes.
    setCurrentPage(1)
  }, [search, statusFilter])

  const paginatedTasks = useMemo(() => {
    return paginateItems(filteredTasks, currentPage, DEFAULT_PAGE_SIZE)
  }, [filteredTasks, currentPage])

  const handleStart = (orderId: number) => {
    navigate(`/staff/picking/${orderId}`)
  }

  return (
    <PdaLayout title="Tác vụ kho" subtitle="Đơn cần nhặt">
      <Paper sx={{ p: 1.5, borderRadius: 2 }}>
        <Stack spacing={1.2}>
          <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Danh sách đơn</Typography>
          <StaffTaskFilters
            search={search}
            status={statusFilter}
            count={filteredTasks.length}
            onSearchChange={setSearch}
            onStatusChange={setStatusFilter}
          />
        </Stack>
      </Paper>

      <StaffTaskList
        items={paginatedTasks}
        isLoading={tasksQuery.isLoading}
        isError={tasksQuery.isError}
        onStart={handleStart}
      />
      <ListPagination
        currentPage={currentPage}
        totalItems={filteredTasks.length}
        pageSize={DEFAULT_PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

      {tasksQuery.isError && <Alert severity="error">Không tải được dữ liệu từ backend.</Alert>}
    </PdaLayout>
  )
}
