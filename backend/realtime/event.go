package realtime

import "time"

// Event là payload backend đẩy xuống frontend qua WebSocket.
type Event struct {
	Type     string `json:"type"`
	Resource string `json:"resource"`
	Action   string `json:"action"`
	Method   string `json:"method,omitempty"`
	Path     string `json:"path,omitempty"`
	At       string `json:"at"`
}

// NewDataChangedEvent tạo event chung khi dữ liệu hệ thống thay đổi.
func NewDataChangedEvent(method string, path string) Event {
	return Event{
		Type:     "DATA_CHANGED",
		Resource: resourceFromPath(path),
		Action:   actionFromMethod(method),
		Method:   method,
		Path:     path,
		At:       time.Now().Format(time.RFC3339),
	}
}
