import { ordersApi } from '../api/ordersApi'
import type { Order } from '../types/orderTypes'
import { toQrDataUrl } from '../../../shared/lib/qrCode'
import { formatDateTimeVN } from '../../../shared/lib/datetime'

type PrintableOrderItem = {
  product_code: string
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function mapPrintableItems(
  items: Array<{ product_id: number; quantity: number; unit_price: number }>,
  pickingTasks: Array<{ product_id: number; product_code: string; product_name: string }>,
): PrintableOrderItem[] {
  const taskProductMap = new Map<number, { code: string; name: string }>()
  for (const task of pickingTasks || []) {
    taskProductMap.set(task.product_id, {
      code: task.product_code || '',
      name: task.product_name || '',
    })
  }

  return items.map((item) => {
    const productMeta = taskProductMap.get(item.product_id)
    const quantity = Number(item.quantity || 0)
    const unitPrice = Number(item.unit_price || 0)
    return {
      product_code: productMeta?.code || `#${item.product_id}`,
      product_name: productMeta?.name || `Sản phẩm ${item.product_id}`,
      quantity,
      unit_price: unitPrice,
      line_total: quantity * unitPrice,
    }
  })
}

function buildBulkPrintHtml(
  orderBundles: Array<{
    order: {
      id: number
      order_code: string
      customer_name?: string
      customer_phone?: string
      customer_address?: string
      created_at?: string
      total_amount?: number
    }
    qrValue: string
    qrImage: string
    printItems: PrintableOrderItem[]
  }>,
): string {
  return `
    <html>
      <head>
        <title>In đơn hàng đã chọn</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; color: #0f172a; }
          .order-print-root { border: 1px solid #cfd8e3; border-radius: 10px; padding: 14px; margin-bottom: 22px; break-inside: avoid; }
          .order-print-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e293b; padding-bottom: 10px; margin-bottom: 12px; }
          .order-print-brand h2 { margin: 0; font-size: 20px; }
          .order-print-brand p { margin: 2px 0 0 0; color: #475569; }
          .order-print-qr-wrap { text-align: center; }
          .order-print-qr-wrap img { width: 120px; height: 120px; display: block; margin: 0 auto 4px; }
          .order-print-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 16px; margin-bottom: 12px; }
          .order-print-meta p { margin: 0; font-size: 14px; }
          .order-print-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
          .order-print-table th, .order-print-table td { border: 1px solid #cbd5e1; padding: 7px 8px; font-size: 14px; }
          .order-print-table th { background: #f1f5f9; text-align: left; }
          .order-print-table .num { text-align: right; }
          .order-print-empty { text-align: center; color: #475569; }
          @media print { .order-print-root { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <h2>Danh sách đơn hàng đã chọn (${orderBundles.length})</h2>
        ${orderBundles
          .map(
            ({ order, qrValue, qrImage, printItems }) => `
              <section class="order-print-root">
                <header class="order-print-header">
                  <div class="order-print-brand">
                    <h2>WMS ENTERPRISE</h2>
                    <p>Phiếu đơn hàng</p>
                  </div>
                  <div class="order-print-qr-wrap">
                    <img src="${qrImage}" alt="Order QR" />
                    <div style="font-family:monospace;">${escapeHtml(qrValue)}</div>
                  </div>
                </header>

                <section class="order-print-meta">
                  <p><strong>Mã đơn:</strong> ${escapeHtml(order.order_code)}</p>
                  <p><strong>ID đơn hàng:</strong> #${order.id}</p>
                  <p><strong>Khách hàng:</strong> ${escapeHtml(order.customer_name || '-')}</p>
                  <p><strong>Số điện thoại:</strong> ${escapeHtml(order.customer_phone || '-')}</p>
                  <p><strong>Địa chỉ:</strong> ${escapeHtml(order.customer_address || '-')}</p>
                  <p><strong>Ngày tạo:</strong> ${escapeHtml(formatDateTimeVN(order.created_at || null))}</p>
                </section>

                <table class="order-print-table">
                  <thead>
                    <tr>
                      <th>Mã SP</th>
                      <th>Tên SP</th>
                      <th>SL</th>
                      <th>Đơn giá</th>
                      <th>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      printItems.length === 0
                        ? '<tr><td colspan="5" class="order-print-empty">Không có sản phẩm trong đơn.</td></tr>'
                        : printItems
                            .map(
                              (item) => `
                                <tr>
                                  <td>${escapeHtml(item.product_code)}</td>
                                  <td>${escapeHtml(item.product_name)}</td>
                                  <td class="num">${Number(item.quantity).toLocaleString('vi-VN')}</td>
                                  <td class="num">${Number(item.unit_price).toLocaleString('vi-VN')} đ</td>
                                  <td class="num">${Number(item.line_total).toLocaleString('vi-VN')} đ</td>
                                </tr>
                              `,
                            )
                            .join('')
                    }
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="4" class="num"><strong>Tổng cộng</strong></td>
                      <td class="num"><strong>${Number(order.total_amount || 0).toLocaleString('vi-VN')} đ</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </section>
            `,
          )
          .join('')}
      </body>
    </html>
  `
}

export const orderPrintService = {
  // In nhiều đơn hàng theo danh sách id đã chọn.
  // Cách dùng: truyền mảng orders (đang hiển thị), service sẽ tự gọi API detail + build popup print.
  printSelectedOrders: async (orders: Order[]) => {
    if (orders.length === 0) return

    const bundles = await Promise.all(
      orders.map(async (order) => {
        const detail = await ordersApi.getOrderById(order.id)
        const qrValue = order.qr_code || order.order_code
        const qrImage = await toQrDataUrl(qrValue)
        const printItems = mapPrintableItems(detail.order.items || [], detail.picking_tasks || [])

        return {
          order: detail.order,
          qrValue,
          qrImage,
          printItems,
        }
      }),
    )

    const printWindow = window.open('', '_blank', 'width=1000,height=760')
    if (!printWindow) return
    printWindow.document.write(buildBulkPrintHtml(bundles))
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  },
}
