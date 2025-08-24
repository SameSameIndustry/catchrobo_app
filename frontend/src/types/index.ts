// frontend/src/types/index.ts

/**
 * 座標を表すインターフェース
 * (例: { "x": 120.5, "y": 88.0 })
 */
export interface Position {
  x: number;
  y: number;
  z: number; // 追加: 高さ(Z)
}

/**
 * 変位量を表すインターフェース
 * (例: { "dx": 0.5, "dy": -0.2 })
 */
export interface Displacement {
  dx: number; // x方向の移動量
  dy: number; // y方向の移動量
}

/**
 * 関節角度を表すインターフェース
 * (例: { "angles": [0.5, -0.2, 1.0, 0.0, -1.5, 3.14] })
 */
export interface JointAngles {
  angles: number[]; // 6関節 [rad]
}