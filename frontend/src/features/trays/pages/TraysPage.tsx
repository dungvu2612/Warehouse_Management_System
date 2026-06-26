/*
- Mục đích: Page orchestration cho man Trays.
- Phụ thuộc: CRUD hooks (`useTraysQuery` + create/update/delete), options hooks, `trayService`, `useAuth`.
- Hợp đồng API: GET/POST/PUT/DELETE /trays.
- Role access: ADMIN thao tac ghi; WAREHOUSE chi xem.
- Ghi chú bảo trì: Permission xu ly tai trang de dong bo backend role policy.
*/

import { useEffect, useMemo, useState } from 'react'
import { Add, Refresh } from '@mui/icons-material'
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material'
import { useAuth } from '../../../app/providers/useAuth'
import { TrayCreateDialog } from '../components/TrayCreateDialog'
import { TrayTable } from '../components/TrayTable'
import {
  useCreateTrayMutation,
  useDeleteTrayMutation,
  useTrayLocationOptionsQuery,
  useTrayProductOptionsQuery,
  useTraysQuery,
  useUpdateTrayMutation,
} from '../hooks/useTrays'
import { trayService } from '../services/trayService'
import type { TrayDisplay, TrayPayload } from '../types/trayTypes'
import { mapTrayApiError } from '../utils/trayError'
import { normalizeTrayPayload, validateTrayForm } from '../utils/trayValidation'
import { ListPagination } from '../../../shared/components/ListPagination'
import { DEFAULT_PAGE_SIZE, paginateItems } from '../../../shared/lib/pagination'

const defaultTrayForm: TrayPayload = {
  product_id: 0,
  location_id: 0,
  description: '',
}

export function TraysPage() {
  const { user } = useAuth()
  // Ghi chú: Permission block - chi ADMIN duoc thao tac tao tray.
  const isAdmin = user?.role === 'ADMIN'

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingTray, setEditingTray] = useState<TrayDisplay | null>(null)
  const [form, setForm] = useState<TrayPayload>(defaultTrayForm)
  const [formError, setFormError] = useState('')
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const traysQuery = useTraysQuery()
  const productOptionsQuery = useTrayProductOptionsQuery()
  const locationOptionsQuery = useTrayLocationOptionsQuery()

  const createMutation = useCreateTrayMutation({
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Tạo khay thành công.' })
      setSearch('')
      setCurrentPage(1)
      setFormOpen(false)
      setForm(defaultTrayForm)
      setFormError('')
    },
    onError: (error) => {
      setFormError(mapTrayApiError(error))
    },
  })
  const updateMutation = useUpdateTrayMutation({
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Cập nhật khay thành công.' })
      setFormOpen(false)
      setFormMode('create')
      setEditingTray(null)
      setForm(defaultTrayForm)
      setFormError('')
    },
    onError: (error) => {
      setFormError(mapTrayApiError(error))
    },
  })
  const deleteMutation = useDeleteTrayMutation({
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Đã xóa khay khỏi danh sách sử dụng.' })
    },
    onError: (error) => {
      setBanner({ type: 'error', text: mapTrayApiError(error) })
    },
  })

  const traysForDisplay = useMemo(() => {
    // Ghi chú: Join danh sach trays voi locations de hien thi location_code + mo ta.
    return trayService.mapTraysForDisplay(
      traysQuery.data || [],
      locationOptionsQuery.data || [],
      productOptionsQuery.data || [],
    )
  }, [traysQuery.data, locationOptionsQuery.data, productOptionsQuery.data])

  const filteredTrays = useMemo(() => {
    return trayService.filterTraysByKeyword(traysForDisplay, search)
  }, [traysForDisplay, search])

  useEffect(() => {
    // Ghi chú: Reset trang to 1 whenever search/filter changes.
    setCurrentPage(1)
  }, [search])

  const paginatedTrays = useMemo(() => {
    return paginateItems(filteredTrays, currentPage, DEFAULT_PAGE_SIZE)
  }, [filteredTrays, currentPage])

  const openCreateDialog = () => {
    // Ghi chú: Permission block - chi ADMIN duoc mo form tao.
    if (!isAdmin) return
    setFormMode('create')
    setEditingTray(null)
    setForm(defaultTrayForm)
    setFormError('')
    setFormOpen(true)
  }

  const openEditDialog = (tray: TrayDisplay) => {
    // Ghi chú: Permission block - chi ADMIN duoc mo form edit.
    if (!isAdmin) return
    setFormMode('edit')
    setEditingTray(tray)
    setForm({
      product_id: tray.product_id,
      location_id: tray.location_id,
      description: tray.description || '',
    })
    setFormError('')
    setFormOpen(true)
  }

  const handleSubmitForm = () => {
    if (!isAdmin) return
    setFormError('')

    // Ghi chú: Submit block - validate va normalize payload truoc khi goi POST/PUT /trays.
    const validationError = validateTrayForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }

    const payload = normalizeTrayPayload(form)

    if (formMode === 'edit' && editingTray) {
      updateMutation.mutate({ id: editingTray.id, payload })
      return
    }

    createMutation.mutate(payload)
  }

  const handleDeleteTray = (tray: TrayDisplay) => {
    // Ghi chú: Permission block - chi ADMIN duoc xoa mem tray.
    if (!isAdmin) return
    if (!window.confirm(`Xóa khay ${tray.tray_code} khỏi danh sách sử dụng?`)) return
    deleteMutation.mutate(tray.id)
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
              Quản lý khay
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quản lý khay chứa theo sản phẩm và vị trí để phục vụ nhập kho và lấy hàng.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={() => traysQuery.refetch()}>
              Làm mới
            </Button>
            <Button variant="contained" startIcon={<Add />} disabled={!isAdmin} onClick={openCreateDialog}>
              Thêm khay
            </Button>
          </Stack>
        </Box>
      </Paper>

      {banner && <Alert severity={banner.type}>{banner.text}</Alert>}
      {!isAdmin && <Alert severity="info">Nhân viên chỉ có quyền xem danh sách khay.</Alert>}

      <Paper sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Tìm khay"
            placeholder="Tìm theo mã khay, QR, mã/tên sản phẩm, vị trí, mô tả, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Chip
            color="secondary"
            label={`Tổng khay: ${filteredTrays.length}`}
            sx={{ fontWeight: 800, alignSelf: { xs: 'flex-start', sm: 'center' } }}
          />
        </Stack>

        {/* Ghi chú: Fetch/render block - table xu ly loading/error/empty state. */}
        <TrayTable
          trays={paginatedTrays}
          isLoading={traysQuery.isLoading}
          isError={traysQuery.isError}
          isAdmin={isAdmin}
          onEdit={openEditDialog}
          onDelete={handleDeleteTray}
        />
        <ListPagination
          currentPage={currentPage}
          totalItems={filteredTrays.length}
          trangSize={DEFAULT_PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </Paper>

      <TrayCreateDialog
        open={formOpen}
        mode={formMode}
        form={form}
        productOptions={productOptionsQuery.data || []}
        locationOptions={locationOptionsQuery.data || []}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        errorMessage={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmitForm}
        onChange={setForm}
      />
    </Stack>
  )
}
