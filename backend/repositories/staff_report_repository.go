package repositories

import (
	"time"

	"gorm.io/gorm"
)

type StaffPerformanceFilter struct {
	FromDate time.Time
	ToDate   time.Time
	WorkType string
}

type StaffPerformanceRow struct {
	StaffID               uint    `json:"staff_id"`
	StaffName             string  `json:"staff_name"`
	PickingTaskCount      int64   `json:"picking_task_count"`
	PickedQuantity        int64   `json:"picked_quantity"`
	ImportTaskCount       int64   `json:"import_task_count"`
	ImportedQuantity      int64   `json:"imported_quantity"`
	TotalTaskCount        int64   `json:"total_task_count"`
	TotalQuantity         int64   `json:"total_quantity"`
	WeightedTotalQuantity float64 `json:"weighted_total_quantity"`
	PerformanceScore      int64   `json:"performance_score"`
}

type StaffReportRepository interface {
	GetStaffPerformance(filter StaffPerformanceFilter) ([]StaffPerformanceRow, error)
}

type staffReportRepository struct {
	db *gorm.DB
}

func NewStaffReportRepository(db *gorm.DB) StaffReportRepository {
	return &staffReportRepository{db: db}
}

func (r *staffReportRepository) GetStaffPerformance(filter StaffPerformanceFilter) ([]StaffPerformanceRow, error) {
	rows := make([]StaffPerformanceRow, 0)
	includePicking := filter.WorkType == "all" || filter.WorkType == "picking"
	includeImport := filter.WorkType == "all" || filter.WorkType == "import"

	err := r.db.Raw(`
		WITH staff_users AS (
			SELECT id, COALESCE(NULLIF(TRIM(full_name), ''), username) AS staff_name
			FROM users
			WHERE is_active = TRUE
				AND UPPER(TRIM(role::text)) IN ('WAREHOUSE', 'STAFF')
		),
		picking_tasks_done AS (
			SELECT
				pt.assigned_to AS staff_id,
				COUNT(*)::BIGINT AS task_count,
				COALESCE(SUM(COALESCE(p.difficulty_weight, 1.0)), 0)::DOUBLE PRECISION AS weighted_task_count
			FROM picking_tasks pt
			LEFT JOIN products p ON p.id = pt.product_id
			WHERE ? = TRUE
				AND pt.assigned_to IS NOT NULL
				AND UPPER(TRIM(pt.status::text)) = 'DONE'
				AND pt.completed_at >= ?
				AND pt.completed_at < ?
			GROUP BY pt.assigned_to
		),
		picked_quantities AS (
			SELECT
				pl.picked_by AS staff_id,
				COALESCE(SUM(pl.picked_quantity), 0)::BIGINT AS picked_quantity,
				COALESCE(SUM(pl.picked_quantity * COALESCE(p.difficulty_weight, 1.0)), 0)::DOUBLE PRECISION AS weighted_picked_quantity
			FROM pick_logs pl
			LEFT JOIN products p ON p.id = pl.product_id
			WHERE ? = TRUE
				AND pl.picked_by IS NOT NULL
				AND pl.picked_at >= ?
				AND pl.picked_at < ?
			GROUP BY pl.picked_by
		),
		import_tasks_done AS (
			SELECT
				iri.assigned_to AS staff_id,
				COUNT(*)::BIGINT AS task_count,
				COALESCE(SUM(iri.actual_quantity), 0)::BIGINT AS imported_quantity,
				COALESCE(SUM(COALESCE(p.difficulty_weight, 1.0)), 0)::DOUBLE PRECISION AS weighted_task_count,
				COALESCE(SUM(iri.actual_quantity * COALESCE(p.difficulty_weight, 1.0)), 0)::DOUBLE PRECISION AS weighted_imported_quantity
			FROM import_receipt_items iri
			LEFT JOIN products p ON p.id = iri.product_id
			WHERE ? = TRUE
				AND iri.assigned_to IS NOT NULL
				AND UPPER(TRIM(iri.status::text)) = 'DONE'
				AND iri.completed_at >= ?
				AND iri.completed_at < ?
			GROUP BY iri.assigned_to
		),
		combined AS (
			SELECT
				u.id AS staff_id,
				u.staff_name AS staff_name,
				COALESCE(pt.task_count, 0)::BIGINT AS picking_task_count,
				COALESCE(pq.picked_quantity, 0)::BIGINT AS picked_quantity,
				COALESCE(it.task_count, 0)::BIGINT AS import_task_count,
				COALESCE(it.imported_quantity, 0)::BIGINT AS imported_quantity,
				COALESCE(pq.weighted_picked_quantity, 0)::DOUBLE PRECISION AS weighted_picked_quantity,
				COALESCE(it.weighted_imported_quantity, 0)::DOUBLE PRECISION AS weighted_imported_quantity,
				(COALESCE(pt.weighted_task_count, 0) + COALESCE(it.weighted_task_count, 0))::DOUBLE PRECISION AS weighted_task_count
			FROM staff_users u
			LEFT JOIN picking_tasks_done pt ON pt.staff_id = u.id
			LEFT JOIN picked_quantities pq ON pq.staff_id = u.id
			LEFT JOIN import_tasks_done it ON it.staff_id = u.id
		)
		SELECT
			staff_id,
			staff_name,
			picking_task_count,
			picked_quantity,
			import_task_count,
			imported_quantity,
			(picking_task_count + import_task_count)::BIGINT AS total_task_count,
			(picked_quantity + imported_quantity)::BIGINT AS total_quantity,
			(weighted_picked_quantity + weighted_imported_quantity)::DOUBLE PRECISION AS weighted_total_quantity,
			ROUND(weighted_task_count * 10 + weighted_picked_quantity + weighted_imported_quantity)::BIGINT AS performance_score
		FROM combined
		WHERE (picking_task_count + picked_quantity + import_task_count + imported_quantity) > 0
		ORDER BY performance_score DESC, total_task_count DESC, staff_name ASC
	`,
		includePicking, filter.FromDate, filter.ToDate,
		includePicking, filter.FromDate, filter.ToDate,
		includeImport, filter.FromDate, filter.ToDate,
	).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	return rows, nil
}
