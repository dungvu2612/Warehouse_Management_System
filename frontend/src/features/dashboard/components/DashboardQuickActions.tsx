/* Quick actions theo vai trò trên dashboard. */

import { Button, Paper, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import type { DashboardRole } from '../types/dashboard.types'

function actionButton(label: string, to: string) {
  return (
    <Button key={to} component={RouterLink} to={to} variant="outlined" size="small">
      {label}
    </Button>
  )
}

export function DashboardQuickActions({ role }: { role: DashboardRole }) {
  const adminActions = [
    actionButton('Tạo sản phẩm', '/products'),
    actionButton('Tạo phiếu nhập', '/import-receipts'),
    actionButton('Điều chỉnh tồn kho', '/warehouse-overview'),
    actionButton('PDA nhặt hàng', '/pda/picking'),
    actionButton('Kiểm kê', '/pda/stocktaking'),
    actionButton('Xem Orders Audit', '/orders'),
  ]

  const warehouseActions = [
    actionButton('PDA nhặt hàng', '/pda/picking'),
    actionButton('Tra cứu sản phẩm', '/pda/lookup'),
    actionButton('Kiểm kê', '/pda/stocktaking'),
    actionButton('Điều chỉnh tồn kho', '/warehouse-overview'),
  ]

  const actions = role === 'ADMIN' ? adminActions : warehouseActions

  return (
    <Paper sx={{ p: 2 }} variant="outlined">
      <Typography sx={{ fontWeight: 800, mb: 1.2 }}>Thao tác nhanh</Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        {actions}
      </Stack>
    </Paper>
  )
}
