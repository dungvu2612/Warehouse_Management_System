package routes

import (
	"quan_ly_kho/handlers"

	"github.com/gin-gonic/gin"
)

func AuthRoutes(r *gin.Engine) {
	r.POST("/auth/login", handlers.Login)
}
