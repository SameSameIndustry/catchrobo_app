package api

import (
	"catchrobo_app/internal/robot"

	"github.com/gin-gonic/gin"
)

// SetupRouter はGinのルーターを設定し、返します
func SetupRouter(rc *robot.RobotController) *gin.Engine {
	// Ginのデフォルトルーターを作成
	r := gin.Default()

	// RobotHandlerを初期化
	robotHandler := NewRobotHandler(rc)

	// APIのルートを設定
	// POST /api/command というURLに、robotHandler.SendCommand を割り当て
	api := r.Group("/api")
	{
		// この中にいろんなAPIエンドポイントを定義する
		api.POST("/command", robotHandler.SendCommand)
		api.POST("/position", robotHandler.SendCommand)
		api.POST("/move", robotHandler.SendCommand)

	}

	return r
}