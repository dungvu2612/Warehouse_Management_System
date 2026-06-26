-- Kiểm tra tray_id nào có vấn đề
-- Thay <TRAY_ID> bằng ID của khay bạn muốn xóa

SELECT 'INVENTORY' as type, COUNT(*) as count, tray_id, GROUP_CONCAT(quantity) as quantities
FROM inventories 
WHERE tray_id = <TRAY_ID> AND quantity > 0
GROUP BY tray_id

UNION ALL

SELECT 'PICKING_TASK' as type, COUNT(*) as count, tray_id, GROUP_CONCAT(status) as statuses
FROM picking_tasks
WHERE tray_id = <TRAY_ID> AND status <> 'Done'
GROUP BY tray_id

UNION ALL

SELECT 'IMPORT_RECEIPT_ITEM' as type, COUNT(*) as count, tray_id, GROUP_CONCAT(status) as statuses
FROM import_receipt_items
WHERE (tray_id = <TRAY_ID> OR actual_tray_id = <TRAY_ID>) AND status <> 'DONE'
GROUP BY tray_id;
