package routes

import "github.com/labstack/echo/v4"

func adapt(handler func(echo.Context)) echo.HandlerFunc {
	return func(c echo.Context) error {
		handler(c)
		return nil
	}
}
