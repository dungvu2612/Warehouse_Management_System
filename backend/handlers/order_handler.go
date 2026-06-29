package handlers

/*
Mo ta file:
- File nay la transport layer HTTP cho module 'order'.
- Trach nhiem: bind request, parse params, goi service, map domain error sang status code.

Luong xu ly:
1) Nhan request tu router va validate input o muc API.
2) Goi service use-case tuong ung.
3) Tra JSON response nhat quan cho frontend/PDA.

Cac ham chinh:
- NewOrderHandler
- parseOrderID
- parsePickingTaskID
- CreateOrder
- GetOrders
- GetOrderByID
- ScanOrderForPicking
- ConfirmPickingTask
- FinishOrder
- GetOrderPickingTasks
- GetOrderProgress

Luu y khi sua:
- Khong dua query DB vao handler; giu handler la transport-only de de test va de maintain.
*/

import (
	"errors"
	"net/http"
	"strconv"

	"quan_ly_kho/repositories"
	"quan_ly_kho/services"

	"github.com/labstack/echo/v4"
)

// OrderHandler xử lý transport layer cho module order/picking.
type OrderHandler struct {
	service services.OrderService
}

// NewOrderHandler khởi tạo handler order theo dependency injection.
func NewOrderHandler(service services.OrderService) *OrderHandler {
	return &OrderHandler{service: service}
}

// createOrderRequest là DTO request tạo order từ BOM.
type createOrderRequest struct {
	CustomerName    string             `json:"customer_name" binding:"required"`
	CustomerPhone   string             `json:"customer_phone"`
	CustomerAddress string             `json:"customer_address"`
	Items           []orderItemRequest `json:"items" binding:"required,min=1,dive"`
}

// scanOrderRequest là DTO request quét order_code.
type scanOrderRequest struct {
	OrderCode string `json:"order_code" binding:"required"`
}

type updateOrderRequest struct {
	CustomerName    string             `json:"customer_name" binding:"required"`
	CustomerPhone   string             `json:"customer_phone"`
	CustomerAddress string             `json:"customer_address"`
	Items           []orderItemRequest `json:"items" binding:"required,min=1,dive"`
}

type orderItemRequest struct {
	ProductID uint    `json:"product_id" binding:"required,gt=0"`
	Quantity  int     `json:"quantity" binding:"required,gt=0"`
	UnitPrice float64 `json:"unit_price" binding:"gte=0"`
}

type verifyTrayRequest struct {
	TrayQRCode string `json:"tray_qr_code" binding:"required"`
}

type scanProductRequest struct {
	TrayQRCode    string `json:"tray_qr_code" binding:"required"`
	ProductQRCode string `json:"product_qr_code" binding:"required"`
	Note          string `json:"note"`
}

type assignPickingOrderRequest struct {
	StaffID uint `json:"staff_id" binding:"required,gt=0"`
}

type previewShortageResponse struct {
	HasShortage bool                                      `json:"has_shortage"`
	Items       []services.OrderShortagePreviewItemResult `json:"items"`
}

func currentUser(c echo.Context) (uint, string) {
	userIDValue := c.Get("user_id")
	userID, _ := userIDValue.(uint)
	roleRaw := c.Get("role")
	role, _ := roleRaw.(string)
	return userID, role
}

func parseOrderID(c echo.Context) (uint, bool) {
	idRaw := c.Param("id")
	if idRaw == "" {
		idRaw = c.Param("order_id")
	}
	id, err := strconv.ParseUint(idRaw, 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "invalid order id"})
		return 0, false
	}
	return uint(id), true
}

func parsePickingTaskID(c echo.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "invalid picking task id"})
		return 0, false
	}
	return uint(id), true
}

func respondOrderReadError(c echo.Context, err error) {
	switch {
	case errors.Is(err, services.ErrOrderInvalidID):
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
	case errors.Is(err, repositories.ErrOrderEntityNotFound):
		c.JSON(http.StatusNotFound, echo.Map{"error": repositories.ErrOrderEntityNotFound.Error()})
	default:
		c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
}

func respondOrderDomainError(c echo.Context, status int, errorCode string, message string) {
	c.JSON(status, echo.Map{
		"error_code": errorCode,
		"error":      message,
	})
}

func respondPickingAssignmentError(c echo.Context, err error) bool {
	switch {
	case errors.Is(err, repositories.ErrPickingTaskAlreadyAssigned):
		respondOrderDomainError(c, http.StatusConflict, "TASK_ALREADY_ASSIGNED", "Công việc đã được nhân viên khác nhận")
	case errors.Is(err, repositories.ErrPickingTaskNotAssignedToYou):
		respondOrderDomainError(c, http.StatusForbidden, "TASK_NOT_ASSIGNED_TO_YOU", "Bạn không phải người phụ trách công việc này")
	case errors.Is(err, repositories.ErrPickingTaskNotClaimed):
		respondOrderDomainError(c, http.StatusForbidden, "TASK_NOT_CLAIMED", "Bạn cần nhận việc trước khi nhặt hàng")
	case errors.Is(err, repositories.ErrCannotUnassignAfterPicking):
		respondOrderDomainError(c, http.StatusConflict, "CANNOT_UNASSIGN_AFTER_PICKING", "Công việc đã có dữ liệu nhặt hàng, không thể gỡ phân công trực tiếp")
	case errors.Is(err, repositories.ErrCannotReassignAfterPicking):
		respondOrderDomainError(c, http.StatusConflict, "CANNOT_REASSIGN_AFTER_PICKING", "Công việc đã phát sinh dữ liệu nhặt hàng, không thể gán lại trực tiếp")
	case errors.Is(err, repositories.ErrStaffNotFound):
		respondOrderDomainError(c, http.StatusNotFound, "STAFF_NOT_FOUND", "Không tìm thấy nhân viên")
	case errors.Is(err, repositories.ErrInvalidStaffRole):
		respondOrderDomainError(c, http.StatusUnprocessableEntity, "INVALID_STAFF_ROLE", "Người được gán phải là nhân viên")
	case errors.Is(err, repositories.ErrOrderAlreadyCompleted), errors.Is(err, repositories.ErrOrderAlreadyCompletedCannotPick):
		respondOrderDomainError(c, http.StatusBadRequest, "ORDER_ALREADY_COMPLETED", "Đơn hàng đã hoàn thành")
	case errors.Is(err, repositories.ErrOrderCancelled):
		respondOrderDomainError(c, http.StatusBadRequest, "ORDER_CANCELLED", "Đơn hàng đã bị hủy")
	default:
		return false
	}
	return true
}

// CreateOrder tạo order từ BOM và sinh order_items theo machine_qty.
func (h *OrderHandler) CreateOrder(c echo.Context) {
	var req createOrderRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	userIDValue := c.Get("user_id")
	createdBy, _ := userIDValue.(uint)

	order, err := h.service.Create(services.OrderCreateInput{
		CustomerName:    req.CustomerName,
		CustomerPhone:   req.CustomerPhone,
		CustomerAddress: req.CustomerAddress,
		Items:           mapOrderItems(req.Items),
		CreatedBy:       createdBy,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderInvalidPayload):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error_code": "INVALID_ORDER_PAYLOAD", "error": err.Error()})
		case errors.Is(err, repositories.ErrOrderBOMNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error_code": "ORDER_BOM_NOT_FOUND", "error": "Sản phẩm thành phẩm chưa có BOM để tạo tác vụ nhặt hàng."})
		case errors.Is(err, repositories.ErrOrderBOMHasNoItems):
			c.JSON(http.StatusBadRequest, echo.Map{"error_code": "ORDER_BOM_HAS_NO_ITEMS", "error": "BOM của sản phẩm chưa có linh kiện."})
		case errors.Is(err, repositories.ErrOrderEntityNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error_code": "ORDER_PICKING_SOURCE_NOT_FOUND", "error": "Không tìm thấy sản phẩm hoặc khay đang hoạt động để tạo tác vụ nhặt hàng."})
		case errors.Is(err, repositories.ErrOrderHasNoItems):
			c.JSON(http.StatusBadRequest, echo.Map{"error_code": "ORDER_HAS_NO_PICKING_TASKS", "error": "Không tạo được tác vụ nhặt hàng cho đơn này."})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, order)
}

func (h *OrderHandler) PreviewOrderShortage(c echo.Context) {
	var req createOrderRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	result, err := h.service.PreviewShortage(services.OrderCreateInput{
		CustomerName:    req.CustomerName,
		CustomerPhone:   req.CustomerPhone,
		CustomerAddress: req.CustomerAddress,
		Items:           mapOrderItems(req.Items),
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderInvalidPayload):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error_code": "INVALID_ORDER_PAYLOAD", "error": err.Error()})
		case errors.Is(err, repositories.ErrOrderBOMNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error_code": "ORDER_BOM_NOT_FOUND", "error": "Sản phẩm thành phẩm chưa có BOM để tạo tác vụ nhặt hàng."})
		case errors.Is(err, repositories.ErrOrderBOMHasNoItems):
			c.JSON(http.StatusBadRequest, echo.Map{"error_code": "ORDER_BOM_HAS_NO_ITEMS", "error": "BOM của sản phẩm chưa có linh kiện."})
		case errors.Is(err, repositories.ErrOrderEntityNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error_code": "ORDER_PICKING_SOURCE_NOT_FOUND", "error": "Không tìm thấy sản phẩm hoặc khay đang hoạt động để tạo tác vụ nhặt hàng."})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, previewShortageResponse{
		HasShortage: result.HasShortage,
		Items:       result.Items,
	})
}

func (h *OrderHandler) UpdateOrder(c echo.Context) {
	orderID, ok := parseOrderID(c)
	if !ok {
		return
	}
	var req updateOrderRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	order, err := h.service.Update(services.OrderUpdateInput{
		OrderID:         orderID,
		CustomerName:    req.CustomerName,
		CustomerPhone:   req.CustomerPhone,
		CustomerAddress: req.CustomerAddress,
		Items:           mapOrderItems(req.Items),
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderInvalidID), errors.Is(err, services.ErrOrderInvalidPayload):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrOrderCannotEditNonPending):
			respondOrderDomainError(c, http.StatusBadRequest, "ORDER_ALREADY_PICKING_CANNOT_EDIT", err.Error())
		case errors.Is(err, repositories.ErrOrderEntityNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": repositories.ErrOrderEntityNotFound.Error()})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, order)
}

func mapOrderItems(items []orderItemRequest) []services.OrderItemInput {
	results := make([]services.OrderItemInput, 0, len(items))
	for _, item := range items {
		results = append(results, services.OrderItemInput{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			UnitPrice: item.UnitPrice,
		})
	}
	return results
}

func (h *OrderHandler) DeleteOrder(c echo.Context) {
	orderID, ok := parseOrderID(c)
	if !ok {
		return
	}
	if err := h.service.Delete(orderID); err != nil {
		switch {
		case errors.Is(err, services.ErrOrderInvalidID):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrOrderEntityNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": repositories.ErrOrderEntityNotFound.Error()})
		case errors.Is(err, repositories.ErrOrderCannotDelete):
			c.JSON(http.StatusConflict, echo.Map{"error": repositories.ErrOrderCannotDelete.Error()})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, echo.Map{"message": "order deleted"})
}

// GetOrders lấy danh sách orders, hỗ trợ filter status.
func (h *OrderHandler) GetOrders(c echo.Context) {
	orders, err := h.service.GetAll(c.QueryParam("status"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, orders)
}

// GetStaffTasks tra danh sach cong viec can picking cho staff.
func (h *OrderHandler) GetStaffTasks(c echo.Context) {
	userID, role := currentUser(c)
	rows, err := h.service.GetStaffTasks(services.StaffTaskQueryInput{
		UserID:      userID,
		CurrentRole: role,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

func (h *OrderHandler) GetStaffTaskSummary(c echo.Context) {
	userID, role := currentUser(c)
	summary, err := h.service.GetStaffTaskSummary(services.StaffTaskQueryInput{
		UserID:      userID,
		CurrentRole: role,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, summary)
}

func (h *OrderHandler) ClaimStaffOrder(c echo.Context) {
	orderID, ok := parseOrderID(c)
	if !ok {
		return
	}
	userID, _ := currentUser(c)
	order, err := h.service.ClaimOrder(services.ClaimOrderInput{
		OrderID: orderID,
		UserID:  userID,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderInvalidID):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrOrderEntityNotFound):
			respondOrderDomainError(c, http.StatusNotFound, "ORDER_NOT_FOUND", "Không tìm thấy đơn hàng")
		case errors.Is(err, repositories.ErrOrderHasNoItems):
			respondOrderDomainError(c, http.StatusBadRequest, "ORDER_HAS_NO_ITEMS", "Đơn hàng chưa có sản phẩm")
		default:
			if respondPickingAssignmentError(c, err) {
				return
			}
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, echo.Map{
		"message":     "Nhận việc thành công.",
		"order_id":    order.ID,
		"assigned_to": userID,
	})
}

func (h *OrderHandler) AdminAssignPickingOrder(c echo.Context) {
	orderID, ok := parseOrderID(c)
	if !ok {
		return
	}
	var req assignPickingOrderRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}
	order, err := h.service.AssignOrderToStaff(services.AdminAssignOrderInput{
		OrderID: orderID,
		StaffID: req.StaffID,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderInvalidPayload):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrOrderEntityNotFound):
			respondOrderDomainError(c, http.StatusNotFound, "ORDER_NOT_FOUND", "Không tìm thấy đơn hàng")
		default:
			if respondPickingAssignmentError(c, err) {
				return
			}
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, echo.Map{
		"message":     "Đã gán công việc cho nhân viên.",
		"order":       order,
		"assigned_to": req.StaffID,
	})
}

func (h *OrderHandler) AdminUnassignPickingOrder(c echo.Context) {
	orderID, ok := parseOrderID(c)
	if !ok {
		return
	}
	order, err := h.service.UnassignOrder(orderID)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderInvalidID):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrOrderEntityNotFound):
			respondOrderDomainError(c, http.StatusNotFound, "ORDER_NOT_FOUND", "Không tìm thấy đơn hàng")
		default:
			if respondPickingAssignmentError(c, err) {
				return
			}
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, echo.Map{
		"message": "Đã gỡ phân công công việc.",
		"order":   order,
	})
}

// GetOrderByID lấy chi tiết order kèm picking tasks/progress/shortage.
func (h *OrderHandler) GetOrderByID(c echo.Context) {
	orderID, ok := parseOrderID(c)
	if !ok {
		return
	}

	order, err := h.service.GetByID(orderID)
	if err != nil {
		respondOrderReadError(c, err)
		return
	}

	c.JSON(http.StatusOK, order)
}

// ScanOrderForPicking quét order_code để sinh tasks (nếu chưa có) và chuyển order sang PICKING.
func (h *OrderHandler) ScanOrderForPicking(c echo.Context) {
	var req scanOrderRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	userIDValue := c.Get("user_id")
	userID, _ := userIDValue.(uint)

	order, tasks, err := h.service.ScanForPicking(services.OrderScanInput{
		OrderCode: req.OrderCode,
		UserID:    userID,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderCodeIsRequired):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": services.ErrOrderCodeIsRequired.Error()})
		case errors.Is(err, repositories.ErrOrderEntityNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": repositories.ErrOrderEntityNotFound.Error()})
		case errors.Is(err, repositories.ErrOrderAlreadyClosed):
			c.JSON(http.StatusBadRequest, echo.Map{"error": "order already completed or cancelled"})
		case errors.Is(err, repositories.ErrOrderHasNoItems):
			c.JSON(http.StatusBadRequest, echo.Map{"error": repositories.ErrOrderHasNoItems.Error()})
		default:
			if respondPickingAssignmentError(c, err) {
				return
			}
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, echo.Map{
		"message": "Quét đơn thành công.",
		"order":   order,
		"tasks":   tasks,
	})
}

// ScanOrderForPickingByQRCode hỗ trợ luồng quét GET /orders/scan/:qr_code cho HT730 keyboard wedge.
func (h *OrderHandler) ScanOrderForPickingByQRCode(c echo.Context) {
	qrCode := c.Param("qr_code")

	userIDValue := c.Get("user_id")
	userID, _ := userIDValue.(uint)

	order, tasks, err := h.service.ScanForPicking(services.OrderScanInput{
		OrderCode: qrCode,
		UserID:    userID,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderCodeIsRequired):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": services.ErrOrderCodeIsRequired.Error()})
		case errors.Is(err, repositories.ErrOrderEntityNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": repositories.ErrOrderEntityNotFound.Error()})
		case errors.Is(err, repositories.ErrOrderAlreadyClosed):
			c.JSON(http.StatusBadRequest, echo.Map{"error": "order already completed or cancelled"})
		case errors.Is(err, repositories.ErrOrderHasNoItems):
			c.JSON(http.StatusBadRequest, echo.Map{"error": repositories.ErrOrderHasNoItems.Error()})
		default:
			if respondPickingAssignmentError(c, err) {
				return
			}
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, echo.Map{
		"message": "Quét đơn thành công.",
		"order":   order,
		"tasks":   tasks,
	})
}

// VerifyPickingTaskTray verify tray QR cho picking task.
func (h *OrderHandler) VerifyPickingTaskTray(c echo.Context) {
	taskID, ok := parsePickingTaskID(c)
	if !ok {
		return
	}

	var req verifyTrayRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	roleRaw := c.Get("role")
	currentRole, _ := roleRaw.(string)
	userIDValue := c.Get("user_id")
	userID, _ := userIDValue.(uint)

	task, err := h.service.VerifyTray(services.OrderVerifyTrayInput{
		TaskID:      taskID,
		TrayQRCode:  req.TrayQRCode,
		UserID:      userID,
		CurrentRole: currentRole,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderUnauthorizedRole):
			respondOrderDomainError(c, http.StatusForbidden, "UNAUTHORIZED", services.ErrOrderUnauthorizedRole.Error())
		case errors.Is(err, services.ErrOrderInvalidPickingTaskID):
			respondOrderDomainError(c, http.StatusUnprocessableEntity, "INVALID_PICKING_TASK_ID", err.Error())
		case errors.Is(err, services.ErrOrderTrayCodeRequired):
			respondOrderDomainError(c, http.StatusUnprocessableEntity, "TRAY_QR_REQUIRED", err.Error())
		case errors.Is(err, repositories.ErrConfirmTaskDependencyNotFound), errors.Is(err, repositories.ErrTrayQRNotFound):
			respondOrderDomainError(c, http.StatusNotFound, "TRAY_QR_NOT_FOUND", "tray qr not found")
		case errors.Is(err, repositories.ErrPickingTaskAlreadyDone):
			respondOrderDomainError(c, http.StatusBadRequest, "TASK_DONE", repositories.ErrPickingTaskAlreadyDone.Error())
		case errors.Is(err, repositories.ErrOrderAlreadyCompletedCannotPick):
			respondOrderDomainError(c, http.StatusBadRequest, "ORDER_COMPLETED", repositories.ErrOrderAlreadyCompletedCannotPick.Error())
		default:
			if respondPickingAssignmentError(c, err) {
				return
			}
			var wrongTrayErr repositories.OrderWrongTrayError
			if errors.As(err, &wrongTrayErr) {
				respondOrderDomainError(c, http.StatusBadRequest, "WRONG_TRAY", wrongTrayErr.Error())
				return
			}
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, echo.Map{
		"message": "Đã xác minh đúng khay.",
		"task":    task,
	})
}

// ScanProductForPickingTask scan product QR tung lan (quantity=1) va tru kho atomic.
func (h *OrderHandler) ScanProductForPickingTask(c echo.Context) {
	taskID, ok := parsePickingTaskID(c)
	if !ok {
		return
	}

	var req scanProductRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	userIDValue := c.Get("user_id")
	userID, _ := userIDValue.(uint)
	roleRaw := c.Get("role")
	currentRole, _ := roleRaw.(string)

	task, remaining, err := h.service.ScanProduct(services.OrderScanProductInput{
		TaskID:        taskID,
		TrayQRCode:    req.TrayQRCode,
		ProductQRCode: req.ProductQRCode,
		Note:          req.Note,
		UserID:        userID,
		CurrentRole:   currentRole,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderUnauthorizedRole):
			respondOrderDomainError(c, http.StatusForbidden, "UNAUTHORIZED", services.ErrOrderUnauthorizedRole.Error())
		case errors.Is(err, services.ErrOrderInvalidPickingTaskID):
			respondOrderDomainError(c, http.StatusUnprocessableEntity, "INVALID_PICKING_TASK_ID", err.Error())
		case errors.Is(err, services.ErrOrderTrayCodeRequired):
			respondOrderDomainError(c, http.StatusUnprocessableEntity, "TRAY_QR_REQUIRED", err.Error())
		case errors.Is(err, services.ErrOrderProductCodeRequired):
			respondOrderDomainError(c, http.StatusUnprocessableEntity, "PRODUCT_QR_REQUIRED", err.Error())
		case errors.Is(err, repositories.ErrPickingTaskAlreadyDone):
			respondOrderDomainError(c, http.StatusBadRequest, "TASK_DONE", repositories.ErrPickingTaskAlreadyDone.Error())
		case errors.Is(err, repositories.ErrOrderAlreadyCompletedCannotPick):
			respondOrderDomainError(c, http.StatusBadRequest, "ORDER_COMPLETED", repositories.ErrOrderAlreadyCompletedCannotPick.Error())
		case errors.Is(err, repositories.ErrOrderInsufficientStock):
			respondOrderDomainError(c, http.StatusConflict, "INSUFFICIENT_STOCK", repositories.ErrOrderInsufficientStock.Error())
		case errors.Is(err, repositories.ErrProductQRNotFound):
			respondOrderDomainError(c, http.StatusNotFound, "PRODUCT_QR_NOT_FOUND", repositories.ErrProductQRNotFound.Error())
		case errors.Is(err, repositories.ErrTrayQRNotFound), errors.Is(err, repositories.ErrConfirmTaskDependencyNotFound):
			respondOrderDomainError(c, http.StatusNotFound, "TRAY_QR_NOT_FOUND", "tray qr not found")
		case errors.Is(err, repositories.ErrPickingTaskWrongProduct):
			respondOrderDomainError(c, http.StatusBadRequest, "WRONG_PRODUCT", repositories.ErrPickingTaskWrongProduct.Error())
		default:
			if respondPickingAssignmentError(c, err) {
				return
			}
			var wrongTrayErr repositories.OrderWrongTrayError
			if errors.As(err, &wrongTrayErr) {
				respondOrderDomainError(c, http.StatusBadRequest, "WRONG_TRAY", wrongTrayErr.Error())
				return
			}
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, echo.Map{
		"message":            "Quét sản phẩm thành công.",
		"task":               task,
		"remaining_quantity": remaining,
	})
}

// FinishOrder kết thúc order thủ công và trả cảnh báo thiếu hàng nếu có.
func (h *OrderHandler) FinishOrder(c echo.Context) {
	orderID, ok := parseOrderID(c)
	if !ok {
		return
	}

	order, shortageItems, err := h.service.Finish(orderID)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderInvalidID):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrOrderEntityNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": repositories.ErrOrderEntityNotFound.Error()})
		case errors.Is(err, repositories.ErrOrderAlreadyCompleted):
			c.JSON(http.StatusBadRequest, echo.Map{"error": repositories.ErrOrderAlreadyCompleted.Error()})
		case errors.Is(err, repositories.ErrOrderCancelled):
			c.JSON(http.StatusBadRequest, echo.Map{"error": repositories.ErrOrderCancelled.Error()})
		case errors.Is(err, repositories.ErrOrderNotInPickingStatus):
			c.JSON(http.StatusBadRequest, echo.Map{"error": "order must be in PICKING status before finish"})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}

	if len(shortageItems) > 0 {
		items := make([]echo.Map, 0, len(shortageItems))
		for _, item := range shortageItems {
			items = append(items, echo.Map{
				"picking_task_id": item.PickingTaskID,
				"product_id":      item.ProductID,
				"required_qty":    item.RequiredQty,
				"picked_qty":      item.PickedQty,
				"missing_qty":     item.MissingQty,
			})
		}

		c.JSON(http.StatusOK, echo.Map{
			"message": "order completed with shortage",
			"order":   order,
			"shortage": echo.Map{
				"has_shortage": true,
				"items":        items,
			},
		})
		return
	}

	c.JSON(http.StatusOK, echo.Map{
		"message": "order completed successfully",
		"order":   order,
		"shortage": echo.Map{
			"has_shortage": false,
			"items":        []any{},
		},
	})
}

// GetOrderPickingTasks trả danh sách task của order để staff theo dõi.
func (h *OrderHandler) GetOrderPickingTasks(c echo.Context) {
	orderID, ok := parseOrderID(c)
	if !ok {
		return
	}

	order, tasks, err := h.service.GetPickingTasks(orderID)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderInvalidID):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrOrderEntityNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": repositories.ErrOrderEntityNotFound.Error()})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, echo.Map{
		"order_id": order.ID,
		"status":   order.Status,
		"tasks":    tasks,
	})
}

// GetOrderProgress trả done/total/progress (%) cho order hiện tại.
func (h *OrderHandler) GetOrderProgress(c echo.Context) {
	orderID, ok := parseOrderID(c)
	if !ok {
		return
	}

	progress, err := h.service.GetProgress(orderID)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderInvalidID):
			c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		case errors.Is(err, repositories.ErrOrderEntityNotFound):
			c.JSON(http.StatusNotFound, echo.Map{"error": repositories.ErrOrderEntityNotFound.Error()})
		default:
			c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, echo.Map{
		"order_id":     progress.OrderID,
		"order_status": progress.OrderStatus,
		"done_tasks":   progress.DoneTasks,
		"total_tasks":  progress.TotalTasks,
		"progress":     progress.Progress,
	})
}
