# rclgoはros2のインストールが必須
# ステージ1: ROS2環境とrclgoの依存関係をビルド
FROM ros:humble-ros-base AS builder

# 必要なツールをインストール
RUN apt-get update && apt-get install -y \
    git \
    cmake \
    build-essential

# rclgoをクローンしてビルド
WORKDIR /opt/rclgo_ws
RUN git clone https://github.com/tiiuae/rclgo.git src/rclgo
RUN . /opt/ros/humble/setup.sh && colcon build --symlink-install

# ステージ2: Goアプリケーションのビルド
FROM golang:1.21 AS go-builder

# ビルダーからROS2とrclgoの環境をコピー5.1 
COPY --from=builder /opt/ros/humble /opt/ros/humble
COPY --from=builder /opt/rclgo_ws /opt/rclgo_ws

# Goモジュールの依存関係を解決
WORKDIR /app
COPY go.mod ./
COPY go.sum ./
RUN go mod download

# ソースコードをコピーしてビルド
COPY *.go ./
RUN . /opt/ros/humble/setup.sh && \
    . /opt/rclgo_ws/install/setup.sh && \
    CGO_ENABLED=1 go build -o /main .

# ステージ3: 最終的な実行イメージ
FROM ros:humble-ros-core

# 必要なライブラリと証明書をコピー
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/lib/x86_64-linux-gnu /usr/lib/x86_64-linux-gnu
COPY --from=builder /lib/x86_64-linux-gnu /lib/x86_64-linux-gnu

# ROS2とrclgo環境をコピー
COPY --from=builder /opt/ros/humble /opt/ros/humble
COPY --from=builder /opt/rclgo_ws/install /opt/rclgo_ws/install

# ビルドしたGoバイナリをコピー
COPY --from=go-builder /main /main

# ROS2環境をセットアップし、アプリケーションを実行
CMD . /opt/ros/humble/setup.sh && . /opt/rclgo_ws/setup.sh && /main