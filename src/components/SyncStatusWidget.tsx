/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Database, Calendar } from 'lucide-react';

interface SyncStatus {
  status: 'success' | 'failed' | 'running' | 'idle';
  last_sync_time: string | null;
  error: string | null;
  mega_draws_count: number;
  power_draws_count: number;
}

interface SyncStatusWidgetProps {
  onSyncSuccess: () => void;
}

export default function SyncStatusWidget({ onSyncSuccess }: SyncStatusWidgetProps) {
  const [syncState, setSyncState] = useState<SyncStatus>({
    status: 'idle',
    last_sync_time: null,
    error: null,
    mega_draws_count: 0,
    power_draws_count: 0,
  });

  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch current status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/sync/status');
      const data = await res.json();
      if (!data.error) {
        setSyncState(data);
        if (data.status === 'running') {
          setIsSyncing(true);
        } else {
          setIsSyncing(false);
        }
      }
    } catch (e) {
      console.error('Failed to fetch sync status:', e);
    }
  };

  // Trigger manual sync
  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncState((prev) => ({ ...prev, status: 'running' }));

    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      
      if (data.error) {
        setSyncState((prev) => ({
          ...prev,
          status: 'failed',
          error: data.error,
        }));
      } else {
        await fetchStatus();
        onSyncSuccess(); // Trigger reload of all data in App.tsx
      }
    } catch (e: any) {
      setSyncState((prev) => ({
        ...prev,
        status: 'failed',
        error: e.message || String(e),
      }));
    } finally {
      setIsSyncing(false);
    }
  };

  // On mount and periodically poll status
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, []);

  // Format time beautifully
  const formatTime = (isoString: string | null) => {
    if (!isoString) return 'Chưa từng đồng bộ';
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div id="sync-status-widget" className="bg-slate-900/45 backdrop-blur-md border border-slate-800/60 rounded-2xl p-4 mb-6 shadow-xl relative overflow-hidden transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Section: DB Summary and Status */}
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800 shrink-0 text-amber-500">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-display font-semibold text-white">Nguồn Dữ Liệu Thực Tế</h4>
              
              {/* Status Badge */}
              {syncState.status === 'success' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" /> Đã cập nhật
                </span>
              )}
              {syncState.status === 'failed' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3" /> Lỗi kết nối
                </span>
              )}
              {syncState.status === 'running' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Đang cập nhật...
                </span>
              )}
            </div>
            
            {/* Meta statistics */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Đồng bộ lần cuối: <span className="text-slate-200">{formatTime(syncState.last_sync_time)}</span>
              </span>
              <span className="text-slate-600">|</span>
              <span>
                Cơ sở dữ liệu: <strong className="text-amber-500">{syncState.mega_draws_count}</strong> Mega · <strong className="text-amber-500">{syncState.power_draws_count}</strong> Power
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Sync action button */}
        <div className="shrink-0 flex items-center gap-3">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            id="btn-trigger-manual-sync"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-display font-semibold border transition-all duration-300 ${
              isSyncing
                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400/20 font-bold active:scale-95 shadow-lg shadow-amber-500/10'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Đang đồng bộ...' : 'Cập nhật KQ Vietlott'}
          </button>
        </div>
      </div>

      {/* Error report */}
      {syncState.status === 'failed' && syncState.error && (
        <div className="mt-3.5 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-xs text-rose-300 flex items-start gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <span className="font-bold">Chi tiết lỗi:</span> {syncState.error}
            <span className="block mt-1 text-slate-400">Gợi ý: Do hệ thống Vietlott chính đang bị nghẽn mạng hoặc cập nhật kỳ quay mới. Trình crawler sẽ tự động thực hiện lại sau ít phút hoặc bạn có thể nhấn thử lại thủ công.</span>
          </div>
        </div>
      )}
    </div>
  );
}
