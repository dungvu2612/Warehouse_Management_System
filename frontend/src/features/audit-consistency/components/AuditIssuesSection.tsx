/*
Senior Handover Note:
- Purpose: Section D - hien thi danh sach warning/error/critical de supervisor uu tien xu ly.
- Dependencies: Nhan `issues` da duoc adapter map severity/source/title/message.
- Audit logic: Component render badge theo severity, khong tu phan loai lai.
- API assumptions: issue list co the rong khi audit OK.
- Maintenance notes: Badge color can de nhin nhanh muc do nghiem trong.
*/

import { Chip, Paper, Stack, Typography } from '@mui/material'
import type { AuditIssue } from '../types/auditConsistencyTypes'

interface AuditIssuesSectionProps {
  issues: AuditIssue[]
}

function severityColor(severity: AuditIssue['severity']): 'warning' | 'error' {
  return severity === 'WARNING' ? 'warning' : 'error'
}

export function AuditIssuesSection({ issues }: AuditIssuesSectionProps) {
  return (
    <Paper sx={{ p: 2.5, border: '1px solid #e2e8f0' }}>
      <Stack spacing={1.2}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
          D. Audit Issues
        </Typography>

        {issues.length === 0 && <Typography>Không phát hiện issue.</Typography>}

        {issues.map((issue) => (
          <Paper key={issue.id} variant="outlined" sx={{ p: 1.2 }}>
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Chip size="small" color={severityColor(issue.severity)} label={issue.severity} sx={{ fontWeight: 800 }} />
                <Chip size="small" label={issue.source} />
                <Typography sx={{ fontWeight: 800 }}>{issue.title}</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">{issue.message}</Typography>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Paper>
  )
}
