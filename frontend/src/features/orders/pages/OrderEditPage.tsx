/*
- Mục đích: Trang sua don hang (PENDING) voi multi-item editor va xem linh kien BOM theo tung san pham.
- Phụ thuộc: Orders hooks, Products hook, BOM hooks, OrderItemsEditor.
- Hợp đồng API: PUT /orders/:id { customer_name, customer_phone, customer_address, items[] }.
- Multi-item order behavior: Them/sua/xoa item truc tiep va tinh tong realtime.
- Picking task regeneration rule: Backend regen picking_tasks tu items moi trong transaction.
- Quy tắc phân quyền: Chi ADMIN duoc sua don gia; chi order PENDING moi duoc luu.
- Ghi chú bảo trì: Khi mo rong role, cap nhat canEditPrice va trang thai khoa sua tai day.
*/

import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../app/providers/AuthProvider'
import { useOrderByIdQuery, useUpdateOrderMutation } from '../hooks/useOrders'
import { OrderItemsEditor, type OrderEditorItem } from '../components/OrderItemsEditor'
import { useProductsQuery } from '../../products/hooks/useProducts'
import { useBOMItemsQuery, useBOMsQuery } from '../../boms/hooks/useBOMs'

export function OrderEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const orderId = Number(id)

  const detailQuery = useOrderByIdQuery(Number.isFinite(orderId) ? orderId : null)
  const productsQuery = useProductsQuery()
  const bomsQuery = useBOMsQuery()
  const [selectedBomId, setSelectedBomId] = useState<number | null>(null)
  const bomItemsQuery = useBOMItemsQuery(selectedBomId)

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [items, setItems] = useState<OrderEditorItem[]>([])
  const [initialized, setInitialized] = useState(false)
  const [message, setMessage] = useState('')

  const order = detailQuery.data?.order
  const canEditPrice = user?.role === 'ADMIN'
  const canEditOrder = order?.status === 'PENDING'

  const updateMutation = useUpdateOrderMutation({
    onSuccess: () => {
      setMessage('Đã lưu thay đổi đơn hàng.')
      void detailQuery.refetch()
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Không lưu được đơn hàng')
    },
  })

  useEffect(() => {
    if (!order || initialized) return
    setCustomerName(order.customer_name || '')
    setCustomerPhone(order.customer_phone || '')
    setCustomerAddress(order.customer_address || '')
    setItems((order.items || []).map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })))
    setInitialized(true)
  }, [order, initialized])

  const bomIdByProductId = useMemo(() => {
    const map = new Map<number, number>()
    for (const bom of bomsQuery.data || []) {
      if (bom.product_id) map.set(bom.product_id, bom.id)
    }
    return map
  }, [bomsQuery.data])

  const hasDuplicateProduct = useMemo(() => {
    const set = new Set<number>()
    for (const item of items) {
      if (set.has(item.product_id)) return true
      set.add(item.product_id)
    }
    return false
  }, [items])

  const handleSave = () => {
    if (!order || !canEditOrder) return
    if (!customerName.trim()) return setMessage('Tên khách hàng không được để trống.')
    if (items.length === 0) return setMessage('Đơn hàng phải có ít nhất 1 sản phẩm.')
    if (hasDuplicateProduct) return setMessage('Không được trùng sản phẩm trong cùng đơn.')

    for (const item of items) {
      if (!item.product_id || item.quantity <= 0 || item.unit_price < 0) {
        return setMessage('Danh sách sản phẩm không hợp lệ.')
      }
    }

    updateMutation.mutate({
      id: order.id,
      payload: {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_address: customerAddress.trim(),
        items,
      },
    })
  }

  if (!Number.isFinite(orderId) || orderId <= 0) {
    return <Alert severity="error">Mã đơn hàng không hợp lệ.</Alert>
  }

  return (
    <Stack spacing={2.5}>
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Button variant="text" startIcon={<ArrowBack />} onClick={() => navigate(`/orders/${orderId}`)}>
              Quay lại chi tiết đơn
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>Sửa đơn hàng</Typography>
            <Typography color="text.secondary">{order?.order_code || '-'}</Typography>
          </Box>
          <Button variant="contained" onClick={handleSave} disabled={!canEditOrder || updateMutation.isPending}>
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </Stack>
      </Paper>

      {detailQuery.isLoading && <Alert severity="info">Đang tải dữ liệu đơn hàng...</Alert>}
      {detailQuery.isError && <Alert severity="error">Không tải được dữ liệu đơn hàng.</Alert>}

      {order && !canEditOrder && (
        <Alert severity="warning">
          Đơn đang ở trạng thái {order.status}, không thể chỉnh sửa sản phẩm.
        </Alert>
      )}

      {order && (
        <>
          <Paper sx={{ p: 2.5 }}>
            <Stack spacing={1.5}>
              <Typography sx={{ fontWeight: 900, fontSize: 18 }}>Thông tin khách hàng</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <TextField label="Tên khách hàng" value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={!canEditOrder} fullWidth />
                <TextField label="Số điện thoại" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} disabled={!canEditOrder} fullWidth />
              </Stack>
              <TextField
                label="Địa chỉ giao hàng"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                multiline
                rows={2}
                disabled={!canEditOrder}
                fullWidth
              />
            </Stack>
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <Stack spacing={1.5}>
              <Typography sx={{ fontWeight: 900, fontSize: 18 }}>Sản phẩm trong đơn</Typography>
              <OrderItemsEditor
                products={productsQuery.data || []}
                items={items}
                onChange={setItems}
                canEditPrice={canEditPrice && canEditOrder}
                onInspectProduct={(productId) => setSelectedBomId(bomIdByProductId.get(productId) || null)}
              />
            </Stack>
          </Paper>
        </>
      )}

      {message && <Alert severity={message.includes('Đã lưu') ? 'success' : 'error'}>{message}</Alert>}

      <Dialog open={Boolean(selectedBomId)} onClose={() => setSelectedBomId(null)} fullWidth maxWidth="md">
        <DialogTitle>Linh kiện cấu thành</DialogTitle>
        <DialogContent>
          {bomItemsQuery.isLoading && <Alert severity="info">Đang tải linh kiện...</Alert>}
          {bomItemsQuery.isError && <Alert severity="error">Không tải được linh kiện BOM.</Alert>}
          {!bomItemsQuery.isLoading && !bomItemsQuery.isError && (
            <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Mã linh kiện</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Tên linh kiện</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>SL/BOM</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(bomItemsQuery.data?.items || []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{item.component_product?.product_code || '-'}</TableCell>
                      <TableCell>{item.component_product?.product_name || '-'}</TableCell>
                      <TableCell>{Number(item.quantity || 0).toLocaleString('vi-VN')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  )
}
