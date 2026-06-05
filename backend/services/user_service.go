package services

import (
	"errors"
	"strings"

	"quan_ly_kho/models"
	"quan_ly_kho/repositories"
	"quan_ly_kho/utils"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserInvalidID              = errors.New("invalid user id")
	ErrUserInvalidPayload         = errors.New("invalid user payload")
	ErrUserInvalidRole            = errors.New("invalid role")
	ErrUserPasswordTooShort       = errors.New("password must be at least 6 characters")
	ErrUserCannotDeleteSelf       = errors.New("cannot delete self")
	ErrUserCannotDisableLastAdmin = errors.New("cannot disable last admin")
)

type UserCreateInput struct {
	Username string
	Password string
	FullName string
	Role     string
	IsActive bool
}

type UserUpdateInput struct {
	UserID   uint
	FullName string
	Role     string
	IsActive bool
	Password string
}

type UserListQuery struct {
	Search      string
	Role        string
	IsActiveRaw string
}

type UserService interface {
	GetAll(query UserListQuery) ([]models.User, error)
	GetByID(id uint) (*models.User, error)
	Create(input UserCreateInput) (*models.User, error)
	Update(input UserUpdateInput) (*models.User, error)
	SetStatus(userID uint, isActive bool, currentUserID uint) (*models.User, error)
	Delete(userID uint, currentUserID uint) error
}

type userService struct {
	repo repositories.UserRepository
}

func NewUserService(repo repositories.UserRepository) UserService {
	return &userService{repo: repo}
}

func normalizeUserRole(role string) (string, error) {
	normalized := utils.NormalizeRole(role)
	if normalized != "ADMIN" && normalized != "WAREHOUSE" {
		return "", ErrUserInvalidRole
	}
	return normalized, nil
}

func roleToDB(role string) string {
	if role == "WAREHOUSE" {
		return "STAFF"
	}
	return role
}

func roleFromDB(role string) string {
	normalized := utils.NormalizeRole(role)
	if normalized == "STAFF" {
		return "WAREHOUSE"
	}
	return normalized
}

func normalizeUserForResponse(user *models.User) *models.User {
	if user == nil {
		return nil
	}
	clone := *user
	clone.Role = roleFromDB(clone.Role)
	return &clone
}

func normalizeUsersForResponse(users []models.User) []models.User {
	normalized := make([]models.User, 0, len(users))
	for _, user := range users {
		user.Role = roleFromDB(user.Role)
		normalized = append(normalized, user)
	}
	return normalized
}

func (s *userService) GetAll(query UserListQuery) ([]models.User, error) {
	var isActive *bool
	normalizedActive := strings.ToLower(strings.TrimSpace(query.IsActiveRaw))
	if normalizedActive == "true" {
		value := true
		isActive = &value
	}
	if normalizedActive == "false" {
		value := false
		isActive = &value
	}

	role := strings.TrimSpace(query.Role)
	if role != "" {
		normalizedRole, err := normalizeUserRole(role)
		if err != nil {
			return nil, err
		}
		role = roleToDB(normalizedRole)
	}

	users, err := s.repo.FindAll(repositories.UserFilters{
		Search:   query.Search,
		Role:     role,
		IsActive: isActive,
	})
	if err != nil {
		return nil, err
	}
	return normalizeUsersForResponse(users), nil
}

func (s *userService) GetByID(id uint) (*models.User, error) {
	if id == 0 {
		return nil, ErrUserInvalidID
	}
	user, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	return normalizeUserForResponse(user), nil
}

func (s *userService) Create(input UserCreateInput) (*models.User, error) {
	username := strings.TrimSpace(input.Username)
	password := strings.TrimSpace(input.Password)
	fullName := strings.TrimSpace(input.FullName)
	if username == "" || password == "" {
		return nil, ErrUserInvalidPayload
	}
	if len(password) < 6 {
		return nil, ErrUserPasswordTooShort
	}
	role, err := normalizeUserRole(input.Role)
	if err != nil {
		return nil, err
	}

	exists, err := s.repo.ExistsByUsername(username, nil)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, repositories.ErrUsernameAlreadyExists
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	created, err := s.repo.Create(models.User{
		Username:     username,
		PasswordHash: string(passwordHash),
		FullName:     fullName,
		Role:         roleToDB(role),
		IsActive:     input.IsActive,
	})
	if err != nil {
		return nil, err
	}
	return normalizeUserForResponse(created), nil
}

func (s *userService) Update(input UserUpdateInput) (*models.User, error) {
	if input.UserID == 0 {
		return nil, ErrUserInvalidID
	}
	role, err := normalizeUserRole(input.Role)
	if err != nil {
		return nil, err
	}

	user, err := s.repo.FindByID(input.UserID)
	if err != nil {
		return nil, err
	}

	if user.Role == "ADMIN" && role != "ADMIN" {
		adminCount, countErr := s.repo.CountActiveAdmins()
		if countErr != nil {
			return nil, countErr
		}
		if adminCount <= 1 && user.IsActive {
			return nil, ErrUserCannotDisableLastAdmin
		}
	}

	user.FullName = strings.TrimSpace(input.FullName)
	user.Role = roleToDB(role)
	user.IsActive = input.IsActive

	if strings.TrimSpace(input.Password) != "" {
		if len(strings.TrimSpace(input.Password)) < 6 {
			return nil, ErrUserPasswordTooShort
		}
		passwordHash, hashErr := bcrypt.GenerateFromPassword([]byte(strings.TrimSpace(input.Password)), bcrypt.DefaultCost)
		if hashErr != nil {
			return nil, hashErr
		}
		user.PasswordHash = string(passwordHash)
	}

	if user.Role == "ADMIN" && !user.IsActive {
		adminCount, countErr := s.repo.CountActiveAdmins()
		if countErr != nil {
			return nil, countErr
		}
		if adminCount <= 1 {
			return nil, ErrUserCannotDisableLastAdmin
		}
	}

	updated, updateErr := s.repo.Update(*user)
	if updateErr != nil {
		return nil, updateErr
	}
	return normalizeUserForResponse(updated), nil
}

func (s *userService) SetStatus(userID uint, isActive bool, currentUserID uint) (*models.User, error) {
	if userID == 0 {
		return nil, ErrUserInvalidID
	}
	if userID == currentUserID && !isActive {
		return nil, ErrUserCannotDeleteSelf
	}

	user, err := s.repo.FindByID(userID)
	if err != nil {
		return nil, err
	}
	if user.Role == "ADMIN" && !isActive {
		adminCount, countErr := s.repo.CountActiveAdmins()
		if countErr != nil {
			return nil, countErr
		}
		if adminCount <= 1 && user.IsActive {
			return nil, ErrUserCannotDisableLastAdmin
		}
	}

	updated, updateErr := s.repo.SetStatus(userID, isActive)
	if updateErr != nil {
		return nil, updateErr
	}
	return normalizeUserForResponse(updated), nil
}

func (s *userService) Delete(userID uint, currentUserID uint) error {
	if userID == 0 {
		return ErrUserInvalidID
	}
	if userID == currentUserID {
		return ErrUserCannotDeleteSelf
	}

	user, err := s.repo.FindByID(userID)
	if err != nil {
		return err
	}

	hasHistory, err := s.repo.HasHistory(userID)
	if err != nil {
		return err
	}

	if user.Role == "ADMIN" && user.IsActive {
		adminCount, countErr := s.repo.CountActiveAdmins()
		if countErr != nil {
			return countErr
		}
		if adminCount <= 1 {
			return ErrUserCannotDisableLastAdmin
		}
	}

	if hasHistory {
		_, statusErr := s.repo.SetStatus(userID, false)
		return statusErr
	}
	return s.repo.Delete(userID)
}
