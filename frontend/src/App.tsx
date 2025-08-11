// frontend/src/App.tsx

import React, { useState, useEffect } from 'react';
import './App.css';
import RobotField from './components/RobotField';
import ControlPad from './components/ControlPad';

// タブの種類を型として定義しておくと、コードが安全になります
type Tab = 'position' | 'manual' | 'topic';

function App() {
  // 現在アクティブなタブを管理するためのState
  // 初期値として 'position' (座標指定モード) を設定
  const [activeTab, setActiveTab] = useState<Tab>('position');
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [topicContent, setTopicContent] = useState<string>('');

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/topics');
      const data = await response.json();
      setTopics(data.topics);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'topic') {
      fetchTopics();
    }
  }, [activeTab]);

  const handleTopicChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const topic = event.target.value;
    setSelectedTopic(topic);
    try {
      const response = await fetch(`/api/topics/${topic}`);
      const data = await response.json();
      setTopicContent(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to fetch topic content:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        {/* activeTabの値に応じてコンポーネントのタイトルを変更 */}
        <h1>{activeTab === 'position' ? 'Position Control' : activeTab === 'manual' ? 'Manual Control' : 'Topic Interface'}</h1>

        {/* コンテンツエリア */}
        <div className="content-area">
          {/* activeTabが 'position' の場合にのみ RobotField を表示 */}
          {activeTab === 'position' && <RobotField />}
          
          {/* activeTabが 'manual' の場合にのみ ControlPad を表示 */}
          {activeTab === 'manual' && <ControlPad />}
          {activeTab === 'topic' && (
            <div>
              <button onClick={fetchTopics}>Reload Topics</button>
              <select onChange={handleTopicChange} value={selectedTopic}>
                <option value="">Select a topic</option>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
              <pre>{topicContent}</pre>
            </div>
          )}
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
          <button
            // activeTabが 'topic' の場合に 'active' クラスを付与
            className={`tab-button ${activeTab === 'topic' ? 'active' : ''}`}
            // クリックされたら activeTab の値を 'topic' に更新
            onClick={() => setActiveTab('topic')}
          >
            Topic IF
          </button>
        </nav>
      </header>
    </div>
  );
}

export default App;