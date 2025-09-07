import React, { useMemo, useRef, useState } from 'react';
import { sendPosition } from '../api/robotAPI';
import './RobotField.css';

const ROWS = 10;
const COLS = 4;
type Side = 'blue' | 'red';

/** ─────────────────────────────────────────────────────────────
 *  ハードコーディング座標 (mm)：
 *  フィールド中心 = (0,0)
 *  赤フィールド：ロボットセット位置 ≈ (845, 0)
 *  赤の最左上ブロック中心 = (565, -508.4)
 *  ブロック中心間隔：横 100 / 縦 100
 *
 *  インデックスはグリッド内で row-major（0..39）:
 *    row = Math.floor(i / 4), col = i % 4
 *  赤は (x, y) = (565 + 100*col, -508.4 + 100*row)
 *  青は左右対称（x 反転）とし、
 *    (x, y) = (-(565 + 100*col), -508.4 + 100*row)
 * ──────────────────────────────────────────────────────────── */
const RED_COORDS: ReadonlyArray<{ x: number; y: number; z: number }> = [
  // row 0 (y = -508.4)
  { x: 565, y: -508.4, z: 0 },
  { x: 665, y: -508.4, z: 0 },
  { x: 765, y: -508.4, z: 0 },
  { x: 865, y: -508.4, z: 0 },
  // row 1 (y = -408.4)
  { x: 565, y: -408.4, z: 0 },
  { x: 665, y: -408.4, z: 0 },
  { x: 765, y: -408.4, z: 0 },
  { x: 865, y: -408.4, z: 0 },
  // row 2 (y = -308.4)
  { x: 565, y: -308.4, z: 0 },
  { x: 665, y: -308.4, z: 0 },
  { x: 765, y: -308.4, z: 0 },
  { x: 865, y: -308.4, z: 0 },
  // row 3 (y = -208.4)
  { x: 565, y: -208.4, z: 0 },
  { x: 665, y: -208.4, z: 0 },
  { x: 765, y: -208.4, z: 0 },
  { x: 865, y: -208.4, z: 0 },
  // row 4 (y = -108.4)
  { x: 565, y: -108.4, z: 0 },
  { x: 665, y: -108.4, z: 0 },
  { x: 765, y: -108.4, z: 0 },
  { x: 865, y: -108.4, z: 0 },
  // row 5 (y =  -8.4)
  { x: 565, y: -8.4, z: 0 },
  { x: 665, y: -8.4, z: 0 },
  { x: 765, y: -8.4, z: 0 },
  { x: 865, y: -8.4, z: 0 },
  // row 6 (y =   91.6)
  { x: 565, y: 91.6, z: 0 },
  { x: 665, y: 91.6, z: 0 },
  { x: 765, y: 91.6, z: 0 },
  { x: 865, y: 91.6, z: 0 },
  // row 7 (y =  191.6)
  { x: 565, y: 191.6, z: 0 },
  { x: 665, y: 191.6, z: 0 },
  { x: 765, y: 191.6, z: 0 },
  { x: 865, y: 191.6, z: 0 },
  // row 8 (y =  291.6)
  { x: 565, y: 291.6, z: 0 },
  { x: 665, y: 291.6, z: 0 },
  { x: 765, y: 291.6, z: 0 },
  { x: 865, y: 291.6, z: 0 },
  // row 9 (y =  391.6)
  { x: 565, y: 391.6, z: 0 },
  { x: 665, y: 391.6, z: 0 },
  { x: 765, y: 391.6, z: 0 },
  { x: 865, y: 391.6, z: 0 },
];

const BLUE_COORDS: ReadonlyArray<{ x: number; y: number; z: number }> = [
  // row 0 (y = -508.4)
  { x: -565, y: -508.4, z: 0 },
  { x: -665, y: -508.4, z: 0 },
  { x: -765, y: -508.4, z: 0 },
  { x: -865, y: -508.4, z: 0 },
  // row 1 (y = -408.4)
  { x: -565, y: -408.4, z: 0 },
  { x: -665, y: -408.4, z: 0 },
  { x: -765, y: -408.4, z: 0 },
  { x: -865, y: -408.4, z: 0 },
  // row 2 (y = -308.4)
  { x: -565, y: -308.4, z: 0 },
  { x: -665, y: -308.4, z: 0 },
  { x: -765, y: -308.4, z: 0 },
  { x: -865, y: -308.4, z: 0 },
  // row 3 (y = -208.4)
  { x: -565, y: -208.4, z: 0 },
  { x: -665, y: -208.4, z: 0 },
  { x: -765, y: -208.4, z: 0 },
  { x: -865, y: -208.4, z: 0 },
  // row 4 (y = -108.4)
  { x: -565, y: -108.4, z: 0 },
  { x: -665, y: -108.4, z: 0 },
  { x: -765, y: -108.4, z: 0 },
  { x: -865, y: -108.4, z: 0 },
  // row 5 (y =  -8.4)
  { x: -565, y: -8.4, z: 0 },
  { x: -665, y: -8.4, z: 0 },
  { x: -765, y: -8.4, z: 0 },
  { x: -865, y: -8.4, z: 0 },
  // row 6 (y =   91.6)
  { x: -565, y: 91.6, z: 0 },
  { x: -665, y: 91.6, z: 0 },
  { x: -765, y: 91.6, z: 0 },
  { x: -865, y: 91.6, z: 0 },
  // row 7 (y =  191.6)
  { x: -565, y: 191.6, z: 0 },
  { x: -665, y: 191.6, z: 0 },
  { x: -765, y: 191.6, z: 0 },
  { x: -865, y: 191.6, z: 0 },
  // row 8 (y =  291.6)
  { x: -565, y: 291.6, z: 0 },
  { x: -665, y: 291.6, z: 0 },
  { x: -765, y: 291.6, z: 0 },
  { x: -865, y: 291.6, z: 0 },
  // row 9 (y =  391.6)
  { x: -565, y: 391.6, z: 0 },
  { x: -665, y: 391.6, z: 0 },
  { x: -765, y: 391.6, z: 0 },
  { x: -865, y: 391.6, z: 0 },
];

const BlueInitialPosition = { x: 845, y: 0, z: 0 };
const RedInitialPosition = { x: -845, y: 0, z: 0 };
const RobotField: React.FC = () => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const dockLeftRef = useRef<HTMLDivElement>(null);
  const dockRightRef = useRef<HTMLDivElement>(null);

  // 以前の要望どおり「左＝赤、右＝青」
  const [side, setSide] = useState<Side>('blue');

  const rows = useMemo(() => ROWS, []);
  const cols = useMemo(() => COLS, []);

  /** ブロック押下：インデックス→ハードコーディング座標を送信 */
  const handleBlockPointerDown =
    (index: number) => (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const table = side === 'red' ? RED_COORDS.map(
        coord => ({ x: (coord.x - RedInitialPosition.x)/1000, y: (coord.y - RedInitialPosition.y)/1000, z: (coord.z - RedInitialPosition.z)/1000 })) :
        BLUE_COORDS.map(coord => ({ x: (coord.x - BlueInitialPosition.x)/1000,  y: (coord.y - BlueInitialPosition.y)/1000, z: (coord.z - BlueInitialPosition.z)/1000 }));
      const pos = table[index];
      if (!pos) {
        console.error('coordinate not found for index', index, 'side=', side);
        return;
      }
      sendPosition(pos)
        .then((res) => console.log(`sent [${side}] i=${index + 1}`, pos, res))
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
