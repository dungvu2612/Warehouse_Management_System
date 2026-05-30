/*
Senior Handover Note:
- Purpose: Orders page read-only quan ly danh sach va dieu huong den Order Detail.
- Dependencies: useOrdersQuery + OrderTable + orderService filter helper.
- API contract: GET /orders.
- Business rules: Orders page khong van hanh picking; picking chi chay o PDA route.
- Replacement refactor notes: old scan/confirm/finish/picking panel da bi xoa khoi trang nay.
- Maintenance notes: Neu can tao order lai tren trang rieng, dung module route khac, khong ghep lai vao day.
*/

import { useEffect, useMemo, useState } from 'react'
import { Add, Refresh } from '@mui/icons-material'
import { Box, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/providers/AuthProvider'
import { useDeleteOrderMutation, useOrdersQuery } from '../hooks/useOrders'
import { OrderTable } from '../components/OrderTable'
import { orderService } from '../services/orderService'
import type { Order, OrderStatus } from '../types/orderTypes'
import { ListPagination } from '../../../shared/components/ListPagination'
import { DEFAULT_PAGE_SIZE, paginateItems } from '../../../shared/lib/pagination'
import { OrderCreateDialog } from '../components/OrderCreateDialog'

export function OrdersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const canCreateOrder = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE'
  const canManageOrder = user?.role === 'ADMIN'

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [orderCreateOpen, setOrderCreateOpen] = useState(false)

  const ordersQuery = useOrdersQuery(statusFilter === 'ALL' ? undefined : statusFilter)
  const deleteOrderMutation = useDeleteOrderMutation()

  const filteredOrders = useMemo(() => {
    return orderService.filterOrdersByKeyword(ordersQuery.data || [], search)
  }, [ordersQuery.data, search])

  useEffect(() => {
    // Senior Handover: Reset page to 1 whenever search/filter changes.
    setCurrentPage(1)
  }, [search, statusFilter])

  const paginatedOrders = useMemo(() => {
    return paginateItems(filteredOrders, currentPage, DEFAULT_PAGE_SIZE)
  }, [filteredOrders, currentPage])

  const handleOpenDetail = (orderId: number) => {
    navigate(`/orders/${orderId}`)
  }

  const handleEditOrder = (order: Order) => {
    if (!canManageOrder) return
    navigate(`/orders/${order.id}/edit`)
  }

  const handleDeleteOrder = (order: Order) => {
    if (!canManageOrder) return
    const ok = window.confirm(`Xóa đơn ${order.order_code}?`)
    if (!ok) return
    deleteOrderMutation.mutate(order.id)
  }

  return (
    <Stack spacing={2.5}>
      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1.5,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Danh sách đơn hàng
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Trang này chỉ để xem danh sách, mở chi tiết, in đơn và theo dõi nhật ký nhặt/giao dịch kho.
            </Typography>
          </Box>

          <Button variant="outlined" startIcon={<Refresh />} onClick={() => ordersQuery.refetch()}>
            Làm mới
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            disabled={!canCreateOrder}
            onClick={() => setOrderCreateOpen(true)}
          >
            Tạo đơn mới
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ alignItems: { lg: 'center' } }}>
          <TextField
            label="Tìm đơn hàng"
            placeholder="Tìm theo order_code, khách hàng, qr_code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />

          <TextField
            select
            label="Trạng thái"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="ALL">Tất cả</MenuItem>
            <MenuItem value="PENDING">Chờ xử lý</MenuItem>
            <MenuItem value="PICKING">Đang nhặt</MenuItem>
            <MenuItem value="COMPLETED">Hoàn thành</MenuItem>
            <MenuItem value="CANCELLED">Đã hủy</MenuItem>
          </TextField>

          <Chip color="secondary" label={`Tổng đơn: ${filteredOrders.length}`} sx={{ fontWeight: 800, alignSelf: { xs: 'flex-start', lg: 'center' } }} />
        </Stack>

        <Box sx={{ mt: 2.2 }}>
          <OrderTable
            orders={paginatedOrders}
            isLoading={ordersQuery.isLoading}
            isError={ordersQuery.isError}
            canManage={canManageOrder}
            onEdit={handleEditOrder}
            onDelete={handleDeleteOrder}
            onOpenDetail={(order) => handleOpenDetail(order.id)}
          />
          <ListPagination
            currentPage={currentPage}
            totalItems={filteredOrders.length}
            pageSize={DEFAULT_PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </Box>
      </Paper>

      <OrderCreateDialog
        open={orderCreateOpen}
        onClose={() => setOrderCreateOpen(false)}
        canEditPrice={user?.role === 'ADMIN'}
        onSuccess={(order: Order) => {
          setOrderCreateOpen(false)
          navigate(`/orders/${order.id}`)
          void ordersQuery.refetch()
        }}
      />
    </Stack>
  )
}
