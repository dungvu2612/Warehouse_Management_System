package routes

import (
	"quan_ly_kho/config"
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"
	"quan_ly_kho/repositories"
	"quan_ly_kho/services"

	"github.com/labstack/echo/v4"
)

func UserRoutes(r *echo.Echo) {
	repo := repositories.NewUserRepository(config.DB)
	service := services.NewUserService(repo)
	handler := handlers.NewUserHandler(service)

	users := r.Group("/users")
	users.Use(middleware.AuthRequired())
	{
		users.GET("", adapt(handler.GetUsers), middleware.RequireRoles("ADMIN"))
		users.GET("/:id", adapt(handler.GetUserByID), middleware.RequireRoles("ADMIN"))
		users.POST("", adapt(handler.CreateUser), middleware.RequireRoles("ADMIN"))
		users.PUT("/:id", adapt(handler.UpdateUser), middleware.RequireRoles("ADMIN"))
		users.PATCH("/:id/status", adapt(handler.UpdateUserStatus), middleware.RequireRoles("ADMIN"))
		users.DELETE("/:id", adapt(handler.DeleteUser), middleware.RequireRoles("ADMIN"))
	}
}
