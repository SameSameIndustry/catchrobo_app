// frontend/src/api/robotAPI.ts

import exp from 'constants';
import { Position, Displacement } from '../types';

const API_BASE_URL = '/api';

/**
 * 指定した座標をバックエンドに送信する
 * @param position 送信する座標データ
 */
export const sendPosition = async (position: Position): Promise<any> => {
  // position.z が未指定なら 0.5 を補完
  const payload = { x: position.x, y: position.y, z: position.z ?? 0.5 };
  try {
    const response = await fetch(`${API_BASE_URL}/position`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to send position:', error);
    throw error;
  }
};

/**
 * 指定した変位量をバックエンドに送信する
 */
export const sendDisplacement = async (displacement: Displacement): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dx: displacement.dx,
        dy: displacement.dy,
        dz: (displacement as any).dz ?? 0.3, // dz を追加、未指定の場合は 0.3 を補完
      }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to send displacement:', error);
    throw error;
  }
};

/**
 * モーション各種
 */
export const startMotion = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/start_motion`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed start motion');
  return response.json();
};

export const downMotion = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/down_motion`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed down motion');
  return response.json();
};

export const upMotion = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/up_motion`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed up motion');
  return response.json();
};

export const catchMotion = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/catch_motion`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed catch motion');
  return response.json();
};
export const releaseMotion = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/release_motion`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed release motion');
  return response.json();
}

export const addDownMotion = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/add_down_motion`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed add down motion');
  return response.json();
}

export const addUpMotion = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/add_up_motion`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed add up motion');
  return response.json();
}

export const middleMotion = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/middle_motion`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed middle down motion');
  return response.json();
}



export const resetMotion = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/reset_motion`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed reset motion');
  return response.json();
};

/**
 * ジョイント角度をバックエンドに送信する
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
 * 利用可能トピック一覧
 */
export const fetchTopics = async (): Promise<string[]> => {
  const res = await fetch(`${API_BASE_URL}/topics`);
  if (!res.ok) throw new Error('Failed to load topics');
  const data = await res.json();
  return data.topics || [];
};

/** カメラ用の固定エンドポイント（<img src> で直接使う） */
export const cameraEndpoints = {
  stream: `${API_BASE_URL}/camera/mjpeg`,
  snapshot: `${API_BASE_URL}/camera/snapshot`,
};

/** 必要なら Blob でスナップショットを取りたい時用の関数 */
export const fetchCameraSnapshotBlob = async (): Promise<Blob> => {
  const res = await fetch(cameraEndpoints.snapshot, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch snapshot');
  return await res.blob();
};
