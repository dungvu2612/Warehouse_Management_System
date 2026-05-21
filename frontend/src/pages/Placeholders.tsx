import { Alert, Paper, Typography } from '@mui/material'

// Component placeholder dùng tạm cho route chưa triển khai nghiệp vụ thật.
export function PagePlaceholder({ title }: { title: string }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
        {title}
      </Typography>
      <Alert severity="info">Trang này sẽ làm ở phần kế tiếp.</Alert>
    </Paper>
  )
}
