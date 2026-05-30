/*
Senior Handover Note:
- Purpose: API + adapter layer cho man Audit Consistency; gom du lieu tu nhieu endpoint va normalize thanh 1 contract UI duy nhat.
- Dependencies: Shared `http` client, va type contracts cua orders/pick-logs/inventory/stock-transactions.
- Audit logic: Ket hop du lieu order, picking tasks, pick logs, inventory, stock transactions de tao ket qua doi soat tong hop.
- API assumptions: GET /audit/consistency/:order_id la endpoint chinh; cac endpoint bo tro co the thieu field va can fallback.
- Maintenance notes: Toan bo normalize/issue mapping/status calculation dat tai day, UI KHONG tu xu ly normalize.
*/

import { http } from '../../../shared/lib/http'
import type { InventoryItem, ProductOption, TrayOption } from '../../inventory/types/inventoryTypes'
import type { OrderDetailResponse } from '../../orders/types/orderTypes'
import type { PickLog } from '../../pick-logs/types/pickLogTypes'
import type { StockTransaction } from '../../stock-transactions/types/stockTransactionTypes'
import type {
  AuditConsistencyResult,
  AuditIssue,
  AuditOverallStatus,
  AuditSummary,
} from '../types/auditConsistencyTypes'

type AuditConsistencyRaw = {
  order_id: number
  order_code: string
  pick_logs_total_qty: number
  export_tx_total_qty: number
  is_consistent: boolean
}

const FALLBACK_TEXT = 'Data not provided by backend'

function sum(values: number[]): number {
  return values.reduce((acc, cur) => acc + cur, 0)
}

function calculateOverallStatus(issues: AuditIssue[]): AuditOverallStatus {
  // Senior Handover: Status calculation block - ERROR uu tien cao nhat, sau do WARNING, cuoi cung la OK.
  const hasCriticalOrError = issues.some((issue) => issue.severity === 'CRITICAL' || issue.severity === 'ERROR')
  if (hasCriticalOrError) return 'ERROR'

  const hasWarning = issues.some((issue) => issue.severity === 'WARNING')
  if (hasWarning) return 'WARNING'

  return 'OK'
}

function buildSummary(issues: AuditIssue[]): AuditSummary {
  const warningCount = issues.filter((issue) => issue.severity === 'WARNING').length
  const errorCount = issues.filter((issue) => issue.severity === 'ERROR').length
  const criticalCount = issues.filter((issue) => issue.severity === 'CRITICAL').length
  const overallStatus = calculateOverallStatus(issues)

  return {
    overall_status: overallStatus,
    checked_at: new Date().toISOString(),
    issue_count: issues.length,
    warning_count: warningCount,
    error_count: errorCount,
    critical_count: criticalCount,
    headline:
      overallStatus === 'OK'
        ? 'Không phát hiện sai lệch quan trọng.'
        : overallStatus === 'WARNING'
          ? 'Có cảnh báo cần kiểm tra thêm.'
          : 'Phát hiện lỗi/sai lệch nghiêm trọng trong workflow kho.',
  }
}

export const auditConsistencyApi = {
  getAuditConsistency: async (orderId: number): Promise<AuditConsistencyResult> => {
    // Senior Handover: Audit fetch block - goi endpoint chinh + endpoint bo tro song song de doi soat workflow tong hop.
    const [
      consistencyResult,
      orderDetailResult,
      pickLogsResult,
      stockTransactionsResult,
      inventoryResult,
      productsResult,
      traysResult,
    ] = await Promise.allSettled([
      http.get<AuditConsistencyRaw>(`/audit/consistency/${orderId}`),
      http.get<OrderDetailResponse>(`/orders/${orderId}`),
      http.get<PickLog[]>('/pick-logs', { params: { order_id: orderId, limit: 300 } }),
      http.get<StockTransaction[]>('/stock-transactions', { params: { limit: 300 } }),
      http.get<InventoryItem[]>('/inventory'),
      http.get<ProductOption[]>('/products'),
      http.get<TrayOption[]>('/trays'),
    ])

    if (consistencyResult.status === 'rejected') {
      throw consistencyResult.reason
    }

    const consistency = consistencyResult.value.data
    const orderDetail = orderDetailResult.status === 'fulfilled' ? orderDetailResult.value.data : null
    const pickLogs = pickLogsResult.status === 'fulfilled' ? pickLogsResult.value.data : []
    const stockTransactions =
      stockTransactionsResult.status === 'fulfilled' ? stockTransactionsResult.value.data : []
    const inventory = inventoryResult.status === 'fulfilled' ? inventoryResult.value.data : []
    const products = productsResult.status === 'fulfilled' ? productsResult.value.data : []
    const trays = traysResult.status === 'fulfilled' ? traysResult.value.data : []

    const productById = new Map(products.map((product) => [product.id, product]))
    const trayById = new Map(trays.map((tray) => [tray.id, tray]))
    const inventoryByKey = new Map(
      inventory.map((item) => [`${item.product_id}:${item.tray_id}`, item.quantity]),
    )
    const taskById = new Map((orderDetail?.picking_tasks || []).map((task) => [task.id, task]))

    const exportTransactionsOfOrder = stockTransactions.filter(
      (tx) => tx.transaction_type === 'EXPORT' && tx.reference_code === consistency.order_code,
    )

    const pickedQtyFromTasks = sum((orderDetail?.picking_tasks || []).map((task) => task.picked_quantity))
    const requiredQtyFromTasks = sum((orderDetail?.picking_tasks || []).map((task) => task.required_quantity))
    const missingQty = Math.max(requiredQtyFromTasks - pickedQtyFromTasks, 0)

    const pickLogCountByTask = new Map<number, number>()
    let trayMismatch = 0

    pickLogs.forEach((log) => {
      if (log.picking_task_id) {
        pickLogCountByTask.set(log.picking_task_id, (pickLogCountByTask.get(log.picking_task_id) || 0) + 1)
      }

      const task = log.picking_task_id ? taskById.get(log.picking_task_id) : undefined
      if (task && log.tray_id && task.tray_id !== log.tray_id) {
        trayMismatch += 1
      }
    })

    const duplicatedPicking = Array.from(pickLogCountByTask.values()).filter((count) => count > 1).length

    // Senior Handover: Map response block - map pick logs ve read-model day du field phuc vu audit table.
    const pickLogsMapped = pickLogs.map((log) => {
      const task = log.picking_task_id ? taskById.get(log.picking_task_id) : undefined
      const productId = task?.product_id || log.product_id || 0
      const product = productById.get(productId)
      const trayCode =
        (log.tray_id ? trayById.get(log.tray_id)?.tray_code : undefined) || task?.tray_code || '-'

      return {
        id: log.id,
        order_code: consistency.order_code,
        product_code: task?.product_code || product?.product_code || (productId ? `#${productId}` : '-'),
        product_name: task?.product_name || product?.product_name || '-',
        tray_code: trayCode,
        picked_quantity: log.picked_quantity,
        picked_by: log.picked_by ? `User #${log.picked_by}` : FALLBACK_TEXT,
        picked_at: log.picked_at,
        note: log.note || '',
        status: 'PICKED' as const,
        verified: Boolean(task?.verified),
      }
    })

    const groupedKeys = new Set<string>()
    pickLogs.forEach((log) => {
      if (log.product_id && log.tray_id) groupedKeys.add(`${log.product_id}:${log.tray_id}`)
    })
    exportTransactionsOfOrder.forEach((tx) => {
      if (tx.product_id && tx.tray_id) groupedKeys.add(`${tx.product_id}:${tx.tray_id}`)
    })

    const beforeAfterRows = Array.from(groupedKeys).map((key) => {
      const [productIdRaw, trayIdRaw] = key.split(':')
      const productId = Number(productIdRaw)
      const trayId = Number(trayIdRaw)

      const logsByKey = pickLogs.filter((log) => log.product_id === productId && log.tray_id === trayId)
      const txByKey = exportTransactionsOfOrder
        .filter((tx) => tx.product_id === productId && tx.tray_id === trayId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

      const firstTx = txByKey[0]
      const lastTx = txByKey[txByKey.length - 1]
      const product = productById.get(productId)
      const tray = trayById.get(trayId)

      return {
        key,
        product_code: product?.product_code || `#${productId}`,
        product_name: product?.product_name || FALLBACK_TEXT,
        tray_code: tray?.tray_code || `#${trayId}`,
        before_quantity: firstTx ? firstTx.before_quantity : null,
        after_quantity: lastTx ? lastTx.after_quantity : null,
        current_inventory_quantity: inventoryByKey.has(key) ? inventoryByKey.get(key) || 0 : null,
        picked_quantity: sum(logsByKey.map((log) => log.picked_quantity)),
        export_quantity: sum(txByKey.map((tx) => tx.quantity)),
      }
    })

    const issues: AuditIssue[] = []

    // Senior Handover: Issue mapping block - suy ra warning/error/critical tu du lieu doi soat tong hop.
    if (!consistency.is_consistent) {
      issues.push({
        id: 'consistency-mismatch',
        severity: 'ERROR',
        source: 'STOCK_TX',
        title: 'Sai lệch tổng số lượng pick/export',
        message: `Pick logs (${consistency.pick_logs_total_qty}) không khớp export transactions (${consistency.export_tx_total_qty}).`,
      })
    }

    if (missingQty > 0) {
      issues.push({
        id: 'missing-quantity',
        severity: 'WARNING',
        source: 'PICKING',
        title: 'Thiếu số lượng picking',
        message: `Thiếu ${missingQty} so với yêu cầu picking tasks.`,
      })
    }

    if (duplicatedPicking > 0) {
      issues.push({
        id: 'duplicated-picking',
        severity: 'WARNING',
        source: 'PICK_LOGS',
        title: 'Có task bị log pick nhiều lần',
        message: `${duplicatedPicking} task có nhiều hơn 1 pick log.`,
      })
    }

    if (trayMismatch > 0) {
      issues.push({
        id: 'tray-mismatch',
        severity: 'CRITICAL',
        source: 'PICK_LOGS',
        title: 'Phát hiện tray mismatch',
        message: `${trayMismatch} pick log có tray khác với tray trong picking task.`,
      })
    }

    if (orderDetailResult.status === 'rejected') {
      issues.push({
        id: 'missing-order-detail',
        severity: 'WARNING',
        source: 'ORDER',
        title: 'Thiếu dữ liệu Order Detail',
        message: 'Data not provided by backend: không tải được GET /orders/:id cho audit enrich.',
      })
    }

    if (pickLogsResult.status === 'rejected') {
      issues.push({
        id: 'missing-pick-logs',
        severity: 'WARNING',
        source: 'PICK_LOGS',
        title: 'Thiếu dữ liệu Pick Logs',
        message: 'Data not provided by backend: không tải được GET /pick-logs.',
      })
    }

    if (stockTransactionsResult.status === 'rejected') {
      issues.push({
        id: 'missing-stock-tx',
        severity: 'WARNING',
        source: 'STOCK_TX',
        title: 'Thiếu dữ liệu Stock Transactions',
        message: 'Data not provided by backend: không tải được GET /stock-transactions.',
      })
    }

    if (inventoryResult.status === 'rejected') {
      issues.push({
        id: 'missing-inventory',
        severity: 'WARNING',
        source: 'INVENTORY',
        title: 'Thiếu dữ liệu Inventory',
        message: 'Data not provided by backend: không tải được GET /inventory.',
      })
    }

    const summary = buildSummary(issues)

    const warnings = issues
      .filter((issue) => issue.severity === 'WARNING')
      .map((issue) => ({ id: issue.id, source: issue.source, message: issue.message }))

    // Senior Handover: Fallback handling block - ghi chu ro truong nao khong duoc backend cung cap.
    const fallbackNote =
      orderDetailResult.status === 'rejected' ||
      pickLogsResult.status === 'rejected' ||
      stockTransactionsResult.status === 'rejected' ||
      inventoryResult.status === 'rejected'
        ? FALLBACK_TEXT
        : null

    return {
      summary,
      order_summary: {
        order_id: consistency.order_id,
        order_code: consistency.order_code,
        customer: orderDetail?.order.customer_name || FALLBACK_TEXT,
        status: orderDetail?.order.status || FALLBACK_TEXT,
        total_amount:
          typeof orderDetail?.order.total_amount === 'number' ? orderDetail.order.total_amount : null,
        created_at: orderDetail?.order.created_at || FALLBACK_TEXT,
      },
      picking_validation: {
        picking_task_count: orderDetail?.picking_tasks.length || 0,
        picked_quantity: pickedQtyFromTasks,
        required_quantity: requiredQtyFromTasks,
        missing_quantity: missingQty,
        duplicated_picking: duplicatedPicking,
        tray_mismatch: trayMismatch,
      },
      inventory_validation: {
        inventory_deducted_correctly:
          inventoryResult.status === 'fulfilled' ? consistency.is_consistent : null,
        stock_transaction_matched:
          stockTransactionsResult.status === 'fulfilled'
            ? consistency.pick_logs_total_qty === consistency.export_tx_total_qty
            : null,
        pick_logs_total_qty: consistency.pick_logs_total_qty,
        export_tx_total_qty: consistency.export_tx_total_qty,
        before_after_rows: beforeAfterRows,
        fallback_note: fallbackNote,
      },
      issues,
      warnings,
      pick_logs: pickLogsMapped,
    }
  },
}
