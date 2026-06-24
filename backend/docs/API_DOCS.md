# API Docs Web

Tài liệu Swagger/OpenAPI cho backend WMS dùng Go Echo.

## Cài Swagger CLI

```bash
go install github.com/swaggo/swag/cmd/swag@latest
```

Nếu shell chưa nhận lệnh `swag`, gọi trực tiếp:

```bash
$(go env GOPATH)/bin/swag --version
```

## Generate Docs

Chạy trong thư mục `backend`:

```bash
$(go env GOPATH)/bin/swag init -g cmd/main.go
```

Lệnh này sinh/cập nhật:

- `docs/docs.go`
- `docs/swagger.json`
- `docs/swagger.yaml`

## Build Frontend Và Chạy Một Cổng

Backend Echo sẽ serve thư mục `frontend/dist` nếu thư mục này tồn tại. Khi đó frontend, backend API và Swagger cùng chạy trên một cổng.

Chạy trong thư mục project `quan_ly_kho`:

```bash
npm run start
```

Hoặc chạy thủ công:

```bash
npm --prefix frontend run build
cd backend
go run ./cmd
```

Backend tự tìm static files ở:

- `../frontend/dist` nếu chạy từ `backend`
- `frontend/dist` nếu chạy từ project root
- `dist` nếu cấu hình deploy đặt dist cạnh binary

Có thể override bằng:

```bash
FRONTEND_DIST_DIR=/path/to/dist go run ./cmd
```

Port mặc định lấy từ `APP_PORT`, nếu không có thì dùng `8080`.

## Mở Swagger UI

```text
  http://localhost:8080/docs/index.html
```

Nếu chạy trong LAN theo `.env` hiện tại:

```text
http://192.168.110.166:8080/docs/index.html
```

Frontend production cũng mở cùng cổng:

```text
http://192.168.110.166:8080
```

Swagger UI hiện không yêu cầu đăng nhập để mở trong môi trường dev.

## Login Lấy Token

Gọi API:

```text
POST /auth/login
```

Body ví dụ:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response có `access_token`.

## Authorize JWT

Trong Swagger UI:

1. Bấm nút `Authorize`.
2. Nhập token theo dạng:

```text
Bearer <token>
```

3. Bấm `Authorize`.

Sau đó có thể gọi các API cần đăng nhập như `/products`, `/orders`, `/inventory`.

## Kiểm Tra Quyền

- `POST /auth/login` là public.
- Các API còn lại dùng `BearerAuth`.
- API ADMIN-only như `/users`, `POST /products`, `POST /orders` sẽ bị từ chối nếu token không đủ quyền theo middleware hiện tại.

## Lưu Ý Role

Code backend hiện dùng role `ADMIN` và `WAREHOUSE` trong middleware. Nếu nghiệp vụ gọi là STAFF, token/stored role cần được normalize hoặc đồng bộ với `WAREHOUSE` theo logic hiện tại của hệ thống.
