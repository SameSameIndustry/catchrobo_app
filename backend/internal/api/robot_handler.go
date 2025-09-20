// internal/api/robot_handler.go
package api

import (
	"fmt"
	"net/http"
	"time"

	"catchrobo_app/internal/robot"

	"github.com/gin-gonic/gin"
)

// RobotHandler は robot.Controller を保持します
type RobotHandler struct {
	controller *robot.RobotController
}

func NewRobotHandler(rc *robot.RobotController) *RobotHandler {
	return &RobotHandler{controller: rc}
}

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
	Dz float64 `json:"dz"`
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

func (h *RobotHandler) GetTopics(c *gin.Context) {
	topics, err := h.controller.SubscribeTopics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve topics"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"topics": topics})
}

func (h *RobotHandler) Hello(c *gin.Context) {
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

func (h *RobotHandler) ReleaseMotion(c *gin.Context) {
	if err := h.controller.PublishReleaseMotion(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "publish release motion failed", "detail": err.Error()})
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

func (h *RobotHandler) AddDownMotion(c *gin.Context) {
	if err := h.controller.PublishAddDownMotion(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "publish add down motion failed", "detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *RobotHandler) AddUpMotion(c *gin.Context) {
	if err := h.controller.PublishAddUpMotion(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "publish add up motion failed", "detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func(h * RobotHandler) MiddleMotion(c *gin.Context) {
	if err := h.controller.PublishMiddleMotion(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "publish middle motion failed", "detail": err.Error()})
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

/* ------- Camera Endpoints ------- */

// 単発スナップショット（最新JPEGを返す）
func (h *RobotHandler) CameraSnapshot(c *gin.Context) {
	jpg, _ := h.controller.GetLatestJPEG()
	if len(jpg) == 0 {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "no frame yet"})
		return
	}
	c.Header("Content-Type", "image/jpeg")
	c.Header("Cache-Control", "no-store")
	_, _ = c.Writer.Write(jpg)
}

// MJPEG ストリーム（multipart/x-mixed-replace）
func (h *RobotHandler) CameraMJPEG(c *gin.Context) {
	boundary := "frame"
	c.Header("Content-Type", "multipart/x-mixed-replace; boundary="+boundary)
	c.Status(http.StatusOK)

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.Status(http.StatusInternalServerError)
		return
	}

	lastSeq := uint64(0)
	ticker := time.NewTicker(33 * time.Millisecond) // ~30fps 上限
	defer ticker.Stop()

	for {
		select {
		case <-c.Request.Context().Done():
			return
		case <-ticker.C:
			jpg, seq := h.controller.GetLatestJPEG()
			if len(jpg) == 0 || seq == lastSeq {
				continue
			}
			lastSeq = seq

			_, _ = fmt.Fprintf(c.Writer, "--%s\r\n", boundary)
			_, _ = fmt.Fprintf(c.Writer, "Content-Type: image/jpeg\r\n")
			_, _ = fmt.Fprintf(c.Writer, "Content-Length: %d\r\n\r\n", len(jpg))
			_, _ = c.Writer.Write(jpg)
			_, _ = fmt.Fprintf(c.Writer, "\r\n")
			flusher.Flush()
		}
	}
}
