/*
- Mục đích: KPI cards cho Warehouse Operations Dashboard.
- Phụ thuộc: DashboardWarehouseOperations type.
- Hợp đồng API: các field tổng hợp warehouse_operations.
- Role access: ADMIN/WAREHOUSE.
- Ghi chú bảo trì: Card values chỉ xem, khong trigger action.
*/

import { Box, Card, CardContent, Typography } from '@mui/material'
import type { DashboardWarehouseOperations } from '../types/dashboard.types'

export function WarehouseSummaryCards({ data }: { data: DashboardWarehouseOperations }) {
  const cards = [
    { label: 'Đơn chờ xử lý', value: data.pending_orders },
    { label: 'Đơn đang picking', value: data.picking_orders },
    { label: 'Hoàn tất hôm nay', value: data.completed_today },
    { label: 'Sản phẩm low stock', value: data.low_stock_products },
    { label: 'Tổng tồn kho', value: data.total_inventory_quantity },
    { label: 'Khay active', value: data.active_trays },
  ]

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
      {cards.map((card) => (
        <Card key={card.label} variant="outlined">
          <CardContent>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
              {card.label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, mt: 0.5 }}>
              {card.value}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}
