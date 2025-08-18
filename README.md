# キャチロボapp
## 起動法
``` docker compose up -d --build```
各コンテナに入りたいときは
```docker exec -it <コンテナ名> sh```
ログを見たいときは
```docker logs <コンテナ名> -f```

## フロントエンド
ポートは3000
## バックエンド
ポートは8080
### エンドポイント
| HTTP Method | Path            | 説明 |
| ----------- | --------------- | ------------------------------------ |
| **POST**    | `/api/command`  | ロボットにコマンドを送信する |
| **POST**    | `/api/position` | ロボットに位置情報を送信する |
| **POST**    | `/api/move`     | ロボットに移動指示を送信する |
| **GET**     | `/api/topics`   | 現在のROSトピック一覧を取得する|


## その他
bindマウントにしてるからホットリロードされるはず
バックエンドが起動しているかを知りたいときはlocalhost:8080にアクセスして```{"message":"Hello from Robot API!"}```と表示される。
## rclgoメモ
- 使いたいmsgsがありたいときは
    - ```ls /opt/ros/$ROS_DISTRO/share/geometry_msgs```でmsgsが定義されてるか確認
    - ``` rclgo-gen generate -d msgs```で自動的に$AMENT_PREFIX_PATHを見てくれてそこのmsgsをrclgoで使えるためのファイルを自動的に作ってくれる
