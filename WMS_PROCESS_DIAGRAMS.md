# 🎯 WMS BUSINESS PROCESS & DATA FLOW DIAGRAMS

---

## 📊 TABLE OF CONTENTS
1. [Process Flowcharts](#1-process-flowcharts)
2. [System Architecture](#2-system-architecture)
3. [Data Flow Diagrams](#3-data-flow-diagrams)
4. [Entity Relationship Diagram](#4-entity-relationship-diagram)
5. [State Machines](#5-state-machines)

---

# 1. PROCESS FLOWCHARTS

## 1.1 🎯 PICKING PROCESS - Chi tiết từng bước

```mermaid
graph TD
    Start["🚀 START"] --> CreateOrder["1️⃣ ADMIN tạo Order từ BOM"]
    CreateOrder --> SetPending["Order.Status = PENDING<br/>PickingTasks created<br/>PickingTask.Status = WAITING"]
    
    SetPending --> ScanOrderQR["2️⃣ Staff scan Order QR"]
    ScanOrderQR --> CheckOrder{"Order tồn tại<br/>và PENDING?"}
    CheckOrder -->|❌ No| ErrorOrder["Error: Order không tìm thấy<br/>hoặc không PENDING"]
    ErrorOrder --> ScanOrderQR
    
    CheckOrder -->|✅ Yes| StartPicking["Order.Status = PICKING<br/>Show PickingTasks"]
    StartPicking --> TaskLoop["⏰ Lặp qua từng Task"]
    
    TaskLoop --> ScanTray["3️⃣ Staff scan Tray QR"]
    ScanTray --> CheckTray{"Tray QR khớp<br/>với task?"}
    CheckTray -->|❌ No| ErrorTray["Error: Tray mismatch<br/>Re-scan"]
    ErrorTray --> ScanTray
    
    CheckTray -->|✅ Yes| VerifyTray["PickingTask.Verified = true"]
    VerifyTray --> ScanLoop["⏰ Lặp scan product"]
    
    ScanLoop --> ScanProduct["4️⃣ Staff scan Product QR"]
    ScanProduct --> CheckProduct{"Product QR khớp<br/>với task?"}
    CheckProduct -->|❌ No| ErrorProduct["Error: Product mismatch<br/>Re-scan"]
    ErrorProduct --> ScanProduct
    
    CheckProduct -->|✅ Yes| IncrementQty["PickingTask.PickedQty += 1<br/>PickLog record"]
    IncrementQty --> CheckQtyDone{"PickedQty ==<br/>RequiredQty?"}
    
    CheckQtyDone -->|❌ No| ScanLoop
    CheckQtyDone -->|✅ Yes| TaskDone["PickingTask.Status = DONE"]
    
    TaskDone --> CheckAllDone{"All tasks<br/>DONE?"}
    CheckAllDone -->|❌ No| TaskLoop
    
    CheckAllDone -->|✅ Yes| FinishOrder["5️⃣ Order = COMPLETED"]
    FinishOrder --> CreateTx["Create StockTransaction<br/>EXPORT for each item"]
    CreateTx --> UpdateInv["Inventory -= qty"]
    UpdateInv --> End["✅ END - Order completed"]
```

**Key Validations:**
- ✅ Order must exist & be PENDING/PICKING
- ✅ Tray must match PickingTask.TrayID
- ✅ Product must match PickingTask.ProductID
- ✅ PickedQty must be tracked per scan

**Automatic Records:**
- PickLog: Mỗi scan product
- StockTransaction: Khi order COMPLETED

---

## 1.2 🚚 IMPORT PROCESS - Chi tiết từng bước

```mermaid
graph TD
    Start["🚀 START"] --> CreateReceipt["1️⃣ ADMIN tạo ImportReceipt"]
    CreateReceipt --> SetItems["ImportReceipt.Status = WAITING<br/>Items.Status = WAITING"]
    
    SetItems --> StaffView["2️⃣ Staff xem ImportReceiptItems"]
    StaffView --> ViewItems["GET /staff/import-receipt-items<br/>Hiển thị task không assigned"]
    
    ViewItems --> ClaimDecision{"Staff claim<br/>hoặc không?"}
    ClaimDecision -->|❌ Không| AdminAssign["ADMIN assign task"]
    AdminAssign --> ItemClaimed["Item.AssignedTo = staff_id<br/>Item.Status = CLAIMED"]
    
    ClaimDecision -->|✅ Có| StaffClaim["3️⃣ Staff claim item"]
    StaffClaim --> ItemClaimed
    
    ItemClaimed --> EnterQty["4️⃣ Staff xác nhận import:<br/>quét Product QR<br/>quét Tray QR<br/>nhập qty"]
    
    EnterQty --> ValidateLink{"Product + Tray<br/>valid?"}
    ValidateLink -->|❌ No| ErrorLink["Error: Product/Tray invalid"]
    ErrorLink --> EnterQty
    
    ValidateLink -->|✅ Yes| ConfirmItem["Item.Status = CONFIRMED"]
    ConfirmItem --> CreateTx["Create StockTransaction IMPORT<br/>quantity=qty<br/>before=0, after=qty"]
    CreateTx --> UpdateInv["Inventory += qty<br/>hoặc create new"]
    
    UpdateInv --> CheckAllItems{"All items<br/>CONFIRMED?"}
    CheckAllItems -->|❌ No| MoreItems["⏰ Next item"]
    MoreItems --> StaffView
    
    CheckAllItems -->|✅ Yes| ApproveReceipt["5️⃣ ImportReceipt.Status = APPROVED"]
    ApproveReceipt --> End["✅ END - Import completed"]
```

**Status Flow:**
```
ImportReceipt: WAITING → PENDING → APPROVED
Item: WAITING → CLAIMED → CONFIRMED → APPROVED
```

**Alternative: PutawayRequest:**
```mermaid
graph LR
    A["Staff sends<br/>PutawayRequest<br/>Prod + Tray + Qty"] --> B["ADMIN reviews<br/>in /inventory/putaway-requests"]
    B --> C{"Approve or<br/>Reject?"}
    C -->|Approve| D["Auto putaway<br/>Inventory += qty<br/>StockTx IMPORT"]
    C -->|Reject| E["PutawayRequest.Status<br/>= REJECTED"]
    D --> F["✅ Import done"]
    E --> G["Staff redo"]
```

---

## 1.3 📦 STOCK TAKING PROCESS - Chi tiết từng bước

```mermaid
graph TD
    Start["🚀 START"] --> ScanTray["1️⃣ Staff scan Tray QR"]
    ScanTray --> CheckTray{"Tray tồn tại?"}
    
    CheckTray -->|❌ No| ErrorTray["Error: Tray not found"]
    ErrorTray --> ScanTray
    
    CheckTray -->|✅ Yes| GetInv["GET Inventory for tray"]
    GetInv --> ShowQty["Show:<br/>Product: SKU001<br/>System Qty: 100"]
    
    ShowQty --> InputPhysical["2️⃣ Staff nhập<br/>Physical Qty"]
    InputPhysical --> CalcDelta["3️⃣ System calc:<br/>Delta = Physical - System<br/>Delta = 95 - 100 = -5"]
    
    CalcDelta --> ConfirmDelta{"Staff confirm<br/>delta?"}
    ConfirmDelta -->|❌ No| InputPhysical
    
    ConfirmDelta -->|✅ Yes| CreateTx["Create StockTransaction<br/>ADJUST<br/>quantity = delta<br/>before = system_qty<br/>after = physical_qty"]
    
    CreateTx --> UpdateInv["Inventory.Quantity<br/>= physical_qty"]
    UpdateInv --> End["✅ END - Stocktaking completed<br/>Audit trail recorded"]
```

**Delta Analysis:**
- Δ < 0: Hàng thiếu (mất/hỏng/sai tính)
- Δ = 0: Khớp perfect
- Δ > 0: Hàng thừa (có thể tính sai trước)

---

## 1.4 🔧 INVENTORY ADJUSTMENT PROCESS

```mermaid
graph TD
    Start["🚀 START"] --> AdminView["1️⃣ ADMIN xem Inventory"]
    AdminView --> SelectItem["Select item cần điều chỉnh"]
    
    SelectItem --> InputDelta["2️⃣ Enter adjustment:<br/>- Current Qty: 100<br/>- Adjustment: -10<br/>- Reason: 'Hàng hỏng'"]
    
    InputDelta --> ValidateQty{"New Qty<br/>valid?"}
    ValidateQty -->|❌ No| ErrorQty["Error: Quantity < 0<br/>or invalid"]
    ErrorQty --> InputDelta
    
    ValidateQty -->|✅ Yes| ConfirmAdj["3️⃣ Confirm adjustment"]
    ConfirmAdj --> CreateTx["Create StockTransaction<br/>ADJUST<br/>quantity = delta<br/>note = reason"]
    
    CreateTx --> UpdateInv["Inventory.Quantity<br/>= current + delta<br/>= 100 + (-10) = 90"]
    UpdateInv --> End["✅ END - Adjustment recorded"]
```

---

## 1.5 👥 STAFF PERFORMANCE REPORTING PROCESS

```mermaid
graph TD
    Start["🚀 START"] --> AdminAccess["ADMIN access<br/>/admin/reports/staff-performance"]
    AdminAccess --> SelectDate["Select date range"]
    
    SelectDate --> QueryDB["System query database:<br/>- PickingTasks (status=DONE)<br/>- ImportReceiptItems (status=CONFIRMED)<br/>- StockTransactions<br/>- PickLogs"]
    
    QueryDB --> GroupByStaff["Group by staff_id"]
    GroupByStaff --> CalcMetrics["Calculate metrics for each staff:<br/>- picking_tasks_completed<br/>- import_tasks_completed<br/>- avg_picking_time<br/>- error_rate"]
    
    CalcMetrics --> CalcScore["Calc performance_score:<br/>= (tasks_completed × quality) / target"]
    
    CalcScore --> SortRank["Sort by score (descending)<br/>Rank staff"]
    
    SortRank --> Display["Display report:<br/>- Rank<br/>- Staff name<br/>- Tasks completed<br/>- Performance score<br/>- Efficiency trends"]
    
    Display --> End["✅ END - Report generated"]
```

**Metrics Example:**
```
Staff: Nguyễn Văn A
- Picking Tasks Completed: 120
- Import Tasks Completed: 45
- Avg Picking Time: 2.3 min/task
- Error Rate: 2%
- Performance Score: 95/100
- Trend: ↗️ Improving
```

---

## 1.6 📋 ORDER ASSIGNMENT PROCESS

```mermaid
graph TD
    Start["🚀 START"] --> AdminView["ADMIN xem danh sách Order"]
    AdminView --> SelectOrder["Select Order"]
    
    SelectOrder --> CheckStatus{"Order status<br/>= PENDING?"}
    CheckStatus -->|❌ No| ErrorStatus["Error: Cannot assign<br/>non-PENDING orders"]
    ErrorStatus --> AdminView
    
    CheckStatus -->|✅ Yes| ChooseStaff["Choose Staff from list<br/>(role = WAREHOUSE)"]
    ChooseStaff --> ConfirmAssign["Confirm assignment"]
    
    ConfirmAssign --> UpdateOrder["Order.AssignedTo = staff_id"]
    UpdateOrder --> UpdateTasks["PickingTasks.AssignedTo<br/>= staff_id<br/>PickingTasks.Status = WAITING"]
    
    UpdateTasks --> NotifyStaff["Notify staff:<br/>'New order assigned'"]
    NotifyStaff --> StaffView["Staff thấy order trong<br/>danh sách /staff/tasks"]
    
    StaffView --> StaffClaim["Staff claim order"]
    StaffClaim --> End["✅ END - Ready to pick"]
```

---

# 2. SYSTEM ARCHITECTURE

## 2.1 🏗️ Backend Architecture

```mermaid
graph TB
    Client["🖥️ Frontend / PDA"]
    
    subgraph API["📡 API Layer"]
        Routes["Routes<br/>- /products<br/>- /inventory<br/>- /orders<br/>- /import-receipts<br/>- /staff<br/>- /users"]
        
        Handlers["Handlers<br/>- AuthHandler<br/>- ProductHandler<br/>- InventoryHandler<br/>- OrderHandler<br/>- ImportHandler<br/>- StaffHandler"]
        
        Middleware["Middleware<br/>- AuthRequired<br/>- RequireRoles<br/>- ErrorHandler"]
    end
    
    subgraph Business["🧠 Business Logic Layer"]
        Services["Services<br/>- AuthService<br/>- ProductService<br/>- InventoryService<br/>- OrderService<br/>- ImportService<br/>- StaffService"]
        
        Models["Domain Models<br/>- Product<br/>- Inventory<br/>- Order<br/>- PickingTask<br/>- ImportReceipt<br/>- StockTransaction"]
    end
    
    subgraph Data["💾 Data Layer"]
        Repos["Repositories<br/>- ProductRepo<br/>- InventoryRepo<br/>- OrderRepo<br/>- ImportRepo<br/>- StockTxRepo"]
        
        DB["PostgreSQL Database<br/>- products<br/>- inventory<br/>- orders<br/>- picking_tasks<br/>- import_receipts<br/>- stock_transactions<br/>- users"]
    end
    
    subgraph RealTime["⚡ Real-time"]
        WS["WebSocket Hub<br/>- Client connections<br/>- Event broadcasting"]
        Events["Events<br/>- TaskCreated<br/>- TaskCompleted<br/>- InventoryUpdated"]
    end
    
    Client -->|HTTP + JWT| API
    API -->|call| Business
    Business -->|query/insert| Data
    Business -->|broadcast| RealTime
    RealTime -->|send events| Client
    
    style API fill:#e1f5ff
    style Business fill:#f3e5f5
    style Data fill:#e8f5e9
    style RealTime fill:#fff3e0
```

## 2.2 🔐 Authentication Flow

```mermaid
graph LR
    A["Frontend<br/>Login Form"] -->|POST /auth/login<br/>username, password| B["AuthHandler"]
    B -->|call| C["AuthService"]
    C -->|query| D["UserRepository"]
    D -->|SELECT * FROM users| E["PostgreSQL"]
    E -->|return User| D
    D -->|return User| C
    C -->|hash password<br/>compare| F{"Valid<br/>password?"}
    F -->|❌ No| G["Return Error:<br/>Invalid credentials"]
    F -->|✅ Yes| H["Generate JWT<br/>Secret + claims"]
    H -->|return token| C
    C -->|return token| B
    B -->|JSON response<br/>access_token + user| A
    A -->|Store token<br/>localStorage| I["Frontend State"]
    I -->|Next requests:<br/>Authorization: Bearer token| J["API"]
    J -->|JWTVerifyMiddleware| K{"Token valid<br/>& not expired?"}
    K -->|❌ No| L["Return 401<br/>Clear token"]
    K -->|✅ Yes| M["Set context<br/>user_id, role"]
    M -->|Continue| N["Handler"]
    
    style A fill:#e3f2fd
    style B fill:#e8f5e9
    style I fill:#fff3e0
    style J fill:#f3e5f5
```

---

# 3. DATA FLOW DIAGRAMS

## 3.1 📥 Picking Data Flow

```mermaid
graph TD
    Start["START: Create Order"] --> OrderData["Order Data<br/>- order_code<br/>- customer_name<br/>- status=PENDING"]
    
    OrderData --> BOMData["BOM Data<br/>- bom_id<br/>- items[]"]
    
    BOMData --> CreateTasks["Create PickingTasks"]
    CreateTasks --> TaskData["PickingTask Data<br/>- order_id<br/>- product_id<br/>- tray_id<br/>- required_qty<br/>- status=WAITING"]
    
    TaskData --> ScanOrder["Staff scan Order QR"]
    ScanOrder --> UpdateStatus1["Order.Status<br/>= PICKING"]
    
    UpdateStatus1 --> ScanTray["Scan Tray QR"]
    ScanTray --> VerifyData["Verify:<br/>Tray matches task"]
    
    VerifyData --> ScanProduct["Scan Product QR"]
    ScanProduct --> LogData["Log Data<br/>- product_id<br/>- tray_id<br/>- qty=1"]
    
    LogData --> UpdateQty["PickingTask<br/>picked_qty += 1"]
    UpdateQty --> CheckDone{"Completed?"}
    
    CheckDone -->|No| ScanProduct
    CheckDone -->|Yes| TaskDone["PickingTask<br/>status = DONE"]
    
    TaskDone --> CreateTx["StockTransaction<br/>- type=EXPORT<br/>- product_id<br/>- tray_id<br/>- qty"]
    
    CreateTx --> UpdateInv["Inventory<br/>quantity -= qty"]
    
    UpdateInv --> AllDone{"All tasks<br/>done?"}
    AllDone -->|No| ScanTray
    AllDone -->|Yes| OrderDone["Order<br/>status = COMPLETED"]
    
    OrderDone --> End["✅ END"]
```

## 3.2 📤 Import Data Flow

```mermaid
graph TD
    Start["START: Create ImportReceipt"] --> ReceiptData["ImportReceipt Data<br/>- receipt_code<br/>- supplier_name<br/>- status=WAITING"]
    
    ReceiptData --> ItemData["ImportReceiptItem Data<br/>- product_id<br/>- qty<br/>- status=WAITING<br/>- assigned_to=null"]
    
    ItemData --> StaffClaim["Staff claim item"]
    StaffClaim --> UpdateStatus1["Item.Status<br/>= CLAIMED<br/>assigned_to = staff_id"]
    
    UpdateStatus1 --> StaffEnter["Staff enter:<br/>Product QR + Tray QR + Qty"]
    
    StaffEnter --> ValidateData["Validate:<br/>- Product exists<br/>- Tray exists<br/>- Product-Tray link"]
    
    ValidateData --> ConfirmItem["Item.Status<br/>= CONFIRMED"]
    
    ConfirmItem --> CreateInv["Create/Update<br/>Inventory<br/>quantity += qty"]
    
    CreateInv --> CreateTx["StockTransaction<br/>- type=IMPORT<br/>- product_id<br/>- tray_id<br/>- qty<br/>- reference=receipt_code"]
    
    CreateTx --> CheckAll{"All items<br/>confirmed?"}
    
    CheckAll -->|No| StaffClaim
    CheckAll -->|Yes| ApproveReceipt["ImportReceipt.Status<br/>= APPROVED"]
    
    ApproveReceipt --> End["✅ END"]
```

## 3.3 📊 Stock Taking Data Flow

```mermaid
graph TD
    Start["START: Stocktaking"] --> ScanTray["Staff scan Tray QR"]
    ScanTray --> GetInv["Get Inventory<br/>- product_id<br/>- quantity=system_qty"]
    
    GetInv --> ShowQty["Display:<br/>Product + System Qty"]
    
    ShowQty --> InputPhysical["Staff input<br/>physical_qty"]
    
    InputPhysical --> CalcDelta["Calculate:<br/>delta = physical - system"]
    
    CalcDelta --> CreateTx["StockTransaction<br/>- type=ADJUST<br/>- quantity=delta<br/>- before=system<br/>- after=physical"]
    
    CreateTx --> UpdateInv["Update Inventory<br/>quantity = physical_qty"]
    
    UpdateInv --> End["✅ END"]
```

---

# 4. ENTITY RELATIONSHIP DIAGRAM

```mermaid
erDiagram
    USERS ||--o{ PRODUCT : creates
    USERS ||--o{ ORDER : creates
    USERS ||--o{ PICKING_TASK : assigned_to
    USERS ||--o{ IMPORT_RECEIPT_ITEM : assigned_to
    USERS ||--o{ STOCK_TRANSACTION : created_by
    
    PRODUCT ||--o{ INVENTORY : has
    PRODUCT ||--o{ ORDER_ITEM : in
    PRODUCT ||--o{ PICKING_TASK : in
    PRODUCT ||--o{ IMPORT_RECEIPT_ITEM : in
    PRODUCT ||--o{ BOM_ITEM : is_component
    PRODUCT ||--o{ BOM : parent
    
    TRAY ||--o{ INVENTORY : contains
    TRAY ||--o{ LOCATION : located_in
    TRAY ||--o{ PICKING_TASK : stores
    
    LOCATION ||--o{ TRAY : has
    
    BOM ||--o{ BOM_ITEM : contains
    BOM ||--o{ ORDER : creates
    
    ORDER ||--o{ ORDER_ITEM : contains
    ORDER ||--o{ PICKING_TASK : generates
    
    PICKING_TASK ||--o{ PICK_LOG : records
    
    IMPORT_RECEIPT ||--o{ IMPORT_RECEIPT_ITEM : contains
    
    INVENTORY ||--o{ STOCK_TRANSACTION : records
```

---

# 5. STATE MACHINES

## 5.1 Order State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING: Create Order
    
    PENDING --> PICKING: Scan Order QR
    PENDING --> CANCELLED: Cancel
    
    PICKING --> PICKING: Scan products
    PICKING --> COMPLETED: All tasks done
    PICKING --> PENDING: Unassign/Reset
    
    COMPLETED --> [*]: Export
    CANCELLED --> [*]: End
```

## 5.2 Picking Task State Machine

```mermaid
stateDiagram-v2
    [*] --> WAITING: Create Task
    
    WAITING --> WAITING: Verify Tray
    WAITING --> PICKING: Start picking
    
    PICKING --> PICKING: Scan product
    PICKING --> DONE: Qty complete
    PICKING --> WAITING: Reset
    
    DONE --> [*]: Export
```

## 5.3 Import Receipt Item State Machine

```mermaid
stateDiagram-v2
    [*] --> WAITING: Create Item
    
    WAITING --> CLAIMED: Staff claim
    CLAIMED --> CONFIRMED: Staff enter + confirm
    CLAIMED --> WAITING: Unclaim
    
    CONFIRMED --> [*]: Approve Receipt
```

## 5.4 Inventory Status

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE: Create Initial Qty
    
    AVAILABLE --> AVAILABLE: Scan (Picking)
    AVAILABLE --> AVAILABLE: Putaway (Import)
    AVAILABLE --> AVAILABLE: Stocktaking (Adjust)
    
    AVAILABLE --> HELD: On Hold
    HELD --> AVAILABLE: Release Hold
    
    AVAILABLE --> [*]: Complete
```

---

# 6. API SEQUENCE DIAGRAMS

## 6.1 Picking Process Sequence

```mermaid
sequenceDiagram
    actor Staff as 👤 Staff
    participant Frontend as 📱 Frontend
    participant Backend as 🔧 Backend
    participant DB as 💾 Database
    
    Staff->>Frontend: 1. Scan Order QR
    Frontend->>Backend: GET /orders/scan/:qr_code
    Backend->>DB: Query order + picking_tasks
    DB-->>Backend: Return data
    Backend-->>Frontend: Order data + tasks list
    Frontend->>Staff: Show picking tasks
    
    Staff->>Frontend: 2. Scan Tray QR
    Frontend->>Backend: POST /picking-tasks/:id/verify-tray
    Backend->>DB: Verify tray matches task
    DB-->>Backend: ✓ Valid
    Backend-->>Frontend: ✓ Verified
    
    loop For each product
        Staff->>Frontend: 3. Scan Product QR
        Frontend->>Backend: POST /picking-tasks/:id/scan-product
        Backend->>DB: Verify product + increment qty
        DB-->>Backend: PickingTask updated
        Backend-->>Frontend: ✓ Scanned (8/10)
        Frontend->>Staff: Show progress
    end
    
    Staff->>Frontend: 4. All products scanned
    Frontend->>Backend: POST /orders/:id/finish
    Backend->>DB: Create StockTransaction EXPORT
    Backend->>DB: Update Inventory -= qty
    DB-->>Backend: ✓ Done
    Backend-->>Frontend: ✓ Order completed
    Frontend->>Staff: Show success
```

## 6.2 Import Process Sequence

```mermaid
sequenceDiagram
    actor Admin as 👤 Admin
    actor Staff as 👤 Staff
    participant Frontend as 📱 Frontend
    participant Backend as 🔧 Backend
    participant DB as 💾 Database
    
    Admin->>Frontend: 1. Create ImportReceipt
    Frontend->>Backend: POST /import-receipts
    Backend->>DB: Create receipt + items
    DB-->>Backend: ✓ Created
    Backend-->>Frontend: Receipt ID
    
    Staff->>Frontend: 2. Claim ImportReceiptItem
    Frontend->>Backend: POST /import-receipt-items/:id/claim
    Backend->>DB: Update item assigned_to
    DB-->>Backend: ✓ Claimed
    Backend-->>Frontend: ✓ Claimed
    
    Staff->>Frontend: 3. Confirm Putaway
    Frontend->>Backend: POST /import-receipt-items/:id/confirm
    Backend->>DB: Verify product + tray
    Backend->>DB: Create/Update Inventory
    Backend->>DB: Create StockTransaction IMPORT
    DB-->>Backend: ✓ Done
    Backend-->>Frontend: ✓ Confirmed
    
    Backend-->>Frontend: Check all items confirmed
    alt All confirmed
        Backend->>DB: Update ImportReceipt APPROVED
        DB-->>Backend: ✓
        Backend-->>Frontend: ✓ Import completed
    end
```

---

# 📋 QUICK REFERENCE

## Status Values

### Order Status
- `PENDING` → `PICKING` → `COMPLETED`
- Special: `CANCELLED`

### PickingTask Status
- `WAITING` → `PICKING` → `DONE`

### ImportReceipt Status
- `WAITING` → `PENDING` → `APPROVED`

### ImportReceiptItem Status
- `WAITING` → `CLAIMED` → `CONFIRMED`

### StockTransaction Type
- `IMPORT`: Nhập kho
- `EXPORT`: Xuất kho (picking)
- `ADJUST`: Điều chỉnh (stocktaking/manual)
- `ROLLBACK`: Hoàn tác (nếu cần)

## Key Validations

✅ **Product-Tray Link**: Tray phải được assign cho Product trước khi import  
✅ **PickingTask Verification**: Phải verify tray trước khi scan product  
✅ **Quantity Matching**: PickedQty phải bằng RequiredQty trước khi task DONE  
✅ **Unique Constraint**: Product Code, Tray Code, Location Code phải unique  
✅ **Inventory Logic**: Không thể negative quantity (ngoài ADJUST case)  

## Transaction Recording

```
PICKING:
  StockTransaction (EXPORT)
  PickLog (audit trail)
  
IMPORT:
  StockTransaction (IMPORT)
  ImportReceiptItem status update
  
STOCKTAKING:
  StockTransaction (ADJUST)
  
ADJUSTMENT:
  StockTransaction (ADJUST)
```

## Performance Metrics

```
PickingTask:
  - Completed tasks / total tasks
  - Average time per task
  - Error rate (incorrect product/tray scans)
  - Peak hours
  
StaffPerformance:
  - Tasks completed (picking + import)
  - Efficiency score
  - Quality metrics (errors)
  - Trend analysis
  
InventoryAccuracy:
  - Stocktaking adjustments
  - Variance %
  - Product-level accuracy
```
