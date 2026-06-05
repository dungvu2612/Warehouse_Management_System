/*
- Mục đích: Editor dung chung cho create/edit order voi danh sach nhieu san pham.
- Phụ thuộc: MUI table/form controls va product list da load san.
- Hợp đồng API: Tra ve items array { product_id, quantity, unit_price } de submit /orders.
- Multi-item order behavior: Them/sua/xoa theo dong, tinh line_total va total_amount realtime.
- Add/edit/delete item behavior: Chan duplicate product_id, validate quantity > 0, unit_price >= 0.
- Quy tắc phân quyền: unit_price chi cho sua khi canEditPrice=true (thuong la ADMIN).
- Ghi chú bảo trì: Giu state items o trang cha; component nay chi la controlled editor.
*/

import { useMemo, useState } from 'react'
import {
  Add,
  DeleteOutlined,
  Remove,
} from '@mui/icons-material'
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
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
import type { Product } from '../../products/types/productTypes'

export interface OrderEditorItem {
  product_id: number
  quantity: number
  unit_price: number
}

interface OrderItemsEditorProps {
  products: Product[]
  items: OrderEditorItem[]
  onChange: (items: OrderEditorItem[]) => void
  canEditPrice: boolean
  onInspectProduct?: (productId: number) => void
}

const FILTER_ALL = 'ALL'
const FILTER_FINISHED = 'FINISHED_GOOD'
const FILTER_COMPONENT = 'COMPONENT'
type ProductFilterValue = typeof FILTER_ALL | typeof FILTER_FINISHED | typeof FILTER_COMPONENT

function productTypeLabel(productType: string): string {
  return productType === 'FINISHED_GOOD' ? 'Thành phẩm' : 'Linh kiện'
}

export function OrderItemsEditor({
  products,
  items,
  onChange,
  canEditPrice,
  onInspectProduct,
}: OrderItemsEditorProps) {
  const [productFilter, setProductFilter] = useState<ProductFilterValue>(FILTER_ALL)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [addQuantity, setAddQuantity] = useState(1)
  const [addPrice, setAddPrice] = useState(0)

  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])
  const activeProducts = useMemo(
    () => products.filter((product) => product.is_active),
    [products],
  )
  const productOptions = useMemo(
    () => activeProducts.filter((product) => productFilter === FILTER_ALL || product.product_type === productFilter),
    [activeProducts, productFilter],
  )

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0),
    [items],
  )
  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [items],
  )

  // Thêm sản phẩm vào đơn theo state chọn hiện tại.
  // Cách dùng: gọi khi user bấm "Thêm sản phẩm".
  // Quy tắc: không cho quantity <= 0, unit_price < 0, và gộp quantity nếu sản phẩm đã tồn tại.
  const handleAddProduct = () => {
    if (!selectedProduct) return
    if (addQuantity <= 0) return
    if (addPrice < 0) return

    const existingIndex = items.findIndex((item) => item.product_id === selectedProduct.id)
    if (existingIndex >= 0) {
      const ok = window.confirm('Sản phẩm đã có trong đơn, bạn muốn tăng số lượng không?')
      if (!ok) return
      const nextItems = [...items]
      nextItems[existingIndex] = {
        ...nextItems[existingIndex],
        quantity: nextItems[existingIndex].quantity + addQuantity,
      }
      onChange(nextItems)
    } else {
      onChange([
        ...items,
        { product_id: selectedProduct.id, quantity: addQuantity, unit_price: addPrice },
      ])
    }

    setSelectedProduct(null)
    setAddQuantity(1)
    setAddPrice(0)
  }

  // Cập nhật 1 dòng sản phẩm theo index.
  // Cách dùng: truyền patch cần đổi (quantity hoặc unit_price), hàm sẽ merge và emit onChange.
  const updateItem = (index: number, patch: Partial<OrderEditorItem>) => {
    const nextItems = [...items]
    nextItems[index] = { ...nextItems[index], ...patch }
    onChange(nextItems)
  }

  // Xóa 1 dòng sản phẩm theo index (có xác nhận).
  // Cách dùng: gọi từ nút xóa ở từng dòng item.
  const removeItem = (index: number) => {
    const ok = window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi đơn?')
    if (!ok) return
    const nextItems = items.filter((_, itemIndex) => itemIndex !== index)
    onChange(nextItems)
  }

  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
        <TextField
          select
          label="Lọc loại sản phẩm"
          value={productFilter}
          onChange={(event) => setProductFilter(event.target.value as ProductFilterValue)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value={FILTER_ALL}>Tất cả</MenuItem>
          <MenuItem value={FILTER_FINISHED}>Thành phẩm</MenuItem>
          <MenuItem value={FILTER_COMPONENT}>Linh kiện</MenuItem>
        </TextField>

        <Autocomplete
          options={productOptions}
          value={selectedProduct}
          onChange={(_, option) => {
            setSelectedProduct(option)
            setAddPrice(Number(option?.price || 0))
          }}
          getOptionLabel={(option) => `${option.product_code} - ${option.product_name}`}
          fullWidth
          renderInput={(params) => (
            <TextField
              {...params}
              label="Chọn sản phẩm"
              placeholder="Tìm theo mã/tên sản phẩm"
            />
          )}
        />

        <TextField
          label="SL"
          type="number"
          value={addQuantity}
          onChange={(event) => setAddQuantity(Math.max(1, Number(event.target.value || 1)))}
          sx={{ width: 100 }}
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
        />
        <TextField
          label="Đơn giá"
          type="number"
          value={addPrice}
          onChange={(event) => setAddPrice(Math.max(0, Number(event.target.value || 0)))}
          sx={{ width: 160 }}
          slotProps={{ htmlInput: { min: 0, step: 1000 } }}
          disabled={!canEditPrice}
        />
        <Button variant="contained" startIcon={<Add />} onClick={handleAddProduct}>
          Thêm sản phẩm
        </Button>
      </Stack>

      <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Mã SP</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Tên SP</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Loại</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>ĐVT</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>SL</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Đơn giá</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Thành tiền</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>Chưa có sản phẩm nào trong đơn</TableCell>
              </TableRow>
            )}
            {items.map((item, index) => {
              const product = productById.get(item.product_id)
              const lineTotal = Number(item.quantity || 0) * Number(item.unit_price || 0)
              return (
                <TableRow key={`${item.product_id}-${index}`}>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800 }}>{product?.product_code || '-'}</TableCell>
                  <TableCell>{product?.product_name || `#${item.product_id}`}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={product?.product_type === 'FINISHED_GOOD' ? 'secondary' : 'default'}
                      label={productTypeLabel(product?.product_type || 'COMPONENT')}
                    />
                  </TableCell>
                  <TableCell>{product?.unit || '-'}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <IconButton size="small" onClick={() => updateItem(index, { quantity: Math.max(1, item.quantity - 1) })}>
                        <Remove fontSize="small" />
                      </IconButton>
                      <TextField
                        type="number"
                        value={item.quantity}
                        onChange={(event) => updateItem(index, { quantity: Math.max(1, Number(event.target.value || 1)) })}
                        sx={{ width: 90 }}
                        slotProps={{ htmlInput: { min: 1, step: 1 } }}
                      />
                      <IconButton size="small" onClick={() => updateItem(index, { quantity: item.quantity + 1 })}>
                        <Add fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={item.unit_price}
                      onChange={(event) => updateItem(index, { unit_price: Math.max(0, Number(event.target.value || 0)) })}
                      sx={{ width: 140 }}
                      slotProps={{ htmlInput: { min: 0, step: 1000 } }}
                      disabled={!canEditPrice}
                    />
                  </TableCell>
                  <TableCell>{lineTotal.toLocaleString('vi-VN')} đ</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        type="button"
                        size="small"
                        variant="outlined"
                        onClick={() => product && onInspectProduct?.(product.id)}
                        disabled={!product || !onInspectProduct}
                      >
                        Linh kiện
                      </Button>
                      <IconButton size="small" color="error" onClick={() => removeItem(index)}>
                        <DeleteOutlined fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 700 }}>Tổng số lượng: {totalQuantity.toLocaleString('vi-VN')}</Typography>
        <Typography sx={{ fontWeight: 900, fontSize: 18 }}>Tổng tiền: {totalAmount.toLocaleString('vi-VN')} đ</Typography>
      </Box>
    </Stack>
  )
}
