package notifications

import "time"

type Level string

const (
	LevelInfo    Level = "INFO"
	LevelWarning Level = "WARNING"
	LevelError   Level = "ERROR"
	LevelSuccess Level = "SUCCESS"
)

type Item struct {
	ID        string `json:"id"`
	Type      string `json:"type"`
	Level     Level  `json:"level"`
	Title     string `json:"title"`
	Message   string `json:"message"`
	CreatedAt string `json:"created_at"`
	Link      string `json:"link"`
}

func NewItem(id string, typ string, level Level, title string, message string, at time.Time, link string) Item {
	if at.IsZero() {
		at = time.Now()
	}
	return Item{
		ID:        id,
		Type:      typ,
		Level:     level,
		Title:     title,
		Message:   message,
		CreatedAt: at.Format(time.RFC3339),
		Link:      link,
	}
}

type Summary struct {
	UnreadCount int    `json:"unread_count"`
	Items       []Item `json:"items"`
}
