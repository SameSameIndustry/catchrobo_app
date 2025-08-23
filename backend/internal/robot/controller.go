package robot

// controllerはginに依存しないように書く
import (
	"context"
	"fmt"
	"os/signal"
	"syscall"

	// 生成したメッセージパッケージをインポート
	std_msgs "msgs/std_msgs/msg"
	geometry_msgs "msgs/geometry_msgs/msg"

	"github.com/tiiuae/rclgo/pkg/rclgo"
)

// RobotController はROSノードとPublisherを保持します
type RobotController struct {
	node       *rclgo.Node
	chatterPub *rclgo.Publisher
	positionPub *rclgo.Publisher
	movePub	*rclgo.Publisher
	goalRadiusPub *rclgo.Publisher
	resetPub *rclgo.Publisher
	startPub *rclgo.Publisher
	catchMotionPub *rclgo.Publisher
}

// NewController はROSノードとPublisherを初期化し、コントローラーを作成します
func NewController(ctx context.Context) (*RobotController, error) {
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()
	// nodeを初期化
	node, err := rclgo.NewNode("web_app_backend", "")
	if err != nil {
		return nil, err
	}

	// 文字列をパブリッシュするためのPublisherを作成
	// 型情報として生成された StringTypeSupport を使用
	pub, err := node.NewPublisher("/chatter", std_msgs.StringTypeSupport, nil)
	if err != nil {
		return nil, err
	}

	// 位置情報をパブリッシュするためのPublisherを作成
	posPub, err := node.NewPublisher("/arm_move/position", geometry_msgs.PoseTypeSupport, nil)
	if err != nil {
		return nil, err
	}

	movePub, err := node.NewPublisher("/arm_move/move", std_msgs.StringTypeSupport, nil)
	if err != nil {
		return nil, err
	}

	goalRadiusPub, err := node.NewPublisher("/arm_move/goal_radius", std_msgs.StringTypeSupport, nil)
	if err != nil {
		return nil, err
	}

	startPub, err := node.NewPublisher("/arm_move/start", std_msgs.EmptyTypeSupport, nil)
	if err != nil {
		return nil, err
	}

	catchMotionPub, err := node.NewPublisher("/arm_move/catch_motion", std_msgs.EmptyTypeSupport, nil)
	if err != nil {
		return nil, err
	}

	resetPub, err := node.NewPublisher("/arm_move/reset", std_msgs.EmptyTypeSupport, nil)
	if err != nil {
		return nil, err
	}

	return &RobotController{
		node:       node,
		chatterPub: pub,
		positionPub: posPub,
		movePub:    movePub,
		goalRadiusPub: goalRadiusPub,
		startPub: startPub,
		catchMotionPub: catchMotionPub,
		resetPub: resetPub,
	}, nil
}


// SendCommand は受け取った文字列を /chatter トピックに発行します
func (rc *RobotController) SendCommand(command string) error {
	// 送信するメッセージを作成
	rosMsg := std_msgs.String{Data: command}

	// ログを出力し、メッセージをパブリッシュ
	rc.node.Logger().Info("Publishing command: " + command)
	return rc.chatterPub.Publish(&rosMsg)
}

func (rc *RobotController) PublishPosition(x, y float64) error {
    if rc == nil || rc.node == nil { return fmt.Errorf("node not initialized") }
    if rc.positionPub == nil { return fmt.Errorf("position publisher not initialized") }
    // 送信するメッセージを作成
	// TODO std_msgs.Stringではなく、位置情報用のメッセージを使う
	rosMsg := std_msgs.String{Data: fmt.Sprintf("Position: (%.2f, %.2f)", x, y)}

	// ログを出力し、メッセージをパブリッシュ
	rc.node.Logger().Info("Publishing position: " + rosMsg.Data)
	return rc.positionPub.Publish(&rosMsg)
}

func (rc *RobotController) PublishMove(dx, dy float64) error {
    if rc == nil || rc.node == nil { return fmt.Errorf("node not initialized") }
    if rc.movePub == nil { return fmt.Errorf("move publisher not initialized") }
    /// 送信するメッセージを作成
	// TODO std_msgs.Stringではなく、移動情報用のメッセージを使う
	rosMsg := std_msgs.String{Data: fmt.Sprintf("Move: (%.2f, %.2f)", dx, dy)}

	// ログを出力し、メッセージをパブリッシュ
	rc.node.Logger().Info("Publishing move command: " + rosMsg.Data)
	return rc.movePub.Publish(&rosMsg)
}

// SendPositionCommand は受け取った位置情報を /position トピックに発行します
func (rc *RobotController) SendPositionCommand(position string) error {
	// 送信するメッセージを作成
	rosMsg := std_msgs.String{Data: position}

	// ログを出力し、メッセージをパブリッシュ
	rc.node.Logger().Info("Publishing position: " + position)
	return rc.positionPub.Publish(&rosMsg)
}

// SendMoveCommand は受け取った移動情報を /move トピックに発行します
func (rc *RobotController) SendMoveCommand(move string) error {
	// 送信するメッセージを作成
	rosMsg := std_msgs.String{Data: move}

	// ログを出力し、メッセージをパブリッシュ
	rc.node.Logger().Info("Publishing move command: " + move)
	return rc.movePub.Publish(&rosMsg)
}


// SendGoalRadiusCommand は受け取った目標半径情報を /goal_radius トピックに発行します
func (rc *RobotController) SendGoalRadiusCommand(radius string) error {
	// 送信するメッセージを作成
	rosMsg := std_msgs.String{Data: radius}

	// ログを出力し、メッセージをパブリッシュ
	rc.node.Logger().Info("Publishing goal radius command: " + radius)
	return rc.goalRadiusPub.Publish(&rosMsg)
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

func (rc *RobotController) Get(topic_name string) (*rclgo.Publisher, error) {
	
	switch topic_name {
	case "/chatter":
		return rc.chatterPub, nil
	case "/position":
		return rc.positionPub, nil
	case "/move":
		return rc.movePub, nil
	default:
		return nil, fmt.Errorf("unknown topic: %s", topic_name)
	}
}

// Close はROSノードをクリーンに終了させます
func (rc *RobotController) Close() {
	if rc.chatterPub != nil {
		rc.chatterPub.Close()
	}
	if rc.node != nil {
		rc.node.Close()
	}


}