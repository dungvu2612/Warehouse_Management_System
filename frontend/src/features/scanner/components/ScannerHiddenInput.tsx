/*
Senior Handover Note:
- Purpose: Single focusable hidden input for HT730 keyboard-wedge scanners.
- Dependencies: React refs/events only.
- HT730 scanner behavior: QR text is typed into the focused input and submitted by Enter suffix.
- API callback contract: Parent passes handlers from useScannerInput.
- Maintenance notes: Do not replace this with display:none; HT730 needs a focusable input.
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
    // Senior Handover: Hidden input receives scan data without showing a text field.
    // Senior Handover: Do not use display:none because scanner input must be focusable.
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
