// 矢印ボタンのUIを表示し、ボタンが押されている時間を計測して、変位量をバックエンドに送信する責務を持ちます。

// frontend/src/components/RobotField.tsx

import React from 'react';
// src/assets/field.png に画像を配置したと仮定
import fieldImage from '../assets/field.png';
import { sendPosition } from '../api/robotAPI';
import './RobotField.css'; // スタイル用にCSSファイルをインポート

const RobotField = () => {
  const handleClick = (event: React.MouseEvent<HTMLImageElement>) => {
    // 画像要素のサイズと画面上の位置を取得
    const rect = event.currentTarget.getBoundingClientRect();

    // クリック位置の画像内での相対座標を計算
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // (オプション) バックエンドが扱いやすいように座標を正規化（0.0 ~ 1.0の範囲に）
    const normalizedX = x / rect.width;
    const normalizedY = y / rect.height;

    console.log(`Clicked at: (${x}, ${y}) | Normalized: (${normalizedX.toFixed(3)}, ${normalizedY.toFixed(3)})`);
    
    // API関数を呼び出して座標を送信
    sendPosition({ x: normalizedX, y: normalizedY, z: 0 }) // zは0で固定
      .then(response => console.log('Server response:', response))
      .catch(error => console.error('Error sending position:', error));
  };

  return (
    <div className="robot-field-container">
      <h3>Field</h3>
      <img
        src={fieldImage}
        alt="Robot Field"
        onClick={handleClick}
        className="robot-field-image"
      />
    </div>
  );
};

export default RobotField;