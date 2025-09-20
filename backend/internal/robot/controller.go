// internal/robot/controller.go
package robot

// controllerはginに依存しないように書く
import (
	"bytes"
	"context"
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	"os/signal"
	"sync"
	"sync/atomic"
	"syscall"
	"time"

	builtin_interfaces "msgs/builtin_interfaces/msg"
	geometry_msgs "msgs/geometry_msgs/msg"
	sensor_msgs_msg "msgs/sensor_msgs/msg"
	std_msgs "msgs/std_msgs/msg"

	"github.com/tiiuae/rclgo/pkg/rclgo"
)

// RobotController はROSノードとPublisher/Subscriber等を保持します
type RobotController struct {
	node           *rclgo.Node
	positionPub    *rclgo.Publisher
	resetPub       *rclgo.Publisher
	startPub       *rclgo.Publisher
	catchMotionPub *rclgo.Publisher
	releaseMotionPub *rclgo.Publisher
	upMotionPub    *rclgo.Publisher
	downMotionPub  *rclgo.Publisher
	jointAnglesPub *rclgo.Publisher

	// Camera subscriptions (任意: raw / compressed のどちらかが来れば最新JPEGを更新)
	rawImageSub        *rclgo.Subscription
	compressedImageSub *rclgo.Subscription

	latestJPEG   []byte
	latestJPEGMu sync.RWMutex
	frameSeq     uint64 // 新規: フレーム更新ごとに++（MJPEGで重複送信を避けるため）

	// 現在の目標(累積)位置
	currentX float64
	currentY float64
	currentZ float64

	// spin制御
	spinCancel context.CancelFunc
}

func rosNow() builtin_interfaces.Time {
	t := time.Now()
	return builtin_interfaces.Time{
		Sec:     int32(t.Unix()),
		Nanosec: uint32(t.Nanosecond()),
	}
}

// NewController はROSノードとPublisher/Subscriberを初期化します
func NewController(_ context.Context) (*RobotController, error) {
	// nodeを初期化
	node, err := rclgo.NewNode("web_app_backend", "")
	if err != nil {
		return nil, err
	}

	// Publishers
	posPub, err := node.NewPublisher("/arm_move/goal_pose", geometry_msgs.PoseStampedTypeSupport, nil)
	if err != nil {
		return nil, err
	}
	startPub, err := node.NewPublisher("/arm_move/start_motion", std_msgs.EmptyTypeSupport, nil)
	if err != nil {
		return nil, err
	}
	catchMotionPub, err := node.NewPublisher("/arm_move/catch_motion", std_msgs.EmptyTypeSupport, nil)
	if err != nil {
		return nil, err
	}
	releaseMotionPub, err := node.NewPublisher("/arm_move/release_motion", std_msgs.EmptyTypeSupport, nil)
	if err != nil {
		return nil, err
	}
	resetPub, err := node.NewPublisher("/arm_move/reset_motion", std_msgs.EmptyTypeSupport, nil)
	if err != nil {
		return nil, err
	}
	upMotionPub, err := node.NewPublisher("/arm_move/up_motion", std_msgs.EmptyTypeSupport, nil)
	if err != nil {
		return nil, err
	}
	downMotionPub, err := node.NewPublisher("/arm_move/down_motion", std_msgs.EmptyTypeSupport, nil)
	if err != nil {
		return nil, err
	}
	jointAnglesPub, err := node.NewPublisher("/arm_move/joint_angles", std_msgs.Float32MultiArrayTypeSupport, nil)
	if err != nil {
		return nil, err
	}

	rc := &RobotController{
		node:           node,
		positionPub:    posPub,
		startPub:       startPub,
		catchMotionPub: catchMotionPub,
		releaseMotionPub: releaseMotionPub,
		resetPub:       resetPub,
		upMotionPub:    upMotionPub,
		downMotionPub:  downMotionPub,
		jointAnglesPub: jointAnglesPub,
		currentX:       0,
		currentY:       0,
		currentZ:       0,
	}

	// ---- Camera Subscriptions (任意のトピック名に合わせて変更してください) ----
	// QoS はセンサデータ向け（BestEffort / KeepLast / Depth=1 / Volatile）
	qos := rclgo.NewDefaultQosProfile()
	qos.Reliability = rclgo.ReliabilityBestEffort
	qos.Durability = rclgo.DurabilityVolatile
	qos.History = rclgo.HistoryKeepLast
	qos.Depth = 1

	subOpts := rclgo.NewDefaultSubscriptionOptions()
	subOpts.Qos = qos

	// Raw image
	rawTopic := "/object_finder/debug/result"
	rawSub, err := node.NewSubscription(
		rawTopic,
		sensor_msgs_msg.ImageTypeSupport,
		subOpts,
		func(sub *rclgo.Subscription) {
			var msg sensor_msgs_msg.Image
			if _, err := sub.TakeMessage(&msg); err != nil {
				_ = rc.node.Logger().Warn("failed to take raw image: ", err)
				return
			}
			if jpegData, err := encodeSensorImageToJPEG(&msg); err == nil {
				rc.setLatestJPEG(jpegData)
			}
		},
	)
	if err == nil {
		rc.rawImageSub = rawSub
	} else {
		_ = node.Logger().Warn("failed to subscribe raw image: ", err)
	}

	// Compressed image（JPEG想定）
	compTopic := "/camera/image_raw/compressed"
	compSub, err := node.NewSubscription(
		compTopic,
		sensor_msgs_msg.CompressedImageTypeSupport,
		subOpts,
		func(sub *rclgo.Subscription) {
			var msg sensor_msgs_msg.CompressedImage
			if _, err := sub.TakeMessage(&msg); err != nil {
				_ = rc.node.Logger().Warn("failed to take compressed image: ", err)
				return
			}
			dataCopy := append([]byte(nil), msg.Data...)
			rc.setLatestJPEG(dataCopy)
		},
	)
	if err == nil {
		rc.compressedImageSub = compSub
	} else {
		_ = node.Logger().Warn("failed to subscribe compressed image: ", err)
	}
	// ---------------------------------------------------------------

	// Spin をバックグラウンドで開始（Executor は不要）
	spinCtx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	rc.spinCancel = cancel
	go func() {
		if err := rc.node.Spin(spinCtx); err != nil {
			_ = rc.node.Logger().Error("node spin stopped: ", err)
		}
	}()

	return rc, nil
}

// 最新JPEGの保存（フレーム連番をインクリメント）
func (rc *RobotController) setLatestJPEG(b []byte) {
	rc.latestJPEGMu.Lock()
	rc.latestJPEG = b
	rc.latestJPEGMu.Unlock()
	atomic.AddUint64(&rc.frameSeq, 1)
}

// 互換API（robot_handler.go から呼ばれる想定）
// data: JPEGバイト列, seq: フレーム連番
func (rc *RobotController) GetLatestJPEG() (data []byte, seq uint64) {
	rc.latestJPEGMu.RLock()
	if len(rc.latestJPEG) != 0 {
		data = append([]byte(nil), rc.latestJPEG...)
	}
	rc.latestJPEGMu.RUnlock()
	seq = atomic.LoadUint64(&rc.frameSeq)
	return
}

// 新API（必要ならこちらを直接使ってもOK）
func (rc *RobotController) LatestJPEG() ([]byte, bool) {
	data, seq := rc.GetLatestJPEG()
	return data, seq != 0
}

// Raw Image → JPEG 変換の簡易実装（mono8 / rgb8 / bgr8 のみ対応）
func encodeSensorImageToJPEG(img *sensor_msgs_msg.Image) ([]byte, error) {
	w := int(img.Width)
	h := int(img.Height)
	if w <= 0 || h <= 0 {
		return nil, fmt.Errorf("invalid image size %dx%d", w, h)
	}

	switch img.Encoding {
	case "mono8":
		gray := image.NewGray(image.Rect(0, 0, w, h))
		copy(gray.Pix, img.Data)
		var buf bytes.Buffer
		if err := jpeg.Encode(&buf, gray, &jpeg.Options{Quality: 85}); err != nil {
			return nil, err
		}
		return buf.Bytes(), nil

	case "rgb8", "bgr8":
		rgba := image.NewRGBA(image.Rect(0, 0, w, h))
		step := int(img.Step)
		if step <= 0 {
			step = 3 * w
		}
		src := img.Data
		for y := 0; y < h; y++ {
			row := src[y*step:]
			for x := 0; x < w; x++ {
				i := x * 3
				if i+2 >= len(row) {
					break
				}
				var r, g, b uint8
				if img.Encoding == "rgb8" {
					r, g, b = row[i], row[i+1], row[i+2]
				} else {
					// bgr8
					b, g, r = row[i], row[i+1], row[i+2]
				}
				rgba.SetRGBA(x, y, color.RGBA{R: r, G: g, B: b, A: 0xff})
			}
		}
		var buf bytes.Buffer
		if err := jpeg.Encode(&buf, rgba, &jpeg.Options{Quality: 85}); err != nil {
			return nil, err
		}
		return buf.Bytes(), nil

	default:
		return nil, fmt.Errorf("unsupported encoding: %s", img.Encoding)
	}
}

func (rc *RobotController) PublishPosition(x, y, z float64) error {
	if rc == nil || rc.node == nil {
		return fmt.Errorf("node not initialized")
	}
	if rc.positionPub == nil {
		return fmt.Errorf("position publisher not initialized")
	}
	rc.currentX, rc.currentY, rc.currentZ = x, y, z
	rosMsg := geometry_msgs.PoseStamped{
		Header: std_msgs.Header{Stamp: rosNow(), FrameId: "base_link"},
		Pose: geometry_msgs.Pose{
			Position:    geometry_msgs.Point{X: x, Y: y, Z: z},
			Orientation: geometry_msgs.Quaternion{X: 0, Y: 0, Z: 0, W: 1},
		},
	}

	// ログを出力し、メッセージをパブリッシュ
	_ = rc.node.Logger().Infof("Publishing position: (%.2f, %.2f, %.2f)", x, y, z)
	return rc.positionPub.Publish(&rosMsg)
}

func (rc *RobotController) PublishStartMotion() error {
	if rc == nil || rc.node == nil {
		return fmt.Errorf("node not initialized")
	}
	if rc.startPub == nil {
		return fmt.Errorf("start publisher not initialized")
	}
	rosMsg := std_msgs.Empty{}
	_ = rc.node.Logger().Infoln("Publishing start motion command")
	return rc.startPub.Publish(&rosMsg)
}

func (rc *RobotController) PublishUpMotion() error {
	if rc == nil || rc.node == nil {
		return fmt.Errorf("node not initialized")
	}
	if rc.upMotionPub == nil {
		return fmt.Errorf("up motion publisher not initialized")
	}
	rosMsg := std_msgs.Empty{}
	_ = rc.node.Logger().Infoln("Publishing up motion command")
	return rc.upMotionPub.Publish(&rosMsg)
}

func (rc *RobotController) PublishDownMotion() error {
	if rc == nil || rc.node == nil {
		return fmt.Errorf("node not initialized")
	}
	if rc.downMotionPub == nil {
		return fmt.Errorf("down motion publisher not initialized")
	}
	rosMsg := std_msgs.Empty{}
	_ = rc.node.Logger().Infoln("Publishing down motion command")
	return rc.downMotionPub.Publish(&rosMsg)
}

func (rc *RobotController) PublishCatchMotion() error {
	if rc == nil || rc.node == nil {
		return fmt.Errorf("node not initialized")
	}
	if rc.catchMotionPub == nil {
		return fmt.Errorf("catch motion publisher not initialized")
	}
	rosMsg := std_msgs.Empty{}
	_ = rc.node.Logger().Infoln("Publishing catch motion command")
	return rc.catchMotionPub.Publish(&rosMsg)
}

func (rc *RobotController) PublishReleaseMotion() error {
	if rc == nil || rc.node == nil {
		return fmt.Errorf("node not initialized")
	}
	if rc.releaseMotionPub == nil {
		return fmt.Errorf("release motion publisher not initialized")
	}
	rosMsg := std_msgs.Empty{}
	_ = rc.node.Logger().Infoln("Publishing release motion command")
	return rc.releaseMotionPub.Publish(&rosMsg)
}

func (rc *RobotController) PublishResetMotion() error {
	if rc == nil || rc.node == nil {
		return fmt.Errorf("node not initialized")
	}
	if rc.resetPub == nil {
		return fmt.Errorf("reset publisher not initialized")
	}
	rosMsg := std_msgs.Empty{}
	_ = rc.node.Logger().Infoln("Publishing reset motion command")
	return rc.resetPub.Publish(&rosMsg)
}

// 相対変位を受け取り、内部に累積した目標絶対位置を更新してPublish
func (rc *RobotController) PublishDisplacement(dx, dy, dz float64) error {
	if rc == nil || rc.node == nil {
		return fmt.Errorf("node not initialized")
	}
	if rc.positionPub == nil {
		return fmt.Errorf("position publisher not initialized")
	}
	// 累積
	rc.currentX += dx
	rc.currentY += dy
	rc.currentZ += dz
	rosMsg := geometry_msgs.PoseStamped{
		Header: std_msgs.Header{Stamp: rosNow(), FrameId: "base_link"},
		Pose: geometry_msgs.Pose{
			Position:    geometry_msgs.Point{X: rc.currentX, Y: rc.currentY, Z: rc.currentZ},
			Orientation: geometry_msgs.Quaternion{X: 0, Y: 0, Z: 0, W: 1},
		},
	}
	_ = rc.node.Logger().Infof("Publishing displacement accumulated -> (%.3f, %.3f, %.3f)", rc.currentX, rc.currentY, rc.currentZ)
	return rc.positionPub.Publish(&rosMsg)
}

func (rc *RobotController) SubscribeTopics() ([]string, error) {
	// 現在のトピックを取得
	topics, err := rc.node.GetTopicNamesAndTypes(true)
	if err != nil {
		return nil, err
	}

	// トピック名のリストを返す
	var topicNames []string
	for name := range topics {
		topicNames = append(topicNames, name)
	}
	return topicNames, nil
}

func (rc *RobotController) Close() {
	// spin 停止
	if rc.spinCancel != nil {
		rc.spinCancel()
	}

	if rc.rawImageSub != nil {
		rc.rawImageSub.Close()
	}
	if rc.compressedImageSub != nil {
		rc.compressedImageSub.Close()
	}

	if rc.positionPub != nil {
		rc.positionPub.Close()
	}
	if rc.jointAnglesPub != nil {
		rc.jointAnglesPub.Close()
	}
	if rc.startPub != nil {
		rc.startPub.Close()
	}
	if rc.resetPub != nil {
		rc.resetPub.Close()
	}
	if rc.catchMotionPub != nil {
		rc.catchMotionPub.Close()
	}
	if rc.releaseMotionPub != nil {
		rc.releaseMotionPub.Close()
	}
	if rc.upMotionPub != nil {
		rc.upMotionPub.Close()
	}
	if rc.downMotionPub != nil {
		rc.downMotionPub.Close()
	}
	if rc.node != nil {
		rc.node.Close()
	}
}

func (rc *RobotController) Get(topic_name string) (*rclgo.Publisher, error) {
	switch topic_name {
	case "/position":
		return rc.positionPub, nil
	case "/start_motion":
		return rc.startPub, nil
	case "/reset_motion":
		return rc.resetPub, nil
	case "/catch_motion":
		return rc.catchMotionPub, nil
	case "/release_motion":
		return rc.releaseMotionPub, nil
	case "/up_motion":
		return rc.upMotionPub, nil
	case "/down_motion":
		return rc.downMotionPub, nil
	case "/joint_angles":
		return rc.jointAnglesPub, nil
	default:
		return nil, fmt.Errorf("unknown topic: %s", topic_name)
	}
}

func (rc *RobotController) PublishJointAngles(angles []float32) error {
	if rc == nil || rc.node == nil {
		return fmt.Errorf("node not initialized")
	}
	if rc.jointAnglesPub == nil {
		return fmt.Errorf("joint angles publisher not initialized")
	}
	rosMsg := std_msgs.Float32MultiArray{Data: angles}
	_ = rc.node.Logger().Infoln("Publishing joint angles")
	return rc.jointAnglesPub.Publish(&rosMsg)
}
