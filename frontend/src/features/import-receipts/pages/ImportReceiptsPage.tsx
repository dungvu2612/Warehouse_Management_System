/*
- Mục đích: Page orchestration cho man Import Receipts.
- Phụ thuộc: hooks Import Receipts + `importReceiptsService` + `useAuth`.
- Hợp đồng API: GET/POST /import-receipts.
- Role access: ADMIN duoc tao; WAREHOUSE chi xem theo policy backend/frontend.
- Ghi chú bảo trì: Giu permission tai trang de dong bo voi route policy.
*/

import { useEffect, useMemo, useState } from 'react'
import { Add, Refresh } from '@mui/icons-material'
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material'
import { useAuth } from '../../../app/providers/useAuth'
import { ImportReceiptCreateDialog } from '../components/ImportReceiptCreateDialog'
import { ImportReceiptDetailDialog } from '../components/ImportReceiptDetailDialog'
import { ImportReceiptTable } from '../components/ImportReceiptTable'
import {
  useAssignImportReceiptItemMutation,
  useCreateImportReceiptMutation,
  useDeleteImportReceiptMutation,
  useImportReceiptDetailQuery,
  useImportReceiptLocationsQuery,
  useImportReceiptProductsQuery,
  useImportReceiptTraysQuery,
  useImportReceiptsQuery,
  useUpdateImportReceiptMutation,
  useUnassignImportReceiptItemMutation,
} from '../hooks/useImportReceipts'
import { useUsersQuery } from '../../users/hooks/useUsers'
import { importReceiptsService } from '../services/importReceiptsService'
import type { CreateImportReceiptPayload } from '../types/importReceiptTypes'
import { mapImportReceiptApiError } from '../utils/importReceiptError'
import {
  normalizeImportReceiptPayload,
  validateImportReceiptForm,
} from '../utils/importReceiptValidation'
import { ListPagination } from '../../../shared/components/ListPagination'
import { DEFAULT_PAGE_SIZE, paginateItems } from '../../../shared/lib/pagination'

const defaultCreateForm: CreateImportReceiptPayload = {
  supplier_name: '',
  note: '',
  items: [{ product_id: 0, quantity: 1 }],
}

export function ImportReceiptsPage() {
  const { user } = useAuth()
  // Ghi chú: Permission check block - chi ADMIN duoc tao phieu nhap.
  const isAdmin = user?.role === 'ADMIN'

  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateImportReceiptPayload>(defaultCreateForm)
  const [createError, setCreateError] = useState('')
  const [editingReceiptId, setEditingReceiptId] = useState<number | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<CreateImportReceiptPayload>(defaultCreateForm)
  const [editError, setEditError] = useState('')

  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const receiptsQuery = useImportReceiptsQuery()
  const productsQuery = useImportReceiptProductsQuery()
  const traysQuery = useImportReceiptTraysQuery()
  const locationsQuery = useImportReceiptLocationsQuery()
  const receiptDetailQuery = useImportReceiptDetailQuery(selectedReceiptId)
  const staffQuery = useUsersQuery({ role: 'WAREHOUSE', is_active: 'true' })

  // Ghi chú: Khối làm mới dữ liệu - map danh sách phiếu nhập để render bảng tổng hợp.
  const receiptDisplay = useMemo(() => {
    return importReceiptsService.mapReceiptsForDisplay(receiptsQuery.data || [])
  }, [receiptsQuery.data])

  const filteredReceipts = useMemo(() => {
    return importReceiptsService.filterReceiptsByKeyword(receiptDisplay, search)
  }, [receiptDisplay, search])

  useEffect(() => {
    // Ghi chú: Reset trang to 1 whenever search/filter changes.
    setCurrentPage(1)
  }, [search])

  const paginatedReceipts = useMemo(() => {
    return paginateItems(filteredReceipts, currentPage, DEFAULT_PAGE_SIZE)
  }, [filteredReceipts, currentPage])

  const createMutation = useCreateImportReceiptMutation({
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Tạo phiếu nhập thành công.' })
      setCreateOpen(false)
      setCreateForm(defaultCreateForm)
      setCreateError('')
    },
    onError: (error) => setCreateError(mapImportReceiptApiError(error)),
  })

  const updateMutation = useUpdateImportReceiptMutation({
    onSuccess: (message) => {
      setBanner({ type: 'success', text: message || 'Cập nhật phiếu nhập thành công.' })
      setEditOpen(false)
      setEditingReceiptId(null)
      setEditForm(defaultCreateForm)
      setEditError('')
    },
    onError: (error) => setEditError(mapImportReceiptApiError(error)),
  })

  const deleteMutation = useDeleteImportReceiptMutation({
    onSuccess: (message) => setBanner({ type: 'success', text: message || 'Xóa phiếu nhập thành công.' }),
    onError: (error) => setBanner({ type: 'error', text: mapImportReceiptApiError(error) }),
  })

  const assignItemMutation = useAssignImportReceiptItemMutation({
    onSuccess: (message) => setBanner({ type: 'success', text: message || 'Đã gán công việc nhập kho cho nhân viên.' }),
    onError: (error) => setBanner({ type: 'error', text: mapImportReceiptApiError(error) }),
  })

  const unassignItemMutation = useUnassignImportReceiptItemMutation({
    onSuccess: (message) => setBanner({ type: 'success', text: message || 'Đã gỡ phân công công việc nhập kho.' }),
    onError: (error) => setBanner({ type: 'error', text: mapImportReceiptApiError(error) }),
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

    // Ghi chú: Submit receipt block - validate va normalize payload truoc khi POST /import-receipts.
    const validationError = validateImportReceiptForm(createForm)
    if (validationError) {
      setCreateError(validationError)
      return
    }

    createMutation.mutate(normalizeImportReceiptPayload(createForm))
  }

  const handleOpenEdit = (id: number) => {
    if (!isAdmin) return
    const receipt = receiptsQuery.data?.find((item) => item.id === id)
    if (!receipt) {
      setBanner({ type: 'error', text: 'Không tìm thấy phiếu nhập để sửa.' })
      return
    }
    setEditingReceiptId(id)
    setEditForm({
      supplier_name: receipt.supplier_name || '',
      note: receipt.note || '',
      items: receipt.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    })
    setEditError('')
    setEditOpen(true)
  }

  const handleSubmitEdit = () => {
    if (!isAdmin || !editingReceiptId) return
    setEditError('')

    const validationError = validateImportReceiptForm(editForm)
    if (validationError) {
      setEditError(validationError)
      return
    }

    updateMutation.mutate({
      id: editingReceiptId,
      payload: normalizeImportReceiptPayload(editForm),
    })
  }

  const handleDelete = (id: number) => {
    if (!isAdmin) return
    const receipt = receiptsQuery.data?.find((item) => item.id === id)
    const label = receipt?.receipt_code || `#${id}`
    const confirmed = window.confirm(`Bạn có chắc muốn xóa phiếu nhập ${label}?`)
    if (!confirmed) return
    deleteMutation.mutate(id)
  }

  const handleViewDetail = (id: number) => {
    setSelectedReceiptId(id)
    setDetailOpen(true)
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
              Quản lý phiếu nhập
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Theo dõi danh sách phiếu nhập và tạo phiếu nhập nhiều dòng sản phẩm.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={() => receiptsQuery.refetch()}>
              Làm mới
            </Button>
            <Button variant="contained" startIcon={<Add />} disabled={!isAdmin} onClick={handleOpenCreate}>
              Tạo phiếu nhập
            </Button>
          </Stack>
        </Box>
      </Paper>

      {banner && <Alert severity={banner.type}>{banner.text}</Alert>}
      {!isAdmin && <Alert severity="info">Nhân viên chỉ có quyền xem phiếu nhập.</Alert>}

      <Paper sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Tìm phiếu nhập"
            placeholder="Tìm theo mã phiếu, nhà cung cấp, ghi chú..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Chip
            color="secondary"
            label={`Tổng phiếu: ${filteredReceipts.length}`}
            sx={{ fontWeight: 800, alignSelf: { xs: 'flex-start', sm: 'center' } }}
          />
        </Stack>

        <ImportReceiptTable
          receipts={paginatedReceipts}
          isLoading={receiptsQuery.isLoading}
          isError={receiptsQuery.isError}
          canManage={isAdmin}
          onViewDetail={handleViewDetail}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
        <ListPagination
          currentPage={currentPage}
          totalItems={filteredReceipts.length}
          trangSize={DEFAULT_PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </Paper>

      <ImportReceiptCreateDialog
        open={createOpen}
        mode="create"
        form={createForm}
        productOptions={productsQuery.data || []}
        trayOptions={traysQuery.data || []}
        locationOptions={locationsQuery.data || []}
        isSubmitting={createMutation.isPending}
        errorMessage={createError}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleSubmitCreate}
        onChange={setCreateForm}
      />

      <ImportReceiptCreateDialog
        open={editOpen}
        mode="edit"
        form={editForm}
        productOptions={productsQuery.data || []}
        trayOptions={traysQuery.data || []}
        locationOptions={locationsQuery.data || []}
        isSubmitting={updateMutation.isPending}
        errorMessage={editError}
        onClose={() => {
          setEditOpen(false)
          setEditingReceiptId(null)
          setEditError('')
        }}
        onSubmit={handleSubmitEdit}
        onChange={setEditForm}
      />

      <ImportReceiptDetailDialog
        open={detailOpen}
        receipt={receiptDetailQuery.data || null}
        products={productsQuery.data || []}
        trays={traysQuery.data || []}
        staffOptions={staffQuery.data || []}
        canManageAssignment={isAdmin}
        isLoading={receiptDetailQuery.isLoading}
        isError={receiptDetailQuery.isError}
        onAssign={(itemId, staffId) => assignItemMutation.mutate({ itemId, staffId })}
        onUnassign={(itemId) => unassignItemMutation.mutate(itemId)}
        onClose={() => {
          setDetailOpen(false)
          setSelectedReceiptId(null)
        }}
      />
    </Stack>
  )
}
