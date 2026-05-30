package repositories

/*
Senior Handover Note:
- Purpose: Data-access layer cho Dashboard role-based (admin revenue + warehouse operations).
- Dependencies: Phu thuoc DBTX/GORM va schema orders/order_items/products/inventory/trays/picking_tasks/stock_transactions.
- API contract: Tra ve read-model tong hop, service layer khong query SQL truc tiep.
- Role access: Khong enforce role tai repository; role duoc enforce o middleware/service.
- Maintenance notes: Neu schema thay doi, cap nhat SQL alias theo field tags ben duoi.
*/

type DashboardRepository interface {
	GetAdminRevenueMetrics() (*AdminRevenueMetricsRow, error)
	GetRevenueSeries() ([]RevenueSeriesRow, error)
	GetOrderStatusSummary() ([]OrderStatusSummaryRow, error)
	GetTopFinishedProducts() ([]TopFinishedProductRow, error)
	GetRecentCompletedOrders() ([]RecentCompletedOrderRow, error)
	GetWarehouseSummary() (*WarehouseSummaryRow, error)
	GetWarehouseAlerts() ([]WarehouseAlertRow, error)
	GetPickingMonitor() (*PickingMonitorRow, error)
	GetRecentPickingTasks() ([]RecentPickingTaskRow, error)
	GetRecentWarehouseActivities() ([]RecentWarehouseActivityRow, error)
	GetRecentOrders() ([]RecentOrderRow, error)
	GetInventoryHealth() (*InventoryHealthRow, error)
	GetTopMovingProducts() ([]TopMovingProductRow, error)
}

type dashboardRepository struct {
	db DBTX
}

type AdminRevenueMetricsRow struct {
	TotalRevenue      float64 `json:"total_revenue"`
	RevenueToday      float64 `json:"revenue_today"`
	RevenueThisMonth  float64 `json:"revenue_this_month"`
	CompletedOrders   int64   `json:"completed_orders"`
	AverageOrderValue float64 `json:"average_order_value"`
}

type RevenueSeriesRow struct {
	Date    string  `json:"date"`
	Revenue float64 `json:"revenue"`
}

type OrderStatusSummaryRow struct {
	Status string `json:"status"`
	Count  int64  `json:"count"`
}

type TopFinishedProductRow struct {
	ProductID     uint    `json:"product_id"`
	ProductCode   string  `json:"product_code"`
	ProductName   string  `json:"product_name"`
	QuantitySold  int64   `json:"quantity_sold"`
	RevenueAmount float64 `json:"revenue_amount"`
}

type RecentCompletedOrderRow struct {
	OrderCode    string  `json:"order_code"`
	CustomerName string  `json:"customer_name"`
	TotalAmount  float64 `json:"total_amount"`
	CompletedAt  string  `json:"completed_at"`
	UpdatedAt    string  `json:"updated_at"`
}

type WarehouseSummaryRow struct {
	PendingOrders     int64 `json:"pending_orders"`
	PickingOrders     int64 `json:"picking_orders"`
	CompletedToday    int64 `json:"completed_today"`
	LowStockProducts  int64 `json:"low_stock_products"`
	TotalInventoryQty int64 `json:"total_inventory_quantity"`
	ActiveTrays       int64 `json:"active_trays"`
}

type WarehouseAlertRow struct {
	AlertType   string `json:"alert_type"`
	Severity    string `json:"severity"`
	ProductID   uint   `json:"product_id"`
	ProductCode string `json:"product_code"`
	ProductName string `json:"product_name"`
	CurrentQty  int64  `json:"current_quantity"`
	MinStock    int64  `json:"min_stock"`
	Message     string `json:"message"`
}

type PickingMonitorRow struct {
	WaitingTasks int64 `json:"waiting_tasks"`
	PickingTasks int64 `json:"picking_tasks"`
	DoneTasks    int64 `json:"done_tasks"`
}

type RecentPickingTaskRow struct {
	TaskID           uint   `json:"task_id"`
	OrderCode        string `json:"order_code"`
	ProductCode      string `json:"product_code"`
	ProductName      string `json:"product_name"`
	TrayCode         string `json:"tray_code"`
	RequiredQuantity int    `json:"required_quantity"`
	PickedQuantity   int    `json:"picked_quantity"`
	Status           string `json:"status"`
	UpdatedAt        string `json:"updated_at"`
}

type RecentWarehouseActivityRow struct {
	ID              uint   `json:"id"`
	TransactionType string `json:"transaction_type"`
	ReferenceCode   string `json:"reference_code"`
	ProductCode     string `json:"product_code"`
	ProductName     string `json:"product_name"`
	Quantity        int    `json:"quantity"`
	BeforeQuantity  int    `json:"before_quantity"`
	AfterQuantity   int    `json:"after_quantity"`
	CreatedAt       string `json:"created_at"`
}

type RecentOrderRow struct {
	OrderCode    string `json:"order_code"`
	CustomerName string `json:"customer_name"`
	Status       string `json:"status"`
	CreatedAt    string `json:"created_at"`
}

type InventoryHealthRow struct {
	HealthyProducts    int64 `json:"healthy_products"`
	LowStockProducts   int64 `json:"low_stock_products"`
	OutOfStockProducts int64 `json:"out_of_stock_products"`
}

type TopMovingProductRow struct {
	ProductID      uint   `json:"product_id"`
	ProductCode    string `json:"product_code"`
	ProductName    string `json:"product_name"`
	ExportQuantity int64  `json:"export_quantity"`
}

func NewDashboardRepository(db DBTX) DashboardRepository {
	return &dashboardRepository{db: db}
}

func (r *dashboardRepository) GetAdminRevenueMetrics() (*AdminRevenueMetricsRow, error) {
	var row AdminRevenueMetricsRow
	query := `
		SELECT
			COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_amount END), 0) AS total_revenue,
			COALESCE(SUM(CASE WHEN status = 'COMPLETED' AND DATE(updated_at) = CURRENT_DATE THEN total_amount END), 0) AS revenue_today,
			COALESCE(SUM(CASE WHEN status = 'COMPLETED' AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', CURRENT_DATE) THEN total_amount END), 0) AS revenue_this_month,
			COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END), 0) AS completed_orders,
			COALESCE(AVG(CASE WHEN status = 'COMPLETED' THEN total_amount END), 0) AS average_order_value
		FROM orders
	`
	if err := r.db.Raw(query).Scan(&row).Error; err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *dashboardRepository) GetRevenueSeries() ([]RevenueSeriesRow, error) {
	var rows []RevenueSeriesRow
	query := `
		SELECT
			TO_CHAR(DATE(updated_at), 'YYYY-MM-DD') AS date,
			COALESCE(SUM(total_amount), 0) AS revenue
		FROM orders
		WHERE status = 'COMPLETED'
		  AND DATE(updated_at) >= CURRENT_DATE - INTERVAL '13 day'
		GROUP BY DATE(updated_at)
		ORDER BY DATE(updated_at)
	`
	if err := r.db.Raw(query).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *dashboardRepository) GetOrderStatusSummary() ([]OrderStatusSummaryRow, error) {
	var rows []OrderStatusSummaryRow
	query := `
		SELECT status, COUNT(*)::bigint AS count
		FROM orders
		GROUP BY status
	`
	if err := r.db.Raw(query).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *dashboardRepository) GetTopFinishedProducts() ([]TopFinishedProductRow, error) {
	var rows []TopFinishedProductRow
	query := `
		SELECT
			p.id AS product_id,
			p.product_code,
			p.product_name,
			COALESCE(SUM(oi.quantity), 0)::bigint AS quantity_sold,
			COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue_amount
		FROM order_items oi
		JOIN orders o ON o.id = oi.order_id
		JOIN products p ON p.id = oi.product_id
		WHERE o.status = 'COMPLETED'
		  AND p.product_type = 'FINISHED_GOOD'
		GROUP BY p.id, p.product_code, p.product_name
		ORDER BY quantity_sold DESC
		LIMIT 10
	`
	if err := r.db.Raw(query).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *dashboardRepository) GetRecentCompletedOrders() ([]RecentCompletedOrderRow, error) {
	var rows []RecentCompletedOrderRow
	query := `
		SELECT
			o.order_code,
			COALESCE(o.customer_name, '') AS customer_name,
			o.total_amount,
			TO_CHAR(o.updated_at, 'YYYY-MM-DD HH24:MI:SS') AS completed_at,
			TO_CHAR(o.updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
		FROM orders o
		WHERE o.status = 'COMPLETED'
		ORDER BY o.updated_at DESC
		LIMIT 10
	`
	if err := r.db.Raw(query).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *dashboardRepository) GetWarehouseSummary() (*WarehouseSummaryRow, error) {
	var row WarehouseSummaryRow
	query := `
		SELECT
			COALESCE(SUM(CASE WHEN o.status = 'PENDING' THEN 1 ELSE 0 END), 0) AS pending_orders,
			COALESCE(SUM(CASE WHEN o.status = 'PICKING' THEN 1 ELSE 0 END), 0) AS picking_orders,
			COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' AND DATE(o.updated_at) = CURRENT_DATE THEN 1 ELSE 0 END), 0) AS completed_today,
			COALESCE((
				SELECT COUNT(*)
				FROM products p
				LEFT JOIN (
					SELECT product_id, SUM(quantity) AS total_qty
					FROM inventory
					GROUP BY product_id
				) inv ON inv.product_id = p.id
				WHERE p.is_active = TRUE
				  AND COALESCE(inv.total_qty, 0) < p.min_stock
			), 0) AS low_stock_products,
			COALESCE((SELECT SUM(quantity) FROM inventory), 0) AS total_inventory_quantity,
			COALESCE((SELECT COUNT(*) FROM trays WHERE is_active = TRUE), 0) AS active_trays
		FROM orders o
	`
	if err := r.db.Raw(query).Scan(&row).Error; err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *dashboardRepository) GetWarehouseAlerts() ([]WarehouseAlertRow, error) {
	var rows []WarehouseAlertRow
	query := `
		SELECT
			CASE
				WHEN COALESCE(inv.total_qty, 0) <= 0 THEN 'OUT_OF_STOCK'
				ELSE 'LOW_STOCK'
			END AS alert_type,
			CASE
				WHEN COALESCE(inv.total_qty, 0) <= 0 THEN 'CRITICAL'
				ELSE 'WARNING'
			END AS severity,
			p.id AS product_id,
			p.product_code,
			p.product_name,
			COALESCE(inv.total_qty, 0)::bigint AS current_quantity,
			COALESCE(p.min_stock, 0)::bigint AS min_stock,
			CASE
				WHEN COALESCE(inv.total_qty, 0) <= 0 THEN 'Het ton kho'
				ELSE 'Ton kho duoi muc toi thieu'
			END AS message
		FROM products p
		LEFT JOIN (
			SELECT product_id, SUM(quantity) AS total_qty
			FROM inventory
			GROUP BY product_id
		) inv ON inv.product_id = p.id
		WHERE p.is_active = TRUE
		  AND COALESCE(inv.total_qty, 0) <= COALESCE(p.min_stock, 0)
		ORDER BY COALESCE(inv.total_qty, 0) ASC, p.product_code ASC
		LIMIT 20
	`
	if err := r.db.Raw(query).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *dashboardRepository) GetPickingMonitor() (*PickingMonitorRow, error) {
	var row PickingMonitorRow
	query := `
		SELECT
			COALESCE(SUM(CASE WHEN status = 'WAITING' THEN 1 ELSE 0 END), 0) AS waiting_tasks,
			COALESCE(SUM(CASE WHEN status = 'PICKING' THEN 1 ELSE 0 END), 0) AS picking_tasks,
			COALESCE(SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END), 0) AS done_tasks
		FROM picking_tasks
	`
	if err := r.db.Raw(query).Scan(&row).Error; err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *dashboardRepository) GetRecentPickingTasks() ([]RecentPickingTaskRow, error) {
	var rows []RecentPickingTaskRow
	query := `
		SELECT
			pt.id AS task_id,
			o.order_code,
			p.product_code,
			p.product_name,
			t.tray_code,
			pt.required_quantity,
			pt.picked_quantity,
			pt.status,
			TO_CHAR(pt.updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
		FROM picking_tasks pt
		JOIN orders o ON o.id = pt.order_id
		JOIN products p ON p.id = pt.product_id
		JOIN trays t ON t.id = pt.tray_id
		ORDER BY pt.updated_at DESC
		LIMIT 12
	`
	if err := r.db.Raw(query).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *dashboardRepository) GetRecentWarehouseActivities() ([]RecentWarehouseActivityRow, error) {
	var rows []RecentWarehouseActivityRow
	query := `
		SELECT
			st.id,
			st.transaction_type,
			COALESCE(st.reference_code, '') AS reference_code,
			COALESCE(p.product_code, '') AS product_code,
			COALESCE(p.product_name, '') AS product_name,
			st.quantity,
			st.before_quantity,
			st.after_quantity,
			TO_CHAR(st.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
		FROM stock_transactions st
		LEFT JOIN products p ON p.id = st.product_id
		ORDER BY st.created_at DESC
		LIMIT 15
	`
	if err := r.db.Raw(query).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *dashboardRepository) GetRecentOrders() ([]RecentOrderRow, error) {
	var rows []RecentOrderRow
	query := `
		SELECT
			order_code,
			COALESCE(customer_name, '') AS customer_name,
			status,
			TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
		FROM orders
		ORDER BY created_at DESC
		LIMIT 10
	`
	if err := r.db.Raw(query).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *dashboardRepository) GetInventoryHealth() (*InventoryHealthRow, error) {
	var row InventoryHealthRow
	query := `
		SELECT
			COALESCE(SUM(CASE WHEN COALESCE(inv.total_qty, 0) > p.min_stock THEN 1 ELSE 0 END), 0) AS healthy_products,
			COALESCE(SUM(CASE WHEN COALESCE(inv.total_qty, 0) > 0 AND COALESCE(inv.total_qty, 0) <= p.min_stock THEN 1 ELSE 0 END), 0) AS low_stock_products,
			COALESCE(SUM(CASE WHEN COALESCE(inv.total_qty, 0) <= 0 THEN 1 ELSE 0 END), 0) AS out_of_stock_products
		FROM products p
		LEFT JOIN (
			SELECT product_id, SUM(quantity) AS total_qty
			FROM inventory
			GROUP BY product_id
		) inv ON inv.product_id = p.id
		WHERE p.is_active = TRUE
	`
	if err := r.db.Raw(query).Scan(&row).Error; err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *dashboardRepository) GetTopMovingProducts() ([]TopMovingProductRow, error) {
	var rows []TopMovingProductRow
	query := `
		SELECT
			st.product_id,
			COALESCE(p.product_code, '') AS product_code,
			COALESCE(p.product_name, '') AS product_name,
			COALESCE(SUM(st.quantity), 0)::bigint AS export_quantity
		FROM stock_transactions st
		LEFT JOIN products p ON p.id = st.product_id
		WHERE st.transaction_type = 'EXPORT'
		GROUP BY st.product_id, p.product_code, p.product_name
		ORDER BY export_quantity DESC
		LIMIT 10
	`
	if err := r.db.Raw(query).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}
