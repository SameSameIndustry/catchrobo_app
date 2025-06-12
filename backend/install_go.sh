#!/bin/bash

# --- 設定項目 ---
# インストールしたいGoのバージョンを指定します。
# 最新版は https://go.dev/dl/ で確認してください。
GO_VERSION="1.22.4"
# -----------------

# スクリプトが失敗したら、その場で終了する
set -e

# --- 変数定義 ---
OS="linux"
ARCH="amd64"
GO_FILE="go${GO_VERSION}.${OS}-${ARCH}.tar.gz"
DOWNLOAD_URL="https://go.dev/dl/${GO_FILE}"
INSTALL_DIR="/usr/local"
# PROFILE_SCRIPT="~/.bashrc"  # ユーザーのホームディレクトリにある.bashrcを使用

# --- 事前チェック ---
# root権限で実行されているか確認
if [ "$(id -u)" -ne 0 ]; then
  echo "このスクリプトはroot権限で実行する必要があります。'sudo ./install_go.sh' のように実行してください。"
  exit 1
fi
echo 'export PATH=$PATH:$(go env GOPATH)/bin' >> ~/.bashrc
# --- インストール処理 ---
echo "Go v${GO_VERSION} をダウンロードしています..."
# wgetを使用して一時ディレクトリにダウンロード
wget -q "${DOWNLOAD_URL}" -O "/tmp/${GO_FILE}"
echo "ダウンロードが完了しました。"

# 既存のGoインストレーションを削除
if [ -d "${INSTALL_DIR}/go" ]; then
  echo "既存のGoのインストールを ${INSTALL_DIR}/go から削除します..."
  rm -rf "${INSTALL_DIR}/go"
  echo "古いバージョンを削除しました。"
fi

echo "ダウンロードしたアーカイブを ${INSTALL_DIR} に展開しています..."
tar -C "${INSTALL_DIR}" -xzf "/tmp/${GO_FILE}"
echo "展開が完了しました。"

# --- 環境設定 ---
echo "システム全体のPATH環境変数を設定します..."
# # 全ユーザーに適用されるように/etc/profile.dに設定ファイルを作成
# cat > "${PROFILE_SCRIPT}" << EOF
# # Go言語の環境変数設定
# export PATH=\$PATH:${INSTALL_DIR}/go/bin
# export GOPATH=\$HOME/go
# EOF
echo "プロファイルスクリプトを ${PROFILE_SCRIPT} に作成しました。"
echo "GOPATHは \$HOME/go に設定されます。"

# --- クリーンアップ ---
echo "ダウンロードした一時ファイルを削除しています..."
rm "/tmp/${GO_FILE}"
echo "クリーンアップが完了しました。"

# --- 完了メッセージ ---
echo ""
echo "---------------------------------------------------------"
echo "Go v${GO_VERSION} のインストールが正常に完了しました！"
echo ""
echo "現在のセッションでGoを有効にするには、以下のコマンドを実行してください:"
echo "  source ${PROFILE_SCRIPT}"
echo ""
echo "または、一度ログアウトして再度ログインしてください。"
echo "以下のコマンドでインストールを確認できます:"
echo "  go version"
echo "---------------------------------------------------------"