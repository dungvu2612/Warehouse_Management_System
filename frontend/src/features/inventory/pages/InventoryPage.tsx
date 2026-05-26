/*
Senior Handover Note:
- File nay la page orchestration cho man Inventory: quan ly state man hinh, goi hooks va ghep components.
- Phu thuoc vao cac hooks Inventory + `inventoryService` + `useAuth`.
- Luu y bao tri: giu permission tai page (ADMIN duoc tao/adjust, STAFF chi xem) de khong pha flow auth/router/layout.
*/

import { useMemo, useState } from 'react'
import { Add, Refresh } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useAuth } from '../../../app/providers/AuthProvider'
import { InventoryAdjustHistoryTable } from '../components/InventoryAdjustHistoryTable'
import { InventoryAdjustDialog } from '../components/InventoryAdjustDialog'
import { InventoryCreateDialog } from '../components/InventoryCreateDialog'
import { InventoryTable } from '../components/InventoryTable'
import {
  useAdjustInventoryMutation,
  useInventoryAdjustTransactionsQuery,
  useCreateInventoryMutation,
  useInventoryLocationsQuery,
  useInventoryProductsQuery,
  useInventoryQuery,
  useInventoryTraysQuery,
} from '../hooks/useInventory'
import { inventoryService } from '../services/inventoryService'
import type {
  InventoryAdjustFormValues,
  InventoryCreatePayload,
  InventoryDisplayItem,
} from '../types/inventoryTypes'
import { mapInventoryApiError } from '../utils/inventoryError'
import {
  normalizeInventoryAdjustPayload,
  normalizeInventoryCreatePayload,
  validateInventoryAdjustForm,
  validateInventoryCreateForm,
} from '../utils/inventoryValidation'

const defaultCreateForm: InventoryCreatePayload = {
  product_id: 0,
  tray_id: 0,
  quantity: 0,
}

const defaultAdjustForm: InventoryAdjustFormValues = {
  operation: 'IMPORT',
  quantity: 0,
  note: '',
}

export function InventoryPage() {
  const { user } = useAuth()
  // Senior Handover: Permission check block - chi ADMIN duoc tao/adjust inventory.
  const isAdmin = user?.role === 'ADMIN'

  const [search, setSearch] = useState('')
  const [productFilter, setProductFilter] = useState<number | 'ALL'>('ALL')
  const [trayFilter, setTrayFilter] = useState<number | 'ALL'>('ALL')
  const [locationFilter, setLocationFilter] = useState<string | 'ALL'>('ALL')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<InventoryCreatePayload>(defaultCreateForm)
  const [createError, setCreateError] = useState('')

  const [adjustOpen, setAdjustOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryDisplayItem | null>(null)
  const [adjustForm, setAdjustForm] = useState<InventoryAdjustFormValues>(defaultAdjustForm)
  const [adjustError, setAdjustError] = useState('')

  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const inventoryQuery = useInventoryQuery()
  const productsQuery = useInventoryProductsQuery()
  const traysQuery = useInventoryTraysQuery()
  const locationsQuery = useInventoryLocationsQuery()
  const adjustHistoryQuery = useInventoryAdjustTransactionsQuery()

  // Senior Handover: Fetch inventory block - enrich raw inventory bang product/tray/location metadata cho table/filter.
  const inventoryDisplay = useMemo(() => {
    return inventoryService.mapInventoryForDisplay(
      inventoryQuery.data || [],
      productsQuery.data || [],
      traysQuery.data || [],
      locationsQuery.data || [],
    )
  }, [inventoryQuery.data, productsQuery.data, traysQuery.data, locationsQuery.data])

  const filteredInventory = useMemo(() => {
    return inventoryService.filterInventory(inventoryDisplay, {
      keyword: search,
      productId: productFilter,
      trayId: trayFilter,
      locationCode: locationFilter,
      lowStockOnly,
    })
  }, [inventoryDisplay, search, productFilter, trayFilter, locationFilter, lowStockOnly])

  const productLabelById = useMemo(() => {
    const entries = (productsQuery.data || []).map((product) => [
      product.id,
      `${product.product_code} - ${product.product_name}`,
    ])
    return Object.fromEntries(entries) as Record<number, string>
  }, [productsQuery.data])

  const adjustHistoryRows = useMemo(() => {
    return inventoryService.mapStockTransactionsForDisplay(
      adjustHistoryQuery.data || [],
      productsQuery.data || [],
      traysQuery.data || [],
      locationsQuery.data || [],
    )
  }, [adjustHistoryQuery.data, productsQuery.data, traysQuery.data, locationsQuery.data])

  const createMutation = useCreateInventoryMutation({
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Tạo tồn kho ban đầu thành công.' })
      setCreateOpen(false)
      setCreateForm(defaultCreateForm)
      setCreateError('')
    },
    onError: (error) => setCreateError(mapInventoryApiError(error)),
  })

  const adjustMutation = useAdjustInventoryMutation({
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Điều chỉnh tồn kho thành công.' })
      setAdjustOpen(false)
      setSelectedItem(null)
      setAdjustForm(defaultAdjustForm)
      setAdjustError('')
    },
    onError: (error) => setAdjustError(mapInventoryApiError(error)),
  })

  const handleOpenCreate = () => {
    if (!isAdmin) return
    setCreateForm(defaultCreateForm)
    setCreateError('')
    setCreateOpen(true)
  }

  const handleSubmitCreate = () => {
    if (!isAdmin) return
    setCreateError('')

    // Senior Handover: Create inventory block - validate va normalize payload truoc khi POST /inventory.
    const validationError = validateInventoryCreateForm(createForm)
    if (validationError) {
      setCreateError(validationError)
      return
    }

    // Senior Handover: Chan submit neu tray khong thuoc product de tranh loi backend "tray does not belong to the provided product".
    const selectedTray = (traysQuery.data || []).find((tray) => tray.id === createForm.tray_id)
    if (!selectedTray || selectedTray.product_id !== createForm.product_id) {
      setCreateError('Khay đã chọn không thuộc sản phẩm này. Vui lòng chọn lại khay.')
      return
    }

    createMutation.mutate(normalizeInventoryCreatePayload(createForm))
  }

  const handleOpenAdjust = (item: InventoryDisplayItem) => {
    if (!isAdmin) return
    setSelectedItem(item)
    setAdjustForm(defaultAdjustForm)
    setAdjustError('')
    setAdjustOpen(true)
  }

  const handleSubmitAdjust = () => {
    if (!isAdmin || !selectedItem) return
    setAdjustError('')

    // Senior Handover: Adjust inventory block - validate va normalize payload truoc khi PATCH /inventory/:id/adjust.
    const validationError = validateInventoryAdjustForm(adjustForm)
    if (validationError) {
      setAdjustError(validationError)
      return
    }

    // Senior Handover: UX guard cho xuat kho - khong cho xuat vuot ton hien tai.
    if (adjustForm.operation === 'EXPORT' && adjustForm.quantity > selectedItem.quantity) {
      setAdjustError('Số lượng xuất kho vượt quá tồn hiện tại.')
      return
    }

    adjustMutation.mutate({
      id: selectedItem.id,
      payload: normalizeInventoryAdjustPayload(adjustForm),
    })
  }

  const locationCodes = useMemo(() => {
    const unique = new Set<string>()
    inventoryDisplay.forEach((item) => {
      if (item.location_code && item.location_code !== '-') unique.add(item.location_code)
    })
    return Array.from(unique)
  }, [inventoryDisplay])

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
              Quản lý tồn kho
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Theo dõi tồn kho theo sản phẩm/khay/vị trí và điều chỉnh khi cần.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={() => inventoryQuery.refetch()}>
              Làm mới
            </Button>
            <Button variant="contained" startIcon={<Add />} disabled={!isAdmin} onClick={handleOpenCreate}>
              Tạo tồn ban đầu
            </Button>
          </Stack>
        </Box>
      </Paper>

      {banner && <Alert severity={banner.type}>{banner.text}</Alert>}
      {!isAdmin && <Alert severity="info">Nhân viên chỉ có quyền xem tồn kho.</Alert>}

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Tìm tồn kho"
            placeholder="Tìm theo sản phẩm/khay/vị trí..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
            <TextField
              select
              label="Sản phẩm"
              value={productFilter}
              onChange={(e) =>
                setProductFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              fullWidth
            >
              <MenuItem value="ALL">Tất cả sản phẩm</MenuItem>
              {(productsQuery.data || []).map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.product_code} - {product.product_name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Khay"
              value={trayFilter}
              onChange={(e) => setTrayFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              fullWidth
            >
              <MenuItem value="ALL">Tất cả khay</MenuItem>
              {(traysQuery.data || []).map((tray) => (
                <MenuItem key={tray.id} value={tray.id}>
                  {tray.tray_code}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Vị trí"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              fullWidth
            >
              <MenuItem value="ALL">Tất cả vị trí</MenuItem>
              {locationCodes.map((code) => (
                <MenuItem key={code} value={code}>
                  {code}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
              }
              label="Chỉ hiện tồn thấp"
            />
            <Chip
              color="secondary"
              label={`Tổng dòng tồn: ${filteredInventory.length}`}
              sx={{ fontWeight: 800 }}
            />
          </Stack>
        </Stack>

        <InventoryTable
          inventory={filteredInventory}
          isLoading={inventoryQuery.isLoading}
          isError={inventoryQuery.isError}
          isAdmin={isAdmin}
          onOpenAdjust={handleOpenAdjust}
        />
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
          Lịch sử điều chỉnh tồn
        </Typography>
        <InventoryAdjustHistoryTable
          rows={adjustHistoryRows}
          isLoading={adjustHistoryQuery.isLoading}
          isError={adjustHistoryQuery.isError}
        />
      </Paper>

      <InventoryCreateDialog
        open={createOpen}
        form={createForm}
        productOptions={productsQuery.data || []}
        trayOptions={traysQuery.data || []}
        productLabelById={productLabelById}
        isSubmitting={createMutation.isPending}
        errorMessage={createError}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleSubmitCreate}
        onChange={setCreateForm}
      />

      <InventoryAdjustDialog
        open={adjustOpen}
        selectedItem={selectedItem}
        form={adjustForm}
        isSubmitting={adjustMutation.isPending}
        errorMessage={adjustError}
        onClose={() => setAdjustOpen(false)}
        onSubmit={handleSubmitAdjust}
        onChange={setAdjustForm}
      />
    </Stack>
  )
}
