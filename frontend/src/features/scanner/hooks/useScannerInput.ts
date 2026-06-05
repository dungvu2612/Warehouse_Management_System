/* - Mục đích: Điểm kết nối trung tâm cho scanner HT730 đối với tất cả các luồng quét bằng bàn phím.
- Các phụ thuộc: Tham chiếu/trạng thái React và hàm gọi lại API scanner do trang cung cấp.
- Hành vi của scanner HT730: Bàn phím TagAccess gửi văn bản mã QR vào ô nhập liệu được chọn, sau đó nhấn Enter.
- Hợp đồng hàm gọi lại API: onScanComplete({ mode, code }) thực hiện cuộc gọi API cụ thể cho từng chế độ.
- Ghi chú bảo trì: Giữ việc xử lý đầu vào scanner ở đây; các trang không nên sao chép các trình xử lý phím/thay đổi.
*/
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'

export type ScanMode = 'IDLE' | 'ORDER' | 'TRAY' | 'PRODUCT' | 'LOOKUP' | 'STOCKTAKING'
export type ScanStatus = 'IDLE' | 'WAITING' | 'SUCCESS' | 'ERROR'

export interface ScanCompletePayload {
  mode: ScanMode
  code: string
}

interface UseScannerInputOptions {
  onScanComplete: (payload: ScanCompletePayload) => Promise<void>
  autoStart?: boolean
  initialMode?: ScanMode
}

export function getScannerErrorMessage(error: unknown) {
  const responseData = (error as { response?: { data?: { error?: string; message?: string } }; message?: string })?.response?.data
  const rawMessage = responseData?.error || responseData?.message || (error as { message?: string })?.message || ''

  const errorMap: Record<string, string> = {
    ORDER_NOT_FOUND: 'Không tìm thấy đơn hàng',
    TRAY_NOT_FOUND: 'Không tìm thấy khay',
    WRONG_TRAY: 'Sai khay',
    PRODUCT_QR_NOT_FOUND: 'Không tìm thấy sản phẩm',
    WRONG_PRODUCT: 'Sai sản phẩm',
    INSUFFICIENT_STOCK: 'Không đủ tồn kho',
    PICK_QTY_EXCEEDED: 'Đã nhặt đủ số lượng',
    TASK_DONE: 'Task đã hoàn thành',
    UNAUTHORIZED: 'Không có quyền thao tác',
  }

  return errorMap[rawMessage] || rawMessage || 'Scan thất bại'
}

export function useScannerInput({ onScanComplete, autoStart = false, initialMode = 'IDLE' }: UseScannerInputOptions) {
  const scannerInputRef = useRef<HTMLInputElement | null>(null)
  const isScanningRef = useRef(false)
  const pausedRef = useRef(false)
  const lastActiveModeRef = useRef<ScanMode>(initialMode === 'IDLE' ? 'ORDER' : initialMode)
  const [scanMode, setScanMode] = useState<ScanMode>('IDLE')
  const [scanStatus, setScanStatus] = useState<ScanStatus>('IDLE')
  const [scanValue, setScanValue] = useState('')
  const [lastScannedCode, setLastScannedCode] = useState('')
  const [scanMessage, setScanMessage] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  const shouldPauseForFocusedElement = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement | null
    if (!activeElement) return false
    if (activeElement === scannerInputRef.current) return false
    if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT') return true
    if (activeElement.isContentEditable) return true
    return activeElement.closest('[data-scanner-pause="true"]') !== null
  }, [])

  const restoreScrollPosition = useCallback((scrollY: number) => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY })
      window.setTimeout(() => {
        window.scrollTo({ top: scrollY })
      }, 0)
    })
  }, [])

  const focusScannerInput = useCallback(() => {
    if (pausedRef.current) return
    if (shouldPauseForFocusedElement()) return
    window.setTimeout(() => {
      const currentScrollY = window.scrollY
      // Ghi chú: Focus input quét ẩn với preventScroll để giữ vị trí màn hình HT730 ổn định.
      scannerInputRef.current?.focus({ preventScroll: true })
      restoreScrollPosition(currentScrollY)
    }, 50)
  }, [restoreScrollPosition, shouldPauseForFocusedElement])

  const startScan = useCallback(
    (mode: ScanMode) => {
      if (mode === 'IDLE') return
      isScanningRef.current = true
      pausedRef.current = false
      lastActiveModeRef.current = mode
      setScanMode(mode)
      setScanStatus('WAITING')
      setIsScanning(true)
      setScanValue('')
      setLastScannedCode('')
      setScanMessage('Đang chờ quét mã...')
      // Ghi chú: HT730 dùng TagAccess Keyboard theo cơ chế keyboard wedge.
      focusScannerInput()
    },
    [focusScannerInput],
  )

  const stopScan = useCallback(() => {
    isScanningRef.current = false
    setIsScanning(false)
    setScanMode('IDLE')
    setScanStatus('IDLE')
    setScanValue('')
    setScanMessage('')
  }, [])

  const pauseScanner = useCallback(() => {
    pausedRef.current = true
    isScanningRef.current = false
    setIsScanning(false)
  }, [])

  const resumeScanner = useCallback(
    (mode?: ScanMode) => {
      const nextMode = mode && mode !== 'IDLE' ? mode : lastActiveModeRef.current
      if (!nextMode || nextMode === 'IDLE') return
      startScan(nextMode)
    },
    [startScan],
  )

  const resetScan = useCallback(() => {
    isScanningRef.current = false
    setScanMode('IDLE')
    setScanStatus('IDLE')
    setScanValue('')
    setLastScannedCode('')
    setScanMessage('')
    setIsScanning(false)
  }, [])

  const handleScannerChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setScanValue(event.target.value)
  }, [])

  const handleScannerKeyDown = useCallback(
    async (event: KeyboardEvent<HTMLInputElement>) => {
      if (pausedRef.current) return
      if (event.key !== 'Enter') return
      // Ghi chú: Hậu tố Enter kích hoạt hoàn tất lượt quét.
      // Ghi chú: Prevent scanner Enter from submitting forms and causing trang reload.
      event.preventDefault()

      const code = scanValue.trim()
      if (!code || scanMode === 'IDLE') return
      const currentScrollY = window.scrollY

      setLastScannedCode(code)
      setScanValue('')

      try {
        await onScanComplete({ mode: scanMode, code })
        // Ghi chú: Update picking state in-place instead of reloading the trang after scan.
        setScanStatus('SUCCESS')
        setScanMessage(`Đã quét: ${code}`)
      } catch (error) {
        setScanStatus('ERROR')
        setScanMessage(getScannerErrorMessage(error))
      } finally {
        restoreScrollPosition(currentScrollY)
        if (isScanningRef.current) {
          // Ghi chú: Focus lại input ẩn sau khi quét để hỗ trợ quét liên tục.
          focusScannerInput()
        }
      }
    },
    [focusScannerInput, onScanComplete, restoreScrollPosition, scanMode, scanValue],
  )

  useEffect(() => {
    if (!autoStart) return
    if (initialMode === 'IDLE') return
    startScan(initialMode)
  }, [autoStart, initialMode, startScan])

  return {
    scannerInputRef,
    scanMode,
    scanStatus,
    scanValue,
    lastScannedCode,
    scanMessage,
    isScanning,
    startScan,
    stopScan,
    pauseScanner,
    resumeScanner,
    resetScan,
    focusScannerInput,
    handleScannerChange,
    handleScannerKeyDown,
  }
}
