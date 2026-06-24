package services

/*
Mo ta file:
- File nay chua business use-cases cho module 'auth'.
- Trach nhiem: validate/normalize input va dieu phoi repository calls.

Luong xu ly:
1) Nhan input typed tu handler.
2) Ap dung rule nghiep vu va mapping DTO.
3) Goi repository va tra ket qua/domain error len handler.

Cac ham chinh:
- NewAuthService
- Login

Luu y khi sua:
- Uu tien giu on dinh API contract va ten error message neu frontend dang phu thuoc.
*/

import (
	"errors"
	"strings"

	"quan_ly_kho/models"
	"quan_ly_kho/repositories"
	"quan_ly_kho/utils"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials         = errors.New("invalid credentials")
	ErrInvalidAuthPayload         = errors.New("username and password are required")
	ErrAccountLockedByFailedLogin = errors.New("account locked by failed login attempts")
)

const (
	maxFailedLoginAttempts = 10
)

type AuthService interface {
	Login(username, password string) (string, *models.User, error)
}

type authService struct {
	repo repositories.AuthRepository
}

func NewAuthService(repo repositories.AuthRepository) AuthService {
	return &authService{repo: repo}
}

func (s *authService) Login(username, password string) (string, *models.User, error) {
	username = strings.TrimSpace(username)
	if username == "" || password == "" {
		return "", nil, ErrInvalidAuthPayload
	}

	user, err := s.repo.FindActiveUserByUsername(username)
	if err != nil {
		if errors.Is(err, repositories.ErrUserNotFound) {
			return "", nil, ErrInvalidCredentials
		}
		return "", nil, err
	}

	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)) != nil {
		updatedUser, recordErr := s.repo.RecordFailedLogin(user.ID, maxFailedLoginAttempts)
		if recordErr != nil {
			return "", nil, recordErr
		}
		if !updatedUser.IsActive {
			return "", nil, ErrAccountLockedByFailedLogin
		}
		return "", nil, ErrInvalidCredentials
	}

	if err := s.repo.ResetLoginFailures(user.ID); err != nil {
		return "", nil, err
	}

	tokenVersion, err := s.repo.IncrementTokenVersion(user.ID)
	if err != nil {
		return "", nil, errors.New("failed to start login session")
	}
	user.TokenVersion = tokenVersion

	token, err := utils.GenerateToken(user.ID, user.Username, user.Role, user.TokenVersion)
	if err != nil {
		return "", nil, errors.New("failed to generate token")
	}

	return token, user, nil
}
