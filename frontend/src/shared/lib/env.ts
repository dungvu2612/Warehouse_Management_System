// Gom cấu hình môi trường frontend tại một chỗ.
export const env = {
  // URL backend. Ưu tiên lấy từ .env để đổi môi trường dễ dàng.
  // Production mặc định đi qua Nginx /api, dev fallback về backend local.
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8080'),
}
