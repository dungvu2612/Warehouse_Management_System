package routes

import (
	"quan_ly_kho/config"
	"quan_ly_kho/handlers"
	"quan_ly_kho/middleware"
	"quan_ly_kho/notifications"
	"quan_ly_kho/repositories"
	"quan_ly_kho/services"

	"github.com/labstack/echo/v4"
)

func NotificationRoutes(r *echo.Echo) {
	repo := repositories.NewNotificationRepository(config.DB)
	service := services.NewNotificationService(repo)
	handler := handlers.NewNotificationHandler(service)

	group := r.Group("/notifications")
	group.Use(middleware.AuthRequired())
	{
		group.GET("/summary", adapt(handler.GetSummary), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		group.GET("", adapt(handler.GetNotifications), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
		group.POST("/read-all", adapt(handler.MarkAllRead), middleware.RequireRoles("ADMIN", "WAREHOUSE"))
	}

	r.GET("/notifications/ws", notifications.HandleWebSocket)
}
