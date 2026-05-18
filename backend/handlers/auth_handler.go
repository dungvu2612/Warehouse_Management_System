package handlers

import (
	"net/http"
	"quan_ly_kho/config"
	"quan_ly_kho/models"
	"quan_ly_kho/utils"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type loginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": err.Error(),
		})
		return
	}

	username := strings.TrimSpace(req.Username)
	if username == "" || req.Password == "" {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": "username and password are required",
		})
		return
	}

	var user models.User
	err := config.DB.Where("username = ? AND is_active = ?", username, true).First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "invalid credentials",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "invalid credentials",
		})
		return
	}

	token, err := utils.GenerateToken(user.ID, user.Username, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to generate token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": token,
		"token_type":   "Bearer",
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"full_name": user.FullName,
			"role":     utils.NormalizeRole(user.Role),
		},
	})
}
