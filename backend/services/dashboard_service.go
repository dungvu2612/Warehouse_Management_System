package services

/*
Senior Handover Note:
- Purpose: Business layer cho Dashboard role-based, tach du lieu admin revenue va warehouse operations.
- Dependencies: Dashboard repository + role normalize tu auth middleware.
- API contract: GET /dashboard/stats tra payload gom `role`, `admin_revenue`, `warehouse_operations`.
- Role access: ADMIN nhan du ca 2 khoi; WAREHOUSE/VIEWER chi nhan warehouse block.
- Maintenance notes: Khong de component frontend tu suy dien role; contract da quyet dinh tai day.
*/

import (
	"errors"
	"strings"

	"quan_ly_kho/repositories"
)

var ErrDashboardForbiddenRole = errors.New("role is not allowed for dashboard")

type DashboardRevenueSeriesItem struct {
	Date    string  `json:"date"`
	Revenue float64 `json:"revenue"`
}

type DashboardOrderStatusItem struct {
	Status string `json:"status"`
	Count  int64  `json:"count"`
}

type DashboardTopFinishedProductItem struct {
	ProductID     uint    `json:"product_id"`
	ProductCode   string  `json:"product_code"`
	ProductName   string  `json:"product_name"`
	QuantitySold  int64   `json:"quantity_sold"`
	RevenueAmount float64 `json:"revenue_amount"`
}

type DashboardRecentCompletedOrderItem struct {
	OrderCode    string  `json:"order_code"`
	CustomerName string  `json:"customer_name"`
	TotalAmount  float64 `json:"total_amount"`
	CompletedAt  string  `json:"completed_at"`
	UpdatedAt    string  `json:"updated_at"`
}

type DashboardAdminRevenue struct {
	TotalRevenue          float64                             `json:"total_revenue"`
	RevenueToday          float64                             `json:"revenue_today"`
	RevenueThisMonth      float64                             `json:"revenue_this_month"`
	CompletedOrders       int64                               `json:"completed_orders"`
	AverageOrderValue     float64                             `json:"average_order_value"`
	RevenueSeries         []DashboardRevenueSeriesItem        `json:"revenue_series"`
	OrderStatusSummary    []DashboardOrderStatusItem          `json:"order_status_summary"`
	TopFinishedProducts   []DashboardTopFinishedProductItem   `json:"top_finished_products"`
	RecentCompletedOrders []DashboardRecentCompletedOrderItem `json:"recent_completed_orders"`
}

type DashboardWarehouseAlert struct {
	AlertType       string `json:"alert_type"`
	Severity        string `json:"severity"`
	ProductID       uint   `json:"product_id"`
	ProductCode     string `json:"product_code"`
	ProductName     string `json:"product_name"`
	CurrentQuantity int64  `json:"current_quantity"`
	MinStock        int64  `json:"min_stock"`
	Message         string `json:"message"`
}

type DashboardPickingMonitor struct {
	WaitingTasks       int64                               `json:"waiting_tasks"`
	PickingTasks       int64                               `json:"picking_tasks"`
	DoneTasks          int64                               `json:"done_tasks"`
	RecentPickingTasks []repositories.RecentPickingTaskRow `json:"recent_picking_tasks"`
}

type DashboardInventoryHealth struct {
	HealthyProducts    int64 `json:"healthy_products"`
	LowStockProducts   int64 `json:"low_stock_products"`
	OutOfStockProducts int64 `json:"out_of_stock_products"`
}

type DashboardWarehouseOperations struct {
	PendingOrders          int64                                     `json:"pending_orders"`
	PickingOrders          int64                                     `json:"picking_orders"`
	CompletedToday         int64                                     `json:"completed_today"`
	LowStockProducts       int64                                     `json:"low_stock_products"`
	TotalInventoryQuantity int64                                     `json:"total_inventory_quantity"`
	ActiveTrays            int64                                     `json:"active_trays"`
	WarehouseAlerts        []DashboardWarehouseAlert                 `json:"warehouse_alerts"`
	PickingMonitor         DashboardPickingMonitor                   `json:"picking_monitor"`
	RecentActivities       []repositories.RecentWarehouseActivityRow `json:"recent_activities"`
	RecentOrders           []repositories.RecentOrderRow             `json:"recent_orders"`
	InventoryHealth        DashboardInventoryHealth                  `json:"inventory_health"`
	TopMovingProducts      []repositories.TopMovingProductRow        `json:"top_moving_products"`
}

type DashboardStatsResponse struct {
	Role                string                       `json:"role"`
	AdminRevenue        *DashboardAdminRevenue       `json:"admin_revenue"`
	WarehouseOperations DashboardWarehouseOperations `json:"warehouse_operations"`
}

type DashboardService interface {
	GetStatsByRole(role string) (*DashboardStatsResponse, error)
}

type dashboardService struct {
	repo repositories.DashboardRepository
}

func NewDashboardService(repo repositories.DashboardRepository) DashboardService {
	return &dashboardService{repo: repo}
}

func normalizeDashboardRole(role string) string {
	normalized := strings.ToUpper(strings.TrimSpace(role))
	switch normalized {
	case "ADMIN", "WAREHOUSE", "VIEWER":
		return normalized
	case "STAFF":
		return "WAREHOUSE"
	default:
		return normalized
	}
}

func (s *dashboardService) GetStatsByRole(role string) (*DashboardStatsResponse, error) {
	// Senior Handover: dashboard role split - service quyet dinh khoi du lieu nao duoc tra theo role.
	normalizedRole := normalizeDashboardRole(role)
	if normalizedRole != "ADMIN" && normalizedRole != "WAREHOUSE" && normalizedRole != "VIEWER" {
		return nil, ErrDashboardForbiddenRole
	}

	warehouse, err := s.buildWarehouseOperations()
	if err != nil {
		return nil, err
	}

	response := &DashboardStatsResponse{
		Role:                normalizedRole,
		AdminRevenue:        nil,
		WarehouseOperations: *warehouse,
	}

	if normalizedRole == "ADMIN" {
		// Senior Handover: admin revenue fetch block - chi ADMIN moi duoc lay va nhan du lieu doanh thu.
		adminRevenue, adminErr := s.buildAdminRevenue()
		if adminErr != nil {
			return nil, adminErr
		}
		response.AdminRevenue = adminRevenue
	}

	return response, nil
}

func (s *dashboardService) buildAdminRevenue() (*DashboardAdminRevenue, error) {
	metrics, err := s.repo.GetAdminRevenueMetrics()
	if err != nil {
		return nil, err
	}

	revenueSeriesRows, err := s.repo.GetRevenueSeries()
	if err != nil {
		return nil, err
	}

	statusRows, err := s.repo.GetOrderStatusSummary()
	if err != nil {
		return nil, err
	}

	topFinishedRows, err := s.repo.GetTopFinishedProducts()
	if err != nil {
		return nil, err
	}

	recentCompletedRows, err := s.repo.GetRecentCompletedOrders()
	if err != nil {
		return nil, err
	}

	revenueSeries := make([]DashboardRevenueSeriesItem, 0, len(revenueSeriesRows))
	for _, row := range revenueSeriesRows {
		revenueSeries = append(revenueSeries, DashboardRevenueSeriesItem{Date: row.Date, Revenue: row.Revenue})
	}

	orderStatus := make([]DashboardOrderStatusItem, 0, len(statusRows))
	for _, row := range statusRows {
		orderStatus = append(orderStatus, DashboardOrderStatusItem{Status: row.Status, Count: row.Count})
	}

	topFinished := make([]DashboardTopFinishedProductItem, 0, len(topFinishedRows))
	for _, row := range topFinishedRows {
		topFinished = append(topFinished, DashboardTopFinishedProductItem{
			ProductID:     row.ProductID,
			ProductCode:   row.ProductCode,
			ProductName:   row.ProductName,
			QuantitySold:  row.QuantitySold,
			RevenueAmount: row.RevenueAmount,
		})
	}

	recentCompleted := make([]DashboardRecentCompletedOrderItem, 0, len(recentCompletedRows))
	for _, row := range recentCompletedRows {
		recentCompleted = append(recentCompleted, DashboardRecentCompletedOrderItem{
			OrderCode:    row.OrderCode,
			CustomerName: row.CustomerName,
			TotalAmount:  row.TotalAmount,
			CompletedAt:  row.CompletedAt,
			UpdatedAt:    row.UpdatedAt,
		})
	}

	return &DashboardAdminRevenue{
		TotalRevenue:          metrics.TotalRevenue,
		RevenueToday:          metrics.RevenueToday,
		RevenueThisMonth:      metrics.RevenueThisMonth,
		CompletedOrders:       metrics.CompletedOrders,
		AverageOrderValue:     metrics.AverageOrderValue,
		RevenueSeries:         revenueSeries,
		OrderStatusSummary:    orderStatus,
		TopFinishedProducts:   topFinished,
		RecentCompletedOrders: recentCompleted,
	}, nil
}

func (s *dashboardService) buildWarehouseOperations() (*DashboardWarehouseOperations, error) {
	summary, err := s.repo.GetWarehouseSummary()
	if err != nil {
		return nil, err
	}

	alertRows, err := s.repo.GetWarehouseAlerts()
	if err != nil {
		return nil, err
	}

	pickingMonitorRow, err := s.repo.GetPickingMonitor()
	if err != nil {
		return nil, err
	}

	recentPickingTasks, err := s.repo.GetRecentPickingTasks()
	if err != nil {
		return nil, err
	}

	recentActivities, err := s.repo.GetRecentWarehouseActivities()
	if err != nil {
		return nil, err
	}

	recentOrders, err := s.repo.GetRecentOrders()
	if err != nil {
		return nil, err
	}

	inventoryHealthRow, err := s.repo.GetInventoryHealth()
	if err != nil {
		return nil, err
	}

	topMovingProducts, err := s.repo.GetTopMovingProducts()
	if err != nil {
		return nil, err
	}

	alerts := make([]DashboardWarehouseAlert, 0, len(alertRows))
	for _, row := range alertRows {
		alerts = append(alerts, DashboardWarehouseAlert{
			AlertType:       row.AlertType,
			Severity:        row.Severity,
			ProductID:       row.ProductID,
			ProductCode:     row.ProductCode,
			ProductName:     row.ProductName,
			CurrentQuantity: row.CurrentQty,
			MinStock:        row.MinStock,
			Message:         row.Message,
		})
	}

	return &DashboardWarehouseOperations{
		PendingOrders:          summary.PendingOrders,
		PickingOrders:          summary.PickingOrders,
		CompletedToday:         summary.CompletedToday,
		LowStockProducts:       summary.LowStockProducts,
		TotalInventoryQuantity: summary.TotalInventoryQty,
		ActiveTrays:            summary.ActiveTrays,
		WarehouseAlerts:        alerts,
		PickingMonitor: DashboardPickingMonitor{
			WaitingTasks:       pickingMonitorRow.WaitingTasks,
			PickingTasks:       pickingMonitorRow.PickingTasks,
			DoneTasks:          pickingMonitorRow.DoneTasks,
			RecentPickingTasks: recentPickingTasks,
		},
		RecentActivities: recentActivities,
		RecentOrders:     recentOrders,
		InventoryHealth: DashboardInventoryHealth{
			HealthyProducts:    inventoryHealthRow.HealthyProducts,
			LowStockProducts:   inventoryHealthRow.LowStockProducts,
			OutOfStockProducts: inventoryHealthRow.OutOfStockProducts,
		},
		TopMovingProducts: topMovingProducts,
	}, nil
}
