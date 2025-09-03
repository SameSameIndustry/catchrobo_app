import React, { useRef } from 'react';
import { sendPosition } from '../api/robotAPI';
import './RobotField.css';

const ROWS = 10; // 縦
const COLS = 4;  // 横

const RobotField: React.FC = () => {
  const fieldRef = useRef<HTMLDivElement>(null);

  const handleBlockPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = fieldRef.current;
    if (!container) return;

    const cRect = container.getBoundingClientRect();
    const bRect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();

    const cx = bRect.left + bRect.width / 2 - cRect.left;
    const cy = bRect.top + bRect.height / 2 - cRect.top;

    const nx = cx / cRect.width;
    const ny = cy / cRect.height;

    sendPosition({ x: nx, y: ny, z: 0 })
      .then((res) => console.log('sent', { nx, ny }, res))
      .catch((err) => console.error('sendPosition error', err));
  };

  const renderGrid = (side: 'left' | 'right') => (
    <div
      className={`blocks-grid blocks-${side}`}
      style={{ '--rows': ROWS, '--cols': COLS } as React.CSSProperties}
    >
      {Array.from({ length: ROWS * COLS }).map((_, i) => (
        <div
          key={`${side}-${i}`}
          className={`block block-${side}`}
          role="button"
          tabIndex={0}
          onPointerDown={handleBlockPointerDown}
          onKeyDown={(ke) => {
            if (ke.key === 'Enter' || ke.key === ' ') {
              (ke.target as HTMLDivElement).dispatchEvent(
                new PointerEvent('pointerdown', { bubbles: true })
              );
            }
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="robot-field-outer">
      <div className="robot-field-title">Field</div>

      <div ref={fieldRef} className="robot-field" aria-label="robot field">
        {/* 装飾（クリック不可） */}
        <div className="bench bench-left" />
        <div className="bench bench-right" />

        {/* ★ 左右どちらにも 4×10 を配置 */}
        {renderGrid('left')}
        {renderGrid('right')}
      </div>
    </div>
  );
};

export default RobotField;
