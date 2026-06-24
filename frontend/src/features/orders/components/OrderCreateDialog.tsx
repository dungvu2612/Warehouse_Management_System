/*
- Mục đích: Dialog tao don hang theo items[] da chon, khong con flow BOM single-select.
- Phụ thuộc: Products query + OrderItemsEditor + orders API POST /orders.
- Hợp đồng API: POST /orders { customer_name, customer_phone, customer_address, items[] }.
- Multi-item order behavior: Cho phep them/sua/xoa nhieu dong item truoc khi tao don.
- Quy tắc phân quyền: Gia san pham cho phep sua khi canEditPrice=true (ADMIN).
- Ghi chú bảo trì: Validate items o FE de feedback nhanh, backend van la nguon su that cuoi.
*/

import { useMemo, useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'
import { http } from '../../../shared/lib/http'
import type { Order } from '../types/orderTypes'
import { OrderItemsEditor, type OrderEditorItem } from './OrderItemsEditor'
import { useProductsQuery } from '../../products/hooks/useProducts'
import { useInventoryQuery, useInventoryTraysQuery } from '../../inventory/hooks/useInventory'
import { mapOrderApiError } from '../utils/orderError'

export interface OrderCreateDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: (order: Order) => void
  canEditPrice: boolean
}

export function OrderCreateDialog({
  open,
  onClose,
  onSuccess,
  canEditPrice,
}: OrderCreateDialogProps) {
  const productsQuery = useProductsQuery()
  const inventoryQuery = useInventoryQuery()
  const traysQuery = useInventoryTraysQuery()
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [items, setItems] = useState<OrderEditorItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hasDuplicateProduct = useMemo(() => {
    const set = new Set<number>()
    for (const item of items) {
      if (set.has(item.product_id)) return true
      set.add(item.product_id)
    }
    return false
  }, [items])

  const stockQuantityByProductId = useMemo(() => {
    const result = new Map<number, number>()
    for (const tray of traysQuery.data || []) {
      result.set(tray.product_id, 0)
    }
    for (const item of inventoryQuery.data || []) {
      result.set(item.product_id, (result.get(item.product_id) || 0) + item.quantity)
    }
    return result
  }, [inventoryQuery.data, traysQuery.data])

  const productsWithTray = useMemo(() => {
    return (productsQuery.data || []).filter((product) => stockQuantityByProductId.has(product.id))
  }, [productsQuery.data, stockQuantityByProductId])

  const handleClose = () => {
    setCustomerName('')
    setCustomerPhone('')
    setCustomerAddress('')
    setItems([])
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    const name = customerName.trim()
    const phone = customerPhone.trim()
    const address = customerAddress.trim()
    if (!name) return setError('Tên khách hàng không được để trống')
    if (items.length === 0) return setError('Đơn hàng phải có ít nhất 1 sản phẩm')
    if (hasDuplicateProduct) return setError('Không được trùng sản phẩm trong cùng đơn')

    for (const item of items) {
      if (!item.product_id || item.quantity <= 0 || item.unit_price < 0) {
        return setError('Dữ liệu sản phẩm không hợp lệ')
      }
      const availableQuantity = stockQuantityByProductId.get(item.product_id) || 0
      if (availableQuantity <= 0) {
        return setError('Sản phẩm đã chọn chưa có khay hoặc chưa có tồn kho.')
      }
      if (item.quantity > availableQuantity) {
        return setError(`Số lượng đặt vượt tồn kho hiện có. Tồn hiện tại: ${availableQuantity}.`)
      }
    }

    setLoading(true)
    setError('')
    try {
      const { data } = await http.post<Order>('/orders', {
        customer_name: name,
        customer_phone: phone,
        customer_address: address,
        items,
      })
      onSuccess(data)
      handleClose()
    } catch (err) {
      setError(mapOrderApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>Tạo đơn hàng mới</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField label="Tên khách hàng" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required fullWidth />
            <TextField label="Số điện thoại" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} fullWidth />
          </Stack>
          <TextField label="Địa chỉ giao hàng" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} fullWidth multiline rows={2} />

          <OrderItemsEditor
            products={productsWithTray}
            items={items}
            onChange={setItems}
            canEditPrice={canEditPrice}
            availableQuantityByProductId={stockQuantityByProductId}
          />

          {!productsQuery.isLoading && !inventoryQuery.isLoading && !traysQuery.isLoading && productsWithTray.length === 0 && (
            <Alert severity="warning">
              Chưa có sản phẩm nào có khay để tạo đơn.
            </Alert>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Hủy</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || productsQuery.isLoading || inventoryQuery.isLoading || traysQuery.isLoading}
        >
          {loading ? 'Đang tạo...' : 'Tạo đơn'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
