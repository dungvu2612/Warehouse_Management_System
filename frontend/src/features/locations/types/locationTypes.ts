/*
Senior Handover Note:
- File này định nghĩa contract type cho module Locations ở frontend, gồm create/update/delete.
- Phụ thuộc trực tiếp vào API schema của backend: GET/POST/PUT/DELETE /locations.
- Khi backend đổi tên field (ví dụ location_code/shelf/is_active), cần cập nhật type này trước để tránh lỗi lan sang hooks/components.
*/

export interface Location {
  id: number
  location_code: string
  shelf: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateLocationPayload {
  location_code: string
  shelf: string
  description: string
}

export interface UpdateLocationPayload {
  location_code: string
  shelf: string
  description: string
}
