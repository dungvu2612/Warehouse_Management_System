/*
- Mục đích: Orders trang chỉ xem quan ly danh sach va dieu huong den Order Detail.
- Phụ thuộc: useOrdersQuery + OrderTable + orderService filter helper.
- Hợp đồng API: GET /orders.
- Quy tắc nghiệp vụ: Orders trang khong van hanh picking; picking chi chay o PDA route.
- Ghi chú refactor thay thế: old scan/confirm/finish/picking panel da bi xoa khoi trang nay.
- Ghi chú bảo trì: Neu can tao order lai tren trang rieng, dung module route khac, khong ghep lai vao day.
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
import { orderPrintService } from '../services/orderPrintService'
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
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([])

  const ordersQuery = useOrdersQuery(statusFilter === 'ALL' ? undefined : statusFilter)
  const deleteOrderMutation = useDeleteOrderMutation()

  const filteredOrders = useMemo(() => {
    return orderService.filterOrdersByKeyword(ordersQuery.data || [], search)
  }, [ordersQuery.data, search])

  useEffect(() => {
    // Ghi chú: Reset trang to 1 whenever search/filter changes.
    setCurrentPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    const validIds = new Set((ordersQuery.data || []).map((order) => order.id))
    setSelectedOrderIds((prev) => prev.filter((id) => validIds.has(id)))
  }, [ordersQuery.data])

  const paginatedOrders = useMemo(() => {
    return paginateItems(filteredOrders, currentPage, DEFAULT_PAGE_SIZE)
  }, [filteredOrders, currentPage])

  const selectedOrders = useMemo(() => {
    const selectedSet = new Set(selectedOrderIds)
    return filteredOrders.filter((order) => selectedSet.has(order.id))
  }, [filteredOrders, selectedOrderIds])

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

  const handleToggleSelectOrder = (orderId: number) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
    )
  }

  const handleToggleSelectAllInPage = (orderIds: number[]) => {
    setSelectedOrderIds((prev) => {
      const allSelected = orderIds.every((id) => prev.includes(id))
      if (allSelected) return prev.filter((id) => !orderIds.includes(id))
      return Array.from(new Set([...prev, ...orderIds]))
    })
  }

  const handlePrintSelectedOrders = async () => {
    await orderPrintService.printSelectedOrders(selectedOrders)
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

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={() => ordersQuery.refetch()}>
              Làm mới
            </Button>
            <Button
              variant="outlined"
              disabled={selectedOrders.length === 0}
              onClick={() => void handlePrintSelectedOrders()}
            >
              In đơn đã chọn ({selectedOrders.length})
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              disabled={!canCreateOrder}
              onClick={() => setOrderCreateOpen(true)}
            >
              Tạo đơn mới
            </Button>
          </Stack>
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
            selectedIds={selectedOrderIds}
            onToggleSelect={handleToggleSelectOrder}
            onToggleSelectAll={handleToggleSelectAllInPage}
          />
          <ListPagination
            currentPage={currentPage}
            totalItems={filteredOrders.length}
            trangSize={DEFAULT_PAGE_SIZE}
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
