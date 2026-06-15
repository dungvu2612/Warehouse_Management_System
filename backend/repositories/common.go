package repositories

/*
Mo ta file:
- File nay la data-access layer cho module 'common'.
- Trach nhiem: query/transaction DB, lock row (neu can), map loi DB sang domain error.

Luong xu ly:
1) Nhan filter/input tu service.
2) Thuc thi thao tac GORM/SQL (co transaction neu nghiep vu nhieu buoc).
3) Tra model hoac domain error cho service.

Cac ham chinh:
- isUniqueConstraintError

Luu y khi sua:
- Utility file: uu tien giu behavior backward-compatible vi duoc dung o nhieu module.
*/

import (
	"errors"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
)

// DBTX gom các method GORM cần dùng tại repository.
// Mục tiêu: dễ mock/đổi impl mà không dính chặt vào *gorm.DB ở chữ ký interface.
type DBTX interface {
	Create(value interface{}) *gorm.DB
	Where(query interface{}, args ...interface{}) *gorm.DB
	Find(dest interface{}, conds ...interface{}) *gorm.DB
	First(dest interface{}, conds ...interface{}) *gorm.DB
	Save(value interface{}) *gorm.DB
	Model(value interface{}) *gorm.DB
	Update(column string, value interface{}) *gorm.DB
	Order(value interface{}) *gorm.DB
	Limit(limit int) *gorm.DB
	Preload(query string, args ...interface{}) *gorm.DB
	Raw(sql string, values ...interface{}) *gorm.DB
	Select(query interface{}, args ...interface{}) *gorm.DB
	Scan(dest interface{}) *gorm.DB
}

var (
	ErrLocationCodeExists = errors.New("location_code already exists")
	ErrTrayCodeExists     = errors.New("tray_code already exists")
)

func isUniqueConstraintError(err error) bool {
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return true
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return true
	}

	return strings.Contains(err.Error(), "duplicate key value violates unique constraint")
}
