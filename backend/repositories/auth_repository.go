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
	"gorm.io/gorm/clause"
)

var ErrUserNotFound = errors.New("user not found")

type AuthRepository interface {
	FindActiveUserByUsername(username string) (*models.User, error)
	RecordFailedLogin(userID uint, maxAttempts int) (*models.User, error)
	ResetLoginFailures(userID uint) error
	IncrementTokenVersion(userID uint) (int, error)
}

type authRepository struct {
	db *gorm.DB
}

func NewAuthRepository(db *gorm.DB) AuthRepository {
	return &authRepository{db: db}
}

func (r *authRepository) FindActiveUserByUsername(username string) (*models.User, error) {
	var user models.User
	result := r.db.Where("username = ? AND is_active = ?", username, true).Limit(1).Find(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, ErrUserNotFound
	}
	return &user, nil
}

func (r *authRepository) RecordFailedLogin(userID uint, maxAttempts int) (*models.User, error) {
	var user models.User
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", userID).First(&user).Error; err != nil {
			return err
		}

		user.FailedLoginAttempts++
		updates := map[string]any{
			"failed_login_attempts": user.FailedLoginAttempts,
			"updated_at":            gorm.Expr("NOW()"),
		}
		if user.FailedLoginAttempts >= maxAttempts {
			user.IsActive = false
			updates["is_active"] = false
		}

		if err := tx.Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *authRepository) ResetLoginFailures(userID uint) error {
	return r.db.Model(&models.User{}).
		Where("id = ?", userID).
		Updates(map[string]any{
			"failed_login_attempts": 0,
			"updated_at":            gorm.Expr("NOW()"),
		}).Error
}

func (r *authRepository) IncrementTokenVersion(userID uint) (int, error) {
	var tokenVersion int
	if err := r.db.Raw(`
		UPDATE users
		SET token_version = token_version + 1,
			updated_at = NOW()
		WHERE id = ? AND is_active = TRUE
		RETURNING token_version
	`, userID).Scan(&tokenVersion).Error; err != nil {
		return 0, err
	}
	return tokenVersion, nil
}
