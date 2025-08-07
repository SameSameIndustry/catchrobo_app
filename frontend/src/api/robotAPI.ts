// sendPosition(x, y) や sendDisplacement(dx, dy) のような関数を定義します。これにより、コンポーネントは fetch の詳細を意識する必要がなくなります。

// frontend/src/api/robotAPI.ts

import { Position, Displacement } from '../types';

const API_BASE_URL = '/api';

/**
 * 指定した座標をバックエンドに送信する
 * @param position 送信する座標データ
 */
export const sendPosition = async (position: Position): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/position`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(position),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to send position:", error);
    throw error;
  }
};

/**
 * 指定した変位量をバックエンドに送信する
 * @param displacement 送信する変位量データ
 */
export const sendDisplacement = async (displacement: Displacement): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(displacement),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to send displacement:", error);
    throw error;
  }
};