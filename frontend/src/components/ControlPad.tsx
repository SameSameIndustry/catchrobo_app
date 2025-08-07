// フィールド画像を表示し、クリックされた座標を取得して api 経由でバックエンドに送信する責務を持ちます。

// frontend/src/components/ControlPad.tsx

import React, { useRef } from 'react';
import { Displacement } from '../types'; // <-- この行を追加！
import { sendDisplacement } from '../api/robotAPI';
import './ControlPad.css';

// 1秒あたりに動く量（単位は任意）
const MOVE_SPEED = 0.1; // units per second

const ControlPad = () => {
  // 再レンダリングを発生させずに値を保持するためにuseRefを使用
  const pressStartTime = useRef<number | null>(null);

  // マウスボタンが押された時の処理
  const handlePressStart = () => {
    pressStartTime.current = Date.now();
  };

  // マウスボタンが離された時の処理
  const handlePressEnd = (dx: number, dy: number) => {
    if (pressStartTime.current === null) return;

    const pressDuration = (Date.now() - pressStartTime.current) / 1000; // 秒単位
    
    // 移動量 = 速度 x 時間
    const displacement: Displacement = {
      dx: dx * MOVE_SPEED * pressDuration,
      dy: dy * MOVE_SPEED * pressDuration,
    };

    console.log(`Moved for ${pressDuration.toFixed(2)}s. Displacement: (${displacement.dx.toFixed(3)}, ${displacement.dy.toFixed(3)})`);
    
    // API関数を呼び出して変位量を送信
    sendDisplacement(displacement)
      .then(response => console.log('Server response:', response))
      .catch(error => console.error('Error sending displacement:', error));

    pressStartTime.current = null;
  };

  return (
    <div className="control-pad-container">
      <h3>Control Pad</h3>
      <div className="control-pad">
        <button
          className="control-button up"
          onMouseDown={handlePressStart}
          onMouseUp={() => handlePressEnd(0, -1)}
        >
          ↑
        </button>
        <div className="middle-row">
          <button
            className="control-button left"
            onMouseDown={handlePressStart}
            onMouseUp={() => handlePressEnd(-1, 0)}
          >
            ←
          </button>
          <button
            className="control-button right"
            onMouseDown={handlePressStart}
            onMouseUp={() => handlePressEnd(1, 0)}
          >
            →
          </button>
        </div>
        <button
          className="control-button down"
          onMouseDown={handlePressStart}
          onMouseUp={() => handlePressEnd(0, 1)}
        >
          ↓
        </button>
      </div>
    </div>
  );
};

export default ControlPad;