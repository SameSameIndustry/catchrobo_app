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

// SendCommand はフロントエンドからのコマンド要求を処理します
func (h *RobotHandler) SendCommand(c *gin.Context) {
	// リクエストのJSONボディを定義
	type CommandRequest struct {
		Command string `json:"command" binding:"required"`
	}

	var req CommandRequest
	// JSONをGoの構造体にバインド（マッピング）します
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// RobotControllerのメソッドを呼び出してROSに命令を送る
	if err := h.controller.SendCommand(req.Command); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send command to robot"})
		return
	}

	// 成功レスポンスを返す
	c.JSON(http.StatusOK, gin.H{"status": "command sent", "command": req.Command})
}

// SendCommand はフロントエンドからのコマンド要求を処理します
func (h *RobotHandler) SendPositionCommand(c *gin.Context) {
	// リクエストのJSONボディを定義
	type CommandRequest struct {
		Command string `json:"command" binding:"required"`
	}

	var req CommandRequest
	// JSONをGoの構造体にバインド（マッピング）します
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// RobotControllerのメソッドを呼び出してROSに命令を送る
	if err := h.controller.SendPositionCommand(req.Command); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send command to robot"})
		return
	}

	// 成功レスポンスを返す
	c.JSON(http.StatusOK, gin.H{"status": "command sent", "command": req.Command})
}
// SendMoveCommand はフロントエンドからのコマンド要求を処理します
func (h *RobotHandler) SendMoveCommand(c *gin.Context) {
	// リクエストのJSONボディを定義
	type CommandRequest struct {
		Command string `json:"command" binding:"required"`
	}

	var req CommandRequest
	// JSONをGoの構造体にバインド（マッピング）します
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// RobotControllerのメソッドを呼び出してROSに命令を送る
	if err := h.controller.SendMoveCommand(req.Command); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send command to robot"})
		return
	}

	// 成功レスポンスを返す
	c.JSON(http.StatusOK, gin.H{"status": "command sent", "command": req.Command})
}

// GetTopics は利用可能なトピックのリストを取得します
func (h *RobotHandler) GetTopics(c *gin.Context) {
	// RobotControllerのメソッドを呼び出してトピックのリストを取得
	topics, err := h.controller.GetTopics()
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