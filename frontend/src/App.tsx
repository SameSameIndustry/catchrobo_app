// frontend/src/App.tsx

import React, { useState } from 'react';
import './App.css';
import RobotField from './components/RobotField';
import ControlPad from './components/ControlPad';
import CameraView from './components/CameraView';
import { sendPosition, sendJointAngles, startMotion, downMotion, upMotion, catchMotion, resetMotion } from './api/robotAPI';

// タブの種類を型として定義しておくと、コードが安全になります
type Tab = 'competition' | 'debug' | 'field' | 'camera';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('competition');
  const [goal, setGoal] = useState({ x: '', y: '', z: '' });
  const [jointAngles, setJointAngles] = useState<string[]>(['', '', '', '', '', '']);
  const [message, setMessage] = useState<string>('');

  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGoal(prev => ({ ...prev, [name]: value }));
  };

  const submitGoal = async () => {
    try {
      await sendPosition({ x: parseFloat(goal.x), y: parseFloat(goal.y), z: parseFloat(goal.z) });
      setMessage('Goal sent');
    } catch (e: any) { setMessage(e.message); }
  };

  const pressMotion = async (fn: () => Promise<any>) => {
    try { await fn(); setMessage('OK'); } catch (e: any) { setMessage(e.message); }
  };

  const handleJointChange = (idx: number, val: string) => {
    setJointAngles(prev => prev.map((v, i) => i === idx ? val : v));
  };

  const submitJointAngles = async () => {
    try {
      const angles = jointAngles.map(a => parseFloat(a) || 0);
      await sendJointAngles(angles);
      setMessage('Joint angles sent');
    } catch (e: any) { setMessage(e.message); }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>
          {activeTab === 'competition'
            ? '競技用'
            : activeTab === 'debug'
              ? 'デバッグ用'
              : activeTab === 'field'
                ? 'フィールド表示'
                : 'カメラ表示'}
        </h1>

        <div className="content-area">
          {activeTab === 'competition' && (
            <div className="competition-layout">
              {/* ← 左カラム：操作系まとめ */}
              <div className="left-column">
                <div className="motion-buttons">
                  <button onClick={() => pressMotion(startMotion)}>Start Motion</button>
                  <button onClick={() => pressMotion(catchMotion)}>Catch Motion</button>
                  <button onClick={() => pressMotion(resetMotion)}>Reset Motion</button>
                  <button onClick={() => pressMotion(downMotion)}>Down Motion</button>
                  <button onClick={() => pressMotion(upMotion)}>Up Motion</button>
                </div>

                <div className="goal-inputs">
                  <span>目標ゴール座標</span>
                  <div className="goal-row">
                    x:<input name="x" value={goal.x} onChange={handleGoalChange} />
                    y:<input name="y" value={goal.y} onChange={handleGoalChange} />
                    z:<input name="z" value={goal.z} onChange={handleGoalChange} />
                    <button onClick={submitGoal}>送信</button>
                  </div>
                </div>

                <div className="pad-area">
                  <ControlPad />
                </div>
              </div>

              {/* → 右カラム：フィールド */}
              <div className="field-pane">
                <RobotField />
              </div>
            </div>
          )}

          {activeTab === 'debug' && (
            <div className="debug-layout">
              <div className="coord-inputs">
                X:<input value={goal.x} name="x" onChange={handleGoalChange} />
                Y:<input value={goal.y} name="y" onChange={handleGoalChange} />
                Z:<input value={goal.z} name="z" onChange={handleGoalChange} />
                <button onClick={submitGoal}>Move</button>
              </div>
              <div className="joint-inputs">
                {jointAngles.map((val, i) => (
                  <div key={i} className="joint-row">Joint {i + 1}: <input value={val} onChange={e => handleJointChange(i, e.target.value)} /> rad</div>
                ))}
                <button onClick={submitJointAngles}>Send Joints</button>
              </div>
            </div>
          )}

          {activeTab === 'field' && <RobotField />}

          {activeTab === 'camera' && <CameraView />}
        </div>

        <div className="status-message">{message}</div>

        <nav className="tab-bar">
          <button className={`tab-button ${activeTab === 'competition' ? 'active' : ''}`} onClick={() => setActiveTab('competition')}>競技用</button>
          <button className={`tab-button ${activeTab === 'debug' ? 'active' : ''}`} onClick={() => setActiveTab('debug')}>デバッグ用</button>
          <button className={`tab-button ${activeTab === 'field' ? 'active' : ''}`} onClick={() => setActiveTab('field')}>フィールド表示</button>
          <button className={`tab-button ${activeTab === 'camera' ? 'active' : ''}`} onClick={() => setActiveTab('camera')}>カメラ</button>
        </nav>
      </header>
    </div>
  );
}

export default App;
