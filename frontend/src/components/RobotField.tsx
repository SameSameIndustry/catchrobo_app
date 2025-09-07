import React, { useEffect, useMemo, useRef, useState } from 'react';
import { sendPosition } from '../api/robotAPI';
import './RobotField.css';

const ROWS = 10;
const COLS = 4;
type Side = 'blue' | 'red';

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const RobotField: React.FC = () => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const dockLeftRef = useRef<HTMLDivElement>(null);
  const dockRightRef = useRef<HTMLDivElement>(null);

  const [side, setSide] = useState<Side>('blue');
  const [originMode, setOriginMode] = useState<'dock' | 'custom'>('dock');
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  const rows = useMemo(() => ROWS, []);
  const cols = useMemo(() => COLS, []);

  // 選択側 Dock の中心（正規化）を計算
  const computeDockCenter = () => {
    const field = fieldRef.current;
    const dock = side === 'blue' ? dockLeftRef.current : dockRightRef.current;
    if (!field || !dock) return null;
    const fr = field.getBoundingClientRect();
    const dr = dock.getBoundingClientRect();
    const cx = (dr.left + dr.width / 2 - fr.left) / fr.width;
    const cy = (dr.top + dr.height / 2 - fr.top) / fr.height;
    return { x: clamp01(cx), y: clamp01(cy) };
  };

  // サイド変更時：Dock中心に追従
  useEffect(() => {
    if (originMode === 'dock') {
      const c = computeDockCenter();
      if (c) setOrigin(c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side]);

  // リサイズでも Dock 中心に追従
  useEffect(() => {
    if (originMode !== 'dock' || !fieldRef.current) return;
    const ro = new ResizeObserver(() => {
      const c = computeDockCenter();
      if (c) setOrigin(c);
    });
    ro.observe(fieldRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originMode, side]);

  // ブロック押下で、そのブロックの中心座標（正規化）を送信
  const handleBlockPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();

    const field = fieldRef.current;
    const blockEl = e.currentTarget as HTMLDivElement | null;
    if (!field || !blockEl) return;

    const fr = field.getBoundingClientRect();
    const br = blockEl.getBoundingClientRect();

    // ブロック中心の正規化位置（0..1）
    const cx = (br.left + br.width / 2 - fr.left) / fr.width;
    const cy = (br.top + br.height / 2 - fr.top) / fr.height;

    const pos = { x: clamp01(cx), y: clamp01(cy), z: 0 };
    sendPosition(pos)
      .then((res) => console.log('sent block center', pos, res))
      .catch((err) => console.error('sendPosition error', err));
  };

  // 原点 % 入力
  const handleOriginPercentChange = (axis: 'x' | 'y', v: string) => {
    const num = Math.min(100, Math.max(0, Number(v)));
    setOriginMode('custom');
    setOrigin((prev) => ({ ...prev, [axis]: num / 100 }));
  };

  const useDockCenter = () => {
    const c = computeDockCenter();
    if (c) {
      setOriginMode('dock');
      setOrigin(c);
    }
  };

  const renderGrid = (which: 'left' | 'right') => {
    const show =
      (which === 'left' && side === 'blue') || (which === 'right' && side === 'red');
    if (!show) return null;
    const colorClass = which === 'left' ? 'block-left' : 'block-right';
    return (
      <div
        className={`blocks-grid blocks-${which}`}
        style={{ '--rows': rows, '--cols': cols } as React.CSSProperties}
      >
        {Array.from({ length: rows * cols }).map((_, i) => (
          <div
            key={`${which}-${i}`}
            className={`block ${colorClass}`}
            role="button"
            tabIndex={0}
            onPointerDown={handleBlockPointerDown}
            onKeyDown={(ke) => {
              if (ke.key === 'Enter' || ke.key === ' ') {
                // キーボード操作でも同じ処理を走らせる
                (ke.currentTarget as HTMLDivElement).dispatchEvent(
                  new PointerEvent('pointerdown', { bubbles: true })
                );
              }
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="robot-field-outer">
      <div className="robot-field-title">Field</div>

      {/* トグル & 原点UI */}
      <div className="field-controls">
        <div className="side-toggle" role="group" aria-label="side toggle">
          <button
            className={`side-btn ${side === 'blue' ? 'active' : ''}`}
            onClick={() => setSide('blue')}
          >
            Red
          </button>
          <button
            className={`side-btn ${side === 'red' ? 'active' : ''}`}
            onClick={() => setSide('red')}
          >
            Blue
          </button>
        </div>

        <div className="origin-controls">
          <span className="origin-label">原点</span>
          <label>
            X(%)
            <input
              type="number"
              min={0}
              max={100}
              value={Math.round(origin.x * 100)}
              onChange={(e) => handleOriginPercentChange('x', e.target.value)}
            />
          </label>
          <label>
            Y(%)
            <input
              type="number"
              min={0}
              max={100}
              value={Math.round(origin.y * 100)}
              onChange={(e) => handleOriginPercentChange('y', e.target.value)}
            />
          </label>
          <button className="bench-center-btn" onClick={useDockCenter}>
            Dock中心に戻す
          </button>
        </div>
      </div>

      <div ref={fieldRef} className="robot-field" aria-label="robot field">
        {/* 両端の Dock（黒い長方形）— 選択側のみ表示 */}
        {side === 'blue' ? (
          <div ref={dockLeftRef} className="dock dock-left" />
        ) : (
          <div ref={dockRightRef} className="dock dock-right" />
        )}

        {/* 4×10 ブロック（片側だけ表示） */}
        {renderGrid('left')}
        {renderGrid('right')}

        {/* 原点可視化（UI用の表示。送信はブロック中心を使用） */}
        <div
          className="origin-dot"
          style={{ left: `${origin.x * 100}%`, top: `${origin.y * 100}%` }}
        />
      </div>

      <div className="hint">ブロックを押すと、押したブロックの中心座標（正規化）を送信します。</div>
    </div>
  );
};

export default RobotField;
