import React, { useState } from 'react';
import './App.css';

function App() {
  // 入力されたコマンドを保持するための状態(state)
  const [command, setCommand] = useState<string>('forward');
  // バックエンドからの応答を保持するための状態(state)
  const [response, setResponse] = useState<string>('');
  // 処理中かどうかを示すための状態(state)
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ボタンがクリックされたときに実行される関数
  const handleSendCommand = async () => {
    setIsLoading(true);
    setResponse(''); // 以前の応答をクリア

    try {
      // fetch APIを使ってバックエンドにリクエストを送信
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 入力されたコマンドをJSON形式で送信
        body: JSON.stringify({ command: command }),
      });

      // レスポンスが成功でなければエラーを投げる
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      // 成功したレスポンスをJSONとして解析
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));

    } catch (error: any) {
      // エラーが発生した場合
      setResponse(`Error: ${error.message}`);
    } finally {
      // 処理が成功しても失敗しても、ローディング状態を解除
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Robot Controller</h1>
        <div className="control-panel">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter command"
          />
          <button onClick={handleSendCommand} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Command'}
          </button>
        </div>
        <div className="response-panel">
          <h3>Response from Server:</h3>
          <pre>{response}</pre>
        </div>
      </header>
    </div>
  );
}

export default App;