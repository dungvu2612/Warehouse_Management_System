import { useEffect, useMemo, useState } from 'react'
import { Add, Refresh } from '@mui/icons-material'
import { Alert, Box, Button, Chip, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import { useAuth } from '../../../app/providers/AuthProvider'
import { defaultProductForm } from '../constants/productForm'
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useProductCodePreviewQuery,
  useProductsQuery,
  useUpdateProductMutation,
} from '../hooks/useProducts'
import type { Product, ProductPayload, ProductType } from '../types/productTypes'
import { mapProductApiError } from '../utils/productError'
import { normalizeProductPayload, validateProductForm } from '../utils/productValidation'
import { productService } from '../services/productService'
import { ProductFormDialog } from '../components/ProductFormDialog'
import { ProductTable } from '../components/ProductTable'
import { isSupportedProductImageType, resizeProductImageToDataUrl } from '../../../shared/lib/productImage'
import { ListPagination } from '../../../shared/components/ListPagination'
import { DEFAULT_PAGE_SIZE, paginateItems } from '../../../shared/lib/pagination'
import { toQrDataUrl } from '../../../shared/lib/qrCode'

// Trang Products chỉ giữ orchestration: state màn hình + gọi hooks + ghép components.
export function ProductsPage() {
  const { user } = useAuth()

  // Quyền thao tác ghi theo role backend.
  const isAdmin = user?.role === 'ADMIN'

  // State điều khiển màn hình.
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<ProductType>('COMPONENT')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductPayload>(defaultProductForm)
  const [debouncedProductName, setDebouncedProductName] = useState('')
  const [formError, setFormError] = useState('')
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])

  // Debounce 300ms để giảm số lượng request preview code khi user gõ nhanh.
  useEffect(() => {
    if (!dialogOpen || editingProduct) return

    const timeoutId = window.setTimeout(() => {
      setDebouncedProductName(form.product_name)
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [dialogOpen, editingProduct, form.product_name])

  // Data query.
  const productsQuery = useProductsQuery()
  const previewQuery = useProductCodePreviewQuery(
    form.product_type,
    debouncedProductName,
    dialogOpen && !editingProduct && debouncedProductName.trim().length > 0,
  )

  // Mutations.
  const createMutation = useCreateProductMutation({
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Tạo sản phẩm thành công.' })
      setDialogOpen(false)
      setForm(defaultProductForm)
    },
    onError: (error) => setFormError(mapProductApiError(error)),
  })

  const updateMutation = useUpdateProductMutation({
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Cập nhật sản phẩm thành công.' })
      setDialogOpen(false)
      setEditingProduct(null)
      setForm(defaultProductForm)
    },
    onError: (error) => setFormError(mapProductApiError(error)),
  })

  const deleteMutation = useDeleteProductMutation({
    onSuccess: () => setBanner({ type: 'success', text: 'Đã xóa mềm sản phẩm (is_active=false).' }),
    onError: (error) => setBanner({ type: 'error', text: mapProductApiError(error) }),
  })

  // Filter cục bộ cho UX search.
  const filteredProducts = useMemo(() => {
    const list = productsQuery.data || []
    return productService.filterProductsByTypeAndKeyword(list, activeType, search)
  }, [productsQuery.data, search, activeType])

  useEffect(() => {
    // Ghi chú: Reset trang to 1 whenever search/filter changes.
    setCurrentPage(1)
  }, [search, activeType])

  const paginatedProducts = useMemo(() => {
    return paginateItems(filteredProducts, currentPage, DEFAULT_PAGE_SIZE)
  }, [filteredProducts, currentPage])

  const selectedProducts = useMemo(() => {
    const selectedSet = new Set(selectedProductIds)
    return filteredProducts.filter((product) => selectedSet.has(product.id))
  }, [filteredProducts, selectedProductIds])

  // Preview product_code realtime tu backend khi tao moi.
  useEffect(() => {
    if (editingProduct) return
    const preview = previewQuery.data?.product_code || ''
    if (!preview) return
    setForm((prev) => {
      if (prev.product_code === preview) return prev
      return { ...prev, product_code: preview }
    })
  }, [previewQuery.data?.product_code, editingProduct])

  const openCreateDialog = () => {
    setEditingProduct(null)
    setForm({
      ...defaultProductForm,
      product_type: activeType,
    })
    setFormError('')
    setDialogOpen(true)
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setForm({
      product_code: product.product_code,
      qr_code: product.qr_code || product.product_code,
      product_name: product.product_name,
      product_type: product.product_type,
      image_url: product.image_url || '',
      description: product.description || '',
      unit: product.unit || 'pcs',
      min_stock: product.min_stock,
      price: product.price,
    })
    setFormError('')
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    setFormError('')

    const validationError = validateProductForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }

    const normalizeName = (value: string) =>
      value
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase('vi-VN')
    const targetName = normalizeName(form.product_name)
    const duplicate = (productsQuery.data || []).find((product) => {
      if (editingProduct && product.id === editingProduct.id) return false
      return normalizeName(product.product_name) === targetName
    })
    if (duplicate) {
      setFormError(`Tên sản phẩm đã tồn tại: ${duplicate.product_name}`)
      return
    }

    const payload = normalizeProductPayload(form)

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, payload })
      return
    }

    createMutation.mutate(payload)
  }

  const handleDelete = (product: Product) => {
    if (!window.confirm(`Xóa mềm sản phẩm ${product.product_code}?`)) return
    deleteMutation.mutate(product.id)
  }

  const handleImportImage = async (file: File | null) => {
    if (!file) return
    if (!isSupportedProductImageType(file)) {
      setFormError('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.')
      return
    }

    try {
      // Ghi chú: Chuẩn hóa ảnh về cùng kích thước trước khi lưu để đảm bảo UI đồng nhất toàn hệ thống.
      const resizedDataUrl = await resizeProductImageToDataUrl(file)
      setForm((prev) => ({ ...prev, image_url: resizedDataUrl }))
      setFormError('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không xử lý được ảnh sản phẩm.'
      setFormError(message)
    }
  }

  const handleToggleSelectProduct = (productId: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const handleToggleSelectAllInPage = (productIds: number[]) => {
    setSelectedProductIds((prev) => {
      const allSelected = productIds.every((id) => prev.includes(id))
      if (allSelected) return prev.filter((id) => !productIds.includes(id))
      return Array.from(new Set([...prev, ...productIds]))
    })
  }

  const handlePrintSelectedProductQrs = async () => {
    if (selectedProducts.length === 0) return
    const rows = await Promise.all(
      selectedProducts.map(async (product) => {
        const qrValue = product.qr_code || product.product_code
        const qrImage = await toQrDataUrl(qrValue)
        return { product, qrValue, qrImage }
      }),
    )

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>In QR sản phẩm</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 16px;">
          <h2>Danh sách QR sản phẩm</h2>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;">
            ${rows
              .map(
                ({ product, qrValue, qrImage }) => `
                  <div style="border:1px solid #dbe2ea;border-radius:8px;padding:12px;">
                    <div style="font-weight:700;font-family:monospace;">${product.product_code}</div>
                    <div style="margin-top:4px;">${product.product_name}</div>
                    <img src="${qrImage}" alt="QR" style="width:170px;height:170px;display:block;margin:8px 0;" />
                    <div style="font-family:monospace;">${qrValue}</div>
                  </div>
                `,
              )
              .join('')}
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
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
              Danh mục Linh kiện / Sản phẩm
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tách rõ Thành phẩm và Linh kiện để tối ưu vận hành kho/BOM.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={() => productsQuery.refetch()}>
              Làm mới
            </Button>
            <Button
              variant="outlined"
              disabled={selectedProducts.length === 0}
              onClick={() => void handlePrintSelectedProductQrs()}
            >
              In QR đã chọn ({selectedProducts.length})
            </Button>
            <Button variant="contained" startIcon={<Add />} disabled={!isAdmin} onClick={openCreateDialog}>
              Thêm sản phẩm
            </Button>
          </Stack>
        </Box>
      </Paper>

      {banner && <Alert severity={banner.type}>{banner.text}</Alert>}
      {!isAdmin && (
        <Alert severity="info">Bạn đang ở role không có quyền quản trị: chỉ có quyền xem danh sách sản phẩm.</Alert>
      )}

      <Paper sx={{ p: 2.5 }}>
        <Tabs
          value={activeType}
          onChange={(_, value: ProductType) => setActiveType(value)}
          sx={{ mb: 2 }}
        >
          <Tab value="COMPONENT" label="Linh kiện" />
          <Tab value="FINISHED_GOOD" label="Thành phẩm" />
        </Tabs>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Tìm theo mã, tên, đơn vị..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Chip
            label={`Tổng: ${filteredProducts.length} - ${
              activeType === 'FINISHED_GOOD' ? 'Thành phẩm' : 'Linh kiện'
            }`}
            color="secondary"
            sx={{ fontWeight: 800, alignSelf: { xs: 'flex-start', sm: 'center' } }}
          />
        </Stack>

        <ProductTable
          products={paginatedProducts}
          isLoading={productsQuery.isLoading}
          isError={productsQuery.isError}
          isAdmin={isAdmin}
          onEdit={openEditDialog}
          onDelete={handleDelete}
          selectedIds={selectedProductIds}
          onToggleSelect={handleToggleSelectProduct}
          onToggleSelectAll={handleToggleSelectAllInPage}
        />
        <ListPagination
          currentPage={currentPage}
          totalItems={filteredProducts.length}
          trangSize={DEFAULT_PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </Paper>

      <ProductFormDialog
        open={dialogOpen}
        title={editingProduct ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm mới'}
        form={form}
        onChange={setForm}
        onImportImage={handleImportImage}
        errorMessage={formError}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        isEditing={Boolean(editingProduct)}
      />
    </Stack>
  )
}
