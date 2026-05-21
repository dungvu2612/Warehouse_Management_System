import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/authApi'
import { useAuth } from '../../../app/providers/AuthProvider'

// Trang đăng nhập: hệ thống quản trị kho chỉ cho admin tạo user,
// nên frontend chỉ giữ luồng login.
export function LoginPage() {
  const navigate = useNavigate()
  const { loginSuccess } = useAuth()

  // State form.
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // State UI.
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Submit form login.
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập username và password')
      return
    }

    try {
      setLoading(true)

      // Gọi API login.
      const data = await authApi.login({ username: username.trim(), password })

      // Lưu token/user vào context + localStorage.
      loginSuccess(data)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: 2,
        background: 'linear-gradient(135deg, #f5f7fb 0%, #e8eef8 100%)',
      }}
    >
      <Paper sx={{ width: 440, maxWidth: '100%', p: 3.5 }} elevation={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
          Đăng nhập WMS
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Tài khoản được tạo bởi ADMIN hệ thống.
        </Typography>

        <Stack component="form" spacing={2} onSubmit={onSubmit}>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
          />

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    {/* Nút mắt: bật/tắt hiển thị mật khẩu để user nhập dễ hơn */}
                    <IconButton
                      edge="end"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label="toggle password visibility"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {error && <Alert severity="error">{error}</Alert>}

          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
