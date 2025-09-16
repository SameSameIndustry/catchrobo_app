// internal/api/route.go
package api

import (
	"catchrobo_app/internal/robot"

	"github.com/gin-gonic/gin"
)

// SetupRouter はGinのルーターを設定し、返します
func SetupRouter(rc *robot.RobotController) *gin.Engine {
	r := gin.Default()

	robotHandler := NewRobotHandler(rc)

	api := r.Group("/api")
	{
		api.POST("/position", robotHandler.SendPositionCommand)
		api.POST("/move", robotHandler.SendDisplacementCommand)
		api.POST("/joint_angles", robotHandler.SendJointAngles)	
		api.GET("/topics", robotHandler.GetTopics)

		api.POST("/start_motion", robotHandler.StartMotion)
		api.POST("/down_motion", robotHandler.DownMotion)
		api.POST("/up_motion", robotHandler.UpMotion)
		api.POST("/catch_motion", robotHandler.CatchMotion)
		api.POST("/reset_motion", robotHandler.ResetMotion)

		// ---- Camera ----
		api.GET("/camera/snapshot", robotHandler.CameraSnapshot)
		api.GET("/camera/mjpeg", robotHandler.CameraMJPEG)
	}

	r.GET("/api/hello", robotHandler.Hello)

	return r
}
