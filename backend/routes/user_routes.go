package routes

import (
	"quan_ly_kho/config"
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"
	"quan_ly_kho/repositories"
	"quan_ly_kho/services"

	"github.com/gin-gonic/gin"
)

func UserRoutes(r *gin.Engine) {
	repo := repositories.NewUserRepository(config.DB)
	service := services.NewUserService(repo)
	handler := handlers.NewUserHandler(service)

	users := r.Group("/users")
	users.Use(middleware.AuthRequired())
	{
		users.GET("", middleware.RequireRoles("ADMIN"), handler.GetUsers)
		users.GET("/:id", middleware.RequireRoles("ADMIN"), handler.GetUserByID)
		users.POST("", middleware.RequireRoles("ADMIN"), handler.CreateUser)
		users.PUT("/:id", middleware.RequireRoles("ADMIN"), handler.UpdateUser)
		users.PATCH("/:id/status", middleware.RequireRoles("ADMIN"), handler.UpdateUserStatus)
		users.DELETE("/:id", middleware.RequireRoles("ADMIN"), handler.DeleteUser)
	}
}
