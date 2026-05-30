/*
Senior Handover Note:
- Purpose: Hien thi suc khoe ton kho (healthy/low/out).
- Dependencies: DashboardInventoryHealth.
- API contract: warehouse_operations.inventory_health.
- Role access: ADMIN/WAREHOUSE/VIEWER.
- Maintenance notes: Nhom metric read-only cho supervisor.
*/

import { Box, Card, CardContent, Typography } from '@mui/material'
import type { DashboardInventoryHealth } from '../types/dashboard.types'

export function InventoryHealth({ data }: { data: DashboardInventoryHealth }) {
  const cards = [
    { label: 'Sản phẩm khỏe', value: data.healthy_products },
    { label: 'Low stock', value: data.low_stock_products },
    { label: 'Hết hàng', value: data.out_of_stock_products },
  ]

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.2 }}>
      {cards.map((card) => (
        <Card key={card.label} variant="outlined">
          <CardContent>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
              {card.label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, mt: 0.4 }}>
              {card.value}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}
