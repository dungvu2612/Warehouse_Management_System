/*
- Mục đích: Input ẩn duy nhất có thể focus cho máy quét HT730 dạng keyboard wedge.
- Phụ thuộc: Chỉ dùng ref/event của React.
- Hành vi máy quét HT730: Chuỗi QR được nhập vào input đang focus và gửi bằng hậu tố Enter.
- Hợp đồng callback API: Component cha truyền handler từ useScannerInput.
- Ghi chú bảo trì: Không thay bằng display:none; HT730 cần input có thể focus.
*/

import type { ChangeEvent, KeyboardEvent, RefObject } from 'react'

interface ScannerHiddenInputProps {
  inputRef: RefObject<HTMLInputElement | null>
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  disabled?: boolean
}

export function ScannerHiddenInput({ inputRef, value, onChange, onKeyDown, disabled = false }: ScannerHiddenInputProps) {
  return (
    // Ghi chú: Input ẩn nhận dữ liệu quét mà không hiển thị ô nhập.
    // Ghi chú: Không dùng display:none vì input quét vẫn phải focus được.
    <input
      ref={inputRef}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      aria-hidden="true"
      style={{
        position: 'fixed',
        opacity: 0,
        width: 1,
        height: 1,
        left: 0,
        bottom: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
