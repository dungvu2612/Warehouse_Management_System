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
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidAuthPayload = errors.New("username and password are required")
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
		return "", nil, ErrInvalidCredentials
	}

	token, err := utils.GenerateToken(user.ID, user.Username, user.Role)
	if err != nil {
		return "", nil, errors.New("failed to generate token")
	}

	return token, user, nil
}
