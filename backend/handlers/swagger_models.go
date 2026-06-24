package handlers

type DocErrorResponse struct {
	Error     string `json:"error" example:"invalid token"`
	ErrorCode string `json:"error_code,omitempty" example:"TASK_ALREADY_ASSIGNED"`
	Message   string `json:"message,omitempty" example:"Không thể xử lý yêu cầu."`
}

type DocSuccessResponse struct {
	Message string      `json:"message" example:"Thao tác thành công."`
	Data    interface{} `json:"data,omitempty"`
}

type DocLoginRequest struct {
	Username string `json:"username" example:"admin"`
	Password string `json:"password" example:"admin123"`
}

type DocAuthUser struct {
	ID       uint   `json:"id" example:"1"`
	Username string `json:"username" example:"admin"`
	FullName string `json:"full_name" example:"Administrator"`
	Role     string `json:"role" example:"ADMIN"`
}

type DocLoginResponse struct {
	AccessToken string      `json:"access_token" example:"Bearer JWT token"`
	User        DocAuthUser `json:"user"`
}

type DocUser struct {
	ID       uint   `json:"id" example:"1"`
	Username string `json:"username" example:"staff"`
	FullName string `json:"full_name" example:"Nhân viên kho"`
	Role     string `json:"role" example:"WAREHOUSE"`
	IsActive bool   `json:"is_active" example:"true"`
}

type DocCreateUserRequest struct {
	Username string `json:"username" example:"staff01"`
	Password string `json:"password" example:"staff123"`
	FullName string `json:"full_name" example:"Nhân viên kho 01"`
	Role     string `json:"role" example:"WAREHOUSE"`
}

type DocUpdateUserRequest struct {
	FullName string `json:"full_name" example:"Nhân viên kho 01"`
	Role     string `json:"role" example:"WAREHOUSE"`
	Password string `json:"password,omitempty" example:"staff123"`
}

type DocUpdateUserStatusRequest struct {
	IsActive bool `json:"is_active" example:"true"`
}

type DocProduct struct {
	ID               uint    `json:"id" example:"1"`
	ProductCode      string  `json:"product_code" example:"PRD-0001"`
	QRCode           string  `json:"qr_code" example:"PRD-0001"`
	ProductName      string  `json:"product_name" example:"Motor A"`
	ProductType      string  `json:"product_type" example:"COMPONENT"`
	ImageURL         string  `json:"image_url" example:"https://example.com/product.png"`
	Description      string  `json:"description" example:"Linh kiện sản xuất"`
	Unit             string  `json:"unit" example:"pcs"`
	MinStock         int     `json:"min_stock" example:"10"`
	Price            float64 `json:"price" example:"150000"`
	DifficultyWeight float64 `json:"difficulty_weight" example:"1.5"`
	IsActive         bool    `json:"is_active" example:"true"`
}

type DocProductRequest struct {
	ProductCode      string  `json:"product_code" example:"LK-MOTOR-001"`
	QRCode           string  `json:"qr_code" example:"QR-LK-MOTOR-001"`
	ProductName      string  `json:"product_name" example:"Motor A"`
	ProductType      string  `json:"product_type" example:"COMPONENT"`
	ImageURL         string  `json:"image_url" example:"https://example.com/product.png"`
	Description      string  `json:"description" example:"Linh kiện sản xuất"`
	Unit             string  `json:"unit" example:"pcs"`
	MinStock         int     `json:"min_stock" example:"10"`
	Price            float64 `json:"price" example:"150000"`
	DifficultyWeight float64 `json:"difficulty_weight" example:"1.5"`
}

type DocProductCodePreviewResponse struct {
	ProductCode string `json:"product_code" example:"COMP-0001"`
	QRCode      string `json:"qr_code" example:"COMP-0001"`
}

type DocLocation struct {
	ID           uint   `json:"id" example:"1"`
	LocationCode string `json:"location_code" example:"A-01"`
	Shelf        string `json:"shelf" example:"A"`
	Description  string `json:"description" example:"Kệ A hàng 01"`
	IsActive     bool   `json:"is_active" example:"true"`
}

type DocLocationRequest struct {
	LocationCode string `json:"location_code" example:"A-01"`
	Shelf        string `json:"shelf" example:"A"`
	Description  string `json:"description" example:"Kệ A hàng 01"`
}

type DocTray struct {
	ID          uint   `json:"id" example:"1"`
	TrayCode    string `json:"tray_code" example:"TRAY-A0102"`
	ProductID   uint   `json:"product_id" example:"1"`
	LocationID  uint   `json:"location_id" example:"1"`
	QRCode      string `json:"qr_code" example:"TRAY-A0102"`
	Description string `json:"description" example:"Khay linh kiện"`
	IsActive    bool   `json:"is_active" example:"true"`
}

type DocTrayRequest struct {
	TrayCode    string `json:"tray_code" example:"TRAY-A0102"`
	ProductID   uint   `json:"product_id" example:"1"`
	LocationID  uint   `json:"location_id" example:"1"`
	Description string `json:"description" example:"Khay linh kiện"`
}

type DocInventory struct {
	ID        uint `json:"id" example:"1"`
	ProductID uint `json:"product_id" example:"1"`
	TrayID    uint `json:"tray_id" example:"1"`
	Quantity  int  `json:"quantity" example:"100"`
}

type DocCreateInventoryRequest struct {
	ProductID uint `json:"product_id" example:"1"`
	TrayID    uint `json:"tray_id" example:"1"`
	Quantity  int  `json:"quantity" example:"100"`
}

type DocAdjustInventoryRequest struct {
	Delta int    `json:"delta" example:"10"`
	Note  string `json:"note" example:"Điều chỉnh kiểm kê"`
}

type DocAdjustByTrayRequest struct {
	TrayQRCode    string `json:"tray_qr_code" example:"TRAY-A0102"`
	Delta         int    `json:"delta" example:"5"`
	Note          string `json:"note" example:"Điều chỉnh nhanh"`
	ReferenceCode string `json:"reference_code" example:"ADJ-001"`
}

type DocPutawayRequest struct {
	ProductQRCode string `json:"product_qr_code" example:"PRD-0001"`
	TrayQRCode    string `json:"tray_qr_code" example:"TRAY-A0102"`
	Quantity      int    `json:"quantity" example:"20"`
	Note          string `json:"note" example:"Nhập kho bổ sung"`
	ReferenceCode string `json:"reference_code" example:"IMP-001"`
}

type DocStocktakingRequest struct {
	TrayQRCode    string `json:"tray_qr_code" example:"TRAY-A0102"`
	PhysicalQty   int    `json:"physical_qty" example:"95"`
	Note          string `json:"note" example:"Kiểm kê định kỳ"`
	ReferenceCode string `json:"reference_code" example:"STK-001"`
}

type DocRejectPutawayRequest struct {
	Reason string `json:"reason" example:"Sai thông tin khay"`
}

type DocImportReceiptItemRequest struct {
	ProductID uint `json:"product_id" example:"1"`
	Quantity  int  `json:"quantity" example:"50"`
}

type DocCreateImportReceiptRequest struct {
	SupplierName string                        `json:"supplier_name" example:"Nhà cung cấp A"`
	Note         string                        `json:"note" example:"Nhập lô tháng 6"`
	Items        []DocImportReceiptItemRequest `json:"items"`
}

type DocConfirmImportReceiptItemRequest struct {
	TrayCode string `json:"tray_code" example:"TRAY-A0102"`
	TrayID   uint   `json:"tray_id,omitempty" example:"1"`
	Quantity int    `json:"quantity" example:"50"`
	Note     string `json:"note" example:"Đã nhập đủ"`
}

type DocAssignImportReceiptItemRequest struct {
	StaffID uint `json:"staff_id" example:"2"`
}

type DocImportReceipt struct {
	ID           uint   `json:"id" example:"1"`
	ReceiptCode  string `json:"receipt_code" example:"IMP-123"`
	SupplierName string `json:"supplier_name" example:"Nhà cung cấp A"`
	Status       string `json:"status" example:"PENDING"`
	Note         string `json:"note" example:"Nhập lô tháng 6"`
}

type DocImportTask struct {
	ID               uint   `json:"id" example:"1"`
	ReceiptID        uint   `json:"receipt_id" example:"1"`
	ReceiptCode      string `json:"receipt_code" example:"IMP-123"`
	ProductID        uint   `json:"product_id" example:"1"`
	ProductCode      string `json:"product_code" example:"PRD-0001"`
	ProductName      string `json:"product_name" example:"Motor A"`
	ExpectedQuantity int    `json:"expected_quantity" example:"50"`
	ActualQuantity   int    `json:"actual_quantity" example:"0"`
	Status           string `json:"status" example:"WAITING"`
	AssignedTo       *uint  `json:"assigned_to,omitempty" example:"2"`
}

type DocOrderItemRequest struct {
	ProductID uint    `json:"product_id" example:"1"`
	Quantity  int     `json:"quantity" example:"2"`
	UnitPrice float64 `json:"unit_price" example:"150000"`
}

type DocOrderRequest struct {
	CustomerName    string                `json:"customer_name" example:"Khách hàng A"`
	CustomerPhone   string                `json:"customer_phone" example:"0900000000"`
	CustomerAddress string                `json:"customer_address" example:"Hà Nội"`
	Items           []DocOrderItemRequest `json:"items"`
}

type DocOrder struct {
	ID              uint    `json:"id" example:"1"`
	OrderCode       string  `json:"order_code" example:"ORD-123"`
	CustomerName    string  `json:"customer_name" example:"Khách hàng A"`
	CustomerPhone   string  `json:"customer_phone" example:"0900000000"`
	CustomerAddress string  `json:"customer_address" example:"Hà Nội"`
	Status          string  `json:"status" example:"PENDING"`
	TotalAmount     float64 `json:"total_amount" example:"300000"`
}

type DocScanOrderRequest struct {
	OrderCode string `json:"order_code" example:"ORD-123"`
}

type DocVerifyTrayRequest struct {
	TrayQRCode string `json:"tray_qr_code" example:"TRAY-A0102"`
}

type DocScanProductRequest struct {
	TrayQRCode    string `json:"tray_qr_code" example:"TRAY-A0102"`
	ProductQRCode string `json:"product_qr_code" example:"PRD-0001"`
	Note          string `json:"note" example:"Scan đúng hàng"`
}

type DocAssignPickingOrderRequest struct {
	StaffID uint `json:"staff_id" example:"2"`
}

type DocStaffTask struct {
	ID           uint   `json:"id" example:"1"`
	OrderCode    string `json:"order_code" example:"ORD-123"`
	CustomerName string `json:"customer_name" example:"Khách hàng A"`
	Status       string `json:"status" example:"WAITING"`
	TotalItems   int    `json:"total_items" example:"3"`
	PickedItems  int    `json:"picked_items" example:"0"`
	AssignedTo   *uint  `json:"assigned_to,omitempty" example:"2"`
}

type DocStaffTaskSummary struct {
	WaitingCount          int64 `json:"waiting_count" example:"4"`
	PickingCount          int64 `json:"picking_count" example:"2"`
	MyPickingCount        int64 `json:"my_picking_count" example:"1"`
	ImportWaitingCount    int64 `json:"import_waiting_count" example:"3"`
	ImportInProgressCount int64 `json:"import_in_progress_count" example:"1"`
}

type DocPickLog struct {
	ID        uint `json:"id" example:"1"`
	OrderID   uint `json:"order_id" example:"1"`
	ProductID uint `json:"product_id" example:"1"`
	TrayID    uint `json:"tray_id" example:"1"`
	Quantity  int  `json:"quantity" example:"2"`
	PickedBy  uint `json:"picked_by" example:"2"`
}

type DocStockTransaction struct {
	ID              uint   `json:"id" example:"1"`
	ProductID       uint   `json:"product_id" example:"1"`
	TrayID          uint   `json:"tray_id" example:"1"`
	TransactionType string `json:"transaction_type" example:"IMPORT"`
	Quantity        int    `json:"quantity" example:"20"`
	ReferenceCode   string `json:"reference_code" example:"IMP-123"`
	Note            string `json:"note" example:"Nhập kho"`
}

type DocDashboardStats struct {
	Role string `json:"role" example:"ADMIN"`
}

type DocAuditConsistency struct {
	OrderID   uint     `json:"order_id" example:"1"`
	IsValid   bool     `json:"is_valid" example:"true"`
	Issues    []string `json:"issues"`
	CheckedAt string   `json:"checked_at" example:"2026-06-09T10:00:00Z"`
}
