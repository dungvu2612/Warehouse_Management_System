# Database Guide - WMS Ubuntu

Tài liệu này hướng dẫn cài PostgreSQL và import database cho WMS trên Ubuntu 24.04.

## 1. Cài PostgreSQL

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

## 2. Tạo database

```bash
sudo -u postgres createdb quan_ly_kho
```

Nếu cần tạo user riêng:

```bash
sudo -u postgres psql
CREATE USER wms_user WITH PASSWORD 'change_me';
ALTER DATABASE quan_ly_kho OWNER TO wms_user;
\q
```

Sau đó cập nhật `/opt/wms/backend/.env`.

## 3. Export từ máy dev

Full backup:

```bash
pg_dump -U postgres -d quan_ly_kho > full_backup.sql
```

Chỉ schema:

```bash
pg_dump -U postgres -d quan_ly_kho --schema-only > schema.sql
```

Chỉ data:

```bash
pg_dump -U postgres -d quan_ly_kho --data-only > seed.sql
```

## 4. Copy backup lên Ubuntu

```bash
sudo mkdir -p /opt/wms/database
sudo cp full_backup.sql /opt/wms/database/full_backup.sql
```

## 5. Import database

```bash
sudo -u postgres psql -d quan_ly_kho -f /opt/wms/database/full_backup.sql
```

Nếu dùng user riêng và file có owner từ máy dev, có thể restore bằng:

```bash
sudo -u postgres psql -d quan_ly_kho -f /opt/wms/database/full_backup.sql
```

Rồi kiểm tra:

```bash
sudo -u postgres psql -d quan_ly_kho -c "\dt"
```

## Ghi chú

- Không đưa dữ liệu nhạy cảm vào backup nếu không cần.
- Không commit file `full_backup.sql` nếu chứa dữ liệu thật.
- Backend hiện có migration idempotent khi khởi động, nhưng database production vẫn nên được backup trước khi nâng cấp.
