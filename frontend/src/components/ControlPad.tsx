// フィールド画像を表示し、クリックされた座標を取得して api 経由でバックエンドに送信する責務を持ちます。

// frontend/src/components/ControlPad.tsx

import React, { useRef, useEffect } from 'react';
import { sendDisplacement } from '../api/robotAPI';
import './ControlPad.css';

// 1 tick(100ms) あたりに送る変位量（任意単位）
const STEP_PER_TICK = 0.01; // 調整可能
const Z_STEP_PER_TICK = 0.01; // Z方向

const ControlPad = () => {
  const intervalRef = useRef<number | null>(null);
  const directionRef = useRef<{dx:number;dy:number;dz:number}>({dx:0,dy:0,dz:0});
  const stop = () => { if (intervalRef.current !== null) { clearInterval(intervalRef.current); intervalRef.current = null; } directionRef.current = {dx:0,dy:0,dz:0}; };
  const start = (dx:number, dy:number, dz:number=0) => { if (intervalRef.current) return; directionRef.current = {dx,dy,dz}; tick(); intervalRef.current = window.setInterval(tick, 100); };
  const tick = () => { const {dx,dy,dz} = directionRef.current; if (dx === 0 && dy === 0 && dz === 0) return; sendDisplacement({ dx: dx * STEP_PER_TICK, dy: dy * STEP_PER_TICK, dz: dz * Z_STEP_PER_TICK }).catch(err => console.error('displacement send failed', err)); };
  useEffect(() => () => stop(), []);

  return (
    <div className="control-pad-container">
      <h3>Control Pad</h3>
      <div className="control-pad-body">
        <div className="dpad">
          <button className="control-button up"    onMouseDown={() => start(0,-1)} onMouseUp={stop} onMouseLeave={stop} onTouchStart={(e)=>{e.preventDefault(); start(0,-1);}} onTouchEnd={stop} style={{gridArea:'up'}}>↑</button>
          <button className="control-button left"  onMouseDown={() => start(-1,0)} onMouseUp={stop} onMouseLeave={stop} onTouchStart={(e)=>{e.preventDefault(); start(-1,0);}} onTouchEnd={stop} style={{gridArea:'left'}}>←</button>
          <button className="control-button right" onMouseDown={() => start(1,0)}  onMouseUp={stop} onMouseLeave={stop} onTouchStart={(e)=>{e.preventDefault(); start(1,0);}}  onTouchEnd={stop} style={{gridArea:'right'}}>→</button>
          <button className="control-button down"  onMouseDown={() => start(0,1)}  onMouseUp={stop} onMouseLeave={stop} onTouchStart={(e)=>{e.preventDefault(); start(0,1);}}  onTouchEnd={stop} style={{gridArea:'down'}}>↓</button>
        </div>
        <div className="z-column">
          <button className="control-button z-up"   onMouseDown={() => start(0,0,1)}  onMouseUp={stop} onMouseLeave={stop} onTouchStart={(e)=>{e.preventDefault(); start(0,0,1);}}  onTouchEnd={stop}>Z+</button>
          <button className="control-button z-down" onMouseDown={() => start(0,0,-1)} onMouseUp={stop} onMouseLeave={stop} onTouchStart={(e)=>{e.preventDefault(); start(0,0,-1);}} onTouchEnd={stop}>Z-</button>
        </div>
      </div>
    </div>
  );
};

export default ControlPad;