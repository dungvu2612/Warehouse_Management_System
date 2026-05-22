package handlers

/*
Mo ta file:
- File nay la transport layer HTTP cho module 'db_errors'.
- Trach nhiem: bind request, parse params, goi service, map domain error sang status code.

Luong xu ly:
1) Nhan request tu router va validate input o muc API.
2) Goi service use-case tuong ung.
3) Tra JSON response nhat quan cho frontend/PDA.

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

// Kiểm tra lỗi unique key từ PostgreSQL/GORM để trả 409 đúng nghĩa.
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
