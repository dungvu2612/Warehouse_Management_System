package realtime

import "github.com/gorilla/websocket"

// Client đại diện cho một browser/PDA đang mở kết nối WebSocket.
type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan Event
}

// NewClient tạo client WebSocket mới.
func NewClient(hub *Hub, conn *websocket.Conn) *Client {
	return &Client{
		hub:  hub,
		conn: conn,
		send: make(chan Event, 32),
	}
}

// Start đăng ký client và chạy luồng đọc/ghi WebSocket.
func (c *Client) Start() {
	c.hub.Register(c)
	go c.writePump()
	c.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.Unregister(c)
		c.conn.Close()
	}()

	for {
		if _, _, err := c.conn.NextReader(); err != nil {
			break
		}
	}
}

func (c *Client) writePump() {
	defer c.conn.Close()

	for event := range c.send {
		if err := c.conn.WriteJSON(event); err != nil {
			break
		}
	}
}
