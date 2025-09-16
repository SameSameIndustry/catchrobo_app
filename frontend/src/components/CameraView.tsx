// frontend/src/components/CameraView.tsx

import React, { useEffect, useRef, useState } from 'react';
import { cameraEndpoints } from '../api/robotAPI';

type Props = {
  defaultStreamUrl?: string;
  defaultSnapshotUrl?: string;
};

const CameraView: React.FC<Props> = ({
  defaultStreamUrl = cameraEndpoints.stream,
  defaultSnapshotUrl = cameraEndpoints.snapshot,
}) => {
  const [cameraMode, setCameraMode] = useState<'stream' | 'snapshot'>('stream');
  const [streamUrl, setStreamUrl] = useState<string>(defaultStreamUrl);
  const [snapshotUrl, setSnapshotUrl] = useState<string>(defaultSnapshotUrl);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshMs, setRefreshMs] = useState<number>(200);
  const [cacheBust, setCacheBust] = useState<number>(Date.now());
  const [flipH, setFlipH] = useState<boolean>(false);
  const [fitContain, setFitContain] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');
  const refreshTimer = useRef<number | null>(null);

  useEffect(() => {
    if (cameraMode === 'snapshot' && autoRefresh) {
      const ms = Math.max(33, refreshMs | 0);
      refreshTimer.current = window.setInterval(() => setCacheBust(Date.now()), ms);
      return () => {
        if (refreshTimer.current) {
          window.clearInterval(refreshTimer.current);
          refreshTimer.current = null;
        }
      };
    }
    return () => {
      if (refreshTimer.current) {
        window.clearInterval(refreshTimer.current);
        refreshTimer.current = null;
      }
    };
  }, [cameraMode, autoRefresh, refreshMs]);

  const onImgError = () =>
    setMessage('カメラ画像の読み込みに失敗しました。URLやサーバの状態を確認してください。');

  const reconnectStream = () => {
    setStreamUrl(prev => `${prev}${prev.includes('?') ? '&' : '?'}_=${Date.now()}`);
  };

  return (
    <div className="camera-layout">
      <div className="camera-controls">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <label>
            <input
              type="radio"
              checked={cameraMode === 'stream'}
              onChange={() => setCameraMode('stream')}
            /> Stream (MJPEG)
          </label>
          <label>
            <input
              type="radio"
              checked={cameraMode === 'snapshot'}
              onChange={() => setCameraMode('snapshot')}
            /> Snapshot (静止画)
          </label>

          <label style={{ marginLeft: 8 }}>
            <input
              type="checkbox"
              checked={flipH}
              onChange={e => setFlipH(e.target.checked)}
            /> 左右反転
          </label>

          <label style={{ marginLeft: 8 }}>
            <input
              type="checkbox"
              checked={fitContain}
              onChange={e => setFitContain(e.target.checked)}
            /> 余白優先表示（contain）
          </label>
        </div>

        {cameraMode === 'stream' ? (
          <div className="camera-url-row" style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <input
              style={{ flex: 1 }}
              value={streamUrl}
              onChange={e => setStreamUrl(e.target.value)}
              placeholder="/api/camera/mjpeg"
            />
            <button onClick={reconnectStream}>再接続</button>
          </div>
        ) : (
          <div className="camera-url-row" style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              style={{ flex: 1, minWidth: 260 }}
              value={snapshotUrl}
              onChange={e => setSnapshotUrl(e.target.value)}
              placeholder="/api/camera/snapshot"
            />
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
              /> 自動更新
            </label>
            <label>
              周期(ms):
              <input
                type="number"
                min={33}
                step={10}
                value={refreshMs}
                onChange={e => {
                  const v = parseInt(e.target.value, 10);
                  setRefreshMs(Number.isFinite(v) ? v : 200);
                }}
                style={{ width: 90, marginLeft: 4 }}
              />
            </label>
            <button onClick={() => setCacheBust(Date.now())}>手動更新</button>
          </div>
        )}
      </div>

      <div className="camera-view" style={{ marginTop: 12 }}>
        {cameraMode === 'stream' ? (
          <img
            src={streamUrl}
            alt="camera stream"
            onError={onImgError}
            style={{
              width: '100%',
              height: '70vh',
              objectFit: fitContain ? 'contain' : 'cover',
              transform: flipH ? 'scaleX(-1)' : 'none',
              borderRadius: 8,
            }}
          />
        ) : (
          <img
            src={`${snapshotUrl}${snapshotUrl.includes('?') ? '&' : '?'}_=${cacheBust}`}
            alt="camera snapshot"
            onError={onImgError}
            style={{
              width: '100%',
              height: '70vh',
              objectFit: fitContain ? 'contain' : 'cover',
              transform: flipH ? 'scaleX(-1)' : 'none',
              borderRadius: 8,
            }}
          />
        )}
      </div>
      {message && <div className="status-message">{message}</div>}
    </div>
  );
};

export default CameraView;
