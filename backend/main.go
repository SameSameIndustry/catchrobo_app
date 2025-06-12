// main.go (この内容で完全に上書きしてください)
package main

import (
    "context"
    "fmt"
    "os"
    "time"

    "github.com/tiiuae/rclgo/pkg/rclgo"
    // ↓↓↓ あなたのモジュール名に合わせます。go.modファイルで確認してください。
    // "catchrobo_app/msgs/std_msgs/msg"
)

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()
    if err := rclgo.Init(ctx); err != nil {
        fmt.Println("Failed to init rclgo:", err)
        os.Exit(1)
    }

    node, _ := rclgo.NewNode("my_publisher", "")
    pub, _ := node.NewPublisher("/chatter", &msg.String{})

    fmt.Println("Publisher created. Starting to send messages.")
    for i := 0; ; i++ {
        rosMsg := msg.String{Data: fmt.Sprintf("Hello from Go - %d", i)}
        pub.Publish(rosMsg.ToRos())
        time.Sleep(1 * time.Second)
    }
}