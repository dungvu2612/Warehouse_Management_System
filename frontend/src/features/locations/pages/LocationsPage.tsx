/*
- Mục đích: Page orchestration cho man Locations.
- Phụ thuộc: `useLocationsQuery` + mutations create/update/delete, `locationService`, `useAuth`.
- Hợp đồng API: GET/POST/PUT/DELETE /locations.
- Role access: ADMIN thao tac ghi; WAREHOUSE chi xem.
- Ghi chú bảo trì: Giu logic permission tai trang de dong bo route policy.
*/

import { useEffect, useMemo, useState } from 'react'
import { Add, Refresh } from '@mui/icons-material'
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material'
import { useAuth } from '../../../app/providers/useAuth'
import { LocationCreateDialog } from '../components/LocationCreateDialog'
import { LocationTable } from '../components/LocationTable'
import {
  useCreateLocationMutation,
  useDeleteLocationMutation,
  useLocationsQuery,
  useUpdateLocationMutation,
} from '../hooks/useLocations'
import { locationService } from '../services/locationService'
import type { CreateLocationPayload, Location, LocationTray } from '../types/locationTypes'
import { mapLocationApiError } from '../utils/locationError'
import { normalizeLocationPayload, validateLocationForm } from '../utils/locationValidation'
import { ListPagination } from '../../../shared/components/ListPagination'
import { DEFAULT_PAGE_SIZE, paginateItems } from '../../../shared/lib/pagination'

const defaultLocationForm: CreateLocationPayload = {
  location_code: '',
  shelf: '',
  description: '',
}

export function LocationsPage() {
  const { user } = useAuth()
  // Ghi chú: Permission block - chỉ ADMIN được quyền mở form tạo location.
  const isAdmin = user?.role === 'ADMIN'

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [form, setForm] = useState<CreateLocationPayload>(defaultLocationForm)
  const [formError, setFormError] = useState('')
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedLocationId, setExpandedLocationId] = useState<number | null>(null)
  const [traysByLocationId, setTraysByLocationId] = useState<Record<number, LocationTray[]>>({})
  const [loadingLocationId, setLoadingLocationId] = useState<number | null>(null)
  const [errorByLocationId, setErrorByLocationId] = useState<Record<number, string>>({})

  const locationsQuery = useLocationsQuery()

  const createMutation = useCreateLocationMutation({
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Tạo vị trí thành công.' })
      setSearch('')
      setCurrentPage(1)
      setFormOpen(false)
      setForm(defaultLocationForm)
      setFormError('')
    },
    onError: (error) => {
      setFormError(mapLocationApiError(error))
    },
  })
  const updateMutation = useUpdateLocationMutation({
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Cập nhật vị trí thành công.' })
      setFormOpen(false)
      setFormMode('create')
      setEditingLocation(null)
      setForm(defaultLocationForm)
      setFormError('')
    },
    onError: (error) => {
      setFormError(mapLocationApiError(error))
    },
  })
  const deleteMutation = useDeleteLocationMutation({
    onSuccess: () => {
      setBanner({ type: 'success', text: 'Đã xóa vị trí khỏi danh sách sử dụng.' })
    },
    onError: (error) => {
      setBanner({ type: 'error', text: mapLocationApiError(error) })
    },
  })

  const filteredLocations = useMemo(() => {
    return locationService.filterLocationsByKeyword(locationsQuery.data || [], search)
  }, [locationsQuery.data, search])

  useEffect(() => {
    // Ghi chú: Reset trang to 1 whenever search/filter changes.
    setCurrentPage(1)
  }, [search])

  const paginatedLocations = useMemo(() => {
    return paginateItems(filteredLocations, currentPage, DEFAULT_PAGE_SIZE)
  }, [filteredLocations, currentPage])

  const openCreateDialog = () => {
    // Ghi chú: Permission block - chỉ ADMIN được quyền mở dialog thao tác ghi.
    if (!isAdmin) return
    setFormMode('create')
    setEditingLocation(null)
    setForm(defaultLocationForm)
    setFormError('')
    setFormOpen(true)
  }

  const openEditDialog = (location: Location) => {
    // Ghi chú: Permission block - chỉ ADMIN được quyền mở edit.
    if (!isAdmin) return
    setFormMode('edit')
    setEditingLocation(location)
    setForm({
      location_code: location.location_code,
      shelf: location.shelf || '',
      description: location.description || '',
    })
    setFormError('')
    setFormOpen(true)
  }

  const loadLocationTrays = async (location: Location, forceRefresh = false) => {
    if (!forceRefresh && traysByLocationId[location.id]) return

    setLoadingLocationId(location.id)
    setErrorByLocationId((current) => ({ ...current, [location.id]: '' }))

    try {
      const response = await locationService.getLocationTrays(location.id)
      setTraysByLocationId((current) => ({ ...current, [location.id]: response.trays }))
    } catch {
      setErrorByLocationId((current) => ({ ...current, [location.id]: 'Không tải được danh sách khay.' }))
    } finally {
      setLoadingLocationId((current) => (current === location.id ? null : current))
    }
  }

  const handleToggleLocation = (location: Location) => {
    if (expandedLocationId === location.id) {
      setExpandedLocationId(null)
      return
    }

    setExpandedLocationId(location.id)
    void loadLocationTrays(location)
  }

  const handleRetryLocationTrays = (location: Location) => {
    void loadLocationTrays(location, true)
  }

  const handleSubmitForm = () => {
    if (!isAdmin) return
    setFormError('')

    // Ghi chú: Submit block - validate/normalize payload trước khi gọi POST/PUT /locations.
    const validationError = validateLocationForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }

    const payload = normalizeLocationPayload(form)

    if (formMode === 'edit' && editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, payload })
      return
    }

    createMutation.mutate(payload)
  }

  const handleDeleteLocation = (location: Location) => {
    // Ghi chú: Permission block - chỉ ADMIN được quyền xóa mềm.
    if (!isAdmin) return
    if (!window.confirm(`Xóa vị trí ${location.location_code} khỏi danh sách sử dụng?`)) return
    deleteMutation.mutate(location.id)
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
              Quản lý vị trí
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quản lý danh sách vị trí lưu kho, phục vụ liên kết khay và quy trình lấy hàng.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={() => locationsQuery.refetch()}>
              Làm mới
            </Button>
            <Button variant="contained" startIcon={<Add />} disabled={!isAdmin} onClick={openCreateDialog}>
              Thêm vị trí
            </Button>
          </Stack>
        </Box>
      </Paper>

      {banner && <Alert severity={banner.type}>{banner.text}</Alert>}
      {!isAdmin && (
        <Alert severity="info">Nhân viên chỉ có quyền xem danh sách vị trí, không được tạo mới.</Alert>
      )}

      <Paper sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Tìm vị trí"
            placeholder="Tìm theo mã vị trí, kệ, mô tả..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Chip
            color="secondary"
            label={`Tổng vị trí: ${filteredLocations.length}`}
            sx={{ fontWeight: 800, alignSelf: { xs: 'flex-start', sm: 'center' } }}
          />
        </Stack>

        {/* Ghi chú: Fetch/render block - tập trung loading/error/empty state ở table component. */}
        <LocationTable
          locations={paginatedLocations}
          isLoading={locationsQuery.isLoading}
          isError={locationsQuery.isError}
          isAdmin={isAdmin}
          expandedLocationId={expandedLocationId}
          traysByLocationId={traysByLocationId}
          loadingLocationId={loadingLocationId}
          errorByLocationId={errorByLocationId}
          onToggleLocation={handleToggleLocation}
          onRetryLocationTrays={handleRetryLocationTrays}
          onEdit={openEditDialog}
          onDelete={handleDeleteLocation}
        />
        <ListPagination
          currentPage={currentPage}
          totalItems={filteredLocations.length}
          trangSize={DEFAULT_PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </Paper>

      <LocationCreateDialog
        open={formOpen}
        mode={formMode}
        form={form}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        errorMessage={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmitForm}
        onChange={setForm}
      />
    </Stack>
  )
}
