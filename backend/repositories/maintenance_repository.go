package repositories

import (
	"time"

	"gorm.io/gorm"
)

type PurgeInactiveResult struct {
	Products  int64 `json:"products"`
	Trays     int64 `json:"trays"`
	Locations int64 `json:"locations"`
}

type MaintenanceRepository interface {
	PurgeInactiveMasterData(cutoff time.Time, dryRun bool) (PurgeInactiveResult, error)
}

type maintenanceRepository struct {
	db *gorm.DB
}

func NewMaintenanceRepository(db *gorm.DB) MaintenanceRepository {
	return &maintenanceRepository{db: db}
}

func (r *maintenanceRepository) PurgeInactiveMasterData(cutoff time.Time, dryRun bool) (PurgeInactiveResult, error) {
	var result PurgeInactiveResult
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var err error
		result.Trays, err = purgeInactiveTrays(tx, cutoff, dryRun)
		if err != nil {
			return err
		}

		result.Products, err = purgeInactiveProducts(tx, cutoff, dryRun)
		if err != nil {
			return err
		}

		result.Locations, err = purgeInactiveLocations(tx, cutoff, dryRun)
		if err != nil {
			return err
		}
		return nil
	})
	return result, err
}

func purgeInactiveProducts(tx *gorm.DB, cutoff time.Time, dryRun bool) (int64, error) {
	if dryRun {
		var count int64
		err := tx.Raw(inactiveProductsCountSQL, cutoff).Scan(&count).Error
		return count, err
	}

	var count int64
	err := tx.Raw(`
		WITH deleted AS (
			DELETE FROM products p
			WHERE p.is_active = FALSE
				AND p.updated_at < ?
				AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.product_id = p.id)
				AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.id)
				AND NOT EXISTS (SELECT 1 FROM picking_tasks pt WHERE pt.product_id = p.id)
				AND NOT EXISTS (SELECT 1 FROM import_receipt_items iri WHERE iri.product_id = p.id)
				AND NOT EXISTS (SELECT 1 FROM stock_transactions st WHERE st.product_id = p.id)
				AND NOT EXISTS (SELECT 1 FROM pick_logs pl WHERE pl.product_id = p.id)
				AND NOT EXISTS (SELECT 1 FROM boms b WHERE b.product_id = p.id)
				AND NOT EXISTS (SELECT 1 FROM bom_items bi WHERE bi.component_product_id = p.id)
				AND NOT EXISTS (SELECT 1 FROM trays t WHERE t.product_id = p.id)
			RETURNING p.id
		)
		SELECT COUNT(*) FROM deleted
	`, cutoff).Scan(&count).Error
	return count, err
}

func purgeInactiveTrays(tx *gorm.DB, cutoff time.Time, dryRun bool) (int64, error) {
	if dryRun {
		var count int64
		err := tx.Raw(inactiveTraysCountSQL, cutoff).Scan(&count).Error
		return count, err
	}

	var count int64
	err := tx.Raw(`
		WITH deleted AS (
			DELETE FROM trays t
			WHERE t.is_active = FALSE
				AND t.updated_at < ?
				AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.tray_id = t.id)
				AND NOT EXISTS (SELECT 1 FROM picking_tasks pt WHERE pt.tray_id = t.id)
				AND NOT EXISTS (SELECT 1 FROM import_receipt_items iri WHERE iri.tray_id = t.id OR iri.actual_tray_id = t.id)
				AND NOT EXISTS (SELECT 1 FROM stock_transactions st WHERE st.tray_id = t.id)
				AND NOT EXISTS (SELECT 1 FROM pick_logs pl WHERE pl.tray_id = t.id)
			RETURNING t.id
		)
		SELECT COUNT(*) FROM deleted
	`, cutoff).Scan(&count).Error
	return count, err
}

func purgeInactiveLocations(tx *gorm.DB, cutoff time.Time, dryRun bool) (int64, error) {
	if dryRun {
		var count int64
		err := tx.Raw(inactiveLocationsCountSQL, cutoff).Scan(&count).Error
		return count, err
	}

	var count int64
	err := tx.Raw(`
		WITH deleted AS (
			DELETE FROM locations l
			WHERE l.is_active = FALSE
				AND l.updated_at < ?
				AND NOT EXISTS (SELECT 1 FROM trays t WHERE t.location_id = l.id)
			RETURNING l.id
		)
		SELECT COUNT(*) FROM deleted
	`, cutoff).Scan(&count).Error
	return count, err
}

const inactiveProductsCountSQL = `
	SELECT COUNT(*)
	FROM products p
	WHERE p.is_active = FALSE
		AND p.updated_at < ?
		AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.product_id = p.id)
		AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.id)
		AND NOT EXISTS (SELECT 1 FROM picking_tasks pt WHERE pt.product_id = p.id)
		AND NOT EXISTS (SELECT 1 FROM import_receipt_items iri WHERE iri.product_id = p.id)
		AND NOT EXISTS (SELECT 1 FROM stock_transactions st WHERE st.product_id = p.id)
		AND NOT EXISTS (SELECT 1 FROM pick_logs pl WHERE pl.product_id = p.id)
		AND NOT EXISTS (SELECT 1 FROM boms b WHERE b.product_id = p.id)
		AND NOT EXISTS (SELECT 1 FROM bom_items bi WHERE bi.component_product_id = p.id)
		AND NOT EXISTS (SELECT 1 FROM trays t WHERE t.product_id = p.id)
`

const inactiveTraysCountSQL = `
	SELECT COUNT(*)
	FROM trays t
	WHERE t.is_active = FALSE
		AND t.updated_at < ?
		AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.tray_id = t.id)
		AND NOT EXISTS (SELECT 1 FROM picking_tasks pt WHERE pt.tray_id = t.id)
		AND NOT EXISTS (SELECT 1 FROM import_receipt_items iri WHERE iri.tray_id = t.id OR iri.actual_tray_id = t.id)
		AND NOT EXISTS (SELECT 1 FROM stock_transactions st WHERE st.tray_id = t.id)
		AND NOT EXISTS (SELECT 1 FROM pick_logs pl WHERE pl.tray_id = t.id)
`

const inactiveLocationsCountSQL = `
	SELECT COUNT(*)
	FROM locations l
	WHERE l.is_active = FALSE
		AND l.updated_at < ?
		AND NOT EXISTS (SELECT 1 FROM trays t WHERE t.location_id = l.id)
`
