package handlers

// @Summary Kiểm tra trạng thái server
// @Description Public health check cho backend.
// @Tags Health
// @Produce json
// @Success 200 {object} DocSuccessResponse
// @Router /health [get]
func swaggerHealth() {}

// swaggerAuthLogin documents POST /auth/login.
// @Summary Đăng nhập
// @Description Đăng nhập bằng username/password và nhận JWT token.
// @Tags Auth
// @Accept json
// @Produce json
// @Param payload body DocLoginRequest true "Thông tin đăng nhập"
// @Success 200 {object} DocLoginResponse
// @Failure 401 {object} DocErrorResponse
// @Failure 422 {object} DocErrorResponse
// @Router /auth/login [post]
func swaggerAuthLogin() {}

// @Summary Danh sách người dùng
// @Description ADMIN xem danh sách tài khoản, có thể lọc theo search, role, is_active.
// @Tags Users
// @Security BearerAuth
// @Produce json
// @Param search query string false "Từ khóa tìm kiếm"
// @Param role query string false "Vai trò ADMIN hoặc WAREHOUSE/STAFF"
// @Param is_active query bool false "Trạng thái hoạt động"
// @Success 200 {array} DocUser
// @Failure 401 {object} DocErrorResponse
// @Failure 403 {object} DocErrorResponse
// @Router /users [get]
func swaggerGetUsers() {}

// @Summary Chi tiết người dùng
// @Description ADMIN xem chi tiết một tài khoản.
// @Tags Users
// @Security BearerAuth
// @Produce json
// @Param id path int true "ID người dùng"
// @Success 200 {object} DocUser
// @Failure 404 {object} DocErrorResponse
// @Router /users/{id} [get]
func swaggerGetUserByID() {}

// @Summary Tạo tài khoản
// @Description ADMIN tạo tài khoản nhân viên hoặc admin.
// @Tags Users
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param payload body DocCreateUserRequest true "Thông tin tài khoản"
// @Success 201 {object} DocUser
// @Failure 409 {object} DocErrorResponse
// @Failure 422 {object} DocErrorResponse
// @Router /users [post]
func swaggerCreateUser() {}

// @Summary Cập nhật tài khoản
// @Description ADMIN cập nhật thông tin tài khoản.
// @Tags Users
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "ID người dùng"
// @Param payload body DocUpdateUserRequest true "Thông tin cập nhật"
// @Success 200 {object} DocUser
// @Failure 404 {object} DocErrorResponse
// @Router /users/{id} [put]
func swaggerUpdateUser() {}

// @Summary Khóa hoặc mở tài khoản
// @Description ADMIN cập nhật trạng thái hoạt động của tài khoản.
// @Tags Users
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "ID người dùng"
// @Param payload body DocUpdateUserStatusRequest true "Trạng thái mới"
// @Success 200 {object} DocUser
// @Failure 409 {object} DocErrorResponse
// @Router /users/{id}/status [patch]
func swaggerUpdateUserStatus() {}

// @Summary Xóa tài khoản
// @Description ADMIN xóa tài khoản nếu không vi phạm rule nghiệp vụ.
// @Tags Users
// @Security BearerAuth
// @Produce json
// @Param id path int true "ID người dùng"
// @Success 200 {object} DocSuccessResponse
// @Failure 409 {object} DocErrorResponse
// @Router /users/{id} [delete]
func swaggerDeleteUser() {}

// @Summary Danh sách sản phẩm
// @Description Lấy danh sách sản phẩm đang quản lý.
// @Tags Products
// @Security BearerAuth
// @Produce json
// @Success 200 {array} DocProduct
// @Router /products [get]
func swaggerGetProducts() {}

// @Summary Xem trước mã sản phẩm
// @Description Sinh preview product_code/qr_code theo loại và tên sản phẩm.
// @Tags Products
// @Security BearerAuth
// @Produce json
// @Param product_type query string false "Loại sản phẩm COMPONENT hoặc FINISHED_GOOD"
// @Param product_name query string false "Tên sản phẩm"
// @Success 200 {object} DocProductCodePreviewResponse
// @Router /products/code-preview [get]
func swaggerProductCodePreview() {}

// @Summary Quét QR sản phẩm
// @Description Tra cứu sản phẩm và tồn/kệ liên quan bằng QR sản phẩm.
// @Tags Products
// @Security BearerAuth
// @Produce json
// @Param qr_code path string true "QR sản phẩm"
// @Success 200 {object} DocProduct
// @Failure 404 {object} DocErrorResponse
// @Router /products/scan/{qr_code} [get]
func swaggerScanProduct() {}

// @Summary Chi tiết sản phẩm
// @Tags Products
// @Security BearerAuth
// @Produce json
// @Param id path int true "ID sản phẩm"
// @Success 200 {object} DocProduct
// @Failure 404 {object} DocErrorResponse
// @Router /products/{id} [get]
func swaggerGetProductByID() {}

// @Summary Tạo sản phẩm
// @Description ADMIN tạo sản phẩm mới.
// @Tags Products
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param payload body DocProductRequest true "Thông tin sản phẩm"
// @Success 201 {object} DocProduct
// @Failure 422 {object} DocErrorResponse
// @Router /products [post]
func swaggerCreateProduct() {}

// @Summary Cập nhật sản phẩm
// @Tags Products
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "ID sản phẩm"
// @Param payload body DocProductRequest true "Thông tin sản phẩm"
// @Success 200 {object} DocProduct
// @Router /products/{id} [put]
func swaggerUpdateProduct() {}

// @Summary Ngừng kích hoạt sản phẩm
// @Description ADMIN deactivate sản phẩm, không xóa vật lý.
// @Tags Products
// @Security BearerAuth
// @Produce json
// @Param id path int true "ID sản phẩm"
// @Success 200 {object} DocSuccessResponse
// @Router /products/{id} [delete]
func swaggerDeleteProduct() {}

// @Summary Danh sách vị trí
// @Tags Locations
// @Security BearerAuth
// @Produce json
// @Success 200 {array} DocLocation
// @Router /locations [get]
func swaggerGetLocations() {}

// @Summary Danh sách khay trong vị trí
// @Tags Locations
// @Security BearerAuth
// @Produce json
// @Param id path int true "ID vị trí"
// @Success 200 {object} interface{}
// @Router /locations/{id}/trays [get]
func swaggerGetLocationTrays() {}

// @Summary Tạo vị trí
// @Tags Locations
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param payload body DocLocationRequest true "Thông tin vị trí"
// @Success 201 {object} DocLocation
// @Router /locations [post]
func swaggerCreateLocation() {}

// @Summary Cập nhật vị trí
// @Tags Locations
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "ID vị trí"
// @Param payload body DocLocationRequest true "Thông tin vị trí"
// @Success 200 {object} DocLocation
// @Router /locations/{id} [put]
func swaggerUpdateLocation() {}

// @Summary Ngừng kích hoạt vị trí
// @Tags Locations
// @Security BearerAuth
// @Produce json
// @Param id path int true "ID vị trí"
// @Success 200 {object} DocSuccessResponse
// @Router /locations/{id} [delete]
func swaggerDeleteLocation() {}

// @Summary Danh sách khay
// @Tags Trays
// @Security BearerAuth
// @Produce json
// @Success 200 {array} DocTray
// @Router /trays [get]
func swaggerGetTrays() {}

// @Summary Quét QR khay
// @Description Tra cứu khay, vị trí và tồn kho trong khay bằng QR.
// @Tags Trays
// @Security BearerAuth
// @Produce json
// @Param qr_code path string true "QR khay"
// @Success 200 {object} DocTray
// @Router /trays/scan/{qr_code} [get]
func swaggerScanTray() {}

// @Summary Tạo khay
// @Tags Trays
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param payload body DocTrayRequest true "Thông tin khay"
// @Success 201 {object} DocTray
// @Router /trays [post]
func swaggerCreateTray() {}

// @Summary Cập nhật khay
// @Tags Trays
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "ID khay"
// @Param payload body DocTrayRequest true "Thông tin khay"
// @Success 200 {object} DocTray
// @Router /trays/{id} [put]
func swaggerUpdateTray() {}

// @Summary Ngừng kích hoạt khay
// @Tags Trays
// @Security BearerAuth
// @Produce json
// @Param id path int true "ID khay"
// @Success 200 {object} DocSuccessResponse
// @Router /trays/{id} [delete]
func swaggerDeleteTray() {}

// @Summary Danh sách tồn kho
// @Description Xem tồn kho theo sản phẩm/khay.
// @Tags Inventory
// @Security BearerAuth
// @Produce json
// @Param product_id query int false "ID sản phẩm"
// @Param tray_id query int false "ID khay"
// @Success 200 {array} DocInventory
// @Router /inventory [get]
func swaggerGetInventory() {}

// @Summary Tạo tồn kho ban đầu
// @Tags Inventory
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param payload body DocCreateInventoryRequest true "Thông tin tồn kho"
// @Success 201 {object} DocInventory
// @Router /inventory [post]
func swaggerCreateInventory() {}

// @Summary Điều chỉnh tồn kho
// @Tags Inventory
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "ID tồn kho"
// @Param payload body DocAdjustInventoryRequest true "Thông tin điều chỉnh"
// @Success 200 {object} DocSuccessResponse
// @Router /inventory/{id}/adjust [patch]
func swaggerAdjustInventory() {}

// @Summary Điều chỉnh tồn bằng QR khay
// @Tags Inventory
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param payload body DocAdjustByTrayRequest true "Thông tin điều chỉnh theo khay"
// @Success 200 {object} DocSuccessResponse
// @Router /inventory/adjust-by-tray [post]
func swaggerAdjustByTray() {}

// @Summary Nhập kho nhanh bằng QR
// @Description Nhập kho theo QR sản phẩm và QR khay, cộng tồn và ghi stock transaction IMPORT.
// @Tags Inventory
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param payload body DocPutawayRequest true "Thông tin nhập kho"
// @Success 200 {object} DocSuccessResponse
// @Router /inventory/putaway [post]
func swaggerPutaway() {}

// @Summary Danh sách yêu cầu putaway legacy
// @Tags Inventory
// @Security BearerAuth
// @Produce json
// @Param status query string false "Trạng thái yêu cầu"
// @Success 200 {array} interface{}
// @Router /inventory/putaway-requests [get]
func swaggerGetPutawayRequests() {}

// @Summary Duyệt yêu cầu putaway legacy
// @Tags Inventory
// @Security BearerAuth
// @Produce json
// @Param id path int true "ID yêu cầu"
// @Success 200 {object} DocSuccessResponse
// @Router /inventory/putaway-requests/{id}/approve [post]
func swaggerApprovePutawayRequest() {}

// @Summary Từ chối yêu cầu putaway legacy
// @Tags Inventory
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "ID yêu cầu"
// @Param payload body DocRejectPutawayRequest true "Lý do từ chối"
// @Success 200 {object} DocSuccessResponse
// @Router /inventory/putaway-requests/{id}/reject [post]
func swaggerRejectPutawayRequest() {}

// @Summary Kiểm kê nhanh bằng QR khay
// @Tags Inventory
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param payload body DocStocktakingRequest true "Thông tin kiểm kê"
// @Success 200 {object} DocSuccessResponse
// @Router /inventory/stocktaking [post]
func swaggerStocktaking() {}

// @Summary Danh sách phiếu nhập
// @Tags Import Receipts
// @Security BearerAuth
// @Produce json
// @Success 200 {array} DocImportReceipt
// @Router /import-receipts [get]
func swaggerGetImportReceipts() {}

// @Summary Chi tiết phiếu nhập
// @Tags Import Receipts
// @Security BearerAuth
// @Produce json
// @Param id path int true "ID phiếu nhập"
// @Success 200 {object} DocImportReceipt
// @Router /import-receipts/{id} [get]
func swaggerGetImportReceiptByID() {}

// @Summary Tạo phiếu nhập
// @Description ADMIN tạo phiếu nhập kế hoạch; các dòng item trở thành công việc nhập kho cho STAFF.
// @Tags Import Receipts
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param payload body DocCreateImportReceiptRequest true "Thông tin phiếu nhập"
// @Success 201 {object} DocSuccessResponse
// @Router /import-receipts [post]
func swaggerCreateImportReceipt() {}

// @Summary Danh sách task nhập kho
// @Description STAFF xem các dòng phiếu nhập chờ nhận hoặc đang được phân công.
// @Tags Import Receipts
// @Security BearerAuth
// @Produce json
// @Success 200 {array} DocImportTask
// @Router /staff/import-receipt-items [get]
func swaggerGetStaffImportTasks() {}

// @Summary Tổng quan task nhập kho
// @Tags Import Receipts
// @Security BearerAuth
// @Produce json
// @Success 200 {object} DocStaffTaskSummary
// @Router /staff/import-receipt-items/summary [get]
func swaggerGetImportTaskSummary() {}

// @Summary Nhận task nhập kho
// @Tags Import Receipts
// @Security BearerAuth
// @Produce json
// @Param item_id path int true "ID dòng phiếu nhập"
// @Success 200 {object} DocSuccessResponse
// @Router /staff/import-receipt-items/{item_id}/claim [post]
func swaggerClaimImportReceiptItem() {}

// @Summary Xác nhận nhập kho cho task
// @Description STAFF quét QR khay và nhập số lượng thực nhập; backend cộng inventory và ghi transaction IMPORT.
// @Tags Import Receipts
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param item_id path int true "ID dòng phiếu nhập"
// @Param payload body DocConfirmImportReceiptItemRequest true "Thông tin thực nhập"
// @Success 200 {object} DocSuccessResponse
// @Router /staff/import-receipt-items/{item_id}/confirm [post]
func swaggerConfirmImportReceiptItem() {}

// @Summary ADMIN gán task nhập kho
// @Tags Import Receipts
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param item_id path int true "ID dòng phiếu nhập"
// @Param payload body DocAssignImportReceiptItemRequest true "Nhân viên được gán"
// @Success 200 {object} DocSuccessResponse
// @Router /admin/import-receipt-items/{item_id}/assign [patch]
func swaggerAssignImportReceiptItem() {}

// @Summary ADMIN gỡ phân công task nhập kho
// @Tags Import Receipts
// @Security BearerAuth
// @Produce json
// @Param item_id path int true "ID dòng phiếu nhập"
// @Success 200 {object} DocSuccessResponse
// @Router /admin/import-receipt-items/{item_id}/unassign [patch]
func swaggerUnassignImportReceiptItem() {}

// @Summary Danh sách đơn hàng
// @Tags Orders
// @Security BearerAuth
// @Produce json
// @Param status query string false "Trạng thái PENDING/PICKING/COMPLETED/CANCELLED"
// @Success 200 {array} DocOrder
// @Router /orders [get]
func swaggerGetOrders() {}

// @Summary Chi tiết đơn hàng
// @Tags Orders
// @Security BearerAuth
// @Produce json
// @Param id path int true "ID đơn hàng"
// @Success 200 {object} DocOrder
// @Router /orders/{id} [get]
func swaggerGetOrderByID() {}

// @Summary Tạo đơn hàng
// @Description ADMIN tạo đơn hàng từ danh sách sản phẩm/BOM; backend sinh task picking theo nghiệp vụ hiện tại.
// @Tags Orders
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param payload body DocOrderRequest true "Thông tin đơn hàng"
// @Success 201 {object} DocOrder
// @Router /orders [post]
func swaggerCreateOrder() {}

// @Summary Cập nhật đơn hàng
// @Tags Orders
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "ID đơn hàng"
// @Param payload body DocOrderRequest true "Thông tin đơn hàng"
// @Success 200 {object} DocOrder
// @Router /orders/{id} [put]
func swaggerUpdateOrder() {}

// @Summary Xóa/hủy đơn hàng
// @Tags Orders
// @Security BearerAuth
// @Produce json
// @Param id path int true "ID đơn hàng"
// @Success 200 {object} DocSuccessResponse
// @Router /orders/{id} [delete]
func swaggerDeleteOrder() {}

// @Summary Quét đơn để picking
// @Tags Picking
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param payload body DocScanOrderRequest true "Mã đơn"
// @Success 200 {object} DocSuccessResponse
// @Router /orders/scan [post]
func swaggerScanOrderForPicking() {}

// @Summary Quét QR đơn để picking
// @Tags Picking
// @Security BearerAuth
// @Produce json
// @Param qr_code path string true "QR/mã đơn"
// @Success 200 {object} DocSuccessResponse
// @Router /orders/scan/{qr_code} [get]
func swaggerScanOrderForPickingByQRCode() {}

// @Summary Xác nhận QR khay cho picking task
// @Tags Picking
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "ID picking task"
// @Param payload body DocVerifyTrayRequest true "QR khay"
// @Success 200 {object} DocSuccessResponse
// @Router /orders/picking-tasks/{id}/verify-tray [post]
func swaggerVerifyPickingTaskTray() {}

// @Summary Quét sản phẩm cho picking task
// @Description Khi scan đúng, backend cập nhật picked_quantity, trừ inventory, ghi pick_logs và stock_transactions EXPORT.
// @Tags Picking
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "ID picking task"
// @Param payload body DocScanProductRequest true "QR khay và QR sản phẩm"
// @Success 200 {object} DocSuccessResponse
// @Router /orders/picking-tasks/{id}/scan-product [post]
func swaggerScanProductForPickingTask() {}

// @Summary Hoàn tất đơn hàng
// @Tags Picking
// @Security BearerAuth
// @Produce json
// @Param id path int true "ID đơn hàng"
// @Success 200 {object} DocSuccessResponse
// @Router /orders/{id}/finish [post]
func swaggerFinishOrder() {}

// @Summary Danh sách picking task của đơn
// @Tags Picking
// @Security BearerAuth
// @Produce json
// @Param id path int true "ID đơn hàng"
// @Success 200 {object} DocSuccessResponse
// @Router /orders/{id}/picking-tasks [get]
func swaggerGetOrderPickingTasks() {}

// @Summary Tiến độ picking của đơn
// @Tags Picking
// @Security BearerAuth
// @Produce json
// @Param id path int true "ID đơn hàng"
// @Success 200 {object} DocSuccessResponse
// @Router /orders/{id}/progress [get]
func swaggerGetOrderProgress() {}

// @Summary Danh sách tác vụ staff
// @Description STAFF xem đơn chờ nhận hoặc đang picking.
// @Tags Staff Tasks
// @Security BearerAuth
// @Produce json
// @Success 200 {array} DocStaffTask
// @Router /staff/tasks [get]
func swaggerGetStaffTasks() {}

// @Summary Tổng quan tác vụ staff
// @Tags Staff Tasks
// @Security BearerAuth
// @Produce json
// @Success 200 {object} DocStaffTaskSummary
// @Router /staff/task-summary [get]
func swaggerGetStaffTaskSummary() {}

// @Summary STAFF nhận đơn picking
// @Description Một order chỉ có một nhân viên phụ trách tại một thời điểm theo rule hiện tại.
// @Tags Staff Tasks
// @Security BearerAuth
// @Produce json
// @Param order_id path int true "ID đơn hàng"
// @Success 200 {object} DocSuccessResponse
// @Router /staff/orders/{order_id}/claim [post]
func swaggerClaimStaffOrder() {}

// @Summary ADMIN gán đơn picking cho nhân viên
// @Tags Admin Picking
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param order_id path int true "ID đơn hàng"
// @Param payload body DocAssignPickingOrderRequest true "Nhân viên được gán"
// @Success 200 {object} DocSuccessResponse
// @Router /admin/picking/orders/{order_id}/assign [patch]
func swaggerAdminAssignPickingOrder() {}

// @Summary ADMIN gỡ phân công đơn picking
// @Description Chỉ gỡ nếu chưa phát sinh dữ liệu picking theo rule backend.
// @Tags Admin Picking
// @Security BearerAuth
// @Produce json
// @Param order_id path int true "ID đơn hàng"
// @Success 200 {object} DocSuccessResponse
// @Router /admin/picking/orders/{order_id}/unassign [patch]
func swaggerAdminUnassignPickingOrder() {}

// @Summary Lịch sử nhặt hàng
// @Tags Pick Logs
// @Security BearerAuth
// @Produce json
// @Param order_id query int false "ID đơn hàng"
// @Param picked_by query int false "ID nhân viên"
// @Param date_from query string false "Ngày bắt đầu"
// @Param date_to query string false "Ngày kết thúc"
// @Param limit query int false "Số dòng tối đa"
// @Success 200 {array} DocPickLog
// @Router /pick-logs [get]
func swaggerGetPickLogs() {}

// @Summary Lịch sử biến động kho
// @Description Xem stock_transactions IMPORT/EXPORT/ADJUST/ROLLBACK.
// @Tags Stock Transactions
// @Security BearerAuth
// @Produce json
// @Param product_id query int false "ID sản phẩm"
// @Param tray_id query int false "ID khay"
// @Param created_by query int false "ID người tạo"
// @Param transaction_type query string false "IMPORT/EXPORT/ADJUST/ROLLBACK"
// @Param limit query int false "Số dòng tối đa"
// @Success 200 {array} DocStockTransaction
// @Router /stock-transactions [get]
func swaggerGetStockTransactions() {}

// @Summary Dashboard thống kê
// @Description Thống kê dashboard theo role hiện tại.
// @Tags Dashboard
// @Security BearerAuth
// @Produce json
// @Success 200 {object} DocDashboardStats
// @Router /dashboard/stats [get]
func swaggerDashboardStats() {}

// @Summary Kiểm tra nhất quán đơn hàng
// @Description Kiểm tra sai lệch order/picking/stock cho một đơn hàng.
// @Tags Audit
// @Security BearerAuth
// @Produce json
// @Param order_id path int true "ID đơn hàng"
// @Success 200 {object} DocAuditConsistency
// @Router /audit/consistency/{order_id} [get]
func swaggerAuditConsistency() {}
