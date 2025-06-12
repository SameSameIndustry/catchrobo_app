package main

import (
	"context"
	"log"

	// 作成したパッケージをインポート
	"catchrobo_app/internal/api"
	"catchrobo_app/internal/robot"

	"github.com/tiiuae/rclgo/pkg/rclgo"
)

func main() {
	// rclgoを初期化
	if err := rclgo.Init(nil); err != nil {
		log.Fatalf("Failed to init rclgo: %v", err)
	}
	defer rclgo.Uninit()

	// アプリケーション全体のコンテキストを作成
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// RobotControllerを初期化
	robotController, err := robot.NewController(ctx)
	if err != nil {
		log.Fatalf("Failed to create robot controller: %v", err)
	}
	defer robotController.Close()

	// ルーターをセットアップ（RobotControllerを渡す）
	router := api.SetupRouter(robotController)

	// Webサーバーをポート8080で起動
	log.Println("Starting server on port 8080...")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}