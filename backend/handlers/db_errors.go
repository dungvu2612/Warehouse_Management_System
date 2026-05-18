package handlers

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
