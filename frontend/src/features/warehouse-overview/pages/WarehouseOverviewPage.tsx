/*
- File nay la trang orchestration cho man Kho hang tong hop va thay the 2 man rieng Inventory/Stock Transactions.
- Tab 1 su dung API inventory (GET/POST/PATCH) de xem + tao ton + dieu chinh ton; tab 2 su dung API stock-transactions de xem lich su.
- Khong gop du lieu DB, chi gop UI de nguoi dung van quan ly day du chuc nang tai mot man hinh.
*/

import { useEffect, useMemo, useState } from 'react'
import { Refresh } from '@mui/icons-material'
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
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { useAuth } from '../../../app/providers/AuthProvider'
import { InventoryAdjustDialog } from '../../inventory/components/InventoryAdjustDialog'
import { InventoryTable } from '../../inventory/components/InventoryTable'
import {
  useAdjustInventoryMutation,
  useInventoryLocationsQuery,
  useInventoryProductsQuery,
  useInventoryQuery,
  useInventoryTraysQuery,
} from '../../inventory/hooks/useInventory'
import { inventoryService } from '../../inventory/services/inventoryService'
import type {
  InventoryAdjustFormValues,
  InventoryDisplayItem,
} from '../../inventory/types/inventoryTypes'
import { mapInventoryApiError } from '../../inventory/utils/inventoryError'
import {
  normalizeInventoryAdjustPayload,
  validateInventoryAdjustForm,
} from '../../inventory/utils/inventoryValidation'
import { StockTransactionsTable } from '../../stock-transactions/components/StockTransactionsTable'
import {
  useStockTransactionProductsQuery,
  useStockTransactionsQuery,
} from '../../stock-transactions/hooks/useStockTransactions'
import { stockTransactionsService } from '../../stock-transactions/services/stockTransactionsService'
import type { StockTransactionType } from '../../stock-transactions/types/stockTransactionTypes'
import { ListPagination } from '../../../shared/components/ListPagination'
import { DEFAULT_PAGE_SIZE, paginateItems } from '../../../shared/lib/pagination'

const defaultAdjustForm: InventoryAdjustFormValues = {
  operation: 'IMPORT',
  quantity: 0,
  note: '',
}

export function WarehouseOverviewPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [activeTab, setActiveTab] = useState(0)

  const [inventoryKeyword, setInventoryKeyword] = useState('')
  const [inventoryProductFilter, setInventoryProductFilter] = useState<number | 'ALL'>('ALL')
  const [inventoryTrayFilter, setInventoryTrayFilter] = useState<number | 'ALL'>('ALL')
  const [inventoryLocationFilter, setInventoryLocationFilter] = useState<string | 'ALL'>('ALL')
  const [inventoryLowStockOnly, setInventoryLowStockOnly] = useState(false)

  const [transactionTypeFilter, setTransactionTypeFilter] = useState<StockTransactionType | 'ALL'>('ALL')
  const [transactionKeyword, setTransactionKeyword] = useState('')
  const [inventoryPage, setInventoryPage] = useState(1)
  const [transactionPage, setTransactionPage] = useState(1)

  const [adjustOpen, setAdjustOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryDisplayItem | null>(null)
  const [adjustForm, setAdjustForm] = useState<InventoryAdjustFormValues>(defaultAdjustForm)
  const [adjustError, setAdjustError] = useState('')

  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const inventoryQuery = useInventoryQuery()
  const inventoryProductsQuery = useInventoryProductsQuery()
  const inventoryTraysQuery = useInventoryTraysQuery()
  const inventoryLocationsQuery = useInventoryLocationsQuery()

  const stockTransactionsQuery = useStockTransactionsQuery(transactionTypeFilter)
  const stockTransactionProductsQuery = useStockTransactionProductsQuery()

  // Ghi chú: Khối tải dữ liệu - enrich inventory data de hien thi tab "Ton kho hien tai".
  const inventoryRows = useMemo(() => {
    return inventoryService.mapInventoryForDisplay(
      inventoryQuery.data || [],
      inventoryProductsQuery.data || [],
      inventoryTraysQuery.data || [],
      inventoryLocationsQuery.data || [],
    )
  }, [
    inventoryQuery.data,
    inventoryProductsQuery.data,
    inventoryTraysQuery.data,
    inventoryLocationsQuery.data,
  ])

  // Ghi chú: Khối lọc dữ liệu - loc ton kho theo keyword, product, tray, location va low stock.
  const filteredInventoryRows = useMemo(() => {
    return inventoryService.filterInventory(inventoryRows, {
      keyword: inventoryKeyword,
      productId: inventoryProductFilter,
      trayId: inventoryTrayFilter,
      locationCode: inventoryLocationFilter,
      lowStockOnly: inventoryLowStockOnly,
    })
  }, [
    inventoryRows,
    inventoryKeyword,
    inventoryProductFilter,
    inventoryTrayFilter,
    inventoryLocationFilter,
    inventoryLowStockOnly,
  ])

  useEffect(() => {
    // Ghi chú: Reset trang to 1 whenever search/filter changes.
    setInventoryPage(1)
  }, [
    inventoryKeyword,
    inventoryProductFilter,
    inventoryTrayFilter,
    inventoryLocationFilter,
    inventoryLowStockOnly,
  ])

  const paginatedInventoryRows = useMemo(() => {
    return paginateItems(filteredInventoryRows, inventoryPage, DEFAULT_PAGE_SIZE)
  }, [filteredInventoryRows, inventoryPage])

  const locationCodes = useMemo(() => {
    const unique = new Set<string>()
    inventoryRows.forEach((item) => {
      if (item.location_code && item.location_code !== '-') unique.add(item.location_code)
    })
    return Array.from(unique)
  }, [inventoryRows])

  const transactionDisplayRows = useMemo(() => {
    return stockTransactionsService.mapTransactionsForDisplay(
      stockTransactionsQuery.data || [],
      stockTransactionProductsQuery.data || [],
    )
  }, [stockTransactionsQuery.data, stockTransactionProductsQuery.data])

  // Ghi chú: Khối lọc dữ liệu - loc lich su xuat nhap theo loai giao dich va keyword product/reference.
  const filteredTransactionRows = useMemo(() => {
    return stockTransactionsService.filterTransactions(transactionDisplayRows, {
      transactionType: transactionTypeFilter,
      searchKeyword: transactionKeyword,
    })
  }, [transactionDisplayRows, transactionTypeFilter, transactionKeyword])

  useEffect(() => {
    // Ghi chú: Reset trang to 1 whenever search/filter changes.
    setTransactionPage(1)
  }, [transactionTypeFilter, transactionKeyword])

  const paginatedTransactionRows = useMemo(() => {
    return paginateItems(filteredTransactionRows, transactionPage, DEFAULT_PAGE_SIZE)
  }, [filteredTransactionRows, transactionPage])

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

    const validationError = validateInventoryAdjustForm(adjustForm)
    if (validationError) {
      setAdjustError(validationError)
      return
    }

    if (adjustForm.operation === 'EXPORT' && adjustForm.quantity > selectedItem.quantity) {
      setAdjustError('Số lượng xuất kho vượt quá tồn hiện tại.')
      return
    }

    adjustMutation.mutate({
      id: selectedItem.id,
      payload: normalizeInventoryAdjustPayload(adjustForm),
    })
  }
  return (
    <Stack spacing={2.5}>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
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
              Kho hàng tổng hợp
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quản lý tồn kho hiện tại và lịch sử xuất nhập trên cùng một màn hình.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              fullWidth
              onClick={() => {
                if (activeTab === 0) {
                  inventoryQuery.refetch()
                  inventoryProductsQuery.refetch()
                  inventoryTraysQuery.refetch()
                  inventoryLocationsQuery.refetch()
                } else {
                  stockTransactionsQuery.refetch()
                  stockTransactionProductsQuery.refetch()
                }
              }}
            >
              Làm mới
            </Button>
          </Stack>
        </Box>
      </Paper>

      {banner && <Alert severity={banner.type}>{banner.text}</Alert>}
      {!isAdmin && <Alert severity="info">Nhân viên chỉ có quyền xem dữ liệu kho.</Alert>}

      <Paper sx={{ p: { xs: 1.5, md: 2.5 }, overflowX: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, next) => setActiveTab(next)} sx={{ mb: 2 }} variant="scrollable" allowScrollButtonsMobile>
          <Tab label="Tồn kho hiện tại" />
          <Tab label="Lịch sử xuất nhập" />
        </Tabs>

        {activeTab === 0 && (
          <Stack spacing={1.5}>
            <TextField
              fullWidth
              label="Tìm tồn kho"
              placeholder="Tìm theo sản phẩm/khay/vị trí..."
              value={inventoryKeyword}
              onChange={(e) => setInventoryKeyword(e.target.value)}
            />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
              <TextField
                select
                label="Sản phẩm"
                value={inventoryProductFilter}
                onChange={(e) =>
                  setInventoryProductFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                }
                fullWidth
              >
                <MenuItem value="ALL">Tất cả sản phẩm</MenuItem>
                {(inventoryProductsQuery.data || []).map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.product_code} - {product.product_name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Khay"
                value={inventoryTrayFilter}
                onChange={(e) =>
                  setInventoryTrayFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                }
                fullWidth
              >
                <MenuItem value="ALL">Tất cả khay</MenuItem>
                {(inventoryTraysQuery.data || []).map((tray) => (
                  <MenuItem key={tray.id} value={tray.id}>
                    {tray.tray_code}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Vị trí"
                value={inventoryLocationFilter}
                onChange={(e) => setInventoryLocationFilter(e.target.value)}
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

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={inventoryLowStockOnly}
                    onChange={(e) => setInventoryLowStockOnly(e.target.checked)}
                  />
                }
                label="Chỉ hiện tồn thấp"
              />
              <Chip
                color="secondary"
                label={`Tổng dòng tồn: ${filteredInventoryRows.length}`}
                sx={{ fontWeight: 800 }}
              />
            </Stack>

            <InventoryTable
              inventory={paginatedInventoryRows}
              isLoading={inventoryQuery.isLoading}
              isError={inventoryQuery.isError}
              isAdmin={isAdmin}
              showActions={isAdmin}
              onOpenAdjust={handleOpenAdjust}
            />
            <ListPagination
              currentPage={inventoryPage}
              totalItems={filteredInventoryRows.length}
              trangSize={DEFAULT_PAGE_SIZE}
              onPageChange={setInventoryPage}
            />
          </Stack>
        )}

        {activeTab === 1 && (
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
              <TextField
                select
                label="Loại giao dịch"
                value={transactionTypeFilter}
                onChange={(e) => setTransactionTypeFilter(e.target.value as StockTransactionType | 'ALL')}
                fullWidth
              >
                <MenuItem value="ALL">Tất cả</MenuItem>
                <MenuItem value="IMPORT">Nhập kho</MenuItem>
                <MenuItem value="EXPORT">Xuất kho</MenuItem>
                <MenuItem value="ADJUST">Điều chỉnh</MenuItem>
                <MenuItem value="ROLLBACK">Hoàn tác</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Tìm lịch sử"
                placeholder="Tìm theo sản phẩm hoặc mã tham chiếu..."
                value={transactionKeyword}
                onChange={(e) => setTransactionKeyword(e.target.value)}
              />
            </Stack>

            <Chip
              color="secondary"
              label={`Tổng giao dịch: ${filteredTransactionRows.length}`}
              sx={{ fontWeight: 800, alignSelf: 'flex-start' }}
            />

            <StockTransactionsTable
              rows={paginatedTransactionRows}
              isLoading={stockTransactionsQuery.isLoading || stockTransactionProductsQuery.isLoading}
              isError={stockTransactionsQuery.isError || stockTransactionProductsQuery.isError}
            />
            <ListPagination
              currentPage={transactionPage}
              totalItems={filteredTransactionRows.length}
              trangSize={DEFAULT_PAGE_SIZE}
              onPageChange={setTransactionPage}
            />
          </Stack>
        )}
      </Paper>

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
