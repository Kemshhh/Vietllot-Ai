/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NotificationSetting } from '../types.js';
import { Bell, ShieldCheck, Mail, Sliders, Sparkles, Check, Key, User, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsViewProps {
  onSaveConfig: (config: NotificationSetting) => Promise<void>;
  initialConfig: NotificationSetting | null;
  isSaving: boolean;
}

export default function SettingsView({
  onSaveConfig,
  initialConfig,
  isSaving,
}: SettingsViewProps) {
  const [email, setEmail] = useState<string>('kemcolen@gmail.com');
  const [threshold, setThreshold] = useState<number>(50); // 50 tỷ VND
  const [gameTypes, setGameTypes] = useState<string[]>(['Mega 6/45', 'Power 6/55']);
  const [notifyNew, setNotifyNew] = useState<boolean>(true);
  const [notifyPred, setNotifyPred] = useState<boolean>(true);
  const [favNumbers, setFavNumbers] = useState<number[]>([8, 18, 28]);
  const [newFav, setNewFav] = useState<string>('');
  
  // Premium simulation state
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState<boolean>(false);
  const [apiToken, setApiToken] = useState<string>('v_ai_pub_9a1f4b8c9d2e1a3b');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [geminiKey, setGeminiKey] = useState<string>('');

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    setGeminiKey(savedKey);
  }, []);

  useEffect(() => {
    if (initialConfig) {
      setEmail(initialConfig.email || 'kemcolen@gmail.com');
      setThreshold(initialConfig.jackpot_threshold || 50);
      setGameTypes(initialConfig.game_types || ['Mega 6/45', 'Power 6/55']);
      setNotifyNew(initialConfig.notify_on_new_results ?? true);
      setNotifyPred(initialConfig.notify_on_predictions ?? true);
      setFavNumbers(initialConfig.favorite_numbers || [8, 18, 28]);
    }
  }, [initialConfig]);

  const handleToggleGameType = (type: string) => {
    if (gameTypes.includes(type)) {
      setGameTypes(gameTypes.filter((t) => t !== type));
    } else {
      setGameTypes([...gameTypes, type]);
    }
  };

  const handleAddFavorite = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(newFav);
    if (!isNaN(val) && val >= 1 && val <= 55 && !favNumbers.includes(val)) {
      setFavNumbers([...favNumbers, val].sort((a, b) => a - b));
      setNewFav('');
    }
  };

  const handleRemoveFavorite = (num: number) => {
    setFavNumbers(favNumbers.filter((n) => n !== num));
  };

  const handleSubmitConfig = async () => {
    localStorage.setItem('gemini_api_key', geminiKey.trim());
    await onSaveConfig({
      id: initialConfig?.id || 'noti_1',
      email,
      jackpot_threshold: threshold,
      game_types: gameTypes as any,
      notify_on_new_results: notifyNew,
      notify_on_predictions: notifyPred,
      favorite_numbers: favNumbers,
    });
    
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-24 right-6 bg-emerald-500 text-slate-950 font-display font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-50">
          <Check className="w-4 h-4" />
          <span>Cấu hình thông báo đã được lưu thành công!</span>
        </div>
      )}

      {/* Left panel: Notification setup Form */}
      <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-6">
        <h3 className="text-white text-base font-display font-bold flex items-center gap-2 border-b border-slate-800 pb-3">
          <Bell className="w-5 h-5 text-amber-500" />
          Thiết Lập Nhận Thông Báo & Cảnh Báo Jackpot
        </h3>

        <div className="space-y-4">
          {/* Email input */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              Địa chỉ nhận thư:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500"
              placeholder="ten@vi-du.com"
            />
          </div>

          {/* Jackpot alerts */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold flex justify-between">
              <span>Cảnh báo khi Jackpot vượt ngưỡng:</span>
              <span className="text-amber-500 font-bold font-mono">{threshold} tỷ VND</span>
            </label>
            <input
              type="range"
              min="12"
              max="150"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>12 tỷ (Mặc định Mega)</span>
              <span>150 tỷ (Cực đại)</span>
            </div>
          </div>

          {/* Ticket types filter */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold block">Áp dụng cho loại vé:</label>
            <div className="flex gap-4">
              {['Mega 6/45', 'Power 6/55'].map((type) => (
                <label key={type} className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gameTypes.includes(type)}
                    onChange={() => handleToggleGameType(type)}
                    className="w-4 h-4 rounded border-slate-800 text-amber-500 focus:ring-amber-500 bg-slate-950"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preferences checkboxes */}
          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyNew}
                onChange={(e) => setNotifyNew(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 text-amber-500 focus:ring-amber-500 bg-slate-950 mt-0.5"
              />
              <div>
                <strong className="block text-slate-200">Gửi kết quả kỳ quay mới</strong>
                <span className="text-[10px] text-slate-500">Tự động gửi email thông báo bộ số trúng thưởng lúc 19:15 hàng ngày.</span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyPred}
                onChange={(e) => setNotifyPred(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 text-amber-500 focus:ring-amber-500 bg-slate-950 mt-0.5"
              />
              <div>
                <strong className="block text-slate-200">Thông báo dự báo AI mới</strong>
                <span className="text-[10px] text-slate-500">Nhận thông báo khi mô hình Ensemble AI hoàn thành biên dịch dự đoán.</span>
              </div>
            </label>
          </div>

          {/* Favorite numbers tracking */}
          <div className="border-t border-slate-800/80 pt-4 space-y-3">
            <label className="text-xs text-slate-400 font-semibold block">Dãy số ưa thích của bạn (Favorite Numbers):</label>
            <form onSubmit={handleAddFavorite} className="flex gap-2">
              <input
                type="number"
                min="1"
                max="55"
                value={newFav}
                onChange={(e) => setNewFav(e.target.value)}
                placeholder="Số (1-55)"
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-center w-24 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-display font-semibold transition-colors"
              >
                Thêm số
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-1">
              {favNumbers.map((num) => (
                <div
                  key={num}
                  className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-1.5 py-1 text-xs"
                >
                  <span className="font-mono font-bold text-amber-400">{String(num).padStart(2, '0')}</span>
                  <button
                    onClick={() => handleRemoveFavorite(num)}
                    className="w-4 h-4 rounded-full bg-slate-850 hover:bg-slate-750 text-slate-500 hover:text-rose-400 text-[10px] font-bold flex items-center justify-center transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
              {favNumbers.length === 0 && (
                <span className="text-[10.5px] text-slate-500 italic">Chưa thêm số ưa thích nào.</span>
              )}
            </div>
          </div>

          {/* Gemini API Key config */}
          <div className="border-t border-slate-800/80 pt-4 space-y-3">
            <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              Cấu hình Gemini API Key cá nhân:
            </label>
            <p className="text-[10px] text-slate-500 leading-normal">
              Nhập API Key của bạn để sử dụng tính năng giải nghĩa bộ số bằng mô hình AI tiên tiến (Gemini 3.5 Flash). Key của bạn được lưu trữ an toàn trong trình duyệt cục bộ.
            </p>
            <div className="relative flex items-center">
              <input
                id="input-gemini-api-key"
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="Nhập Gemini API Key (AIzaSy...)"
                className="w-full pl-3 pr-24 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <button
                id="btn-save-gemini-key-inline"
                type="button"
                onClick={() => {
                  localStorage.setItem('gemini_api_key', geminiKey.trim());
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 3000);
                }}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/20 rounded-lg text-[10px] font-bold transition-all"
              >
                Lưu Key
              </button>
            </div>
          </div>
        </div>

        <button
          id="btn-save-notification-settings"
          onClick={handleSubmitConfig}
          disabled={isSaving}
          className="w-full py-3 bg-amber-500 text-slate-950 font-display font-bold text-xs rounded-xl hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-lg shadow-amber-500/5 mt-4"
        >
          {isSaving ? 'Đang lưu cấu hình...' : 'Lưu Cấu Hình Thông Báo'}
        </button>
      </div>

      {/* Right panel: Premium membership simulation */}
      <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-indigo-950/20 to-purple-950/20 border border-indigo-500/10 p-6 rounded-3xl shadow-xl relative overflow-hidden">
        {/* Decorative badge */}
        <div className="absolute top-4 right-4 bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-mono font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
          <Star className="w-2.5 h-2.5" />
          Premium
        </div>

        <div>
          <div className="flex items-center gap-2 border-b border-indigo-950 pb-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white text-sm font-display font-bold block">Thành Viên Vietlott AI Premium</h3>
              <span className="text-[10.5px] text-indigo-300">Kích hoạt các quyền năng phân tích chuyên nghiệp</span>
            </div>
          </div>

          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            Nâng cấp gói thành viên Premium để mở khóa tối đa chiều sâu của nền tảng Vietlott AI, phục vụ nghiên cứu và phân tích toán học cao cấp.
          </p>

          {/* Feature List */}
          <ul className="space-y-3.5">
            {[
              {
                title: 'Không giới hạn lịch sử',
                desc: 'Phân tích dữ liệu không giới hạn khoảng thời gian (lên đến 1.000+ kỳ).'
              },
              {
                title: 'Nhiều mô hình AI cao cấp',
                desc: 'Mở khóa đầy đủ 12 mô hình Machine Learning & LSTM Neural Networks.'
              },
              {
                title: 'Monte Carlo quy mô lớn',
                desc: 'Cho phép mô phỏng lên đến 1.000.000 lần quay ngẫu nhiên.'
              },
              {
                title: 'Hỗ trợ xuất tệp đa định dạng',
                desc: 'Đầy đủ tính năng tải báo cáo dưới dạng Excel hoặc file PDF.'
              }
            ].map((f, idx) => (
              <li key={idx} className="flex gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] shrink-0 font-bold">
                  ✓
                </div>
                <div>
                  <strong className="block text-slate-200 text-xs font-semibold">{f.title}</strong>
                  <span className="text-[10px] text-slate-500 leading-normal block mt-0.5">{f.desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Premium Simulation interaction */}
        <div className="border-t border-indigo-950 pt-5 mt-6 space-y-4">
          {isPremiumUnlocked ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-300 font-bold">Đã Mở Khóa Gói Premium (Simulated)</span>
              </div>
              
              {/* Public API Key access simulation */}
              <div className="space-y-1 mt-3">
                <label className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  Mã API Key công cộng của bạn:
                </label>
                <input
                  type="text"
                  readOnly
                  value={apiToken}
                  className="w-full font-mono text-[10px] px-2 py-1 bg-slate-950 border border-slate-850 rounded-lg text-slate-400 select-all focus:outline-none"
                />
              </div>
            </motion.div>
          ) : (
            <button
              id="btn-unlock-premium"
              onClick={() => setIsPremiumUnlocked(true)}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-display font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/15 flex items-center justify-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              Kích Hoạt Hội Viên Premium (Miễn phí thử nghiệm)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
