// frontend/src/App.tsx

import React, { useState } from 'react';
import './App.css';
import RobotField from './components/RobotField';
import ControlPad from './components/ControlPad';

// タブの種類を型として定義しておくと、コードが安全になります
type Tab = 'position' | 'manual';

function App() {
  // 現在アクティブなタブを管理するためのState
  // 初期値として 'position' (座標指定モード) を設定
  const [activeTab, setActiveTab] = useState<Tab>('position');

  return (
    <div className="App">
      <header className="App-header">
        {/* activeTabの値に応じてコンポーネントのタイトルを変更 */}
        <h1>{activeTab === 'position' ? 'Position Control' : 'Manual Control'}</h1>

        {/* コンテンツエリア */}
        <div className="content-area">
          {/* activeTabが 'position' の場合にのみ RobotField を表示 */}
          {activeTab === 'position' && <RobotField />}
          
          {/* activeTabが 'manual' の場合にのみ ControlPad を表示 */}
          {activeTab === 'manual' && <ControlPad />}
        </div>

        {/* タブナビゲーションバー */}
        <nav className="tab-bar">
          <button
            // activeTabが 'position' の場合に 'active' クラスを付与
            className={`tab-button ${activeTab === 'position' ? 'active' : ''}`}
            // クリックされたら activeTab の値を 'position' に更新
            onClick={() => setActiveTab('position')}
          >
            Position
          </button>
          <button
            // activeTabが 'manual' の場合に 'active' クラスを付与
            className={`tab-button ${activeTab === 'manual' ? 'active' : ''}`}
            // クリックされたら activeTab の値を 'manual' に更新
            onClick={() => setActiveTab('manual')}
          >
            Manual
          </button>
        </nav>
      </header>
    </div>
  );
}

export default App;