// Gom cấu hình môi trường frontend tại một chỗ.
export const env = {
  // URL backend. Ưu tiên lấy từ .env để đổi môi trường dễ dàng.
  // Nếu chưa có biến môi trường thì fallback localhost cho local dev.
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
}
