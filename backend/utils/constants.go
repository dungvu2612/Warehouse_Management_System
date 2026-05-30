package utils

// Order status constants
const (
	OrderStatusPending   = "PENDING"
	OrderStatusPicking   = "PICKING"
	OrderStatusCompleted = "COMPLETED"
	OrderStatusCancelled = "CANCELLED"
)

// Picking task status constants
const (
	PickingStatusWaiting = "WAITING"
	PickingStatusPicking = "PICKING"
	PickingStatusDone    = "DONE"
)

// Stock transaction type constants
const (
	StockTxTypeImport = "IMPORT"
	StockTxTypeExport = "EXPORT"
	StockTxTypeAdjust = "ADJUST"
	StockTxTypeRollback = "ROLLBACK"
)
