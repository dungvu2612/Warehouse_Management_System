package repositories

/*
Mo ta file:
- File nay la data-access layer cho module 'auth'.
- Trach nhiem: query/transaction DB, lock row (neu can), map loi DB sang domain error.

Luong xu ly:
1) Nhan filter/input tu service.
2) Thuc thi thao tac GORM/SQL (co transaction neu nghiep vu nhieu buoc).
3) Tra model hoac domain error cho service.

Cac ham chinh:
- NewAuthRepository
- FindActiveUserByUsername

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"errors"

	"quan_ly_kho/models"

	"gorm.io/gorm"
)

var ErrUserNotFound = errors.New("user not found")

type AuthRepository interface {
	FindActiveUserByUsername(username string) (*models.User, error)
}

type authRepository struct {
	db *gorm.DB
}

func NewAuthRepository(db *gorm.DB) AuthRepository {
	return &authRepository{db: db}
}

func (r *authRepository) FindActiveUserByUsername(username string) (*models.User, error) {
	var user models.User
	if err := r.db.Where("username = ? AND is_active = ?", username, true).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}
