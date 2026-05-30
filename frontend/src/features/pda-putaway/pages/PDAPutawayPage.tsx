/*
Senior Handover Note:
- Purpose: PDA Putaway page theo flow HT730: scan product trước, sau đó chọn khay hợp lệ và nhập số lượng.
- Dependencies: PdaLayout, scanner hook dùng chung, products scan API, trays/inventory queries, putaway mutation.
- HT730 scanner behavior: TagAccess Keyboard nhập QR vào hidden input đang focus, Enter để submit scan.
- API callback contract: PRODUCT mode gọi GET /products/scan/:qr_code, submit gọi POST /inventory/putaway.
- Maintenance notes: Chỉ cho putaway vào khay thuộc đúng sản phẩm; không tạo scanner flow song song.
*/

import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { QrCodeScanner } from '@mui/icons-material'
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material'
import { PdaLayout } from '../../pda/layout/PdaLayout'
import { useScannerInput } from '../../scanner/hooks/useScannerInput'
import { ScannerHiddenInput } from '../../scanner/components/ScannerHiddenInput'
import { usePDAPutawayMutation } from '../hooks/usePdaPutaway'
import { productsApi } from '../../products/api/productsApi'
import type { ProductScanResponse } from '../../products/types/productTypes'
import { useTraysQuery, useTrayLocationOptionsQuery } from '../../trays/hooks/useTrays'
import { useInventoryQuery } from '../../inventory/hooks/useInventory'

export function PDAPutawayPage() {
  const [productScanResult, setProductScanResult] = useState<ProductScanResponse | null>(null)
  const [traySearch, setTraySearch] = useState('')
  const [selectedTrayId, setSelectedTrayId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [errorText, setErrorText] = useState('')

  const traysQuery = useTraysQuery()
  const locationsQuery = useTrayLocationOptionsQuery()
  const inventoryQuery = useInventoryQuery()

  const scanProductMutation = useMutation({
    mutationFn: (qrCode: string) => productsApi.scanProductByQRCode(qrCode),
  })

  const putawayMutation = usePDAPutawayMutation({
    onError: () => setErrorText('Nhập kho thất bại.'),
  })

  const locationCodeById = useMemo(() => {
    return new Map((locationsQuery.data || []).map((location) => [location.id, location.location_code]))
  }, [locationsQuery.data])

  const inventoryByTrayId = useMemo(() => {
    const map = new Map<number, { totalQty: number; sameProductQty: number }>()
    const productId = productScanResult?.product.id
    for (const row of inventoryQuery.data || []) {
      const prev = map.get(row.tray_id) || { totalQty: 0, sameProductQty: 0 }
      const next = {
        totalQty: prev.totalQty + Number(row.quantity || 0),
        sameProductQty: prev.sameProductQty + (productId && row.product_id === productId ? Number(row.quantity || 0) : 0),
      }
      map.set(row.tray_id, next)
    }
    return map
  }, [inventoryQuery.data, productScanResult?.product.id])

  const trayCandidates = useMemo(() => {
    const keyword = traySearch.trim().toLowerCase()
    const productId = productScanResult?.product.id
    return (traysQuery.data || [])
      .map((tray) => {
        const inv = inventoryByTrayId.get(tray.id) || { totalQty: 0, sameProductQty: 0 }
        const locationCode = locationCodeById.get(tray.location_id) || '-'
        const belongsToProduct = productId ? tray.product_id === productId : false
        const hasSameProduct = inv.sameProductQty > 0
        const isEmpty = inv.totalQty <= 0
        const isAllowed = belongsToProduct && (hasSameProduct || isEmpty)

        return {
          tray,
          locationCode,
          isAllowed,
          hasSameProduct,
          isEmpty,
          currentQty: inv.sameProductQty,
        }
      })
      .filter((item) => {
        if (!productId) return false
        if (!keyword) return true
        return (
          item.tray.tray_code.toLowerCase().includes(keyword) ||
          item.locationCode.toLowerCase().includes(keyword)
        )
      })
  }, [inventoryByTrayId, locationCodeById, productScanResult?.product.id, traySearch, traysQuery.data])

  const selectedTray = useMemo(() => {
    if (!selectedTrayId) return null
    return trayCandidates.find((candidate) => candidate.tray.id === selectedTrayId) || null
  }, [selectedTrayId, trayCandidates])

  const handleSubmit = async () => {
    if (!productScanResult || !selectedTray || quantity <= 0) return
    setErrorText('')
    setMessage('')

    const result = await putawayMutation.mutateAsync({
      product_qr_code: productScanResult.product.qr_code,
      tray_qr_code: selectedTray.tray.qr_code,
      quantity,
      note: note.trim(),
    })

    setMessage(result.message)
    setQuantity(1)
    setNote('')
  }

  const scanner = useScannerInput({
    autoStart: true,
    initialMode: 'PRODUCT',
    // Senior Handover: Scanner logic is centralized here to avoid duplicate handlers.
    onScanComplete: async ({ mode, code }) => {
      if (mode !== 'PRODUCT') return
      setErrorText('')
      setMessage('')
      const data = await scanProductMutation.mutateAsync(code)
      setProductScanResult(data)
      setTraySearch('')
      setSelectedTrayId(null)
    },
  })

  return (
    <PdaLayout title="Nhập kho PDA" subtitle="Quét sản phẩm rồi chọn khay">
      <Paper sx={{ p: 1.5, borderRadius: 2 }}>
        <Stack spacing={0.75}>
          <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Sẵn sàng quét mã sản phẩm</Typography>
          <Typography sx={{ fontSize: 15, color: 'text.secondary' }}>Không cần bấm nút scan, có thể quét ngay bằng HT730.</Typography>
          <Button type="button" variant="outlined" onClick={() => scanner.focusScannerInput()}>
            Đưa con trỏ quét về máy scan
          </Button>
        </Stack>
      </Paper>

      {productScanResult && (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Stack spacing={1}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 900 }}>
              {productScanResult.product.product_code}
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 800 }}>{productScanResult.product.product_name}</Typography>
            <Chip color="secondary" label={`Tồn hiện tại: ${productScanResult.inventory_total}`} sx={{ fontWeight: 900 }} />
          </Stack>
        </Paper>
      )}

      {productScanResult && (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Stack spacing={1}>
            <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Chọn khay nhập</Typography>
            <TextField
              label="Nhập mã khay / vị trí"
              placeholder="Ví dụ: TRAY-001 hoặc A-01"
              value={traySearch}
              onChange={(event) => setTraySearch(event.target.value)}
              fullWidth
            />

            <Stack spacing={0.8}>
              {trayCandidates.slice(0, 20).map((candidate) => (
                <Button
                  key={candidate.tray.id}
                  type="button"
                  variant={selectedTrayId === candidate.tray.id ? 'contained' : 'outlined'}
                  color={candidate.isAllowed ? 'primary' : 'inherit'}
                  disabled={!candidate.isAllowed}
                  onClick={() => setSelectedTrayId(candidate.tray.id)}
                  sx={{ justifyContent: 'space-between', minHeight: 48, textTransform: 'none' }}
                >
                  <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>
                    {candidate.tray.tray_code} · {candidate.locationCode}
                  </span>
                  <span>
                    {candidate.hasSameProduct
                      ? `Đang có: ${candidate.currentQty}`
                      : candidate.isEmpty
                        ? 'Khay trống'
                        : 'Không hợp lệ'}
                  </span>
                </Button>
              ))}
              {trayCandidates.length === 0 && (
                <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
                  Không có khay phù hợp cho sản phẩm này.
                </Typography>
              )}
            </Stack>

            <TextField
              label="Số lượng nhập"
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
              fullWidth
            />
            <TextField
              label="Ghi chú"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              fullWidth
            />

            <Button
              type="button"
              variant="contained"
              startIcon={<QrCodeScanner />}
              onClick={() => void handleSubmit()}
              disabled={!selectedTray || putawayMutation.isPending}
              sx={{ minHeight: 52, fontSize: 16, fontWeight: 900 }}
            >
              {putawayMutation.isPending ? 'Đang xử lý...' : 'Xác nhận nhập kho'}
            </Button>
          </Stack>
        </Paper>
      )}

      {message && <Alert severity="success">{message}</Alert>}
      {errorText && <Alert severity="error">{errorText}</Alert>}

      <Box>
        <ScannerHiddenInput
          inputRef={scanner.scannerInputRef}
          value={scanner.scanValue}
          onChange={scanner.handleScannerChange}
          onKeyDown={(event) => void scanner.handleScannerKeyDown(event)}
        />
      </Box>
    </PdaLayout>
  )
}
