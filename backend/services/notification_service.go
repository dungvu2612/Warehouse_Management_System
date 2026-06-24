package services

import (
	"sort"
	"time"

	"quan_ly_kho/notifications"
	"quan_ly_kho/repositories"
	"quan_ly_kho/utils"
)

type NotificationService interface {
	GetSummary(userID uint, role string, limit int) (*notifications.Summary, error)
	GetItems(userID uint, role string, limit int) ([]notifications.Item, error)
}

type notificationService struct {
	repo repositories.NotificationRepository
}

func NewNotificationService(repo repositories.NotificationRepository) NotificationService {
	return &notificationService{repo: repo}
}

func (s *notificationService) GetSummary(userID uint, role string, limit int) (*notifications.Summary, error) {
	items, err := s.GetItems(userID, role, limit)
	if err != nil {
		return nil, err
	}
	return &notifications.Summary{UnreadCount: len(items), Items: items}, nil
}

func (s *notificationService) GetItems(userID uint, role string, limit int) ([]notifications.Item, error) {
	normalizedRole := utils.NormalizeRole(role)
	items, err := s.repo.FindNotifications(userID, normalizedRole, limit)
	if err != nil {
		return nil, err
	}
	sort.SliceStable(items, func(i, j int) bool {
		left, leftErr := time.Parse(time.RFC3339, items[i].CreatedAt)
		right, rightErr := time.Parse(time.RFC3339, items[j].CreatedAt)
		if leftErr != nil || rightErr != nil {
			return items[i].CreatedAt > items[j].CreatedAt
		}
		return left.After(right)
	})
	if limit > 0 && len(items) > limit {
		items = items[:limit]
	}
	return items, nil
}
