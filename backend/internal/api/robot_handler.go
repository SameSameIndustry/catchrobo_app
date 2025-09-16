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
	Z float64 `json:"z"`
}

type JointAnglesReq struct {
	Angles []float32 `json:"angles"`
}

type DisplacementReq struct {
	Dx float64 `json:"dx"`
	Dy float64 `json:"dy"`
	Dz float64 `json:"dz"` // 追加: Z 方向
}

func (h *RobotHandler) SendPositionCommand(c *gin.Context) {
	var req PositionReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid position json", "detail": err.Error()})
		return
	}
	if err := h.controller.PublishPosition(req.X, req.Y, req.Z); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "publish position failed", "detail": err.Error()})
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

func (h *RobotHandler) StartMotion(c *gin.Context) {
	if err := h.controller.PublishStartMotion(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "publish start motion failed", "detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *RobotHandler) DownMotion(c *gin.Context) {
	if err := h.controller.PublishDownMotion(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "publish down motion failed", "detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *RobotHandler) UpMotion(c *gin.Context) {
	if err := h.controller.PublishUpMotion(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "publish up motion failed", "detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *RobotHandler) CatchMotion(c *gin.Context) {
	if err := h.controller.PublishCatchMotion(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "publish catch motion failed", "detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *RobotHandler) ResetMotion(c *gin.Context) {
	if err := h.controller.PublishResetMotion(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "publish reset motion failed", "detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *RobotHandler) SendDisplacementCommand(c *gin.Context) {
	var req DisplacementReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid displacement json", "detail": err.Error()})
		return
	}
	if err := h.controller.PublishDisplacement(req.Dx, req.Dy, req.Dz); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "publish displacement failed", "detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *RobotHandler) SendJointAngles(c *gin.Context) {
	var req JointAnglesReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid joint angles json", "detail": err.Error()})
		return
	}
	if err := h.controller.PublishJointAngles(req.Angles); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "publish joint angles failed", "detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
