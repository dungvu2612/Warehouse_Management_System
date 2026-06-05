/*
- Mục đích: Order Detail chỉ xem sau replacement refactor; tap trung quan sat order, print, pick logs, stock transactions.
- Phụ thuộc: Orders hooks + Pick Logs module + Stock Transactions module.
- Hợp đồng API: GET /orders/:id, GET /pick-logs, GET /stock-transactions.
- Quy tắc nghiệp vụ: Khong duoc thao tac picking tai day; picking chi duoc van hanh o PDA flow.
- Ghi chú refactor thay thế: old picking UI/action da bo khoi Order Detail va thay bang nut Open PDA Picking.
- Ghi chú luồng scanner: Nut Open PDA Picking chuyen staff sang /pda/picking?order=<order_code> de scan HT730.
- Ghi chú bảo trì: Neu can them section chỉ xem khac, bo sung theo tab de tranh lam roi layout.
*/

import { useEffect, useMemo, useState } from 'react'
import { ArrowBack, ContentCopy, EditOutlined, OpenInNew, Print, Refresh } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { ProductImageThumb } from '../../../shared/components/ProductImageThumb'
import { toQrDataUrl } from '../../../shared/lib/qrCode'
import { usePickLogsQuery } from '../../pick-logs/hooks/usePickLogs'
import { PickLogsTable } from '../../pick-logs/components/PickLogsTable'
import { pickLogsService } from '../../pick-logs/services/pickLogsService'
import type { PickLogFilterValues } from '../../pick-logs/types/pickLogTypes'
import { useStockTransactionsQuery, useStockTransactionProductsQuery } from '../../stock-transactions/hooks/useStockTransactions'
import { stockTransactionsService } from '../../stock-transactions/services/stockTransactionsService'
import { useOrderByIdQuery } from '../hooks/useOrders'
import type { OrderDetailPickingTask, PickingStatus } from '../types/orderTypes'
import { OrderPrintTemplate } from '../components/OrderPrintTemplate'
import { ListPagination } from '../../../shared/components/ListPagination'
import { DEFAULT_PAGE_SIZE, paginateItems } from '../../../shared/lib/pagination'
import '../components/orderPrint.css'

function statusColor(status: PickingStatus | string): 'warning' | 'secondary' | 'success' | 'default' {
  if (status === 'WAITING') return 'warning'
  if (status === 'PICKING') return 'secondary'
  if (status === 'DONE') return 'success'
  return 'default'
}

function statusLabel(status: PickingStatus | string): string {
  if (status === 'WAITING') return 'Chờ nhặt'
  if (status === 'PICKING') return 'Đang nhặt'
  if (status === 'DONE') return 'Hoàn thành'
  if (status === 'PENDING') return 'Chờ xử lý'
  if (status === 'COMPLETED') return 'Đã hoàn tất'
  if (status === 'CANCELLED') return 'Đã hủy'
  return status
}

function formatQty(value: number) {
  return Number(value || 0).toLocaleString('vi-VN')
}

function formatMoney(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'
  return `${value.toLocaleString('vi-VN')} đ`
}

function TaskCards({ tasks }: { tasks: OrderDetailPickingTask[] }) {
  return (
    <Box
      sx={{
        display: { xs: 'grid', lg: 'none' },
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        gap: 1.5,
      }}
    >
      {tasks.map((task) => (
        <Paper key={task.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack spacing={1.2}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography sx={{ fontSize: 18, fontWeight: 900 }}>
                  {task.product_name || `Sản phẩm #${task.product_id}`}
                </Typography>
                <Typography sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  {task.product_code || '-'}
                </Typography>
              </Box>
              <Chip color={statusColor(task.status)} label={statusLabel(task.status)} sx={{ fontWeight: 900 }} />
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Chip label={`Vị trí ${task.location_code || '-'}`} sx={{ fontSize: 16, fontWeight: 800 }} />
              <Chip label={`Khay ${task.tray_code || '-'}`} sx={{ fontSize: 16, fontWeight: 800 }} />
            </Stack>

            <Stack direction="row" spacing={1.5}>
              <Box sx={{ flex: 1 }}>
                <Typography color="text.secondary">Yêu cầu</Typography>
                <Typography sx={{ fontSize: 28, fontWeight: 900 }}>{formatQty(task.required_quantity)}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography color="text.secondary">Đã nhặt</Typography>
                <Typography sx={{ fontSize: 28, fontWeight: 900 }}>{formatQty(task.picked_quantity)}</Typography>
              </Box>
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Box>
  )
}

const defaultPickLogFilters: PickLogFilterValues = {
  product: 'ALL',
  tray: 'ALL',
  picker: 'ALL',
  searchKeyword: '',
}

export function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const orderId = Number(id)

  const [activeTab, setActiveTab] = useState(0)
  const [pickLogFilters, setPickLogFilters] = useState<PickLogFilterValues>(defaultPickLogFilters)
  const [copyMessage, setCopyMessage] = useState('')
  const [printQrDataUrl, setPrintQrDataUrl] = useState('')
  const [pickingTaskPage, setPickingTaskPage] = useState(1)
  const [pickLogPage, setPickLogPage] = useState(1)

  const detailQuery = useOrderByIdQuery(Number.isFinite(orderId) ? orderId : null)
  // Ghi chú: Fetch logs block - goi GET /pick-logs theo order_id de nhung vao tab Pick Logs.
  const pickLogsQuery = usePickLogsQuery({ orderId: Number.isFinite(orderId) ? orderId : undefined, limit: 200 })
  const stockTxQuery = useStockTransactionsQuery('EXPORT')
  const stockProductQuery = useStockTransactionProductsQuery()

  const detail = detailQuery.data
  const order = detail?.order
  const progressValue = Math.round(detail?.progress.percent || 0)

  const handleOpenPickingMode = () => {
    if (!order) return
    navigate(`/pda/picking?order=${encodeURIComponent(order.order_code)}`)
  }

  const printItems = useMemo(() => {
    if (!order?.items || order.items.length === 0) return []

    const taskProductMap = new Map<number, { code: string; name: string }>()
    for (const task of detail?.picking_tasks || []) {
      taskProductMap.set(task.product_id, {
        code: task.product_code || '',
        name: task.product_name || '',
      })
    }

    const mapped = order.items.map((item) => {
      const productMeta = taskProductMap.get(item.product_id)
      const productCode = productMeta?.code || `#${item.product_id}`
      const productName = productMeta?.name || `Sản phẩm ${item.product_id}`
      const lineTotal = Number(item.unit_price || 0) * Number(item.quantity || 0)

      return {
        product_code: productCode,
        product_name: productName,
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0),
        line_total: lineTotal,
      }
    })

    // Ghi chú: template in chỉ hiển thị thành phẩm.
    return mapped.filter((item) => item.product_code.toUpperCase().startsWith('TP-'))
  }, [order?.items, detail?.picking_tasks])

  const orderLineItems = useMemo(() => {
    if (!order?.items || order.items.length === 0) return []
    const taskProductMap = new Map<number, { code: string; name: string }>()
    for (const task of detail?.picking_tasks || []) {
      taskProductMap.set(task.product_id, {
        code: task.product_code || '',
        name: task.product_name || '',
      })
    }

    return order.items.map((item) => {
      const productMeta = taskProductMap.get(item.product_id)
      const quantity = Number(item.quantity || 0)
      const unitPrice = Number(item.unit_price || 0)
      return {
        id: item.id,
        product_code: productMeta?.code || `#${item.product_id}`,
        product_name: productMeta?.name || `Sản phẩm ${item.product_id}`,
        quantity,
        unit_price: unitPrice,
        line_total: quantity * unitPrice,
      }
    })
  }, [order?.items, detail?.picking_tasks])

  const handlePrintOrder = async () => {
    if (!order || !detail) return
    const qrValue = order.qr_code || order.order_code
    const qrImage = await toQrDataUrl(qrValue)
    setPrintQrDataUrl(qrImage)
    window.setTimeout(() => window.print(), 80)
  }

  const pickLogRows = useMemo(() => {
    return pickLogsService.mapPickLogsForDisplay(pickLogsQuery.data || [], {
      orderCode: order?.order_code || '-',
      tasks: detail?.picking_tasks || [],
      trays: (detail?.picking_tasks || []).map((task) => ({
        id: task.tray_id,
        tray_code: task.tray_code,
      })),
    })
  }, [pickLogsQuery.data, order?.order_code, detail?.picking_tasks])

  // Ghi chú: Filter/search logic block - loc nhanh pick logs theo product/tray/picker + keyword realtime.
  const filteredPickLogRows = useMemo(() => {
    return pickLogsService.filterPickLogs(pickLogRows, pickLogFilters)
  }, [pickLogRows, pickLogFilters])

  useEffect(() => {
    // Ghi chú: Reset trang to 1 whenever search/filter changes.
    setPickLogPage(1)
  }, [pickLogFilters])

  const paginatedPickLogRows = useMemo(() => {
    return paginateItems(filteredPickLogRows, pickLogPage, DEFAULT_PAGE_SIZE)
  }, [filteredPickLogRows, pickLogPage])

  const productFilterOptions = useMemo(() => {
    return Array.from(new Set(pickLogRows.map((row) => row.product_code).filter((v) => v && v !== '-')))
  }, [pickLogRows])

  const trayFilterOptions = useMemo(() => {
    return Array.from(new Set(pickLogRows.map((row) => row.tray_code).filter((v) => v && v !== '-')))
  }, [pickLogRows])

  const pickerFilterOptions = useMemo(() => {
    return Array.from(new Set(pickLogRows.map((row) => row.picked_by_label).filter((v) => v && v !== '-')))
  }, [pickLogRows])

  const stockTxRows = useMemo(() => {
    if (!order) return []
    const transactions = (stockTxQuery.data || []).filter((item) => item.reference_code === order.order_code)
    return stockTransactionsService.mapTransactionsForDisplay(transactions, stockProductQuery.data || [])
  }, [order, stockTxQuery.data, stockProductQuery.data])

  useEffect(() => {
    setPickingTaskPage(1)
  }, [detail?.picking_tasks])

  const paginatedPickingTasks = useMemo(() => {
    return paginateItems(detail?.picking_tasks || [], pickingTaskPage, DEFAULT_PAGE_SIZE)
  }, [detail?.picking_tasks, pickingTaskPage])

  const stockTxSummaryByTaskKey = useMemo(() => {
    const byTask = new Map<string, { count: number; totalQty: number; latestAt: string | null }>()
    const byProduct = new Map<string, { count: number; totalQty: number; latestAt: string | null }>()

    const upsert = (
      target: Map<string, { count: number; totalQty: number; latestAt: string | null }>,
      key: string,
      quantity: number,
      createdAt: string,
    ) => {
      const prev = target.get(key) || { count: 0, totalQty: 0, latestAt: null }
      const nextLatest =
        !prev.latestAt || new Date(createdAt).getTime() > new Date(prev.latestAt).getTime()
          ? createdAt
          : prev.latestAt
      target.set(key, {
        count: prev.count + 1,
        totalQty: prev.totalQty + Number(quantity || 0),
        latestAt: nextLatest,
      })
    }

    for (const tx of stockTxRows) {
      const taskKey = `${tx.product_code}::${tx.tray_id ?? ''}`
      const productKey = tx.product_code
      upsert(byTask, taskKey, tx.quantity, tx.created_at)
      upsert(byProduct, productKey, tx.quantity, tx.created_at)
    }

    return { byTask, byProduct }
  }, [stockTxRows])

  const handleCopyTrayCode = async (trayCode: string) => {
    try {
      await navigator.clipboard.writeText(trayCode)
      setCopyMessage(`Đã sao chép mã khay: ${trayCode}`)
      window.setTimeout(() => setCopyMessage(''), 1800)
    } catch {
      setCopyMessage('Không thể sao chép mã khay trên trình duyệt hiện tại.')
      window.setTimeout(() => setCopyMessage(''), 1800)
    }
  }

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyMessage(`Đã sao chép ${label}: ${text}`)
      window.setTimeout(() => setCopyMessage(''), 1800)
    } catch {
      setCopyMessage(`Không thể sao chép ${label} trên trình duyệt hiện tại.`)
      window.setTimeout(() => setCopyMessage(''), 1800)
    }
  }

  if (!Number.isFinite(orderId) || orderId <= 0) {
    return <Alert severity="error">Mã đơn hàng không hợp lệ.</Alert>
  }

  return (
    <>
      <Stack spacing={2.5} className="no-print">
        <Paper sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
            <Stack spacing={0.8}>
              <Button
                variant="text"
                startIcon={<ArrowBack />}
                onClick={() => navigate('/orders')}
                sx={{ alignSelf: 'flex-start', fontWeight: 800 }}
              >
                Quay lại
              </Button>

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {order?.order_code || 'Chi tiết đơn hàng'}
                </Typography>
                <Typography color="text.secondary">
                  {order?.customer_name || '-'} · {order?.created_at ? new Date(order.created_at).toLocaleString('vi-VN') : '-'}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              {order && <Chip color="secondary" label={statusLabel(order.status)} sx={{ fontWeight: 900 }} />}
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => {
                  detailQuery.refetch()
                  pickLogsQuery.refetch()
                  stockTxQuery.refetch()
                }}
                disabled={detailQuery.isFetching || pickLogsQuery.isFetching || stockTxQuery.isFetching}
              >
                Làm mới
              </Button>
              <Button variant="outlined" startIcon={<Print />} onClick={handlePrintOrder}>
                In đơn hàng
              </Button>
              {order?.status === 'PENDING' && (
                <Button variant="outlined" startIcon={<EditOutlined />} onClick={() => navigate(`/orders/${orderId}/edit`)}>
                  Sửa đơn hàng
                </Button>
              )}
              <Button variant="contained" size="large" startIcon={<OpenInNew />} onClick={handleOpenPickingMode}>
                Mở màn nhặt PDA
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {(detailQuery.isError || pickLogsQuery.isError || stockTxQuery.isError) && (
          <Alert severity="error">Không tải được đầy đủ dữ liệu chi tiết đơn, nhật ký nhặt hoặc giao dịch kho.</Alert>
        )}
        {copyMessage && <Alert severity="success">{copyMessage}</Alert>}

        <Paper sx={{ p: 2.5 }}>
          <Tabs value={activeTab} onChange={(_, next) => setActiveTab(next)} sx={{ mb: 2 }}>
            <Tab label="Tổng quan" />
            <Tab label="Tiến độ nhặt & Giao dịch kho" />
            <Tab label="Nhật ký nhặt" />
          </Tabs>

          {activeTab === 0 && (
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                <Chip label={`Đơn: ${order?.order_code || '-'}`} sx={{ fontFamily: 'monospace', fontWeight: 800 }} />
                <Chip label={`QR: ${order?.qr_code || '-'}`} sx={{ fontFamily: 'monospace', fontWeight: 800 }} />
                <Chip label={`Trạng thái: ${order?.status ? statusLabel(order.status) : '-'}`} color="secondary" sx={{ fontWeight: 800 }} />
              </Stack>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Typography sx={{ fontSize: 18, fontWeight: 900 }}>Thông tin khách hàng</Typography>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                    <Typography><strong>Khách hàng:</strong> {order?.customer_name || '-'}</Typography>
                    <Typography><strong>Số điện thoại:</strong> {order?.customer_phone || '-'}</Typography>
                  </Stack>
                  <Typography><strong>Địa chỉ:</strong> {order?.customer_address || '-'}</Typography>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                    <Typography><strong>Ngày tạo:</strong> {order?.created_at ? new Date(order.created_at).toLocaleString('vi-VN') : '-'}</Typography>
                    <Typography><strong>Cập nhật:</strong> {order?.updated_at ? new Date(order.updated_at).toLocaleString('vi-VN') : '-'}</Typography>
                  </Stack>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1.2}>
                  <Typography sx={{ fontSize: 18, fontWeight: 900 }}>Sản phẩm trong đơn</Typography>
                  <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                    <Table>
                      <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>Mã SP</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Tên SP</TableCell>
                          <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>SL</TableCell>
                          <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Đơn giá</TableCell>
                          <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Thành tiền</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orderLineItems.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5}>Không có sản phẩm trong đơn.</TableCell>
                          </TableRow>
                        )}
                        {orderLineItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800 }}>{item.product_code}</TableCell>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell sx={{ textAlign: 'right' }}>{formatQty(item.quantity)}</TableCell>
                            <TableCell sx={{ textAlign: 'right' }}>{formatMoney(item.unit_price)}</TableCell>
                            <TableCell sx={{ textAlign: 'right', fontWeight: 800 }}>{formatMoney(item.line_total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} sx={{ justifyContent: 'space-between' }}>
                    <Typography sx={{ fontWeight: 700 }}>Số dòng sản phẩm: {orderLineItems.length}</Typography>
                    <Typography sx={{ fontWeight: 700 }}>
                      Tổng số lượng: {formatQty(orderLineItems.reduce((sum, item) => sum + item.quantity, 0))}
                    </Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: 18 }}>Tổng tiền: {formatMoney(order?.total_amount)}</Typography>
                  </Stack>
                </Stack>
              </Paper>

              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={() => void handleCopyText(order?.order_code || '', 'mã đơn')}
                  disabled={!order?.order_code}
                >
                  Sao chép mã đơn
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={() => void handleCopyText(order?.qr_code || order?.order_code || '', 'mã QR')}
                  disabled={!order}
                >
                  Sao chép mã QR
                </Button>
              </Stack>
            </Stack>
          )}

          {activeTab === 1 && (
            <Stack spacing={2}>
              {/* Ghi chú: Order Detail is chỉ xem for picking operations. */}
              <Alert severity="info">Màn chi tiết đơn chỉ hiển thị tiến độ nhặt. Thao tác nhặt thực hiện tại màn PDA.</Alert>

              <Stack spacing={1.2}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 900 }}>Tiến độ</Typography>
                  <Typography sx={{ fontWeight: 900 }}>
                    {detail?.progress.done_tasks || 0}/{detail?.progress.total_tasks || 0} công việc · {progressValue}%
                  </Typography>
                </Stack>
                <LinearProgress variant="determinate" value={progressValue} sx={{ height: 12, borderRadius: 99, bgcolor: 'grey.100' }} />
              </Stack>

              {detail?.shortage.has_shortage ? (
                <Alert severity="warning">
                  Thiếu hàng: {detail.shortage.items.map((item) => `${item.product_code || item.product_id} thiếu ${item.missing_qty}`).join(', ')}
                </Alert>
              ) : (
                <Alert severity="success">Không có cảnh báo thiếu hàng tại thời điểm xem.</Alert>
              )}

              {detailQuery.isLoading && <Typography>Đang tải danh sách tác vụ nhặt...</Typography>}
              {!detailQuery.isLoading && detail?.picking_tasks.length === 0 && <Alert severity="info">Đơn này chưa có tác vụ nhặt.</Alert>}
              {detail && <TaskCards tasks={paginatedPickingTasks} />}

              <TableContainer sx={{ display: { xs: 'none', lg: 'block' }, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 900 }}>Sản phẩm</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>Mã vị trí</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>Khay</TableCell>
                      <TableCell sx={{ fontWeight: 900, textAlign: 'right' }}>SL yêu cầu</TableCell>
                      <TableCell sx={{ fontWeight: 900, textAlign: 'right' }}>SL đã nhặt</TableCell>
                      <TableCell sx={{ fontWeight: 900, textAlign: 'right' }}>Tồn hiện tại</TableCell>
                      <TableCell sx={{ fontWeight: 900, textAlign: 'right' }}>Số lần xuất</TableCell>
                      <TableCell sx={{ fontWeight: 900, textAlign: 'right' }}>Tổng SL xuất</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>Xuất gần nhất</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>Trạng thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedPickingTasks.map((task) => {
                      const taskKey = `${task.product_code || '-'}::${task.tray_id ?? ''}`
                      const productKey = task.product_code || '-'
                      const txSummary =
                        stockTxSummaryByTaskKey.byTask.get(taskKey) ||
                        stockTxSummaryByTaskKey.byProduct.get(productKey) || {
                          count: 0,
                          totalQty: 0,
                          latestAt: null,
                        }

                      return (
                        <TableRow key={task.id} hover>
                          <TableCell>
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                              <ProductImageThumb src={task.product_image_url || ''} alt={task.product_name || `Sản phẩm ${task.product_id}`} size={40} />
                              <Box>
                                <Typography sx={{ fontWeight: 900 }}>{task.product_name || '-'}</Typography>
                                <Typography sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{task.product_code || '-'}</Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ fontSize: 18, fontWeight: 900 }}>{task.location_code || '-'}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{task.tray_code || '-'}</TableCell>
                          <TableCell sx={{ textAlign: 'right', fontWeight: 900 }}>{formatQty(task.required_quantity)}</TableCell>
                          <TableCell sx={{ textAlign: 'right', fontWeight: 900 }}>{formatQty(task.picked_quantity)}</TableCell>
                          <TableCell sx={{ textAlign: 'right' }}>{formatQty(task.inventory_qty)}</TableCell>
                          <TableCell sx={{ textAlign: 'right', fontWeight: 900 }}>{formatQty(txSummary.count)}</TableCell>
                          <TableCell sx={{ textAlign: 'right', fontWeight: 900 }}>{formatQty(txSummary.totalQty)}</TableCell>
                          <TableCell>{txSummary.latestAt ? new Date(txSummary.latestAt).toLocaleString('vi-VN') : '-'}</TableCell>
                          <TableCell>
                            <Chip color={statusColor(task.status)} label={statusLabel(task.status)} sx={{ fontWeight: 900 }} />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <ListPagination
                currentPage={pickingTaskPage}
                totalItems={detail?.picking_tasks.length || 0}
                trangSize={DEFAULT_PAGE_SIZE}
                onPageChange={setPickingTaskPage}
              />
            </Stack>
          )}

          {activeTab === 2 && (
            <Stack spacing={1.5}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                <TextField
                  select
                  label="Sản phẩm"
                  value={pickLogFilters.product}
                  onChange={(e) => setPickLogFilters((prev) => ({ ...prev, product: e.target.value }))}
                  fullWidth
                >
                  <MenuItem value="ALL">Tất cả sản phẩm</MenuItem>
                  {productFilterOptions.map((code) => (
                    <MenuItem key={code} value={code}>
                      {code}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Khay"
                  value={pickLogFilters.tray}
                  onChange={(e) => setPickLogFilters((prev) => ({ ...prev, tray: e.target.value }))}
                  fullWidth
                >
                  <MenuItem value="ALL">Tất cả khay</MenuItem>
                  {trayFilterOptions.map((code) => (
                    <MenuItem key={code} value={code}>
                      {code}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Nhân viên"
                  value={pickLogFilters.picker}
                  onChange={(e) => setPickLogFilters((prev) => ({ ...prev, picker: e.target.value }))}
                  fullWidth
                >
                  <MenuItem value="ALL">Tất cả nhân viên</MenuItem>
                  {pickerFilterOptions.map((picker) => (
                    <MenuItem key={picker} value={picker}>
                      {picker}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <TextField
                fullWidth
                label="Tìm trong nhật ký nhặt"
                placeholder="Tìm theo mã đơn, sản phẩm, khay, nhân viên, ghi chú..."
                value={pickLogFilters.searchKeyword}
                onChange={(e) => setPickLogFilters((prev) => ({ ...prev, searchKeyword: e.target.value }))}
              />

              <Chip color="secondary" label={`Tổng nhật ký: ${filteredPickLogRows.length}`} sx={{ fontWeight: 800, alignSelf: 'flex-start' }} />

              <PickLogsTable
                rows={paginatedPickLogRows}
                isLoading={pickLogsQuery.isLoading || detailQuery.isLoading}
                isError={pickLogsQuery.isError}
                onCopyTrayCode={handleCopyTrayCode}
              />
              <ListPagination
                currentPage={pickLogPage}
                totalItems={filteredPickLogRows.length}
                trangSize={DEFAULT_PAGE_SIZE}
                onPageChange={setPickLogPage}
              />
            </Stack>
          )}

        </Paper>
      </Stack>

      {order && (
        <OrderPrintTemplate
          systemName="WMS ENTERPRISE"
          logoText="WMS"
          order={{
            id: order.id,
            order_code: order.order_code,
            qr_code: order.qr_code,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            customer_address: order.customer_address,
            created_at: order.created_at,
          }}
          qrDataUrl={printQrDataUrl}
          items={printItems}
        />
      )}
    </>
  )
}
