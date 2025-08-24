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
		api.POST("/position", robotHandler.SendPositionCommand)
		api.POST("/move", robotHandler.SendDisplacementCommand)
		api.POST("/joint_angles", robotHandler.SendJointAngles)
		api.GET("/topics", robotHandler.GetTopics)
		api.POST("/start_motion", robotHandler.StartMotion)
		api.POST("/catch_motion", robotHandler.CatchMotion)
		api.POST("/reset_motion", robotHandler.ResetMotion)
	}
	// 追加のエンドポイントを設定
	r.GET("/api/hello", robotHandler.Hello)

	return r
}
