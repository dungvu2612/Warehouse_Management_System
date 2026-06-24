package repositories

import (
	"errors"
	"strings"

	"quan_ly_kho/models"

	"gorm.io/gorm"
)

var (
	ErrUserEntityNotFound    = errors.New("user not found")
	ErrUsernameAlreadyExists = errors.New("username already exists")
)

type UserFilters struct {
	Search   string
	Role     string
	IsActive *bool
}

type UserRepository interface {
	FindAll(filters UserFilters) ([]models.User, error)
	FindByID(id uint) (*models.User, error)
	Create(user models.User) (*models.User, error)
	Update(user models.User) (*models.User, error)
	SetStatus(id uint, isActive bool) (*models.User, error)
	Delete(id uint) error
	ExistsByUsername(username string, excludeID *uint) (bool, error)
	CountActiveAdmins() (int64, error)
	HasHistory(userID uint) (bool, error)
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) FindAll(filters UserFilters) ([]models.User, error) {
	var users []models.User
	query := r.db.Model(&models.User{}).Order("id DESC")

	if filters.Search != "" {
		keyword := "%" + strings.ToLower(strings.TrimSpace(filters.Search)) + "%"
		query = query.Where("LOWER(username) LIKE ? OR LOWER(full_name) LIKE ?", keyword, keyword)
	}
	if filters.Role != "" {
		query = query.Where("role = ?", strings.ToUpper(strings.TrimSpace(filters.Role)))
	}
	if filters.IsActive != nil {
		query = query.Where("is_active = ?", *filters.IsActive)
	}

	if err := query.Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (r *userRepository) FindByID(id uint) (*models.User, error) {
	var user models.User
	if err := r.db.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserEntityNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) Create(user models.User) (*models.User, error) {
	if err := r.db.Create(&user).Error; err != nil {
		if isUniqueConstraintError(err) {
			return nil, ErrUsernameAlreadyExists
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) Update(user models.User) (*models.User, error) {
	if err := r.db.Save(&user).Error; err != nil {
		if isUniqueConstraintError(err) {
			return nil, ErrUsernameAlreadyExists
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) SetStatus(id uint, isActive bool) (*models.User, error) {
	user, err := r.FindByID(id)
	if err != nil {
		return nil, err
	}
	user.IsActive = isActive
	if isActive {
		user.FailedLoginAttempts = 0
	}
	return r.Update(*user)
}

func (r *userRepository) Delete(id uint) error {
	return r.db.Delete(&models.User{}, id).Error
}

func (r *userRepository) ExistsByUsername(username string, excludeID *uint) (bool, error) {
	var count int64
	query := r.db.Model(&models.User{}).Where("username = ?", username)
	if excludeID != nil && *excludeID > 0 {
		query = query.Where("id <> ?", *excludeID)
	}
	if err := query.Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *userRepository) CountActiveAdmins() (int64, error) {
	var count int64
	if err := r.db.Model(&models.User{}).Where("role = ? AND is_active = ?", "ADMIN", true).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *userRepository) HasHistory(userID uint) (bool, error) {
	var count int64
	err := r.db.Raw(`
		SELECT (
			COALESCE((SELECT COUNT(*) FROM pick_logs WHERE picked_by = ?), 0) +
			COALESCE((SELECT COUNT(*) FROM orders WHERE created_by = ?), 0) +
			COALESCE((SELECT COUNT(*) FROM stock_transactions WHERE created_by = ?), 0) +
			COALESCE((SELECT COUNT(*) FROM import_receipts WHERE created_by = ?), 0)
		) AS total
	`, userID, userID, userID, userID).Scan(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
