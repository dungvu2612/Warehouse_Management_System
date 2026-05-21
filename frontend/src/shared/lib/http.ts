import axios from 'axios'
import { env } from './env'
import { STORAGE_KEYS } from '../constants/storage'

// Tạo axios instance dùng chung cho toàn bộ API calls.
export const http = axios.create({
  // Mọi request sẽ tự prepend base URL này.
  baseURL: env.apiBaseUrl,
  // Timeout cơ bản để tránh request treo vô hạn.
  timeout: 15000,
})

// Interceptor request: chạy trước khi request được gửi đi.
http.interceptors.request.use((config) => {
  // Lấy token đã lưu sau login.
  const token = localStorage.getItem(STORAGE_KEYS.accessToken)

  // Nếu có token thì gắn Authorization header theo chuẩn Bearer.
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Trả config để axios tiếp tục gửi request.
  return config
})

// Interceptor response: xử lý response/error tập trung.
http.interceptors.response.use(
  // Nhánh thành công: trả response nguyên bản.
  (response) => response,
  // Nhánh lỗi: xử lý các case chung trước khi ném lỗi ra caller.
  (error) => {
    // Đọc HTTP status từ error response (nếu có).
    const status = error?.response?.status

    // Nếu backend báo 401 thì xem như token hết hạn/sai.
    if (status === 401) {
      // Xóa session local để tránh dùng token hỏng.
      localStorage.removeItem(STORAGE_KEYS.accessToken)
      localStorage.removeItem(STORAGE_KEYS.user)

      // Nếu không ở trang login thì ép quay về login.
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    // Luôn reject để component/hook phía trên còn hiển thị thông báo lỗi.
    return Promise.reject(error)
  },
)
