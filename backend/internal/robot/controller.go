package robot

// controllerはginに依存しないように書く
import (
	"context"
	"fmt"
	"os/signal"
	"syscall"

	// 生成したメッセージパッケージをインポート
	geometry_msgs "msgs/geometry_msgs/msg"
	std_msgs "msgs/std_msgs/msg"

	"github.com/tiiuae/rclgo/pkg/rclgo"
)

// RobotController はROSノードとPublisherを保持します
type RobotController struct {
	node           *rclgo.Node
	positionPub    *rclgo.Publisher
	resetPub       *rclgo.Publisher
	startPub       *rclgo.Publisher
	catchMotionPub *rclgo.Publisher
	jointAnglesPub *rclgo.Publisher
}

// NewController はROSノードとPublisherを初期化し、コントローラーを作成します
func NewController(_ context.Context) (*RobotController, error) {
	_, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()
	// nodeを初期化
	node, err := rclgo.NewNode("web_app_backend", "")
	if err != nil {
		return nil, err
	}

	// 文字列をパブリッシュするためのPublisherを作成

	// 位置情報をパブリッシュするためのPublisherを作成
	posPub, err := node.NewPublisher("/arm_move/goal_pose", geometry_msgs.PoseTypeSupport, nil)
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

	resetPub, err := node.NewPublisher("/arm_move/reset_motion", std_msgs.EmptyTypeSupport, nil)
	if err != nil {
		return nil, err
	}

	jointAnglesPub, err := node.NewPublisher("/arm_move/joint_angles", std_msgs.Float32MultiArrayTypeSupport, nil)
	if err != nil {
		return nil, err
	}

	return &RobotController{
		node:           node,
		positionPub:    posPub,
		startPub:       startPub,
		catchMotionPub: catchMotionPub,
		resetPub:       resetPub,
		jointAnglesPub: jointAnglesPub,
	}, nil
}

func (rc *RobotController) PublishPosition(x, y, z float64) error {
	if rc == nil || rc.node == nil {
		return fmt.Errorf("node not initialized")
	}
	if rc.positionPub == nil {
		return fmt.Errorf("position publisher not initialized")
	}
	rosMsg := geometry_msgs.Pose{Position: geometry_msgs.Point{X: x, Y: y, Z: z}, Orientation: geometry_msgs.Quaternion{X: 0, Y: 0, Z: 0, W: 1}}

	// ログを出力し、メッセージをパブリッシュ
	rc.node.Logger().Info("Publishing position: " + fmt.Sprintf("Position: (%.2f, %.2f, %.2f)", x, y, z))
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

	// ログを出力し、メッセージをパブリッシュ
	rc.node.Logger().Info("Publishing start motion command")
	return rc.startPub.Publish(&rosMsg)
}

func (rc *RobotController) PublishCatchMotion() error {
	if rc == nil || rc.node == nil {
		return fmt.Errorf("node not initialized")
	}
	if rc.catchMotionPub == nil {
		return fmt.Errorf("catch motion publisher not initialized")
	}
	rosMsg := std_msgs.Empty{}

	// ログを出力し、メッセージをパブリッシュ
	rc.node.Logger().Info("Publishing catch motion command")
	return rc.catchMotionPub.Publish(&rosMsg)
}

func (rc *RobotController) PublishResetMotion() error {
	if rc == nil || rc.node == nil {
		return fmt.Errorf("node not initialized")
	}
	if rc.resetPub == nil {
		return fmt.Errorf("reset publisher not initialized")
	}
	rosMsg := std_msgs.Empty{}

	// ログを出力し、メッセージをパブリッシュ
	rc.node.Logger().Info("Publishing reset motion command")
	return rc.resetPub.Publish(&rosMsg)
}

func (rc *RobotController) PublishDisplacement(dx, dy float64) error {
	if rc == nil || rc.node == nil {
		return fmt.Errorf("node not initialized")
	}
	if rc.positionPub == nil {
		return fmt.Errorf("position publisher not initialized")
	}
	// Interpret displacement as relative move command (placeholder). Here we publish as Pose with displacement in X,Y and 0 Z.
	rosMsg := geometry_msgs.Pose{Position: geometry_msgs.Point{X: dx, Y: dy, Z: 0}, Orientation: geometry_msgs.Quaternion{X: 0, Y: 0, Z: 0, W: 1}}
	rc.node.Logger().Info("Publishing displacement: " + fmt.Sprintf("dX: %.3f dY: %.3f", dx, dy))
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
	rc.node.Logger().Info("Publishing joint angles")
	return rc.jointAnglesPub.Publish(&rosMsg)
}
