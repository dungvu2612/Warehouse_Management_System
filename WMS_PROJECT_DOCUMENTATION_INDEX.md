# 📚 WMS PROJECT - DOCUMENTATION INDEX

**Last Updated:** 2024-01-23  
**Project:** quan_ly_kho (Warehouse Management System)

---

## 📖 DOCUMENTATION OVERVIEW

Dự án WMS đã được tài liệu hóa chi tiết với 4 file chính:

### 📄 File 1: [WMS_API_BUSINESS_FLOW_DOCUMENTATION.md](WMS_API_BUSINESS_FLOW_DOCUMENTATION.md)
**Nội dung chính:**
- ✅ Danh sách toàn bộ 60+ endpoints của API
- ✅ Request/Response format cho mỗi endpoint
- ✅ JWT Token structure & configuration
- ✅ Authentication & Authorization middleware
- ✅ Interceptor flow (Frontend)
- ✅ Error handling conventions
- ✅ Role-Based Access Control (RBAC)
- ✅ Business flows cho 6 nghiệp vụ chính
- ✅ Error code reference

**Khi nào xem?** Khi cần hiểu API contracts, JWT, error handling

---

### 📄 File 2: [WMS_PROCESS_DIAGRAMS.md](WMS_PROCESS_DIAGRAMS.md)
**Nội dung chính:**
- ✅ 6 Process flowcharts chi tiết (Mermaid diagrams)
  - 1️⃣ Picking (Xuất kho/Nhặt hàng)
  - 2️⃣ Import (Nhập kho)
  - 3️⃣ Stock Taking (Kiểm kê)
  - 4️⃣ Inventory Adjustment (Điều chỉnh tồn kho)
  - 5️⃣ Staff Performance Reporting
  - 6️⃣ Order Assignment
- ✅ System Architecture diagram
- ✅ Data Flow diagrams
- ✅ Entity Relationship Diagram (ERD)
- ✅ State Machines (Order, Task, ImportItem)
- ✅ API Sequence Diagrams
- ✅ Quick reference (Status values, Validations, Metrics)

**Khi nào xem?** Khi cần hiểu business logic & relationships

---

### 📄 File 3: [WMS_FRONTEND_INTEGRATION.md](WMS_FRONTEND_INTEGRATION.md)
**Nội dung chính:**
- ✅ Frontend project structure
- ✅ Axios HTTP interceptor implementation
- ✅ Error handling strategy & utilities
- ✅ Error detection & classification
- ✅ API response standards
- ✅ Frontend feature modules code examples
  - Authentication
  - Product management
  - Picking (Orders)
  - Import
  - Inventory
- ✅ QR Code integration
- ✅ Real-time WebSocket updates
- ✅ Storage & Session management
- ✅ Best practices & checklists

**Khi nào xem?** Khi cần tích hợp frontend với backend API

---

## 🎯 QUICK REFERENCE GUIDE

### 🚀 I need to...

#### Understand API Endpoints
→ Go to [WMS_API_BUSINESS_FLOW_DOCUMENTATION.md](WMS_API_BUSINESS_FLOW_DOCUMENTATION.md) **Section 1 (API CONTEXT)**

**Key sections:**
- 1.2 Auth Endpoints (Login)
- 1.3 Product Endpoints
- 1.4 Inventory Endpoints (Putaway, Stock Taking)
- 1.5 Order Endpoints (Picking)
- 1.6 Import Receipt Endpoints
- 1.7 BOM Endpoints
- 1.8-1.12 Other endpoints

#### Understand JWT & Authentication
→ Go to [WMS_API_BUSINESS_FLOW_DOCUMENTATION.md](WMS_API_BUSINESS_FLOW_DOCUMENTATION.md) **Section 2 (JWT & AUTHENTICATION)**

**Key topics:**
- Token structure (header, payload, signature)
- JWT configuration (24h expiry, secret)
- Token validation flow

#### Understand Error Handling
→ Go to [WMS_API_BUSINESS_FLOW_DOCUMENTATION.md](WMS_API_BUSINESS_FLOW_DOCUMENTATION.md) **Section 3 (INTERCEPTOR & ERROR HANDLING)**

**Key topics:**
- Request/Response interceptor
- Error response format
- Common error codes

#### Understand Role-Based Access
→ Go to [WMS_API_BUSINESS_FLOW_DOCUMENTATION.md](WMS_API_BUSINESS_FLOW_DOCUMENTATION.md) **Section 4 (ROLE-BASED ACCESS CONTROL)**

**Key topics:**
- ADMIN vs WAREHOUSE roles
- Route protection patterns

#### Understand Business Process Flows
→ Go to [WMS_PROCESS_DIAGRAMS.md](WMS_PROCESS_DIAGRAMS.md) **Section 1 (PROCESS FLOWCHARTS)**

**Key processes:**
- 1.1 Picking (Xuất kho)
- 1.2 Import (Nhập kho)
- 1.3 Stock Taking (Kiểm kê)
- 1.4 Inventory Adjustment
- 1.5 Staff Performance
- 1.6 Order Assignment

#### Implement Frontend Integration
→ Go to [WMS_FRONTEND_INTEGRATION.md](WMS_FRONTEND_INTEGRATION.md)

**Key sections:**
- Section 2: HTTP Interceptor setup
- Section 3: Error handling
- Section 5: Feature module implementations
- Section 6: QR code integration
- Section 7: Real-time updates

#### Understand System Architecture
→ Go to [WMS_PROCESS_DIAGRAMS.md](WMS_PROCESS_DIAGRAMS.md) **Section 2 (SYSTEM ARCHITECTURE)**

#### Understand Data Relationships
→ Go to [WMS_PROCESS_DIAGRAMS.md](WMS_PROCESS_DIAGRAMS.md) **Section 4 (ENTITY RELATIONSHIP DIAGRAM)**

#### Check Status Values & Validations
→ Go to [WMS_PROCESS_DIAGRAMS.md](WMS_PROCESS_DIAGRAMS.md) **Section 6 (QUICK REFERENCE)**

---

## 📊 API ENDPOINTS SUMMARY

### By Module

| Module | Endpoints | Purpose |
|--------|-----------|---------|
| **Auth** | 2 | Login, Get current user |
| **Products** | 7 | CRUD, scan QR |
| **Inventory** | 6+ | View, adjust, putaway, stocktaking |
| **Orders (Picking)** | 14+ | Create, scan, verify tray, scan product, finish |
| **Import Receipt** | 10+ | Create, claim, confirm, assign |
| **BOM** | 5 | Create, read, update, delete |
| **Location & Tray** | 8+ | Manage locations, trays, scan QR |
| **Staff** | 5+ | View tasks, assign, report |
| **Stock Transaction** | 2 | Audit trail |
| **Dashboard & Reports** | 5+ | Stats, performance |
| **User Management** | 6 | CRUD users |
| **Notifications** | 4 | Get, mark read, WebSocket |

**Total:** ~60+ endpoints

---

## 🔄 MAIN BUSINESS FLOWS

```
┌─────────────────────────────────────────────────────────────┐
│                   WMS MAIN WORKFLOWS                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📥 IMPORT (Nhập kho)                                       │
│  Create ImportReceipt → Staff claims → Confirm putaway       │
│  → Inventory += qty → StockTransaction (IMPORT)             │
│                                                              │
│  📤 PICKING (Xuất kho)                                      │
│  Create Order from BOM → Scan Order → Verify Tray           │
│  → Scan Products (qty times) → Finish order                 │
│  → Inventory -= qty → StockTransaction (EXPORT)             │
│                                                              │
│  📦 STOCKTAKING (Kiểm kê)                                   │
│  Scan Tray → Input physical qty → System calc delta         │
│  → Update Inventory → StockTransaction (ADJUST)             │
│                                                              │
│  🔧 ADJUSTMENT (Điều chỉnh tồn kho)                         │
│  Admin view inventory → Enter delta + reason                │
│  → Update Inventory → StockTransaction (ADJUST)             │
│                                                              │
│  👥 STAFF PERFORMANCE                                        │
│  Query completed tasks → Calc metrics                        │
│  → Rank staff → Show report                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Login Flow
```
User enters username/password
           ↓
POST /auth/login
           ↓
Backend validates credentials
           ↓
Generate JWT token (24h expiry)
           ↓
Return token + user info
           ↓
Frontend stores token in localStorage
           ↓
Next requests: Authorization: Bearer <token>
```

### Token Structure
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
{
  "user_id": 1,
  "username": "admin",
  "role": "ADMIN",
  "iat": 1704096000,      // Issued At
  "exp": 1704182400       // Expires At (24h)
}.
<signature>
```

### Role-Based Access
- **ADMIN**: All permissions (CRUD users, approve tasks, etc.)
- **WAREHOUSE**: Staff permissions (picking, importing, stocktaking)

---

## 🛠️ FRONTEND INTEGRATION CHECKLIST

- [ ] **HTTP Setup**
  - Axios instance with base URL
  - Request interceptor (add Authorization header)
  - Response interceptor (handle 401)

- [ ] **Authentication**
  - Login page
  - Store token in localStorage
  - Token retrieval & validation
  - Logout flow

- [ ] **Error Handling**
  - Normalize errors with `getApiErrorInfo()`
  - Map errors to user-friendly messages
  - Show toast notifications
  - Handle network errors

- [ ] **Feature Modules**
  - Product search & QR scan
  - Picking workflow (order → tray → product)
  - Import workflow (claim → confirm)
  - Inventory view & adjustment
  - Stock taking
  - Staff tasks & reports

- [ ] **Real-time Updates**
  - WebSocket connection
  - Event listeners
  - Query invalidation

- [ ] **Best Practices**
  - TypeScript types for all APIs
  - Loading/error states
  - Retry logic
  - Performance optimization

---

## 📊 DATA MODELS

### Core Entities

```
User → Orders → OrderItems
       ↓
       PickingTasks → Products → Inventory → Trays → Locations

User → ImportReceipts → ImportReceiptItems → Products

BOM → BOMItems → Products

All transactions tracked in StockTransaction & PickLog
```

### Key Models

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **Product** | Sản phẩm | product_code, qr_code, product_name, type, min_stock |
| **Inventory** | Tồn kho | product_id, tray_id, quantity |
| **Tray** | Khay lưu trữ | tray_code, qr_code, location_id, product_id |
| **Order** | Đơn xuất | order_code, customer, status (PENDING→PICKING→COMPLETED) |
| **PickingTask** | Nhiệm vụ nhặt | product_id, tray_id, required/picked_qty, status |
| **ImportReceipt** | Phiếu nhập | receipt_code, supplier, status |
| **ImportReceiptItem** | Chi tiết nhập | product_id, qty, status, assigned_to |
| **StockTransaction** | Lịch sử tồn kho | type (IMPORT/EXPORT/ADJUST), product_id, qty, before/after |
| **BOM** | Bill of Materials | product_id (cha), items (danh sách con) |

---

## 🎓 LEARNING PATH

**If you're new to this project, follow this order:**

1. **Day 1: Understand the Business**
   - Read: [WMS_PROCESS_DIAGRAMS.md](WMS_PROCESS_DIAGRAMS.md) Section 1
   - Watch: 6 main process flows
   - Understand: What is picking, import, stocktaking, adjustment

2. **Day 2: Understand API Structure**
   - Read: [WMS_API_BUSINESS_FLOW_DOCUMENTATION.md](WMS_API_BUSINESS_FLOW_DOCUMENTATION.md) Section 1
   - Focus: Auth endpoints, Product endpoints, Order endpoints, Import endpoints
   - Understand: Request/response formats

3. **Day 3: Understand Authentication**
   - Read: [WMS_API_BUSINESS_FLOW_DOCUMENTATION.md](WMS_API_BUSINESS_FLOW_DOCUMENTATION.md) Sections 2, 3, 4
   - Focus: JWT, Interceptor, Error handling, RBAC
   - Understand: How token works, how to protect routes

4. **Day 4: Understand Data Model**
   - Read: [WMS_PROCESS_DIAGRAMS.md](WMS_PROCESS_DIAGRAMS.md) Section 4
   - Focus: Entity relationships
   - Understand: How entities connect

5. **Day 5: Frontend Integration**
   - Read: [WMS_FRONTEND_INTEGRATION.md](WMS_FRONTEND_INTEGRATION.md)
   - Focus: Interceptor setup, error handling, feature modules
   - Practice: Implement one feature (e.g., login)

---

## ⚡ QUICK TIPS

### Common Tasks

**Q: How to add a new endpoint?**
A: Define route → Create handler → Call service → Return response. See handlers/ in backend.

**Q: How to handle errors?**
A: Use `getApiErrorInfo()` to normalize, map to user message, show toast. See WMS_FRONTEND_INTEGRATION.md Section 3.

**Q: How to add role protection?**
A: Use `RequireRoles("ADMIN")` middleware. See WMS_API_BUSINESS_FLOW_DOCUMENTATION.md Section 4.

**Q: How to track inventory changes?**
A: Every change creates StockTransaction. See WMS_API_BUSINESS_FLOW_DOCUMENTATION.md Section 1.10.

**Q: How to integrate QR scanning?**
A: Call `scanProductByQR()` or `scanTrayByQR()`. See WMS_FRONTEND_INTEGRATION.md Section 6.

**Q: How to implement real-time updates?**
A: Use WebSocket connection with event listeners. See WMS_FRONTEND_INTEGRATION.md Section 7.

**Q: How does picking work step-by-step?**
A: Order → Verify Tray → Scan Products → Mark Done → Update Inventory. See WMS_PROCESS_DIAGRAMS.md 1.1.

**Q: What happens when import is confirmed?**
A: Inventory increases, StockTransaction recorded, item marked CONFIRMED. See WMS_PROCESS_DIAGRAMS.md 1.2.

---

## 🔗 RELATED FILES IN PROJECT

- Backend: `backend/handlers/` - HTTP handlers
- Backend: `backend/services/` - Business logic
- Backend: `backend/models/` - Data models
- Backend: `backend/repositories/` - Database access
- Backend: `backend/middleware/` - Auth & validation
- Frontend: `frontend/src/shared/lib/http.ts` - HTTP client
- Frontend: `frontend/src/features/` - Feature modules
- Database: `config/migrations.go` - DB schema

---

## 📞 NEED HELP?

### Understanding a specific endpoint?
→ Search in [WMS_API_BUSINESS_FLOW_DOCUMENTATION.md](WMS_API_BUSINESS_FLOW_DOCUMENTATION.md)

### Understanding a business process?
→ Look at [WMS_PROCESS_DIAGRAMS.md](WMS_PROCESS_DIAGRAMS.md) Section 1

### Understanding frontend integration?
→ Check [WMS_FRONTEND_INTEGRATION.md](WMS_FRONTEND_INTEGRATION.md)

### Want to see error codes?
→ Go to [WMS_API_BUSINESS_FLOW_DOCUMENTATION.md](WMS_API_BUSINESS_FLOW_DOCUMENTATION.md) Section 6

### Want to see data relationships?
→ Go to [WMS_PROCESS_DIAGRAMS.md](WMS_PROCESS_DIAGRAMS.md) Section 4 (ERD)

---

## 📝 DOCUMENTATION STATISTICS

| File | Size | Sections | Content |
|------|------|----------|---------|
| WMS_API_BUSINESS_FLOW_DOCUMENTATION.md | ~150KB | 6 | 60+ endpoints, JWT, interceptor, error codes |
| WMS_PROCESS_DIAGRAMS.md | ~100KB | 6 | 6 flowcharts, architecture, diagrams, state machines |
| WMS_FRONTEND_INTEGRATION.md | ~120KB | 9 | Frontend setup, error handling, feature modules, best practices |
| WMS_PROJECT_DOCUMENTATION_INDEX.md | ~20KB | - | This file - overview & quick reference |

**Total:** ~390KB of comprehensive documentation

---

## 🎯 NEXT STEPS

1. **Read** the overview (this file)
2. **Choose** which aspect to learn (API, Business, or Frontend)
3. **Deep dive** into the relevant documentation file
4. **Reference** specific sections as needed

Good luck with the WMS project! 🚀
