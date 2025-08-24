// sendPosition(x, y) や sendDisplacement(dx, dy) のような関数を定義します。これにより、コンポーネントは fetch の詳細を意識する必要がなくなります。

// frontend/src/api/robotAPI.ts

import { Position, Displacement } from '../types';

const API_BASE_URL = '/api';  

/**
 * 指定した座標をバックエンドに送信する
 * @param position 送信する座標データ
 */
export const sendPosition = async (position: Position): Promise<any> => {
  // position.z が未指定なら 0 を補完
  const payload = { x: position.x, y: position.y, z: position.z ?? 0 };
  try {
    const response = await fetch(`${API_BASE_URL}/position`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
      body: JSON.stringify({
        dx: displacement.dx,
        dy: displacement.dy,
        dz: displacement.dz ?? 0, // dz を追加、未指定の場合は 0 を補完
      }),
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

/**
 * モーションを開始する
 */
export const startMotion = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/start_motion`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed start motion');
  return response.json();
};

/**
 * モーションをキャッチする
 */
export const catchMotion = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/catch_motion`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed catch motion');
  return response.json();
};

/**
 * モーションをリセットする
 */
export const resetMotion = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/reset_motion`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed reset motion');
  return response.json();
};

/**
 * ジョイント角度をバックエンドに送信する
 * @param angles 送信するジョイント角度の配列
 */
export const sendJointAngles = async (angles: number[]): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/joint_angles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ angles }),
  });
  if (!response.ok) throw new Error('Failed joint angles');
  return response.json();
};

/**
 * トピックのリストをバックエンドから取得する
 */
export const fetchTopics = async (): Promise<string[]> => {
  const res = await fetch(`${API_BASE_URL}/topics`);
  if (!res.ok) throw new Error('Failed to load topics');
  const data = await res.json();
  return data.topics || [];
};