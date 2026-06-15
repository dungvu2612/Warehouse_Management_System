# WMS Ubuntu 24.04 Service Runbook

File này ghi lại quy trình từ đầu tới cuối để chạy WMS trên Ubuntu 24.04 bằng service.

Kết quả sau deploy:

- Nginx serve frontend tại `http://IP-UBUNTU`.
- Frontend gọi API qua `/api`.
- Nginx proxy `/api` về backend Go/Echo ở `127.0.0.1:8080`.
- Nginx proxy `/docs` về Swagger UI.
- Backend chạy nền bằng `systemd`.
- PostgreSQL chạy trên Ubuntu.

## 1. Thông tin project

- Backend entrypoint: `backend/cmd/main.go`
- Backend port: `APP_PORT`, mặc định `8080`
- Backend route thật không có prefix `/api`: `/auth`, `/products`, `/orders`, `/staff`, ...
- Health check backend: `GET /health`
- Swagger UI backend: `GET /docs/index.html`
- Frontend: `frontend/`
- Frontend build output: `frontend/dist`
- Frontend production API base: `VITE_API_BASE_URL=/api`
- Database production đang dùng trong hướng dẫn: `quan_ly_kho_VNA`

## 2. Build trên Mac

Chạy trên Mac trong thư mục project:

```bash
cd /Users/vutandung/Documents/VNATech1/VNATech/quan_ly_kho
```

Nếu Ubuntu VM chạy ARM64 trên Mac Apple Silicon:

```bash
./deploy/linux/build-linux.sh arm64
```

Nếu Ubuntu server Intel/AMD:

```bash
./deploy/linux/build-linux.sh amd64
```

Output cần có:

```bash
ls -lh release/linux/backend/wms-backend-linux
ls release/linux/frontend/dist
```

Nếu frontend build lỗi Node/Vite, đổi Node:

```bash
nvm install 22
nvm use 22
node -v
./deploy/linux/build-linux.sh arm64
```

## 3. Export database trên Mac

Kiểm tra DB name trong `backend/.env`. Dự án này đang dùng:

```env
DB_NAME=quan_ly_kho_VNA
```

Nếu `pg_dump` bị mismatch version, dùng `pg_dump` cùng version PostgreSQL server.

Ví dụ Postgres.app 17:

```bash
/Applications/Postgres.app/Contents/Versions/17/bin/pg_dump -U postgres -d quan_ly_kho_VNA > full_backup.sql
```

Hoặc nếu `pg_dump` đúng version trong PATH:

```bash
pg_dump -U postgres -d quan_ly_kho_VNA > full_backup.sql
```

Kiểm tra backup:

```bash
ls -lh full_backup.sql
```

## 4. Copy release sang Ubuntu

Lấy IP Ubuntu:

```bash
hostname -I
```

Nếu dùng UTM Shared Network, IP thường là `192.168.64.2` và chỉ Mac host vào được.

Nếu muốn máy khác cùng Wi-Fi vào được, dùng UTM Bridged, rồi lấy IP mới cùng dải Wi-Fi.

Chạy trên Mac:

```bash
cd /Users/vutandung/Documents/VNATech1/VNATech/quan_ly_kho
rsync -av release deploy full_backup.sql USER@IP-UBUNTU:~/wms
```

Ví dụ:

```bash
rsync -av release deploy full_backup.sql dungvu@192.168.1.25:~/wms
```

Nếu dùng `scp` mà gặp lỗi `subsystem request failed`, dùng legacy mode:

```bash
scp -O -r release deploy full_backup.sql USER@IP-UBUNTU:~/wms
```

Nếu SSH báo host key changed:

```bash
ssh-keygen -R IP-UBUNTU
ssh USER@IP-UBUNTU
```

## 5. Cài package trên Ubuntu

Chạy trên Ubuntu:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib nginx curl openssh-server -y
sudo systemctl enable postgresql
sudo systemctl enable nginx
sudo systemctl enable ssh
```

## 6. Import database trên Ubuntu

Chạy trên Ubuntu:

```bash
sudo systemctl stop wms-backend 2>/dev/null || true
sudo -u postgres dropdb quan_ly_kho_VNA 2>/dev/null || true
sudo -u postgres createdb quan_ly_kho_VNA
sudo mkdir -p /opt/wms/database
sudo cp ~/wms/full_backup.sql /opt/wms/database/full_backup.sql
sudo -u postgres psql -d quan_ly_kho_VNA -f /opt/wms/database/full_backup.sql
```

Kiểm tra có bảng:

```bash
sudo -u postgres psql -d quan_ly_kho_VNA -c "\dt"
```

Phải thấy các bảng như `products`, `orders`, `inventory`, ...

Đặt password cho user postgres để backend kết nối TCP:

```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

## 7. Cài backend service và Nginx

Chạy trên Ubuntu:

```bash
cd ~/wms
./deploy/linux/install-ubuntu.sh
```

Script sẽ copy:

- Backend binary vào `/opt/wms/backend/wms-backend-linux`
- Frontend dist vào `/opt/wms/frontend/dist`
- Env mẫu vào `/opt/wms/backend/.env` nếu chưa có
- Service vào `/etc/systemd/system/wms-backend.service`
- Nginx site vào `/etc/nginx/sites-available/wms`

Tắt Nginx default site:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sfn /etc/nginx/sites-available/wms /etc/nginx/sites-enabled/wms
sudo nginx -t
sudo systemctl restart nginx
```

## 8. Ghi file env production

Chạy trên Ubuntu. Thay `IP-UBUNTU` bằng IP hiện tại của Ubuntu.

```bash
sudo tee /opt/wms/backend/.env > /dev/null <<'EOF'
APP_ENV=production
APP_HOST=127.0.0.1
APP_PORT=8080

FRONTEND_DIST_DIR=/opt/wms/frontend/dist
CORS_ALLOWED_ORIGINS=http://localhost,http://IP-UBUNTU
WS_ALLOWED_ORIGINS=http://localhost,http://IP-UBUNTU

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=quan_ly_kho_VNA
DB_SSLMODE=disable

JWT_SECRET=wms_prod_2026_change_this_to_long_random_string
JWT_EXPIRES_HOURS=24
EOF
```

Sửa lại IP bằng `sed`, ví dụ IP là `192.168.1.25`:

```bash
sudo sed -i 's/IP-UBUNTU/192.168.1.25/g' /opt/wms/backend/.env
```

Kiểm tra:

```bash
sudo cat /opt/wms/backend/.env
```

## 9. Start và kiểm tra service

```bash
sudo systemctl daemon-reload
sudo systemctl enable wms-backend
sudo systemctl restart wms-backend
sudo systemctl status wms-backend --no-pager
```

Kiểm tra Nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status nginx --no-pager
```

Test backend trực tiếp:

```bash
curl http://127.0.0.1:8080/health
```

Test API qua Nginx:

```bash
curl http://localhost/api/health
```

Kết quả đúng:

```json
{"message":"Server running"}
```

Test frontend:

```bash
curl http://localhost | head
```

Phải thấy HTML có asset Vite:

```html
<script type="module" crossorigin src="/assets/...
```

Mở từ Mac hoặc máy khác:

```text
http://IP-UBUNTU
```

API docs:

```text
http://IP-UBUNTU/docs/index.html
```

## 10. Kiểm tra auto-start sau reboot

```bash
sudo systemctl is-enabled postgresql
sudo systemctl is-enabled nginx
sudo systemctl is-enabled wms-backend
```

Nếu chưa enabled:

```bash
sudo systemctl enable postgresql
sudo systemctl enable nginx
sudo systemctl enable wms-backend
```

Reboot test:

```bash
sudo reboot
```

Sau khi VM lên lại:

```bash
hostname -I
sudo systemctl status postgresql --no-pager
sudo systemctl status nginx --no-pager
sudo systemctl status wms-backend --no-pager
curl http://localhost/api/health
```

## 11. Đổi network để máy khác cùng Wi-Fi vào được

Nếu IP là `192.168.64.2`, đó là UTM Shared/NAT. Thường chỉ Mac host vào được.

Muốn máy khác cùng Wi-Fi vào:

1. Tắt VM.
2. UTM Settings -> Network.
3. `Network Mode`: `Bridged (Advanced)`.
4. `Bridged Interface`: Wi-Fi của Mac, thường là `Wi-Fi (en0)`.
5. Start VM.

Kiểm tra interface Wi-Fi trên Mac:

```bash
networksetup -listallhardwareports
```

Tìm:

```text
Hardware Port: Wi-Fi
Device: en0
```

Trong Ubuntu, dùng DHCP:

```bash
sudo nano /etc/netplan/50-cloud-init.yaml
```

Nội dung tối thiểu:

```yaml
network:
  version: 2
  ethernets:
    enp0s1:
      dhcp4: true
```

Lưu trong nano:

- `Ctrl + O`
- `Enter`
- `Ctrl + X`

Apply:

```bash
sudo netplan apply
hostname -I
ip route
```

Nếu IP vẫn cũ:

```bash
sudo systemctl restart NetworkManager 2>/dev/null || true
sudo netplan apply
hostname -I
```

Khi đúng Bridged, IP không còn `192.168.64.x`, mà cùng dải Wi-Fi thật, ví dụ `192.168.1.x`.

Mở firewall nếu cần:

```bash
sudo ufw allow 80
sudo ufw allow 22
sudo ufw status
```

Sau đổi IP, cập nhật env:

```bash
NEW_IP="192.168.1.25"
sudo sed -i "s#^CORS_ALLOWED_ORIGINS=.*#CORS_ALLOWED_ORIGINS=http://localhost,http://$NEW_IP#" /opt/wms/backend/.env
sudo sed -i "s#^WS_ALLOWED_ORIGINS=.*#WS_ALLOWED_ORIGINS=http://localhost,http://$NEW_IP#" /opt/wms/backend/.env
sudo systemctl restart wms-backend
```

## 12. Lệnh quản lý service hằng ngày

Kiểm tra:

```bash
sudo systemctl status nginx --no-pager
sudo systemctl status wms-backend --no-pager
sudo systemctl status postgresql --no-pager
```

Start:

```bash
sudo systemctl start nginx
sudo systemctl start wms-backend
sudo systemctl start postgresql
```

Restart:

```bash
sudo systemctl restart nginx
sudo systemctl restart wms-backend
sudo systemctl restart postgresql
```

Logs backend:

```bash
journalctl -u wms-backend -f
journalctl -u wms-backend -n 100 --no-pager
```

Kiểm tra port:

```bash
sudo ss -tlnp | grep -E ':80|:8080|:5432'
```

## 13. Lỗi thường gặp và cách sửa

### Nginx hiện "Welcome to nginx"

Default site đang được ưu tiên.

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sfn /etc/nginx/sites-available/wms /etc/nginx/sites-enabled/wms
sudo nginx -t
sudo systemctl restart nginx
curl http://localhost | head
```

### `Unit wms-backend.service could not be found`

Service chưa được cài hoặc đang boot nhầm Ubuntu.

```bash
ls -lh /opt/wms
ls -lh ~/wms
cd ~/wms
./deploy/linux/install-ubuntu.sh
sudo systemctl restart wms-backend
```

Nếu `/opt/wms` và `~/wms` đều không có, copy lại từ Mac bằng `rsync`.

### `/tmp/wms` bị mất sau reboot

`/tmp` có thể bị dọn. Copy vào home thay vì `/tmp`:

```bash
rsync -av release deploy full_backup.sql USER@IP-UBUNTU:~/wms
```

### Backend chết với lỗi `relation "products" does not exist`

Database trống hoặc chưa import backup.

```bash
sudo systemctl stop wms-backend
sudo -u postgres dropdb quan_ly_kho_VNA 2>/dev/null || true
sudo -u postgres createdb quan_ly_kho_VNA
sudo -u postgres psql -d quan_ly_kho_VNA -f ~/wms/full_backup.sql
sudo -u postgres psql -d quan_ly_kho_VNA -c "\dt"
sudo systemctl restart wms-backend
```

### Backend không connect DB

Kiểm tra env:

```bash
sudo cat /opt/wms/backend/.env
```

Đặt password postgres:

```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=postgres/' /opt/wms/backend/.env
sudo systemctl restart wms-backend
```

### `curl http://localhost/api/health` trả 502

Nginx chạy nhưng backend chết.

```bash
sudo systemctl status wms-backend --no-pager
journalctl -u wms-backend -n 100 --no-pager
curl http://127.0.0.1:8080/health
```

### `curl http://localhost/api/health` trả 404

Nginx đang dùng default site hoặc config `/api` chưa đúng.

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sfn /etc/nginx/sites-available/wms /etc/nginx/sites-enabled/wms
sudo nginx -t
sudo systemctl restart nginx
```

### SSH báo `Connection refused`

SSH server chưa chạy:

```bash
sudo apt install openssh-server -y
sudo systemctl enable ssh
sudo systemctl start ssh
sudo systemctl status ssh --no-pager
```

### SSH báo `REMOTE HOST IDENTIFICATION HAS CHANGED`

Mac đang lưu host key cũ:

```bash
ssh-keygen -R IP-UBUNTU
ssh USER@IP-UBUNTU
```

### Quên password Ubuntu

Nếu còn vào console UTM:

```bash
sudo passwd USER
```

Nếu đang boot vào installer, gỡ ISO trong UTM Settings -> Drives, giữ lại VirtIO Drive.

### Boot vào `Try or Install Ubuntu`

VM đang boot từ ISO installer.

Trong UTM Settings -> Drives:

- Giữ `VirtIO Drive`.
- Gỡ/eject `USB Drive` hoặc ISO Ubuntu installer.

Start lại VM.

### Máy khác cùng Wi-Fi không vào được

Nếu Ubuntu IP là `192.168.64.x`, đó là UTM Shared/NAT. Đổi sang Bridged như mục 11.

### API docs không mở bằng IP

Kiểm tra Nginx có location `/docs/`:

```bash
sudo grep -n "location /docs" -A8 /etc/nginx/sites-available/wms
sudo nginx -t
sudo systemctl restart nginx
```

Mở:

```text
http://IP-UBUNTU/docs/index.html
```

## 14. Checklist cuối

- `curl http://127.0.0.1:8080/health` OK.
- `curl http://localhost/api/health` OK.
- `curl http://localhost | head` ra HTML frontend.
- `http://IP-UBUNTU` mở web OK.
- `http://IP-UBUNTU/docs/index.html` mở Swagger OK.
- Login được.
- Tạo phiếu nhập/task nhập kho OK.
- Tạo đơn/task nhặt hàng OK.
- `nginx`, `wms-backend`, `postgresql` đều `enabled`.
- Máy khác cùng Wi-Fi vào được nếu VM dùng Bridged.
