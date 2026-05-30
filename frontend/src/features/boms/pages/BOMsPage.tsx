/*
Senior Handover Note:
- Purpose: Trang BOM chinh theo clean architecture o FE.
- Dependencies: BOM hooks/service/components + auth context.
- API contract: GET/POST/PUT/DELETE /boms va GET /boms/:id/items.
- Role access: ADMIN va WAREHOUSE duoc quan ly BOM; VIEWER chi xem neu backend cho phep.
- Maintenance notes: Giu page o vai tro coordinator, khong chen HTTP/business logic truc tiep.
*/

import { useEffect, useMemo, useState } from 'react'
import { Add, Refresh } from '@mui/icons-material'
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material'
import { useAuth } from '../../../app/providers/AuthProvider'
import { defaultBOMForm } from '../constants/bomForm'
import {
  useBOMComponentProductsQuery,
  useBOMItemsQuery,
  useBOMParentProductsQuery,
  useBOMsQuery,
  useCreateBOMMutation,
  useDeleteBOMMutation,
  useUpdateBOMMutation,
} from '../hooks/useBOMs'
import type { BOM, BOMPayload } from '../types/bomTypes'
import { mapBOMApiError } from '../utils/bomError'
import { normalizeBOMPayload, validateBOMForm } from '../utils/bomValidation'
import { bomService } from '../services/bomService'
import { BOMCreateDialog } from '../components/BOMCreateDialog'
import { BOMItemsDialog } from '../components/BOMItemsDialog'
import { BOMTable } from '../components/BOMTable'
import { OrderCreateDialog } from '../../orders/components/OrderCreateDialog'
import type { Order } from '../../orders/types/orderTypes'
import { ListPagination } from '../../../shared/components/ListPagination'
import { DEFAULT_PAGE_SIZE, paginateItems } from '../../../shared/lib/pagination'

// BOMs page.
export function BOMsPage() {
  // Lay user de xu ly role UI.
  const { user } = useAuth()
  // Theo yêu cầu nghiệp vụ mới: ADMIN và WAREHOUSE đều được tạo/sửa/xóa BOM.
  const canManage = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE'

  // State search cục bộ cho trải nghiệm lọc nhanh.
  const [search, setSearch] = useState('')
  // State mo dong dialog tao/sua BOM.
  const [formOpen, setFormOpen] = useState(false)
  // State mode dialog: create hay edit.
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  // State BOM đang được chỉnh sửa (nếu mode edit).
  const [editingBOM, setEditingBOM] = useState<BOM | null>(null)
  // State BOM dang duoc chon de xem detail items.
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null)
  // State mo dong dialog xem items.
  const [itemsOpen, setItemsOpen] = useState(false)
  // Senior Handover: State mo dong dialog tao order tu BOM.
  const [orderCreateOpen, setOrderCreateOpen] = useState(false)

  // Form create/update BOM state.
  const [form, setForm] = useState<BOMPayload>(defaultBOMForm)
  // Error message hien thi trong dialog form BOM.
  const [formError, setFormError] = useState('')
  // Banner thong bao tong quan man hinh.
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Query danh sach BOM.
  const bomsQuery = useBOMsQuery()
  // Query product options cho parent FINISHED_GOOD.
  const parentProductsQuery = useBOMParentProductsQuery()
  // Query product options cho component COMPONENT.
  const componentProductsQuery = useBOMComponentProductsQuery()
  // Query chi tiet items cua BOM dang chon.
  const bomItemsQuery = useBOMItemsQuery(selectedBOM?.id ?? null)

  // Mutation tao BOM.
  const createMutation = useCreateBOMMutation({
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Tạo BOM thành công.' })
      setFormOpen(false)
      setForm(defaultBOMForm)
      setFormError('')
    },
    onError: (error) => {
      setFormError(mapBOMApiError(error))
    },
  })

  // Mutation cap nhat BOM.
  const updateMutation = useUpdateBOMMutation({
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Cập nhật BOM thành công.' })
      setFormOpen(false)
      setEditingBOM(null)
      setForm(defaultBOMForm)
      setFormError('')
    },
    onError: (error) => {
      setFormError(mapBOMApiError(error))
    },
  })

  // Mutation xoa BOM.
  const deleteMutation = useDeleteBOMMutation({
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Đã xóa BOM thành công.' })
    },
    onError: (error) => {
      setBanner({ type: 'error', text: mapBOMApiError(error) })
    },
  })

  // Filter BOM theo keyword (ten BOM, mo ta, ma ten parent product, nguoi tao).
  const filteredBOMs = useMemo(() => {
    const list = bomsQuery.data || []
    return bomService.filterBOMsByKeyword(list, search)
  }, [bomsQuery.data, search])

  useEffect(() => {
    // Senior Handover: Reset page to 1 whenever search/filter changes.
    setCurrentPage(1)
  }, [search])

  const paginatedBOMs = useMemo(() => {
    return paginateItems(filteredBOMs, currentPage, DEFAULT_PAGE_SIZE)
  }, [filteredBOMs, currentPage])

  // Mo dialog tao BOM.
  const openCreateDialog = () => {
    setFormMode('create')
    setEditingBOM(null)
    setForm(defaultBOMForm)
    setFormError('')
    setFormOpen(true)
  }

  // Mo dialog sua BOM.
  const openEditDialog = (bom: BOM) => {
    setFormMode('edit')
    setEditingBOM(bom)

    // Map BOM -> form payload để người dùng chỉnh cả sản phẩm cha và sản phẩm con.
    const mappedItems = Array.isArray(bom.items)
      ? bom.items.map((item) => ({
          component_product_id: item.component_product_id,
          quantity: item.quantity,
        }))
      : []

    setForm({
      product_id: bom.product_id,
      bom_name: bom.bom_name || '',
      description: bom.description || '',
      items: mappedItems.length > 0 ? mappedItems : [{ component_product_id: 0, quantity: 1 }],
    })

    setFormError('')
    setFormOpen(true)
  }

  // Submit tao/cap nhat BOM.
  const handleSubmitForm = () => {
    setFormError('')

    // Validate FE truoc khi call API.
    const validationError = validateBOMForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }

    const payload = normalizeBOMPayload(form)

    if (formMode === 'edit' && editingBOM) {
      updateMutation.mutate({ id: editingBOM.id, payload })
      return
    }

    createMutation.mutate(payload)
  }

  // Xoa BOM theo dong du lieu.
  const handleDeleteBOM = (bom: BOM) => {
    if (!window.confirm(`Xóa BOM #${bom.id} - ${bom.bom_name || 'không tên'}?`)) {
      return
    }
    deleteMutation.mutate(bom.id)
  }

  // Mo dialog xem items theo BOM duoc chon.
  const handleOpenItems = (bom: BOM) => {
    setSelectedBOM(bom)
    setItemsOpen(true)
  }

  // Dong dialog items va clear selected BOM.
  const handleCloseItems = () => {
    setItemsOpen(false)
    setSelectedBOM(null)
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
              Quản lý cấu trúc BOM
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quản lý cấu tạo thành phẩm từ danh sách linh kiện để phục vụ tách lệnh picking.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={() => bomsQuery.refetch()}>
              Làm mới
            </Button>
            <Button variant="contained" startIcon={<Add />} disabled={!canManage} onClick={openCreateDialog}>
              Tạo BOM
            </Button>
          </Stack>
        </Box>
      </Paper>

      {banner && <Alert severity={banner.type}>{banner.text}</Alert>}

      {!canManage && (
        <Alert severity="info">
          Bạn không có quyền chỉnh sửa BOM ở role hiện tại, chỉ có thể xem danh sách.
        </Alert>
      )}

      <Paper sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Tìm BOM theo tên, mô tả, mã/tên thành phẩm, người tạo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Chip
            color="secondary"
            label={`Tổng BOM: ${filteredBOMs.length}`}
            sx={{ fontWeight: 800, alignSelf: { xs: 'flex-start', sm: 'center' } }}
          />
        </Stack>

        <BOMTable
          boms={paginatedBOMs}
          isLoading={bomsQuery.isLoading}
          isError={bomsQuery.isError}
          canManage={canManage}
          onViewItems={handleOpenItems}
          onEdit={openEditDialog}
          onDelete={handleDeleteBOM}
          onCreateOrder={(bom) => {
            void bom
            setOrderCreateOpen(true)
          }}
        />
        <ListPagination
          currentPage={currentPage}
          totalItems={filteredBOMs.length}
          pageSize={DEFAULT_PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </Paper>

      <BOMCreateDialog
        open={formOpen}
        mode={formMode}
        form={form}
        parentProducts={parentProductsQuery.data || []}
        componentProducts={componentProductsQuery.data || []}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        errorMessage={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmitForm}
        onChange={setForm}
      />

      <BOMItemsDialog
        open={itemsOpen}
        bom={bomItemsQuery.data?.bom || selectedBOM}
        items={bomItemsQuery.data?.items || []}
        isLoading={bomItemsQuery.isLoading}
        isError={bomItemsQuery.isError}
        onClose={handleCloseItems}
      />

      <OrderCreateDialog
        open={orderCreateOpen}
        onClose={() => {
          setOrderCreateOpen(false)
        }}
        canEditPrice={user?.role === 'ADMIN'}
        onSuccess={(order: Order) => {
          setBanner({ type: 'success', text: `Tạo đơn hàng thành công: ${order.order_code}` })
          void bomsQuery.refetch()
        }}
      />
    </Stack>
  )
}
