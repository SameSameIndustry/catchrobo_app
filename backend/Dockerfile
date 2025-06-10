# # ステージ1: ビルド用ステージ
# # Goの公式イメージをベースにする
# FROM golang:1.22-alpine AS builder

# # 作業ディレクトリを設定
# WORKDIR /app

# # go.modとgo.sumをコピーして、依存関係を先にダウンロード
# COPY go.mod ./
# RUN go mod download

# # アプリケーションのソースコードをコピー
# COPY . .

# # アプリケーションをビルド。CGO_ENABLED=0 は静的リンクバイナリを生成するため
# RUN CGO_ENABLED=0 GOOS=linux go build -o /go-catchrobo-app .

# # ステージ2: 実行用ステージ
# # 軽量なAlpine Linuxイメージをベースにする
# FROM alpine:latest

# # 作業ディレクトリを設定
# WORKDIR /

# # ビルド用ステージから、ビルド済みのバイナリのみをコピー
# COPY --from=builder /go-catchrobo-app /go-catchrobo-app

# # アプリケーションが使用するポートを公開
# EXPOSE 8080

# # コンテナ起動時に実行するコマンド
# CMD [ "/go-catchrobo-app" ]


# ベースイメージを指定
FROM golang:latest

# コンテナ内の作業ディレクトリを設定
WORKDIR /app

# ローカルのソースコードをコンテナにコピー
COPY . .

# 必要なパッケージをインストール
RUN go mod download

# アプリケーションをビルド
RUN go build -o main .

# 公開予定のコンテナのポートを明示
EXPOSE 8080

# アプリケーションを実行
CMD ["go", "run", "main.go"]
