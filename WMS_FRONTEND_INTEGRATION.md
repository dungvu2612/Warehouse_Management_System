# 🎨 WMS FRONTEND INTEGRATION & ERROR HANDLING GUIDE

---

## 📋 TABLE OF CONTENTS
1. [Frontend Architecture](#1-frontend-architecture)
2. [HTTP Interceptor & Authentication](#2-http-interceptor--authentication)
3. [Error Handling Strategy](#3-error-handling-strategy)
4. [API Response Standards](#4-api-response-standards)
5. [Frontend Feature Modules](#5-frontend-feature-modules)
6. [QR Code Integration](#6-qr-code-integration)
7. [Real-time Updates](#7-real-time-updates)
8. [Storage & Session Management](#8-storage--session-management)
9. [Best Practices](#9-best-practices)

---

# 1. FRONTEND ARCHITECTURE

## 1.1 Project Structure

```
frontend/
├── src/
│   ├── main.tsx                    # App entry point
│   ├── App.tsx                     # Root component
│   │
│   ├── shared/
│   │   ├── lib/
│   │   │   ├── http.ts            # Axios instance with interceptors
│   │   │   ├── apiError.ts        # Error handling utilities
│   │   │   ├── qrCode.ts          # QR code generation
│   │   │   ├── env.ts             # Environment config
│   │   │   ├── pagination.ts      # Pagination helper
│   │   │   └── datetime.ts        # Date utilities
│   │   │
│   │   ├── types/
│   │   │   ├── auth.ts            # Auth types
│   │   │   ├── product.ts         # Product types
│   │   │   ├── inventory.ts       # Inventory types
│   │   │   ├── order.ts           # Order types
│   │   │   └── ...
│   │   │
│   │   ├── constants/
│   │   │   ├── storage.ts         # localStorage keys
│   │   │   ├── api.ts             # API endpoints
│   │   │   └── ...
│   │   │
│   │   ├── components/            # Shared UI components
│   │   ├── router/
│   │   │   ├── router.tsx         # Route definitions
│   │   │   └── guards.tsx         # Route guards
│   │   │
│   │   └── realtime/
│   │       ├── realtimeUrl.ts     # WebSocket URL builder
│   │       └── useRealtimeInvalidation.ts  # Real-time hooks
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── pages/
│   │   │   │   └── LoginPage.tsx
│   │   │   └── hooks/
│   │   │       └── useAuth.ts
│   │   │
│   │   ├── products/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   │       └── useProducts.ts
│   │   │
│   │   ├── inventory/
│   │   │   ├── pages/
│   │   │   └── hooks/
│   │   │
│   │   ├── orders/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   │   ├── PickingTaskList.tsx
│   │   │   │   ├── PickingForm.tsx
│   │   │   │   └── OrderProgress.tsx
│   │   │   └── hooks/
│   │   │       └── useOrders.ts
│   │   │
│   │   ├── import/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   │   ├── ImportTaskList.tsx
│   │   │   │   └── ImportForm.tsx
│   │   │   └── hooks/
│   │   │
│   │   ├── staff/
│   │   │   ├── pages/
│   │   │   │   ├── StaffTasksPage.tsx
│   │   │   │   └── StaffReportPage.tsx
│   │   │   └── hooks/
│   │   │
│   │   └── notifications/
│   │       ├── pages/
│   │       └── hooks/
│   │           └── useNotifications.ts
│   │
│   └── layouts/
│       ├── AppLayout.tsx
│       └── AppNavigationDrawer.tsx
│
└── vite.config.ts
```

## 1.2 Technology Stack

```
Frontend Framework: React 18 + TypeScript
Build Tool: Vite 5
API Client: Axios 1.x
State Management: React Hooks + Context (or TanStack Query)
UI Library: Material-UI / Custom Components
Real-time: WebSocket
QR Code: Scanning library (built-in or third-party)
```

---

# 2. HTTP INTERCEPTOR & AUTHENTICATION

## 2.1 Axios Instance Configuration

**File: `frontend/src/shared/lib/http.ts`**

```typescript
import axios from 'axios'
import { env } from './env'
import { STORAGE_KEYS } from '../constants/storage'

// Tạo axios instance dùng chung cho toàn bộ API calls
export const http = axios.create({
  // Base URL sẽ tự prepend vào tất cả request
  baseURL: env.apiBaseUrl,  // e.g., http://localhost:8080/api/v1
  
  // Timeout để tránh request treo vô hạn
  timeout: 15000,
})

// ==================== REQUEST INTERCEPTOR ====================
http.interceptors.request.use((config) => {
  // 1. Lấy token từ localStorage (được lưu sau login)
  const token = localStorage.getItem(STORAGE_KEYS.accessToken)
  
  // 2. Nếu có token → Gắn Authorization header theo chuẩn Bearer
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // 3. Log request (optional, chỉ trong development)
  if (import.meta.env.DEV) {
    console.log(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`)
  }
  
  // 4. Return config để axios tiếp tục gửi request
  return config
})

// ==================== RESPONSE INTERCEPTOR ====================
http.interceptors.response.use(
  // ===== Nhánh SUCCESS =====
  (response) => {
    // Log response (optional)
    if (import.meta.env.DEV) {
      console.log(`[HTTP] Response 200:`, response.data)
    }
    
    // Trả response nguyên bản để component/hook xử lý
    return response
  },
  
  // ===== Nhánh ERROR =====
  (error) => {
    // Đọc HTTP status từ error response (nếu có)
    const status = error?.response?.status
    
    // ===== CASE 1: 401 Unauthorized (Token invalid/expired) =====
    if (status === 401) {
      // 1. Xóa session local để tránh dùng token hỏng
      localStorage.removeItem(STORAGE_KEYS.accessToken)
      localStorage.removeItem(STORAGE_KEYS.user)
      
      // 2. Xóa state nếu sử dụng Redux/Context
      // dispatch(clearAuthState())
      
      // 3. Nếu không ở trang login → ép quay về login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    // ===== CASE 2: Network error (không có response từ server) =====
    if (!error.response) {
      console.error('[HTTP] Network error:', error.message)
      // Component sẽ show: "Kết nối API thất bại"
    }
    
    // ===== CASE 3: Timeout =====
    if (error.code === 'ECONNABORTED') {
      console.error('[HTTP] Request timeout')
      // Component sẽ show: "Kết nối API quá lâu"
    }
    
    // Luôn reject để component/hook phía trên còn hiển thị thông báo lỗi
    return Promise.reject(error)
  }
)
```

## 2.2 Environment Configuration

**File: `frontend/src/shared/lib/env.ts`**

```typescript
interface Env {
  apiBaseUrl: string
  wsBaseUrl: string
}

export const env: Env = {
  // API base URL từ env var hoặc default
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  
  // WebSocket base URL
  wsBaseUrl: import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080/ws',
}
```

**File: `.env` (development)**

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_BASE_URL=ws://localhost:8080/ws
```

**File: `.env.production`**

```env
VITE_API_BASE_URL=https://wms.vnatech.local/api/v1
VITE_WS_BASE_URL=wss://wms.vnatech.local/ws
```

## 2.3 Storage Keys

**File: `frontend/src/shared/constants/storage.ts`**

```typescript
export const STORAGE_KEYS = {
  accessToken: 'wms:access_token',
  user: 'wms:user',
  preferences: 'wms:preferences',
} as const
```

---

# 3. ERROR HANDLING STRATEGY

## 3.1 Error Detection & Classification

**File: `frontend/src/shared/lib/apiError.ts`**

```typescript
import axios from 'axios'

// Interface chứa thông tin lỗi được normalize
export interface ApiErrorInfo {
  status?: number              // HTTP status code
  message?: string             // Error message
  code?: string                // Error code (e.g., "PRODUCT_NOT_FOUND")
  hasResponse: boolean         // Có response từ server?
  isTimeout: boolean           // Là timeout error?
}

/**
 * Extract error info từ error object (có thể từ axios hoặc lỗi khác)
 */
export function getApiErrorInfo(error: unknown): ApiErrorInfo {
  // Nếu không phải axios error → return generic error
  if (!axios.isAxiosError(error)) {
    return {
      hasResponse: false,
      isTimeout: false,
      message: error instanceof Error ? error.message : undefined,
    }
  }

  // Extract data từ response
  const data = error.response?.data as {
    error?: string
    error_code?: string
    message?: string
  } | undefined

  return {
    status: error.response?.status,
    message: data?.error || data?.message || error.message,
    code: data?.error_code,
    hasResponse: Boolean(error.response),
    isTimeout: error.code === 'ECONNABORTED',
  }
}

/**
 * Map network error (không có response) thành user-friendly message
 */
export function mapNetworkApiError(info: ApiErrorInfo): string | null {
  if (info.hasResponse) {
    // Có response từ server → không phải network error
    return null
  }

  if (info.isTimeout) {
    return 'Kết nối API quá lâu, kiểm tra backend hoặc mạng.'
  }

  return (
    'Không kết nối được API. Kiểm tra backend service, ' +
    'Nginx /api hoặc địa chỉ API của frontend.'
  )
}

/**
 * Map business error codes thành user-friendly message
 */
export function mapBusinessApiError(info: ApiErrorInfo): string | null {
  if (!info.hasResponse) {
    // Không phải business error
    return null
  }

  switch (info.code) {
    case 'PRODUCT_NOT_FOUND':
      return 'Sản phẩm không tồn tại. Kiểm tra lại mã QR.'

    case 'TRAY_NOT_FOUND':
      return 'Khay không tồn tại. Kiểm tra lại mã QR.'

    case 'TRAY_MISMATCH':
      return 'Khay không khớp với picking task. Vui lòng quét lại.'

    case 'PRODUCT_MISMATCH':
      return 'Sản phẩm không khớp với picking task. Vui lòng quét lại.'

    case 'DUPLICATE_KEY':
      return 'Dữ liệu đã tồn tại trong hệ thống.'

    case 'INVENTORY_NOT_FOUND':
      return 'Tồn kho không tìm thấy.'

    default:
      return info.message || 'Có lỗi xảy ra, vui lòng thử lại.'
  }
}
```

## 3.2 Error Handling Hooks

```typescript
import { AxiosError } from 'axios'
import { getApiErrorInfo, mapNetworkApiError, mapBusinessApiError } from '../lib/apiError'

/**
 * Hook để xử lý API error và show toast notification
 */
export function useApiErrorHandler() {
  return (error: unknown) => {
    const info = getApiErrorInfo(error)

    // Try network error message
    const networkErrorMsg = mapNetworkApiError(info)
    if (networkErrorMsg) {
      toast.error(networkErrorMsg)
      return
    }

    // Try business error message
    const businessErrorMsg = mapBusinessApiError(info)
    if (businessErrorMsg) {
      toast.error(businessErrorMsg)
      return
    }

    // Fallback
    toast.error('Có lỗi xảy ra, vui lòng thử lại.')
  }
}
```

## 3.3 Common Error Scenarios & Solutions

| Error | HTTP Status | Cause | Solution |
|-------|------------|-------|----------|
| **Invalid credentials** | 401 | Sai username/password | Nhập lại credentials |
| **Token expired** | 401 | Token hết hạn (24h) | Đăng nhập lại |
| **Forbidden** | 403 | Không có quyền | Liên hệ admin để get permission |
| **Product not found** | 404 | Sản phẩm QR không tồn tại | Kiểm tra QR code |
| **Duplicate product** | 409 | Product code đã tồn tại | Dùng product code khác |
| **Validation error** | 422 | Dữ liệu invalid | Check required fields |
| **Network error** | None | Không kết nối được backend | Kiểm tra backend & mạng |
| **Timeout** | None | Backend không respond | Thử lại sau |

---

# 4. API RESPONSE STANDARDS

## 4.1 Standard Response Format

### Success Response
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Product Name",
    ...
  },
  "message": "Operation completed successfully"
}
```

**OR** (ngắn gọn)
```json
{
  "id": 1,
  "name": "Product Name",
  ...
}
```

### Error Response
```json
{
  "status": "error",
  "error": "Error message here",
  "error_code": "PRODUCT_NOT_FOUND",
  "details": {
    "field": "product_id",
    "reason": "Product with ID 999 not found"
  }
}
```

### Paginated Response
```json
{
  "data": [
    { "id": 1, "name": "..." },
    { "id": 2, "name": "..." }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

## 4.2 HTTP Status Code Mapping

| Status | Meaning | Response Example |
|--------|---------|------------------|
| 200 | Success | `{ "id": 1, "name": "..." }` |
| 201 | Created | `{ "id": 1, "created_at": "..." }` |
| 204 | No Content | (empty body) |
| 400 | Bad Request | `{ "error": "Invalid request body" }` |
| 401 | Unauthorized | `{ "error": "Invalid token" }` |
| 403 | Forbidden | `{ "error": "Access denied" }` |
| 404 | Not Found | `{ "error": "Resource not found" }` |
| 409 | Conflict | `{ "error": "Duplicate entry" }` |
| 422 | Validation Error | `{ "error": "Invalid email format" }` |
| 500 | Server Error | `{ "error": "Internal server error" }` |

---

# 5. FRONTEND FEATURE MODULES

## 5.1 Authentication Module

```typescript
// Login flow
interface LoginRequest {
  username: string
  password: string
}

interface LoginResponse {
  access_token: string
  token_type: string  // "Bearer"
  user: {
    id: number
    username: string
    full_name: string
    role: 'ADMIN' | 'WAREHOUSE'
  }
}

// Implementation
async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    const response = await http.post<LoginResponse>('/auth/login', {
      username,
      password,
    })
    
    // Store token & user info
    localStorage.setItem(STORAGE_KEYS.accessToken, response.data.access_token)
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(response.data.user))
    
    return response.data
  } catch (error) {
    throw error
  }
}
```

## 5.2 Product Module

```typescript
interface Product {
  id: number
  product_code: string
  qr_code: string
  product_name: string
  product_type: 'COMPONENT' | 'FINISHED_GOOD'
  image_url: string
  unit: string
  min_stock: number
  price: number
  is_active: boolean
}

// Get products with search & pagination
async function getProducts(params?: {
  search?: string
  page?: number
  limit?: number
}): Promise<{ data: Product[], pagination: any }> {
  const response = await http.get('/products', { params })
  return response.data
}

// Scan product by QR code
async function scanProductByQR(qr_code: string): Promise<Product> {
  const response = await http.get(`/products/scan/${qr_code}`)
  return response.data
}
```

## 5.3 Picking (Orders) Module

```typescript
interface PickingTask {
  id: number
  order_id: number
  product_id: number
  tray_id: number
  required_quantity: number
  picked_quantity: number
  status: 'WAITING' | 'PICKING' | 'DONE'
  verified: boolean
}

// Scan order to start picking
async function scanOrderForPicking(qr_code: string) {
  const response = await http.get(`/orders/scan/${qr_code}`)
  return response.data  // Returns { order, picking_tasks }
}

// Verify tray before picking
async function verifyTray(picking_task_id: number, tray_qr_code: string) {
  const response = await http.post(
    `/orders/picking-tasks/${picking_task_id}/verify-tray`,
    { tray_qr_code }
  )
  return response.data
}

// Scan product for picking (qty += 1)
async function scanProductForPicking(picking_task_id: number, product_qr_code: string) {
  const response = await http.post(
    `/orders/picking-tasks/${picking_task_id}/scan-product`,
    { product_qr_code }
  )
  return response.data  // { picking_task_id, picked_quantity, ... }
}

// Finish order
async function finishOrder(order_id: number) {
  const response = await http.post(`/orders/${order_id}/finish`)
  return response.data
}
```

## 5.4 Import Module

```typescript
interface ImportReceiptItem {
  id: number
  receipt_code: string
  product_id: number
  quantity: number
  status: 'WAITING' | 'CLAIMED' | 'CONFIRMED'
  assigned_to: number | null
}

// Get staff import tasks
async function getImportTasks(params?: { status?: string; page?: number }) {
  const response = await http.get('/staff/import-receipt-items', { params })
  return response.data
}

// Claim import task
async function claimImportTask(item_id: number) {
  const response = await http.post(`/staff/import-receipt-items/${item_id}/claim`)
  return response.data
}

// Confirm import (putaway)
async function confirmImport(
  item_id: number,
  product_qr_code: string,
  tray_qr_code: string,
  quantity: number
) {
  const response = await http.post(
    `/staff/import-receipt-items/${item_id}/confirm`,
    { product_qr_code, tray_qr_code, quantity }
  )
  return response.data
}

// Alternative: Direct putaway (Admin can use this too)
async function putawayDirect(product_qr_code: string, tray_qr_code: string, quantity: number) {
  const response = await http.post('/inventory/putaway', {
    product_qr_code,
    tray_qr_code,
    quantity,
  })
  return response.data
}
```

## 5.5 Inventory Module

```typescript
interface InventoryItem {
  id: number
  product_id: number
  tray_id: number
  quantity: number
  product: Product
  tray: Tray
}

// Get inventory list
async function getInventory(params?: { product_id?: number; page?: number }) {
  const response = await http.get('/inventory', { params })
  return response.data
}

// Stock taking: quét tray + nhập physical qty
async function stockTaking(tray_qr_code: string, physical_quantity: number) {
  const response = await http.post('/inventory/stocktaking', {
    tray_qr_code,
    physical_quantity,
  })
  return response.data  // { tray_id, system_quantity, physical_quantity, delta }
}

// Manual adjustment
async function adjustInventory(inventory_id: number, delta: number, reason: string) {
  const response = await http.patch(`/inventory/${inventory_id}/adjust`, {
    adjustment_quantity: delta,
    note: reason,
  })
  return response.data
}
```

---

# 6. QR CODE INTEGRATION

## 6.1 QR Code Scanning

```typescript
// frontend/src/shared/lib/qrCode.ts

/**
 * Utilities cho QR code scanning
 */

// Camera stream setup (native or third-party library)
export async function startQRScanner(
  onScan: (result: string) => void,
  onError?: (error: string) => void
) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },  // Back camera
    })
    
    // Initialize scanner library (e.g., jsQR, QuaggaJS)
    // ...
  } catch (error) {
    onError?.(error.message)
  }
}

export function stopQRScanner() {
  // Stop stream & cleanup
}
```

## 6.2 QR Scanning Workflow

```typescript
// Component example: PickingPage.tsx

export function PickingPage() {
  const [mode, setMode] = useState<'order' | 'tray' | 'product'>('order')
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  
  const handleQRScanned = async (qrValue: string) => {
    try {
      if (mode === 'order') {
        // Scan Order QR
        const data = await scanOrderForPicking(qrValue)
        setCurrentOrder(data.order)
        setMode('tray')
      } else if (mode === 'tray') {
        // Scan Tray QR
        const task = currentOrder?.picking_tasks[0]
        await verifyTray(task.id, qrValue)
        setMode('product')
        toast.success('Tray verified')
      } else if (mode === 'product') {
        // Scan Product QR
        const task = currentOrder?.picking_tasks[0]
        const result = await scanProductForPicking(task.id, qrValue)
        toast.success(`Scanned: ${result.picked_quantity}/${result.required_quantity}`)
        
        if (result.picked_quantity === result.required_quantity) {
          // Task done, move to next
          toast.info('Task completed!')
        }
      }
    } catch (error) {
      handleError(error)
    }
  }
  
  return (
    <QRScanner onScan={handleQRScanned} />
  )
}
```

---

# 7. REAL-TIME UPDATES

## 7.1 WebSocket Integration

**File: `frontend/src/shared/realtime/realtimeUrl.ts`**

```typescript
import { env } from '../lib/env'

/**
 * Build WebSocket URL with token for real-time updates
 */
export function buildWebSocketUrl(token: string): string {
  return `${env.wsBaseUrl}?token=${encodeURIComponent(token)}`
}
```

## 7.2 Real-time Event Types

**File: `frontend/src/shared/realtime/realtimeTypes.ts`**

```typescript
export type RealtimeEventType =
  | 'task_created'
  | 'task_completed'
  | 'task_assigned'
  | 'inventory_updated'
  | 'order_completed'
  | 'import_completed'
  | 'notification'

export interface RealtimeEvent {
  type: RealtimeEventType
  data: any
  timestamp: string
}
```

## 7.3 Real-time Hook

**File: `frontend/src/shared/realtime/useRealtimeInvalidation.ts`**

```typescript
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Hook để auto-invalidate queries khi có real-time updates
 */
export function useRealtimeInvalidation() {
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  
  useEffect(() => {
    const token = localStorage.getItem('wms:access_token')
    if (!token) return
    
    const wsUrl = buildWebSocketUrl(token)
    const ws = new WebSocket(wsUrl)
    
    ws.onmessage = (event) => {
      const realtimeEvent = JSON.parse(event.data) as RealtimeEvent
      
      switch (realtimeEvent.type) {
        case 'task_completed':
          // Invalidate picking tasks
          queryClient.invalidateQueries({ queryKey: ['picking-tasks'] })
          break
          
        case 'inventory_updated':
          // Invalidate inventory
          queryClient.invalidateQueries({ queryKey: ['inventory'] })
          break
          
        case 'notification':
          // Show notification toast
          toast.info(realtimeEvent.data.message)
          break
      }
    }
    
    wsRef.current = ws
    
    return () => {
      ws.close()
    }
  }, [queryClient])
}
```

---

# 8. STORAGE & SESSION MANAGEMENT

## 8.1 Token Storage

```typescript
// After successful login
const response = await login(username, password)

// Store securely
localStorage.setItem('wms:access_token', response.access_token)
localStorage.setItem('wms:user', JSON.stringify(response.user))

// Every subsequent request will auto-include token via interceptor
```

## 8.2 Token Retrieval

```typescript
// Get token when needed
const token = localStorage.getItem('wms:access_token')

// Get user info
const user = JSON.parse(localStorage.getItem('wms:user') || '{}')
```

## 8.3 Logout

```typescript
function logout() {
  // Clear token & user
  localStorage.removeItem('wms:access_token')
  localStorage.removeItem('wms:user')
  
  // Redirect to login
  window.location.href = '/login'
}
```

## 8.4 Session Persistence

```typescript
// On app load, check if token exists
useEffect(() => {
  const token = localStorage.getItem('wms:access_token')
  
  if (token) {
    // Verify token still valid
    http.get('/auth/me')
      .then(response => {
        // Set auth state
        setUser(response.data.user)
      })
      .catch(() => {
        // Token invalid, clear & redirect
        logout()
      })
  } else {
    // Not logged in
    navigate('/login')
  }
}, [])
```

---

# 9. BEST PRACTICES

## 9.1 Error Handling Best Practices

✅ **DO:**
- Always wrap API calls in try-catch
- Use `getApiErrorInfo()` to normalize errors
- Show user-friendly error messages
- Log errors for debugging
- Retry logic for transient errors

❌ **DON'T:**
- Ignore errors silently
- Show raw backend error messages to users
- Expose sensitive data in error messages
- Retry indefinitely

## 9.2 Performance Best Practices

✅ **DO:**
- Use pagination for list APIs
- Debounce search inputs
- Cache responses (TanStack Query)
- Lazy load components
- Optimize images

❌ **DON'T:**
- Fetch all data at once
- Make unnecessary API calls
- Store sensitive data in local storage
- Block UI during API calls

## 9.3 Security Best Practices

✅ **DO:**
- Store token in localStorage (frontend only)
- Clear token on 401 error
- Validate input before sending
- Use HTTPS in production
- Implement CSRF protection

❌ **DON'T:**
- Store token in cookies (unless httpOnly)
- Log tokens in console
- Send passwords in URL
- Use hardcoded API URLs
- Trust user input

## 9.4 API Integration Best Practices

✅ **DO:**
- Use consistent error handling
- Implement request/response logging
- Version your API
- Use TypeScript interfaces
- Handle loading states

❌ **DON'T:**
- Use `any` types
- Make synchronous API calls
- Hard-code API endpoints in components
- Ignore timeout errors
- Use outdated APIs

## 9.5 Component Integration Patterns

```typescript
// ✅ Good pattern: Custom hook + component
function usePickingTasks() {
  const [tasks, setTasks] = useState<PickingTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getPickingTasks()
      setTasks(data)
    } catch (err) {
      setError(getApiErrorInfo(err).message)
    } finally {
      setLoading(false)
    }
  }, [])
  
  return { tasks, loading, error, fetchTasks }
}

// ✅ Good pattern: Clean component
export function PickingTasksPage() {
  const { tasks, loading, error, fetchTasks } = usePickingTasks()
  
  useEffect(() => {
    fetchTasks()
  }, [])
  
  if (loading) return <Spinner />
  if (error) return <ErrorAlert message={error} />
  
  return <PickingTasksList tasks={tasks} />
}
```

## 9.6 Error Handling in Components

```typescript
// ✅ Good error handling
async function handlePickProduct(taskId: number, qrCode: string) {
  try {
    const result = await scanProductForPicking(taskId, qrCode)
    toast.success(`Scanned: ${result.picked_quantity}/${result.required_quantity}`)
  } catch (error) {
    const errorInfo = getApiErrorInfo(error)
    
    if (errorInfo.code === 'PRODUCT_MISMATCH') {
      toast.error('Sản phẩm không khớp, vui lòng quét lại')
    } else if (errorInfo.code === 'TRAY_MISMATCH') {
      toast.error('Khay không khớp, vui lòng quét lại')
    } else if (errorInfo.isTimeout) {
      toast.error('Kết nối quá lâu, kiểm tra backend')
    } else {
      toast.error(errorInfo.message || 'Có lỗi xảy ra')
    }
  }
}
```

---

# 📋 QUICK CHECKLIST

## API Integration Checklist

- [ ] Axios instance configured with base URL & timeout
- [ ] Request interceptor adds Authorization header
- [ ] Response interceptor handles 401 errors
- [ ] Error handler normalizes errors to ApiErrorInfo
- [ ] User-friendly error messages mapped
- [ ] Token stored in localStorage after login
- [ ] Token cleared on logout/401
- [ ] Network error handling implemented
- [ ] Timeout error handling implemented
- [ ] All API types in TypeScript interfaces
- [ ] Pagination handled for list endpoints
- [ ] Loading states managed
- [ ] Error states managed & displayed

## Feature Module Checklist

- [ ] Login/logout flow implemented
- [ ] Products list with search
- [ ] Product QR scanning
- [ ] Picking workflow (scan order → verify tray → scan products)
- [ ] Import workflow (claim task → confirm putaway)
- [ ] Inventory view & adjustment
- [ ] Stock taking workflow
- [ ] Staff tasks list
- [ ] Staff performance report
- [ ] Real-time updates via WebSocket
- [ ] Notifications system
- [ ] Role-based UI (hide/show based on role)

## UI/UX Checklist

- [ ] Loading spinners shown during API calls
- [ ] Error alerts/toast notifications shown
- [ ] Success notifications shown
- [ ] Form validation before submit
- [ ] QR scanner integrated
- [ ] Pagination controls
- [ ] Search/filter functionality
- [ ] Responsive design (mobile-first)
- [ ] Accessibility (ARIA labels, keyboard nav)
