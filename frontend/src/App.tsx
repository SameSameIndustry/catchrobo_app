// frontend/src/App.tsx

import React, { useState } from 'react';
import './App.css';
import RobotField from './components/RobotField'; // 作成したコンポーネントをインポート
import ControlPad from './components/ControlPad'; // 作成したコンポーネントをインポート

function App() {
  const [response, setResponse] = useState<string>('');
  
  // (メモ) 各コンポーネントがAPIを直接叩くので、App.tsxはシンプルになります。
  // 必要であれば、レスポンス表示などの共通ロジックはここに残します。

  return (
    <div className="App">
      <header className="App-header">
        <h1>Robot Controller</h1>
        <div className="main-interface">
          <RobotField />
          <ControlPad />
        </div>
        <div className="response-panel">
          <h3>Response from Server:</h3>
          <pre>{response || 'No response yet...'}</pre>
        </div>
      </header>
    </div>
  );
}

export default App;