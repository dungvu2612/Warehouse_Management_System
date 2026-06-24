package repositories

import (
	"fmt"
	"time"

	"quan_ly_kho/notifications"

	"gorm.io/gorm"
)

type NotificationRepository interface {
	FindNotifications(userID uint, role string, limit int) ([]notifications.Item, error)
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) FindNotifications(userID uint, role string, limit int) ([]notifications.Item, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	items := make([]notifications.Item, 0, limit)
	if role == "ADMIN" {
		if err := r.appendAdminNotifications(&items, limit); err != nil {
			return nil, err
		}
	} else {
		if err := r.appendStaffNotifications(&items, userID, limit); err != nil {
			return nil, err
		}
	}

	if len(items) > limit {
		items = items[:limit]
	}
	return items, nil
}

func (r *notificationRepository) appendAdminNotifications(items *[]notifications.Item, limit int) error {
	if err := r.appendStockNotifications(items, limit); err != nil {
		return err
	}
	if err := r.appendPickingWaitingNotifications(items, 0, "ADMIN", limit); err != nil {
		return err
	}
	if err := r.appendImportWaitingNotifications(items, 0, "ADMIN", limit); err != nil {
		return err
	}
	if err := r.appendCompletedOrders(items, limit); err != nil {
		return err
	}
	if err := r.appendCompletedImportReceipts(items, limit); err != nil {
		return err
	}
	if err := r.appendLongRunningTasks(items, 0, "ADMIN", limit); err != nil {
		return err
	}
	return nil
}

func (r *notificationRepository) appendStaffNotifications(items *[]notifications.Item, userID uint, limit int) error {
	if err := r.appendPickingWaitingNotifications(items, userID, "WAREHOUSE", limit); err != nil {
		return err
	}
	if err := r.appendImportWaitingNotifications(items, userID, "WAREHOUSE", limit); err != nil {
		return err
	}
	if err := r.appendAssignedPickingTasks(items, userID, limit); err != nil {
		return err
	}
	if err := r.appendAssignedImportTasks(items, userID, limit); err != nil {
		return err
	}
	if err := r.appendLongRunningTasks(items, userID, "WAREHOUSE", limit); err != nil {
		return err
	}
	return nil
}

type stockNotificationRow struct {
	ProductID       uint
	ProductCode     string
	ProductName     string
	MinStock        int
	CurrentQuantity int
	UpdatedAt       time.Time
}

func (r *notificationRepository) appendStockNotifications(items *[]notifications.Item, limit int) error {
	rows := make([]stockNotificationRow, 0)
	if err := r.db.Raw(`
		SELECT
			p.id AS product_id,
			p.product_code,
			p.product_name,
			p.min_stock,
			COALESCE(SUM(i.quantity), 0)::INT AS current_quantity,
			MAX(COALESCE(i.updated_at, p.updated_at)) AS updated_at
		FROM products p
		LEFT JOIN inventory i ON i.product_id = p.id
		WHERE p.is_active = TRUE
		GROUP BY p.id, p.product_code, p.product_name, p.min_stock
		HAVING COALESCE(SUM(i.quantity), 0) = 0
			OR (p.min_stock > 0 AND COALESCE(SUM(i.quantity), 0) < p.min_stock)
		ORDER BY current_quantity ASC, updated_at DESC
		LIMIT ?
	`, limit).Scan(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		if row.CurrentQuantity == 0 {
			*items = append(*items, notifications.NewItem(
				fmt.Sprintf("OUT_OF_STOCK-%d", row.ProductID),
				"OUT_OF_STOCK",
				notifications.LevelError,
				"Hết hàng",
				fmt.Sprintf("Sản phẩm %s hiện đã hết hàng.", row.ProductCode),
				row.UpdatedAt,
				fmt.Sprintf("/warehouse-overview?product_code=%s&low_stock=1", row.ProductCode),
			))
			continue
		}
		*items = append(*items, notifications.NewItem(
			fmt.Sprintf("LOW_STOCK-%d", row.ProductID),
			"LOW_STOCK",
			notifications.LevelWarning,
			"Tồn kho thấp",
			fmt.Sprintf("Sản phẩm %s chỉ còn %d, thấp hơn mức tối thiểu %d.", row.ProductCode, row.CurrentQuantity, row.MinStock),
			row.UpdatedAt,
			fmt.Sprintf("/warehouse-overview?product_code=%s&low_stock=1", row.ProductCode),
		))
	}
	return nil
}

type countNotificationRow struct {
	Count    int
	LatestAt time.Time
}

func (r *notificationRepository) appendPickingWaitingNotifications(items *[]notifications.Item, userID uint, role string, limit int) error {
	var row countNotificationRow
	if err := r.db.Raw(`
		SELECT COUNT(*)::INT AS count, MAX(created_at) AS latest_at
		FROM picking_tasks
		WHERE (assigned_to IS NULL OR UPPER(TRIM(status::text)) = 'WAITING')
	`).Scan(&row).Error; err != nil {
		return err
	}
	if row.Count == 0 {
		return nil
	}
	*items = append(*items, notifications.NewItem(
		"PICKING_WAITING",
		"PICKING_WAITING",
		notifications.LevelInfo,
		"Tác vụ mới",
		fmt.Sprintf("Có %d tác vụ nhặt hàng đang chờ nhận.", row.Count),
		row.LatestAt,
		"/staff/tasks",
	))
	return nil
}

func (r *notificationRepository) appendImportWaitingNotifications(items *[]notifications.Item, userID uint, role string, limit int) error {
	var row countNotificationRow
	if err := r.db.Raw(`
		SELECT COUNT(*)::INT AS count, MAX(created_at) AS latest_at
		FROM import_receipt_items
		WHERE assigned_to IS NULL OR UPPER(TRIM(status::text)) = 'WAITING'
	`).Scan(&row).Error; err != nil {
		return err
	}
	if row.Count == 0 {
		return nil
	}
	*items = append(*items, notifications.NewItem(
		"IMPORT_WAITING",
		"IMPORT_WAITING",
		notifications.LevelInfo,
		"Tác vụ nhập kho mới",
		fmt.Sprintf("Có %d tác vụ nhập kho đang chờ nhận.", row.Count),
		row.LatestAt,
		"/staff/import-tasks",
	))
	return nil
}

type assignedTaskRow struct {
	ID        uint
	Code      string
	Status    string
	At        time.Time
	Completed bool
}

func (r *notificationRepository) appendAssignedPickingTasks(items *[]notifications.Item, userID uint, limit int) error {
	rows := make([]assignedTaskRow, 0)
	if err := r.db.Raw(`
		SELECT pt.id, COALESCE(o.order_code, '') AS code, pt.status::text AS status,
			COALESCE(pt.completed_at, pt.assigned_at, pt.updated_at) AS at,
			(UPPER(TRIM(pt.status::text)) = 'DONE') AS completed
		FROM picking_tasks pt
		LEFT JOIN orders o ON o.id = pt.order_id
		WHERE pt.assigned_to = ?
		ORDER BY COALESCE(pt.completed_at, pt.assigned_at, pt.updated_at) DESC
		LIMIT ?
	`, userID, limit).Scan(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		if row.Completed {
			*items = append(*items, notifications.NewItem(
				fmt.Sprintf("PICKING_DONE-%d", row.ID),
				"PICKING_DONE",
				notifications.LevelSuccess,
				"Hoàn thành công việc",
				fmt.Sprintf("Bạn đã hoàn thành tác vụ nhặt hàng cho đơn %s.", row.Code),
				row.At,
				"/staff/tasks",
			))
			continue
		}
		*items = append(*items, notifications.NewItem(
			fmt.Sprintf("PICKING_ASSIGNED-%d", row.ID),
			"PICKING_ASSIGNED",
			notifications.LevelInfo,
			"Bạn đã nhận tác vụ",
			fmt.Sprintf("Bạn đã nhận tác vụ nhặt hàng cho đơn %s.", row.Code),
			row.At,
			"/staff/tasks",
		))
	}
	return nil
}

func (r *notificationRepository) appendAssignedImportTasks(items *[]notifications.Item, userID uint, limit int) error {
	rows := make([]assignedTaskRow, 0)
	if err := r.db.Raw(`
		SELECT iri.id, COALESCE(ir.receipt_code, '') AS code, iri.status::text AS status,
			COALESCE(iri.completed_at, iri.assigned_at, iri.updated_at) AS at,
			(UPPER(TRIM(iri.status::text)) = 'DONE') AS completed
		FROM import_receipt_items iri
		LEFT JOIN import_receipts ir ON ir.id = iri.receipt_id
		WHERE iri.assigned_to = ?
		ORDER BY COALESCE(iri.completed_at, iri.assigned_at, iri.updated_at) DESC
		LIMIT ?
	`, userID, limit).Scan(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		if row.Completed {
			*items = append(*items, notifications.NewItem(
				fmt.Sprintf("IMPORT_DONE-%d", row.ID),
				"IMPORT_DONE",
				notifications.LevelSuccess,
				"Hoàn thành công việc",
				fmt.Sprintf("Bạn đã hoàn thành tác vụ nhập kho từ phiếu %s.", row.Code),
				row.At,
				"/staff/import-tasks",
			))
			continue
		}
		*items = append(*items, notifications.NewItem(
			fmt.Sprintf("IMPORT_ASSIGNED-%d", row.ID),
			"IMPORT_ASSIGNED",
			notifications.LevelInfo,
			"Tác vụ được gán",
			fmt.Sprintf("Bạn được gán tác vụ nhập kho từ phiếu %s.", row.Code),
			row.At,
			"/staff/import-tasks",
		))
	}
	return nil
}

type completedCodeRow struct {
	ID   uint
	Code string
	At   time.Time
}

func (r *notificationRepository) appendCompletedOrders(items *[]notifications.Item, limit int) error {
	rows := make([]completedCodeRow, 0)
	if err := r.db.Raw(`
		SELECT id, order_code AS code, updated_at AS at
		FROM orders
		WHERE UPPER(TRIM(status::text)) = 'COMPLETED'
		ORDER BY updated_at DESC
		LIMIT ?
	`, limit).Scan(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		*items = append(*items, notifications.NewItem(
			fmt.Sprintf("ORDER_COMPLETED-%d", row.ID),
			"ORDER_COMPLETED",
			notifications.LevelSuccess,
			"Đơn hàng hoàn thành",
			fmt.Sprintf("Đơn hàng %s đã hoàn thành picking.", row.Code),
			row.At,
			fmt.Sprintf("/orders/%d", row.ID),
		))
	}
	return nil
}

func (r *notificationRepository) appendCompletedImportReceipts(items *[]notifications.Item, limit int) error {
	rows := make([]completedCodeRow, 0)
	if err := r.db.Raw(`
		SELECT id, receipt_code AS code, updated_at AS at
		FROM import_receipts
		WHERE UPPER(TRIM(status::text)) = 'COMPLETED'
		ORDER BY updated_at DESC
		LIMIT ?
	`, limit).Scan(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		*items = append(*items, notifications.NewItem(
			fmt.Sprintf("IMPORT_RECEIPT_COMPLETED-%d", row.ID),
			"IMPORT_RECEIPT_COMPLETED",
			notifications.LevelSuccess,
			"Phiếu nhập hoàn thành",
			fmt.Sprintf("Phiếu nhập %s đã hoàn thành.", row.Code),
			row.At,
			"/import-receipts",
		))
	}
	return nil
}

type longTaskRow struct {
	ID   uint
	Code string
	Kind string
	At   time.Time
}

func (r *notificationRepository) appendLongRunningTasks(items *[]notifications.Item, userID uint, role string, limit int) error {
	rows := make([]longTaskRow, 0)
	args := []interface{}{userID, role == "ADMIN", limit}
	if err := r.db.Raw(`
		SELECT * FROM (
			SELECT pt.id, COALESCE(o.order_code, '') AS code, 'PICKING' AS kind, COALESCE(pt.started_at, pt.assigned_at) AS at
			FROM picking_tasks pt
			LEFT JOIN orders o ON o.id = pt.order_id
			WHERE COALESCE(pt.started_at, pt.assigned_at) < NOW() - INTERVAL '4 hours'
				AND UPPER(TRIM(pt.status::text)) IN ('PICKING', 'PROCESSING', 'IMPORTING')
				AND (? = TRUE OR pt.assigned_to = ?)
			UNION ALL
			SELECT iri.id, COALESCE(ir.receipt_code, '') AS code, 'IMPORT' AS kind, iri.assigned_at AS at
			FROM import_receipt_items iri
			LEFT JOIN import_receipts ir ON ir.id = iri.receipt_id
			WHERE iri.assigned_at < NOW() - INTERVAL '4 hours'
				AND UPPER(TRIM(iri.status::text)) IN ('IMPORTING', 'PARTIAL', 'PROCESSING')
				AND (? = TRUE OR iri.assigned_to = ?)
		) slow_tasks
		ORDER BY at ASC
		LIMIT ?
	`, args[1], args[0], args[1], args[0], args[2]).Scan(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		title := "Tác vụ quá lâu"
		message := fmt.Sprintf("Tác vụ %s %s đang xử lý quá lâu.", row.Kind, row.Code)
		link := "/staff/tasks"
		if row.Kind == "IMPORT" {
			link = "/staff/import-tasks"
		}
		*items = append(*items, notifications.NewItem(
			fmt.Sprintf("LONG_TASK-%s-%d", row.Kind, row.ID),
			"LONG_TASK",
			notifications.LevelWarning,
			title,
			message,
			row.At,
			link,
		))
	}
	return nil
}
