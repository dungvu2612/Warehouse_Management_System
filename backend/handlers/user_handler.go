package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"quan_ly_kho/repositories"
	"quan_ly_kho/services"

	"github.com/labstack/echo/v4"
)

type UserHandler struct {
	service services.UserService
}

type createUserRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	FullName string `json:"full_name"`
	Role     string `json:"role" binding:"required"`
	IsActive *bool  `json:"is_active"`
}

type updateUserRequest struct {
	FullName string `json:"full_name"`
	Role     string `json:"role" binding:"required"`
	IsActive *bool  `json:"is_active"`
	Password string `json:"password"`
}

type updateStatusRequest struct {
	IsActive bool `json:"is_active"`
}

func NewUserHandler(service services.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func parseUserID(c echo.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error_code": "INVALID_USER_ID", "error": "ID người dùng không hợp lệ"})
		return 0, false
	}
	return uint(id), true
}

func mapUserError(c echo.Context, err error) {
	switch {
	case errors.Is(err, repositories.ErrUsernameAlreadyExists):
		c.JSON(http.StatusConflict, echo.Map{"error_code": "USERNAME_ALREADY_EXISTS", "error": "Tên đăng nhập đã tồn tại"})
	case errors.Is(err, repositories.ErrUserEntityNotFound):
		c.JSON(http.StatusNotFound, echo.Map{"error_code": "USER_NOT_FOUND", "error": "Không tìm thấy tài khoản"})
	case errors.Is(err, services.ErrUserInvalidRole):
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error_code": "INVALID_ROLE", "error": "Vai trò không hợp lệ"})
	case errors.Is(err, services.ErrUserPasswordTooShort):
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error_code": "PASSWORD_TOO_SHORT", "error": "Mật khẩu phải có ít nhất 6 ký tự"})
	case errors.Is(err, services.ErrUserCannotDisableLastAdmin):
		c.JSON(http.StatusConflict, echo.Map{"error_code": "CANNOT_DISABLE_LAST_ADMIN", "error": "Không thể khóa admin cuối cùng"})
	case errors.Is(err, services.ErrUserCannotDeleteSelf):
		c.JSON(http.StatusConflict, echo.Map{"error_code": "CANNOT_DELETE_SELF", "error": "Không thể xóa chính tài khoản đang đăng nhập"})
	case errors.Is(err, services.ErrUserInvalidPayload), errors.Is(err, services.ErrUserInvalidID):
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
}

func (h *UserHandler) GetUsers(c echo.Context) {
	users, err := h.service.GetAll(services.UserListQuery{
		Search:      c.QueryParam("search"),
		Role:        c.QueryParam("role"),
		IsActiveRaw: c.QueryParam("is_active"),
	})
	if err != nil {
		mapUserError(c, err)
		return
	}
	c.JSON(http.StatusOK, users)
}

func (h *UserHandler) GetUserByID(c echo.Context) {
	userID, ok := parseUserID(c)
	if !ok {
		return
	}
	user, err := h.service.GetByID(userID)
	if err != nil {
		mapUserError(c, err)
		return
	}
	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) CreateUser(c echo.Context) {
	var req createUserRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	user, err := h.service.Create(services.UserCreateInput{
		Username: req.Username,
		Password: req.Password,
		FullName: req.FullName,
		Role:     req.Role,
		IsActive: isActive,
	})
	if err != nil {
		mapUserError(c, err)
		return
	}
	c.JSON(http.StatusCreated, user)
}

func (h *UserHandler) UpdateUser(c echo.Context) {
	userID, ok := parseUserID(c)
	if !ok {
		return
	}
	var req updateUserRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	user, err := h.service.Update(services.UserUpdateInput{
		UserID:   userID,
		FullName: req.FullName,
		Role:     req.Role,
		IsActive: isActive,
		Password: req.Password,
	})
	if err != nil {
		mapUserError(c, err)
		return
	}
	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateUserStatus(c echo.Context) {
	userID, ok := parseUserID(c)
	if !ok {
		return
	}
	var req updateStatusRequest
	if err := c.Bind(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error()})
		return
	}

	currentUserRaw := c.Get("user_id")
	currentUserID, _ := currentUserRaw.(uint)

	user, err := h.service.SetStatus(userID, req.IsActive, currentUserID)
	if err != nil {
		mapUserError(c, err)
		return
	}
	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) DeleteUser(c echo.Context) {
	userID, ok := parseUserID(c)
	if !ok {
		return
	}
	currentUserRaw := c.Get("user_id")
	currentUserID, _ := currentUserRaw.(uint)

	if err := h.service.Delete(userID, currentUserID); err != nil {
		mapUserError(c, err)
		return
	}

	c.JSON(http.StatusOK, echo.Map{"message": "Xóa tài khoản thành công"})
}
