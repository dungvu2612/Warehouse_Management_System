import { Box, Card, CardContent, Chip, Paper, Stack, Typography } from '@mui/material'

function MetricCard({ title, value, tone }: { title: string; value: string; tone: 'warning' | 'secondary' | 'success' | 'error' }) {
  const toneMap = {
    warning: { bg: 'rgba(245, 158, 11, 0.08)', color: 'warning.main' },
    secondary: { bg: 'rgba(37, 99, 235, 0.08)', color: 'secondary.main' },
    success: { bg: 'rgba(16, 185, 129, 0.08)', color: 'success.main' },
    error: { bg: 'rgba(239, 68, 68, 0.08)', color: 'error.main' },
  } as const

  return (
    <Card>
      <CardContent>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.8 }}>
          {value}
        </Typography>
        <Box sx={{ mt: 1.3, p: 0.8, borderRadius: 2, bgcolor: toneMap[tone].bg, color: toneMap[tone].color, fontSize: 12, fontWeight: 800 }}>
          Realtime snapshot
        </Box>
      </CardContent>
    </Card>
  )
}

export function DashboardMock() {
  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2.5,
        }}
      >
        <MetricCard title="Đơn chờ xử lý" value="12" tone="warning" />
        <MetricCard title="Đơn đang picking" value="6" tone="secondary" />
        <MetricCard title="Đơn hoàn thành" value="48" tone="success" />
        <MetricCard title="Cảnh báo min stock" value="3" tone="error" />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '5fr 7fr' },
          gap: 2.5,
        }}
      >
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
            Cảnh báo tồn tối thiểu
          </Typography>
          <Stack spacing={1.2}>
            {['SCW-4MM', 'MTR-12V', 'BELT-M2'].map((code) => (
              <Box key={code} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #fecaca', bgcolor: 'rgba(239, 68, 68, 0.04)' }}>
                <Typography sx={{ fontWeight: 700 }}>{code}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Tồn hiện tại thấp hơn mức tối thiểu
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Luồng vận hành chuẩn
            </Typography>
            <Chip size="small" label="Admin-first" color="secondary" />
          </Box>
          <Stack spacing={1.2}>
            {[
              'Nhập kho: import receipt -> inventory -> stock transaction',
              'Tạo đơn: order PENDING -> scan QR -> sinh picking tasks',
              'Picking: xác thực khay -> xác nhận số lượng -> trừ tồn kho',
              'Hoàn tất: order COMPLETED -> đối soát logs và dashboard',
            ].map((text) => (
              <Box key={text} sx={{ p: 1.4, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                <Typography variant="body2">{text}</Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      </Box>
    </Stack>
  )
}

// Component placeholder dùng cho route chưa nối API thật.
export function PagePlaceholder({ title }: { title: string }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Trang này đã có khung UI theo phong cách mới và sẽ nối API backend ở bước tiếp theo.
      </Typography>
    </Paper>
  )
}
