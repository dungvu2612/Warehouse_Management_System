/*
Senior Handover Note:
- Purpose: Quick actions theo role cho dashboard.
- Dependencies: React Router Link + role type.
- API contract: Khong goi API.
- Role access: ADMIN nhieu action; WAREHOUSE action kho; VIEWER chi xem report.
- Maintenance notes: Day la permission guard o UI, backend van la source of truth.
*/

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
  // Senior Handover: quick action permission guard block.
  const adminActions = [
    actionButton('Tạo sản phẩm', '/products'),
    actionButton('Tạo phiếu nhập', '/import-receipts'),
    actionButton('Điều chỉnh tồn kho', '/warehouse-overview'),
    actionButton('PDA Picking', '/pda/picking'),
    actionButton('Stocktaking', '/pda/stocktaking'),
    actionButton('Xem Orders Audit', '/orders'),
  ]

  const warehouseActions = [
    actionButton('PDA Picking', '/pda/picking'),
    actionButton('Tra cứu sản phẩm', '/pda/lookup'),
    actionButton('Stocktaking', '/pda/stocktaking'),
    actionButton('Điều chỉnh tồn kho', '/warehouse-overview'),
  ]

  const viewerActions = [actionButton('Xem báo cáo', '/dashboard')]

  const actions = role === 'ADMIN' ? adminActions : role === 'WAREHOUSE' ? warehouseActions : viewerActions

  return (
    <Paper sx={{ p: 2 }} variant="outlined">
      <Typography sx={{ fontWeight: 800, mb: 1.2 }}>Quick Actions</Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        {actions}
      </Stack>
    </Paper>
  )
}
