/*
- Mục đích: Dialog tao don hang theo items[] da chon, khong con flow BOM single-select.
- Phụ thuộc: Products query + OrderItemsEditor + orders API POST /orders.
- Hợp đồng API: POST /orders { customer_name, customer_phone, customer_address, items[] }.
- Multi-item order behavior: Cho phep them/sua/xoa nhieu dong item truoc khi tao don.
- Quy tắc phân quyền: Gia san pham cho phep sua khi canEditPrice=true (ADMIN).
- Ghi chú bảo trì: Validate items o FE de feedback nhanh, backend van la nguon su that cuoi.
*/

import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'
import { http } from '../../../shared/lib/http'
import type { Order, OrderShortagePreviewResponse } from '../types/orderTypes'
import { OrderItemsEditor, type OrderEditorItem } from './OrderItemsEditor'
import { useProductsQuery } from '../../products/hooks/useProducts'
import { useInventoryQuery, useInventoryTraysQuery } from '../../inventory/hooks/useInventory'
import { mapOrderApiError } from '../utils/orderError'
import { useBOMsQuery } from '../../boms/hooks/useBOMs'

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
  const bomsQuery = useBOMsQuery()
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [items, setItems] = useState<OrderEditorItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shortagePreview, setShortagePreview] = useState<OrderShortagePreviewResponse | null>(null)
  const [shortagePreviewError, setShortagePreviewError] = useState('')

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

  const finishedGoodProductIdsWithBom = useMemo(() => {
    const result = new Set<number>()
    for (const bom of bomsQuery.data || []) {
      if (bom.product_id) result.add(bom.product_id)
    }
    return result
  }, [bomsQuery.data])

  const productsWithTray = useMemo(() => {
    return (productsQuery.data || []).filter((product) => {
      if (product.product_type === 'FINISHED_GOOD') {
        return finishedGoodProductIdsWithBom.has(product.id)
      }
      return stockQuantityByProductId.has(product.id)
    })
  }, [productsQuery.data, stockQuantityByProductId, finishedGoodProductIdsWithBom])

  const handleClose = () => {
    setCustomerName('')
    setCustomerPhone('')
    setCustomerAddress('')
    setItems([])
    setError('')
    setShortagePreview(null)
    setShortagePreviewError('')
    onClose()
  }

  useEffect(() => {
    if (!open) return
    if (productsQuery.isLoading || inventoryQuery.isLoading || traysQuery.isLoading || bomsQuery.isLoading) return
    if (!customerName.trim() || items.length === 0 || hasDuplicateProduct) {
      setShortagePreview(null)
      setShortagePreviewError('')
      return
    }
    if (items.some((item) => !item.product_id || item.quantity <= 0 || item.unit_price < 0)) {
      setShortagePreview(null)
      setShortagePreviewError('')
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const { data } = await http.post<OrderShortagePreviewResponse>('/orders/preview-shortage', {
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_address: customerAddress.trim(),
          items,
        })
        if (cancelled) return
        setShortagePreview(data)
        setShortagePreviewError('')
      } catch (err) {
        if (cancelled) return
        setShortagePreview(null)
        setShortagePreviewError('Chưa thể kiểm tra thiếu linh kiện lúc này. Vui lòng kiểm tra lại thông tin đơn hàng.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    open,
    items,
    hasDuplicateProduct,
    customerName,
    customerPhone,
    customerAddress,
    productsQuery.isLoading,
    inventoryQuery.isLoading,
    traysQuery.isLoading,
    bomsQuery.isLoading,
  ])

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
      const product = (productsQuery.data || []).find((candidate) => candidate.id === item.product_id)
      if (!product) {
        return setError('Sản phẩm đã chọn không còn hợp lệ.')
      }
      if (product.product_type === 'FINISHED_GOOD') {
        if (!finishedGoodProductIdsWithBom.has(product.id)) {
          return setError('Thành phẩm đã chọn chưa có BOM để tạo đơn.')
        }
        continue
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

          {!productsQuery.isLoading && !inventoryQuery.isLoading && !traysQuery.isLoading && !bomsQuery.isLoading && productsWithTray.length === 0 && (
            <Alert severity="warning">
              Chưa có sản phẩm nào đủ điều kiện tạo đơn.
            </Alert>
          )}

          {shortagePreview?.has_shortage && (
            <Alert severity="warning">
              Thiếu linh kiện: {shortagePreview.items.map((item) => `${item.product_code || item.product_id} thiếu ${item.missing_qty} (cần ${item.required_qty}, có ${item.available_qty})`).join(', ')}
            </Alert>
          )}

          {shortagePreviewError && <Alert severity="info">{shortagePreviewError}</Alert>}

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Hủy</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || productsQuery.isLoading || inventoryQuery.isLoading || traysQuery.isLoading || bomsQuery.isLoading}
          >
          {loading ? 'Đang tạo...' : 'Tạo đơn'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
