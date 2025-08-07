package robot
// controllerはginに依存しないように書く
import (
	"context"
	"os/signal"
	"syscall"
	
	// 生成したメッセージパッケージをインポート
	std_msgs "catchrobo_app/msgs/std_msgs/msg"

	"github.com/tiiuae/rclgo/pkg/rclgo"
)

// RobotController はROSノードとPublisherを保持します
type RobotController struct {
	node       *rclgo.Node
	chatterPub *rclgo.Publisher
	positionPub *rclgo.Publisher
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
	posPub, err := node.NewPublisher("/position", std_msgs.StringTypeSupport, nil)
	if err != nil {
		return nil, err
	}

	movePub, err := node.NewPublisher("/move", std_msgs.StringTypeSupport, nil)
	if err != nil {
		return nil, err
	}

	return &RobotController{
		node:       node,
		chatterPub: pub,
		positionPub: posPub,
		movePub:    movePub,
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

// Close はROSノードをクリーンに終了させます
func (rc *RobotController) Close() {
	if rc.chatterPub != nil {
		rc.chatterPub.Close()
	}
	if rc.node != nil {
		rc.node.Close()
	}


}