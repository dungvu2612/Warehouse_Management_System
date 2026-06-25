import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
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
import { useAuth } from '../../../app/providers/useAuth'
import { getApiErrorInfo } from '../../../shared/lib/apiError'

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
  const [rateLimitRemaining, setRateLimitRemaining] = useState(0)

  useEffect(() => {
    if (rateLimitRemaining <= 0) return undefined
    const timer = window.setInterval(() => {
      setRateLimitRemaining((current) => Math.max(current - 1, 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [rateLimitRemaining])

  // Submit form login.
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (rateLimitRemaining > 0) {
      setError(`IP đang bị khóa đăng nhập. Vui lòng thử lại sau ${formatRemainingTime(rateLimitRemaining)}.`)
      return
    }

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
    } catch (err: unknown) {
      const errorInfo = getApiErrorInfo(err)
      if (errorInfo.code === 'ACCOUNT_LOCKED_BY_FAILED_LOGIN') {
        setError('Tài khoản đã bị khóa do nhập sai mật khẩu quá nhiều lần. Vui lòng liên hệ Admin để mở khóa.')
        return
      }
      if (errorInfo.code === 'LOGIN_RATE_LIMITED') {
        const retryAfter = Math.max(errorInfo.retryAfterSeconds || 600, 0)
        setRateLimitRemaining(retryAfter)
        setError(`Bạn đã đăng nhập sai quá 15 lần. Vui lòng thử lại sau ${formatRemainingTime(retryAfter)}.`)
        return
      }
      setError(errorInfo.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        p: { xs: 2, md: 3 },
        background: 'linear-gradient(135deg, #e2e8f0 0%, #f8fafc 45%, #dbeafe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 980,
          minHeight: 560,
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
          bgcolor: 'white',
        }}
      >
        {/* Khối trái: branding + mô tả ngữ cảnh nghiệp vụ */}
        <Box
          sx={{
            p: { xs: 3, md: 5 },
            background: 'linear-gradient(165deg, #0f172a 0%, #1e293b 55%, #2563eb 130%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Chip label="WMS ENTERPRISE" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'white', fontWeight: 800 }} />
            
    
          </Box>

          <Stack spacing={1.2} sx={{ mt: 4 }}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Theo dõi tồn kho, quản lý BOM, điều phối picking và kiểm toán giao dịch trong một hệ thống tập trung.
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Đăng nhập này dành cho tài khoản do ADMIN cấp phát.
            </Typography>
          </Stack>
        </Box>

        {/* Khối phải: form đăng nhập */}
        <Box sx={{ p: { xs: 3, md: 5 }, display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '100%' }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }} gutterBottom>
              Đăng nhập hệ thống
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Vui lòng nhập thông tin tài khoản để tiếp tục.
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
              {rateLimitRemaining > 0 && (
                <Alert severity="warning">
                  IP đang bị khóa đăng nhập. Còn {formatRemainingTime(rateLimitRemaining)} để thử lại.
                </Alert>
              )}

              <Button type="submit" variant="contained" size="large" disabled={loading || rateLimitRemaining > 0} sx={{ py: 1.2 }}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}

function formatRemainingTime(totalSeconds: number) {
  const seconds = Math.max(Math.ceil(totalSeconds), 0)
  const minutesPart = Math.floor(seconds / 60)
  const secondsPart = seconds % 60
  return `${minutesPart}:${secondsPart.toString().padStart(2, '0')}`
}
