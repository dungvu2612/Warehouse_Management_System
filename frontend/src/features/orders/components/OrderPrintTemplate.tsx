/*
- Mục đích: Print template rieng cho phieu don hang khach hang (browser print -> PDF).
- Phụ thuộc: `OrderQrCode` component va CSS print `orderPrint.css`.
- Hợp đồng API: Nhan du lieu tu Order Detail (order + order_items da map) khong goi API truc tiep.
- Quy tắc nghiệp vụ: Chi hien thi finished products, khong hien thi BOM/component breakdown/picking/internal data.
- Ghi chú phân quyền: Chỉ xem print view cho ADMIN/WAREHOUSE co quyen xem order detail.
- Ghi chú bảo trì: Neu doi layout giay A4/A5, cap nhat class CSS trong file print css.
*/

import { OrderQrCode } from './OrderQrCode'

export interface OrderPrintItem {
  product_code: string
  product_name: string
  quantity: number
  unit_price?: number
  line_total?: number
}

interface OrderPrintTemplateProps {
  systemName: string
  logoText?: string
  order: {
    id: number
    order_code: string
    qr_code?: string
    customer_name?: string
    customer_phone?: string
    customer_address?: string
    created_at?: string
  }
  qrDataUrl?: string
  items: OrderPrintItem[]
}

function formatMoney(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'
  return `${value.toLocaleString('vi-VN')} đ`
}

export function OrderPrintTemplate({
  systemName,
  logoText = 'WMS',
  order,
  qrDataUrl,
  items,
}: OrderPrintTemplateProps) {
  const qrValue = order.qr_code || order.order_code
  const createdAtLabel = order.created_at ? new Date(order.created_at).toLocaleString('vi-VN') : '-'

  const grandTotal = items.reduce((sum, item) => {
    if (typeof item.line_total === 'number' && !Number.isNaN(item.line_total)) return sum + item.line_total
    return sum
  }, 0)

  return (
    <section className="order-print-root" aria-label="Order Print Template">
      <header className="order-print-header">
        <div className="order-print-brand">
          <div className="order-print-logo">{logoText}</div>
          <div>
            <h1>{systemName}</h1>
            <p>Phiếu đơn hàng</p>
          </div>
        </div>

        <div className="order-print-qr-wrap">
          <OrderQrCode value={qrValue} dataUrl={qrDataUrl} size={140} className="order-print-qr" />
          <p>{qrValue}</p>
        </div>
      </header>

      <section className="order-print-meta">
        <p><strong>Mã đơn:</strong> {order.order_code}</p>
        <p><strong>ID đơn hàng:</strong> #{order.id}</p>
        <p><strong>Khách hàng:</strong> {order.customer_name || '-'}</p>
        <p><strong>Số điện thoại:</strong> {order.customer_phone || '-'}</p>
        <p><strong>Địa chỉ:</strong> {order.customer_address || '-'}</p>
        <p><strong>Ngày tạo:</strong> {createdAtLabel}</p>
      </section>

      {/* Ghi chú: print template only shows finished products from order_items. */}
      <table className="order-print-table">
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
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="order-print-empty">Không có sản phẩm thành phẩm để in trên phiếu khách hàng.</td>
            </tr>
          )}

          {items.map((item, idx) => (
            <tr key={`${item.product_code}-${idx}`}>
              <td>{item.product_code || '-'}</td>
              <td>{item.product_name || '-'}</td>
              <td className="num">{item.quantity.toLocaleString('vi-VN')}</td>
              <td className="num">{formatMoney(item.unit_price)}</td>
              <td className="num">{formatMoney(item.line_total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="num"><strong>Tổng cộng</strong></td>
            <td className="num"><strong>{grandTotal > 0 ? formatMoney(grandTotal) : '-'}</strong></td>
          </tr>
        </tfoot>
      </table>
    </section>
  )
}
