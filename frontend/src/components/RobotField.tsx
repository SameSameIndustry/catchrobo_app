import React, { useMemo, useRef, useState } from 'react';
import { sendPosition } from '../api/robotAPI';
import './RobotField.css';

const ROWS = 10;
const COLS = 4;
type Side = 'blue' | 'red';

/** ─────────────────────────────────────────────────────────────
 *  CSV 由来：インデックス(1..40)毎のゴール座標（単位: m）
 *  与えられた表：
 *   行方向: x = 0.55,0.45,0.30,0.20,0.05,-0.05,-0.20,-0.30,-0.45,-0.55 (10行)
 *   列方向: y = 1.00,0.90,0.80,0.70 (4列)
 *  インデックス = row * 4 + col + 1 （row-major）
 *  青フィールドをそのまま使用し、赤フィールドは x を符号反転した線対称。
 *  旧実装(mm) + 初期位置差分計算は廃止し、ここではフィールド原点基準の絶対座標(m)を直接送信。
 *  z は送信時 0.5m を決め打ち。
 * ──────────────────────────────────────────────────────────── */
type Coord = { x: number; y: number; z: number };

// 青フィールド座標 (m) - CSV 順序そのまま
const BLUE_COORDS: ReadonlyArray<Coord> = [
  // row 0 (x = 0.55)
  { x: 0.55, y: 1.0, z: 0 },
  { x: 0.55, y: 0.9, z: 0 },
  { x: 0.55, y: 0.8, z: 0 },
  { x: 0.55, y: 0.7, z: 0 },
  // row 1 (x = 0.45)
  { x: 0.45, y: 1.0, z: 0 },
  { x: 0.45, y: 0.9, z: 0 },
  { x: 0.45, y: 0.8, z: 0 },
  { x: 0.45, y: 0.7, z: 0 },
  // row 2 (x = 0.30)
  { x: 0.30, y: 1.0, z: 0 },
  { x: 0.30, y: 0.9, z: 0 },
  { x: 0.30, y: 0.8, z: 0 },
  { x: 0.30, y: 0.7, z: 0 },
  // row 3 (x = 0.20)
  { x: 0.20, y: 1.0, z: 0 },
  { x: 0.20, y: 0.9, z: 0 },
  { x: 0.20, y: 0.8, z: 0 },
  { x: 0.20, y: 0.7, z: 0 },
  // row 4 (x = 0.05)
  { x: 0.05, y: 1.0, z: 0 },
  { x: 0.05, y: 0.9, z: 0 },
  { x: 0.05, y: 0.8, z: 0 },
  { x: 0.05, y: 0.7, z: 0 },
  // row 5 (x = -0.05)
  { x: -0.05, y: 1.0, z: 0 },
  { x: -0.05, y: 0.9, z: 0 },
  { x: -0.05, y: 0.8, z: 0 },
  { x: -0.05, y: 0.7, z: 0 },
  // row 6 (x = -0.20)
  { x: -0.20, y: 1.0, z: 0 },
  { x: -0.20, y: 0.9, z: 0 },
  { x: -0.20, y: 0.8, z: 0 },
  { x: -0.20, y: 0.7, z: 0 },
  // row 7 (x = -0.30)
  { x: -0.30, y: 1.0, z: 0 },
  { x: -0.30, y: 0.9, z: 0 },
  { x: -0.30, y: 0.8, z: 0 },
  { x: -0.30, y: 0.7, z: 0 },
  // row 8 (x = -0.45)
  { x: -0.45, y: 1.0, z: 0 },
  { x: -0.45, y: 0.9, z: 0 },
  { x: -0.45, y: 0.8, z: 0 },
  { x: -0.45, y: 0.7, z: 0 },
  // row 9 (x = -0.55)
  { x: -0.55, y: 1.0, z: 0 },
  { x: -0.55, y: 0.9, z: 0 },
  { x: -0.55, y: 0.8, z: 0 },
  { x: -0.55, y: 0.7, z: 0 },
];

// 赤フィールドは x 符号反転
const RED_COORDS: ReadonlyArray<Coord> = BLUE_COORDS.map(c => ({ x: -c.x, y: c.y, z: 0 }));
const RobotField: React.FC = () => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const dockLeftRef = useRef<HTMLDivElement>(null);
  const dockRightRef = useRef<HTMLDivElement>(null);

  // 以前の要望どおり「左＝赤、右＝青」
  const [side, setSide] = useState<Side>('blue');

  const rows = useMemo(() => ROWS, []);
  const cols = useMemo(() => COLS, []);

  /** ブロック押下：インデックス→ハードコーディング座標を送信 */
  const [lastGoal, setLastGoal] = useState<null | { side: Side; index: number; x: number; y: number; z: number }>(null);

  const handleBlockPointerDown = (index: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const table = side === 'red' ? RED_COORDS : BLUE_COORDS;
    const base = table[index];
    if (!base) {
      console.error('coordinate not found for index', index, 'side=', side);
      return;
    }
    // 送信用：z を 0.5m とする
    const pos = { x: base.x, y: base.y, z: 0.5 };
    sendPosition(pos)
      .then((res) => {
        console.log(`sent [${side}] i=${index + 1}`, pos, res);
        setLastGoal({ side, index: index + 1, ...pos });
      })
      .catch((err) => console.error('sendPosition error', err));
  };

  /** グリッド生成（インデックスを描画して可視化） */
  const renderGrid = (which: 'left' | 'right') => {
    const show =
      (which === 'left' && side === 'red') || (which === 'right' && side === 'blue');
    if (!show) return null;

    // 色クラス：左＝赤系, 右＝青系
    const colorClass = which === 'left' ? 'block-right' : 'block-left';

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
            onPointerDown={handleBlockPointerDown(i)}
            onKeyDown={(ke) => {
              if (ke.key === 'Enter' || ke.key === ' ') {
                (ke.currentTarget as HTMLDivElement).dispatchEvent(
                  new PointerEvent('pointerdown', { bubbles: true })
                );
              }
            }}
            style={{ position: 'relative' }}
            aria-label={`index ${i + 1}`}
            title={`#${i + 1}`}
          >
            {/* インデックス表示（中央） */}
            <span
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                color: '#1b1f23',
                pointerEvents: 'none',
                userSelect: 'none',
                opacity: 0.9,
              }}
            >
              {i + 1}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="robot-field-outer">
      <div className="robot-field-title">Field</div>

      {/* 最終送信ゴール表示 */}
      <div style={{ margin: '4px 0 8px', fontSize: '12px', lineHeight: 1.4 }}>
        {lastGoal ? (
          <span>
            最終送信: <strong>{lastGoal.side}</strong> idx #{lastGoal.index} → (
            x={lastGoal.x.toFixed(3)} m, y={lastGoal.y.toFixed(3)} m, z={lastGoal.z.toFixed(2)} m)
          </span>
        ) : (
          <span>まだゴールは送信されていません。</span>
        )}
      </div>

      {/* サイド切替だけ残しています（原点UIなどは不要なので削除） */}
      <div className="field-controls">
        <div className="side-toggle" role="group" aria-label="side toggle">
          <button
            className={`side-btn ${side === 'red' ? 'active' : ''}`}
            onClick={() => setSide('red')}
          >
            Red
          </button>
          <button
            className={`side-btn ${side === 'blue' ? 'active' : ''}`}
            onClick={() => setSide('blue')}
          >
            Blue
          </button>
        </div>
      </div>

      <div ref={fieldRef} className="robot-field" aria-label="robot field">
        {/* Dock（青=右 / 赤=左）— 見た目だけ残しています */}
        {side === 'blue' ? (
          <div ref={dockRightRef} className="dock dock-right" />
        ) : (
          <div ref={dockLeftRef} className="dock dock-left" />
        )}

        {/* 4×10 ブロック（片側だけ表示） */}
        {renderGrid('left')}
        {renderGrid('right')}
      </div>

      <div className="hint">
        ブロックを押すと、ハードコード済みテーブルの (x,y,z) を送信します（表示番号＝インデックス+1）。
      </div>
    </div>
  );
};

export default RobotField;
