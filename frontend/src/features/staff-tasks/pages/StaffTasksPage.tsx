/*
- Mục đích: Trang danh sach cong viec can lam cho staff warehouse.
- Phụ thuộc: staffTasksApi + StaffTaskList + centralized scanner + order scan endpoint.
- Hợp đồng API: GET /staff/tasks, GET /orders/scan/:qr_code.
- Quy tắc nghiệp vụ: danh sách tác vụ staff là điểm vào cho nhân viên kho.
- Ghi chú refactor thay thế: replacement refactor, no duplicate picking flow.
- Hành vi máy quét HT730: TagAccess Keyboard nhập QR vào input ẩn đang focus và gửi Enter.
- Hợp đồng callback API: Mode ORDER gọi GET /orders/scan/:qr_code.
- Ghi chú phân quyền: ADMIN/WAREHOUSE duoc vao route nay.
- Giả định màn hình HT730: Màn hình dọc 480x800, không dùng bảng, mặc định không hiển thị input quét.
- Quy tắc responsive: PdaLayout maxes content to 480px and action buttons are >=48px.
- Ghi chú bảo trì: Neu can assign task theo user sau nay, mo rong filter tai trang nay.
*/

import { useMemo, useState } from 'react'
import {
  Alert,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { staffTasksApi } from '../api/staffTasks.api'
import type { StaffTaskStatus } from '../types/staffTasks.types'
import { StaffTaskList } from '../components/StaffTaskList'
import { StaffTaskFilters } from '../components/StaffTaskFilters'
import { PdaLayout } from '../../pda/layout/PdaLayout'
import { useAuth } from '../../../app/providers/useAuth'

function getApiErrorData(error: unknown): { error_code?: string; error?: string } {
  if (!error || typeof error !== 'object') return {}
  const response = 'response' in error ? error.response : undefined
  if (!response || typeof response !== 'object') return {}
  const data = 'data' in response ? response.data : undefined
  return data && typeof data === 'object' ? data : {}
}

function mapStaffTaskError(error: unknown) {
  const { error_code: code, error: message } = getApiErrorData(error)
  if (code === 'TASK_ALREADY_ASSIGNED') return 'Công việc đã được nhân viên khác nhận.'
  if (code === 'ORDER_ALREADY_COMPLETED') return 'Đơn hàng đã hoàn thành.'
  if (code === 'ORDER_CANCELLED') return 'Đơn hàng đã bị hủy.'
  return message || 'Không thể nhận việc. Vui lòng thử lại.'
}

export function StaffTasksPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StaffTaskStatus | 'ALL'>('ALL')
  const [banner, setBanner] = useState<{ severity: 'success' | 'error'; text: string } | null>(null)

  const tasksQuery = useQuery({
    queryKey: ['staff-tasks'],
    queryFn: staffTasksApi.getTasks,
  })

  const claimMutation = useMutation({
    mutationFn: staffTasksApi.claimOrder,
    onSuccess: async (_, orderId) => {
      setBanner({ severity: 'success', text: 'Nhận việc thành công.' })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-task-summary'] }),
      ])
      navigate(`/staff/picking/${orderId}`)
    },
    onError: async (error) => {
      setBanner({ severity: 'error', text: mapStaffTaskError(error) })
      await queryClient.invalidateQueries({ queryKey: ['staff-tasks'] })
    },
  })

  const filteredTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return (tasksQuery.data || []).filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false
      if (!keyword) return true
      return item.order_code.toLowerCase().includes(keyword) || item.customer_name.toLowerCase().includes(keyword)
    })
  }, [search, statusFilter, tasksQuery.data])

  const waitingTasks = useMemo(() => {
    return filteredTasks.filter((item) => item.status === 'WAITING' || !item.assigned_to)
  }, [filteredTasks])

  const myTasks = useMemo(() => {
    return filteredTasks.filter((item) => item.status === 'PICKING' && item.assigned_to === user?.id)
  }, [filteredTasks, user?.id])

  const handleStart = (orderId: number) => {
    navigate(`/staff/picking/${orderId}`)
  }

  const handleClaim = (orderId: number) => {
    setBanner(null)
    claimMutation.mutate(orderId)
  }

  return (
    <PdaLayout title="Tác vụ nhặt hàng" subtitle="Đơn cần nhặt">
      <Paper sx={{ p: 1.5, borderRadius: 2 }}>
        <Stack spacing={1.2}>
          <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Tác vụ nhặt hàng</Typography>
          <StaffTaskFilters
            search={search}
            status={statusFilter}
            count={filteredTasks.length}
            onSearchChange={setSearch}
            onStatusChange={setStatusFilter}
          />
        </Stack>
      </Paper>

      {banner && <Alert severity={banner.severity}>{banner.text}</Alert>}

      <Stack spacing={1}>
        <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Việc nhặt hàng đang chờ nhận</Typography>
        <StaffTaskList
          items={waitingTasks}
          isLoading={tasksQuery.isLoading}
          isError={tasksQuery.isError}
          onStart={handleStart}
          onClaim={handleClaim}
          claimingOrderId={claimMutation.isPending ? Number(claimMutation.variables || 0) : null}
          emptyText="Chưa có công việc chờ nhận."
        />
      </Stack>

      <Stack spacing={1}>
        <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Việc nhặt hàng của tôi</Typography>
        <StaffTaskList
          items={myTasks}
          isLoading={tasksQuery.isLoading}
          isError={tasksQuery.isError}
          onStart={handleStart}
          onClaim={handleClaim}
          emptyText="Bạn chưa nhận công việc nào."
        />
      </Stack>

      {tasksQuery.isError && <Alert severity="error">Không tải được dữ liệu từ backend.</Alert>}
    </PdaLayout>
  )
}
