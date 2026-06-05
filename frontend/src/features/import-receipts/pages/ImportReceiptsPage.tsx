/*
- Mục đích: Page orchestration cho man Import Receipts.
- Phụ thuộc: hooks Import Receipts + `importReceiptsService` + `useAuth`.
- Hợp đồng API: GET/POST /import-receipts.
- Role access: ADMIN duoc tao; WAREHOUSE chi xem theo policy backend/frontend.
- Ghi chú bảo trì: Giu permission tai trang de dong bo voi route policy.
*/

import { useEffect, useMemo, useState } from 'react'
import { Add, Refresh } from '@mui/icons-material'
import { Alert, Box, Button, Chip, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useAuth } from '../../../app/providers/AuthProvider'
import { ImportReceiptCreateDialog } from '../components/ImportReceiptCreateDialog'
import { ImportReceiptDetailDialog } from '../components/ImportReceiptDetailDialog'
import { ImportReceiptTable } from '../components/ImportReceiptTable'
import {
  useCreateImportReceiptMutation,
  useImportReceiptDetailQuery,
  useImportReceiptLocationsQuery,
  useImportReceiptProductsQuery,
  useImportReceiptTraysQuery,
  useImportReceiptsQuery,
  usePutawayRequestsQuery,
  useApprovePutawayRequestMutation,
  useRejectPutawayRequestMutation,
} from '../hooks/useImportReceipts'
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
  items: [{ product_id: 0, tray_id: 0, tray_qr_code: '', quantity: 1 }],
}

export function ImportReceiptsPage() {
  const { user } = useAuth()
  // Ghi chú: Permission check block - chi ADMIN duoc tao phieu nhap.
  const isAdmin = user?.role === 'ADMIN'

  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateImportReceiptPayload>(defaultCreateForm)
  const [createError, setCreateError] = useState('')

  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [putawayStatusFilter, setPutawayStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING')

  const receiptsQuery = useImportReceiptsQuery()
  const productsQuery = useImportReceiptProductsQuery()
  const traysQuery = useImportReceiptTraysQuery()
  const locationsQuery = useImportReceiptLocationsQuery()
  const receiptDetailQuery = useImportReceiptDetailQuery(selectedReceiptId)
  const putawayRequestsQuery = usePutawayRequestsQuery(putawayStatusFilter)
  const approvePutawayMutation = useApprovePutawayRequestMutation({
    onSuccess: () => setBanner({ type: 'success', text: 'Đã duyệt yêu cầu nhập kho.' }),
    onError: () => setBanner({ type: 'error', text: 'Duyệt yêu cầu thất bại.' }),
  })
  const rejectPutawayMutation = useRejectPutawayRequestMutation({
    onSuccess: () => setBanner({ type: 'success', text: 'Đã từ chối yêu cầu nhập kho.' }),
    onError: () => setBanner({ type: 'error', text: 'Từ chối yêu cầu thất bại.' }),
  })

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

    const trayMap = new Map((traysQuery.data || []).map((tray) => [tray.id, tray]))
    for (const [index, item] of createForm.items.entries()) {
      const selectedTray = trayMap.get(item.tray_id)
      if (!selectedTray || selectedTray.product_id !== item.product_id) {
        setCreateError(`Dòng ${index + 1}: Khay không thuộc sản phẩm đã chọn.`)
        return
      }
    }

    createMutation.mutate(normalizeImportReceiptPayload(createForm))
  }

  const handleViewDetail = (id: number) => {
    setSelectedReceiptId(id)
    setDetailOpen(true)
  }

  const handleApprovePutaway = (id: number) => {
    approvePutawayMutation.mutate(id)
  }

  const handleRejectPutaway = (id: number) => {
    const reason = window.prompt('Nhập lý do từ chối yêu cầu nhập kho:', '') || ''
    rejectPutawayMutation.mutate({ id, reason })
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
          onViewDetail={handleViewDetail}
        />
        <ListPagination
          currentPage={currentPage}
          totalItems={filteredReceipts.length}
          trangSize={DEFAULT_PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </Paper>

      {isAdmin && (
        <Paper sx={{ p: 2.5 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2, alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 900 }}>Yêu cầu nhập kho chờ duyệt</Typography>
            <TextField
              select
              size="small"
              label="Trạng thái"
              value={putawayStatusFilter}
              onChange={(e) => setPutawayStatusFilter(e.target.value as 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL')}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="PENDING">Chờ duyệt</MenuItem>
              <MenuItem value="APPROVED">Đã duyệt</MenuItem>
              <MenuItem value="REJECTED">Đã từ chối</MenuItem>
              <MenuItem value="ALL">Tất cả</MenuItem>
            </TextField>
          </Stack>

          <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Mã SP QR</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Mã khay QR</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Số lượng</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Tạo lúc</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {putawayRequestsQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={7}>Đang tải yêu cầu nhập kho...</TableCell>
                  </TableRow>
                )}
                {putawayRequestsQuery.isError && (
                  <TableRow>
                    <TableCell colSpan={7}>Không tải được yêu cầu nhập kho.</TableCell>
                  </TableRow>
                )}
                {!putawayRequestsQuery.isLoading && !putawayRequestsQuery.isError && (putawayRequestsQuery.data || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>Chưa có yêu cầu nhập kho.</TableCell>
                  </TableRow>
                )}
                {(putawayRequestsQuery.data || []).map((req) => (
                  <TableRow key={req.id} hover>
                    <TableCell>{req.id}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{req.product_qr_code}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{req.tray_qr_code}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 800 }}>{req.quantity}</TableCell>
                    <TableCell>{req.status}</TableCell>
                    <TableCell>{new Date(req.created_at).toLocaleString('vi-VN')}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          disabled={req.status !== 'PENDING' || approvePutawayMutation.isPending || rejectPutawayMutation.isPending}
                          onClick={() => handleApprovePutaway(req.id)}
                        >
                          Duyệt
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          disabled={req.status !== 'PENDING' || approvePutawayMutation.isPending || rejectPutawayMutation.isPending}
                          onClick={() => handleRejectPutaway(req.id)}
                        >
                          Từ chối
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <ImportReceiptCreateDialog
        open={createOpen}
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

      <ImportReceiptDetailDialog
        open={detailOpen}
        receipt={receiptDetailQuery.data || null}
        products={productsQuery.data || []}
        isLoading={receiptDetailQuery.isLoading}
        isError={receiptDetailQuery.isError}
        onClose={() => {
          setDetailOpen(false)
          setSelectedReceiptId(null)
        }}
      />
    </Stack>
  )
}
