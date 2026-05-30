import { Paper, Typography } from '@mui/material'

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
