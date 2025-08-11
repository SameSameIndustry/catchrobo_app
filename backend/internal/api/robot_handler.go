package api

import (
	"net/http"

	// 自分のプロジェクト内のrobotパッケージをインポート
	"catchrobo_app/internal/robot"

	"github.com/gin-gonic/gin"
)

// RobotHandler は robot.Controller を保持します
type RobotHandler struct {
	controller *robot.RobotController
}

// NewRobotHandler は新しいハンドラを作成します
func NewRobotHandler(rc *robot.RobotController) *RobotHandler {
	return &RobotHandler{controller: rc}
}

// internal/api/robot_handler.go
type PositionReq struct {
    X float64 `json:"x"`
    Y float64 `json:"y"`
}
type DisplacementReq struct {
    Dx float64 `json:"dx"`
    Dy float64 `json:"dy"`
}

// そのまま command 文字列を扱う用途
func (h *RobotHandler) SendCommand(c *gin.Context) {
    var req struct{ Command string `json:"command" binding:"required"` }
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "detail": err.Error()})
        return
    }
    if err := h.controller.SendCommand(req.Command); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "send command failed", "detail": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *RobotHandler) SendPositionCommand(c *gin.Context) {
    var req PositionReq
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid position json", "detail": err.Error()})
        return
    }
    if err := h.controller.PublishPosition(req.X, req.Y); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "publish position failed", "detail": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *RobotHandler) SendMoveCommand(c *gin.Context) {
    var req DisplacementReq
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid displacement json", "detail": err.Error()})
        return
    }
    if err := h.controller.PublishMove(req.Dx, req.Dy); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "publish move failed", "detail": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"ok": true})
}


// GetTopics は利用可能なトピックのリストを取得します
func (h *RobotHandler) GetTopics(c *gin.Context) {
	// RobotControllerのメソッドを呼び出してトピックのリストを取得
	topics, err := h.controller.SubscribeTopics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve topics"})
		return
	}

	// トピックのリストをJSONレスポンスとして返す
	c.JSON(http.StatusOK, gin.H{"topics": topics})
}

func (h *RobotHandler) Hello(c *gin.Context) {
	// シンプルなHelloレスポンスを返す
	c.JSON(http.StatusOK, gin.H{"message": "Hello from Robot API!"})
}