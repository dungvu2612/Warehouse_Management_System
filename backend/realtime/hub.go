package realtime

import "sync"

// DefaultHub là hub WebSocket dùng chung cho toàn backend.
var DefaultHub = NewHub()

// Hub giữ danh sách client đang kết nối và phát event tới toàn bộ client.
type Hub struct {
	mu        sync.RWMutex
	clients   map[*Client]struct{}
	broadcast chan Event
}

// NewHub khởi tạo hub và chạy vòng lặp phát event nền.
func NewHub() *Hub {
	hub := &Hub{
		clients:   make(map[*Client]struct{}),
		broadcast: make(chan Event, 128),
	}
	go hub.run()
	return hub
}

// Register thêm client mới vào hub.
func (h *Hub) Register(client *Client) {
	h.mu.Lock()
	h.clients[client] = struct{}{}
	h.mu.Unlock()
}

// Unregister gỡ client khỏi hub và đóng channel gửi của client đó.
func (h *Hub) Unregister(client *Client) {
	h.mu.Lock()
	if _, ok := h.clients[client]; ok {
		delete(h.clients, client)
		close(client.send)
	}
	h.mu.Unlock()
}

// Broadcast xếp event vào hàng đợi phát realtime.
func (h *Hub) Broadcast(event Event) {
	select {
	case h.broadcast <- event:
	default:
	}
}

func (h *Hub) run() {
	for event := range h.broadcast {
		h.mu.RLock()
		clients := make([]*Client, 0, len(h.clients))
		for client := range h.clients {
			clients = append(clients, client)
		}
		h.mu.RUnlock()

		for _, client := range clients {
			select {
			case client.send <- event:
			default:
				h.Unregister(client)
			}
		}
	}
}
