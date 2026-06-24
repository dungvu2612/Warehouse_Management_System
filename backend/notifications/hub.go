package notifications

import (
	"sync"

	"quan_ly_kho/utils"
)

var DefaultHub = NewHub()

type ClientIdentity struct {
	UserID uint
	Role   string
}

type Client struct {
	hub      *Hub
	identity ClientIdentity
	send     chan Item
}

type Hub struct {
	mu      sync.RWMutex
	clients map[*Client]struct{}
}

func NewHub() *Hub {
	return &Hub{clients: make(map[*Client]struct{})}
}

func NewClient(hub *Hub, identity ClientIdentity) *Client {
	return &Client{
		hub:      hub,
		identity: ClientIdentity{UserID: identity.UserID, Role: utils.NormalizeRole(identity.Role)},
		send:     make(chan Item, 32),
	}
}

func (h *Hub) Register(client *Client) {
	h.mu.Lock()
	h.clients[client] = struct{}{}
	h.mu.Unlock()
}

func (h *Hub) Unregister(client *Client) {
	h.mu.Lock()
	if _, ok := h.clients[client]; ok {
		delete(h.clients, client)
		close(client.send)
	}
	h.mu.Unlock()
}

func (h *Hub) BroadcastToAdmins(item Item) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for client := range h.clients {
		if client.identity.Role == "ADMIN" {
			trySend(client, item)
		}
	}
}

func (h *Hub) BroadcastToUser(userID uint, item Item) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for client := range h.clients {
		if client.identity.UserID == userID {
			trySend(client, item)
		}
	}
}

func (h *Hub) BroadcastToAll(item Item) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for client := range h.clients {
		trySend(client, item)
	}
}

func (h *Hub) BroadcastComputed(fetch func(ClientIdentity) ([]Item, error)) {
	h.mu.RLock()
	clients := make([]*Client, 0, len(h.clients))
	for client := range h.clients {
		clients = append(clients, client)
	}
	h.mu.RUnlock()

	for _, client := range clients {
		items, err := fetch(client.identity)
		if err != nil {
			continue
		}
		for _, item := range items {
			trySend(client, item)
		}
	}
}

func trySend(client *Client, item Item) {
	select {
	case client.send <- item:
	default:
		client.hub.Unregister(client)
	}
}
