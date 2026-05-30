/*
Senior Handover Note:
- Purpose: PDA Product Lookup toi uu cho Unitech HT730.
- Dependencies: PdaLayout, centralized scanner hook, pda-product-lookup mutation.
- API contract: GET /products/scan/:qr_code.
- HT730 scanner behavior: TagAccess Keyboard types QR into the focused hidden input, then Enter.
- API callback contract: LOOKUP mode calls GET /products/scan/:qr_code.
- Maintenance notes: Read-only lookup; do not mix with picking confirmation logic.
*/

import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { PdaLayout } from '../../pda/layout/PdaLayout'
import { ScanResultPanel } from '../../pda/components/ScanResultPanel'
import { useScannerInput } from '../../scanner/hooks/useScannerInput'
import { ScannerHiddenInput } from '../../scanner/components/ScannerHiddenInput'
import { usePDAProductLookupMutation } from '../hooks/usePdaProductLookup'
import { ListPagination } from '../../../shared/components/ListPagination'
import { DEFAULT_PAGE_SIZE, paginateItems } from '../../../shared/lib/pagination'

export function PDAProductLookupPage() {
  const [errorText, setErrorText] = useState('')
  const [trayPage, setTrayPage] = useState(1)

  const lookupMutation = usePDAProductLookupMutation({
    onError: () => setErrorText('Không tìm thấy sản phẩm theo QR.'),
  })

  const scanner = useScannerInput({
    autoStart: true,
    initialMode: 'LOOKUP',
    // Senior Handover: Scanner logic is centralized here to avoid duplicate handlers.
    onScanComplete: async ({ mode, code }) => {
      if (mode !== 'LOOKUP') return
      setErrorText('')
      await lookupMutation.mutateAsync(code)
    },
  })

  const data = lookupMutation.data
  const paginatedTrays = useMemo(() => {
    return paginateItems(data?.trays || [], trayPage, DEFAULT_PAGE_SIZE)
  }, [data?.trays, trayPage])

  useEffect(() => {
    setTrayPage(1)
  }, [data?.product.product_code])

  return (
    <PdaLayout
      title="Tra cứu sản phẩm"
      subtitle="Tra cứu tồn"
    >
      <Paper sx={{ p: 1.5, borderRadius: 2 }}>
        <Stack spacing={0.75}>
          <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Sẵn sàng quét mã sản phẩm</Typography>
          <Typography sx={{ fontSize: 15, color: 'text.secondary' }}>Không cần bấm nút scan, có thể quét ngay bằng HT730.</Typography>
          <Button type="button" variant="outlined" onClick={() => scanner.focusScannerInput()}>
            Đưa con trỏ quét về máy scan
          </Button>
        </Stack>
      </Paper>

      {scanner.isScanning && <ScanResultPanel severity="info" title="Đang chờ quét..." message="Bấm nút scan vật lý trên HT730" />}
      {scanner.scanStatus === 'SUCCESS' && <ScanResultPanel severity="success" title="Scan thành công" message={scanner.lastScannedCode} />}
      {scanner.scanStatus === 'ERROR' && <ScanResultPanel severity="error" title="Scan lỗi" message={scanner.scanMessage} />}
      {errorText && <ScanResultPanel severity="error" title="Tra cứu lỗi" message={errorText} />}

      {data && (
        <>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <Stack spacing={1}>
              <Typography sx={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 900 }}>
                {data.product.product_code}
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 800 }}>{data.product.product_name}</Typography>
              <Chip color="success" label={`Tồn tổng ${data.inventory_total}`} sx={{ minHeight: 36, fontWeight: 900 }} />
            </Stack>
          </Paper>

          <Stack spacing={1}>
            {paginatedTrays.map((tray) => (
              <Paper key={tray.inventory_id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack spacing={0.5}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 900 }}>
                    {tray.tray_code || '-'}
                  </Typography>
                  <Typography sx={{ fontSize: 15 }}>Vị trí: {tray.location_code || '-'}</Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 900 }}>Số lượng: {tray.quantity}</Typography>
                </Stack>
              </Paper>
            ))}
            <ListPagination
              currentPage={trayPage}
              totalItems={data.trays.length}
              pageSize={DEFAULT_PAGE_SIZE}
              onPageChange={setTrayPage}
            />
          </Stack>
        </>
      )}

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
