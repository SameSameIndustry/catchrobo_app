# ステージ1: ROS2 + rclgo ビルド
FROM ros:humble-ros-base AS builder

RUN apt-get update && apt-get install -y git cmake build-essential curl
WORKDIR /opt/rclgo_ws
RUN git clone https://github.com/tiiuae/rclgo.git src/rclgo
RUN . /opt/ros/humble/setup.sh && colcon build --symlink-install

# ステージ2: GoをROSイメージに導入してビルド（同一OSなのでABI不一致なし）
FROM ros:humble-ros-base AS go-builder
# Go 1.22 を導入（公式tarball）
ARG GOVERSION=1.22.12
RUN curl -fsSL https://go.dev/dl/go${GOVERSION}.linux-amd64.tar.gz \
  | tar -C /usr/local -xz
ENV PATH=/usr/local/go/bin:$PATH
ENV GOTOOLCHAIN=auto \
    LD_LIBRARY_PATH=/opt/ros/humble/lib:/opt/rclgo_ws/install/lib:$LD_LIBRARY_PATH

# ROSとrclgoをコピー
COPY --from=builder /opt/ros/humble /opt/ros/humble
COPY --from=builder /opt/rclgo_ws /opt/rclgo_ws

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .

# 必要ならビルド対象を合わせて
RUN . /opt/ros/humble/setup.sh && \
    . /opt/rclgo_ws/install/setup.sh && \
    CGO_ENABLED=1 go build -o /main ./cmd/service

# ステージ3: ランタイム
FROM ros:humble-ros-base
# 余計なライブラリの手動コピーは不要（同じベースなのでOK）
COPY --from=builder   /opt/ros/humble          /opt/ros/humble
COPY --from=builder   /opt/rclgo_ws/install    /opt/rclgo_ws/install
COPY --from=go-builder /main                   /main
ENV LD_LIBRARY_PATH=/opt/ros/humble/lib:/opt/rclgo_ws/install/lib:$LD_LIBRARY_PATH
CMD . /opt/ros/humble/setup.sh && . /opt/rclgo_ws/install/setup.sh && /main
