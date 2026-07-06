/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LotteryDraw, GameType, Prediction } from '../types.js';
import { formatVND } from '../lib/utils.js';
import { Play, Flame, Calendar, Award, Hourglass, Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeViewProps {
  latestDraw: LotteryDraw | null;
  gameType: GameType;
  setGameType: (type: GameType) => void;
  onSimulateDraw: () => Promise<void>;
  isSimulating: boolean;
  topAiTicket: Prediction | null;
}

export default function HomeView({
  latestDraw,
  gameType,
  setGameType,
  onSimulateDraw,
  isSimulating,
  topAiTicket,
}: HomeViewProps) {
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Simulate a live ticking countdown to the next Vietlott draw
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const target = new Date();
      target.setHours(18, 0, 0, 0); // drawings are usually at 18:00
      
      if (now.getHours() >= 18) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!latestDraw) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Hourglass className="w-12 h-12 mb-4 animate-spin text-amber-500" />
        <p>Đang tải dữ liệu kỳ quay gần nhất...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Selector Tab-Header */}
      <div className="flex p-1 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800/80 max-w-md mx-auto">
        <button
          id="btn-select-mega"
          onClick={() => setGameType('Mega 6/45')}
          className={`flex-1 py-3 text-center rounded-xl font-display font-semibold text-sm transition-all duration-300 ${
            gameType === 'Mega 6/45'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Mega 6/45
        </button>
        <button
          id="btn-select-power"
          onClick={() => setGameType('Power 6/55')}
          className={`flex-1 py-3 text-center rounded-xl font-display font-semibold text-sm transition-all duration-300 ${
            gameType === 'Power 6/55'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Power 6/55
        </button>
        <button
          id="btn-select-lotto"
          onClick={() => setGameType('Lotto 5/35')}
          className={`flex-1 py-3 text-center rounded-xl font-display font-semibold text-sm transition-all duration-300 ${
            gameType === 'Lotto 5/35'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Lotto 5/35
        </button>
      </div>

      {/* Main Jackpot Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Jackpot Info Card */}
        <div id="jackpot-card" className="lg:col-span-8 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden shadow-2xl flex flex-col justify-between">
          {/* Visual Accents */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full filter blur-3xl -z-10" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/55 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
                  {latestDraw.game_type}
                </span>
                <span className="text-slate-500 text-sm font-mono">
                  Kỳ quay {latestDraw.draw_number}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-display font-bold text-white mt-2 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-400" />
                {new Date(latestDraw.draw_date).toLocaleDateString('vi-VN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
                Đếm ngược kỳ tiếp theo
              </span>
              <div className="flex items-center gap-1 mt-1 font-mono text-lg font-bold text-amber-400">
                <Hourglass className="w-4 h-4 animate-pulse" />
                <span>
                  {String(countdown.hours).padStart(2, '0')}:
                  {String(countdown.minutes).padStart(2, '0')}:
                  {String(countdown.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          <div className="py-8 text-center md:text-left">
            <span className="text-slate-400 text-sm font-medium tracking-wide">
              GIẢI THƯỞNG JACKPOT HIỆN TẠI
            </span>
            <div className="text-4xl md:text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-amber-500 tracking-tight mt-1 animate-pulse">
              {formatVND(latestDraw.jackpot)}
            </div>
            <p className="text-slate-400 text-xs mt-2 flex items-center justify-center md:justify-start gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Tăng khoảng <span className="text-emerald-400 font-bold">{formatVND(Math.floor(latestDraw.sales * 0.45), true)}</span> so với kỳ trước
            </p>
          </div>

          {/* Lottery Balls Container */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
            {latestDraw.numbers.map((num, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.08 }}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-radial from-slate-800 to-slate-900 border-2 border-amber-500/80 text-amber-400 font-mono font-extrabold text-base md:text-xl shadow-lg shadow-amber-500/5 hover:scale-105 hover:shadow-amber-500/20 transition-all duration-200"
              >
                {String(num).padStart(2, '0')}
              </motion.div>
            ))}

            {latestDraw.game_type === 'Power 6/55' && latestDraw.bonus && (
              <>
                <span className="text-slate-500 font-bold text-xl px-1">+</span>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-radial from-slate-950 to-slate-900 border-2 border-rose-500 text-rose-500 font-mono font-extrabold text-base md:text-xl shadow-lg shadow-rose-500/10 hover:scale-105 hover:shadow-rose-500/20 transition-all duration-200"
                  title="Bonus Ball (Cầu vàng)"
                >
                  {String(latestDraw.bonus).padStart(2, '0')}
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* Quick Stats Panel */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {/* Winners Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">
                Số người trúng Jackpot
              </span>
              <span className="text-2xl font-mono font-bold text-white mt-1 block">
                {latestDraw.winners > 0 ? `${latestDraw.winners} người` : 'Chưa có'}
              </span>
            </div>
          </div>

          {/* Sales Revenue */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">
                Doanh thu kỳ quay
              </span>
              <span className="text-xl font-mono font-bold text-indigo-400 mt-1 block">
                {formatVND(latestDraw.sales, true)} VND
              </span>
            </div>
          </div>

          {/* Simulate Action Panel */}
          <div className="bg-gradient-to-b from-amber-500/5 to-amber-500/0 border border-amber-500/15 rounded-2xl p-5 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
            <div>
              <h3 className="text-amber-500 text-sm font-display font-bold flex items-center gap-1.5">
                <Flame className="w-4 h-4" />
                Mô Phỏng Kỳ Quay Kế Tiếp
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Kích hoạt hệ thống quay số tự động, cập nhật lịch sử, tính toán lại thống kê tần suất và cập nhật AI Engine ngay lập tức.
              </p>
            </div>
            <button
              id="btn-simulate-draw"
              onClick={onSimulateDraw}
              disabled={isSimulating}
              className="mt-4 w-full py-3 bg-amber-500 text-slate-950 font-display font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-amber-400 disabled:opacity-50 transition-all duration-300 shadow-md shadow-amber-500/10 active:scale-98"
            >
              <Play className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
              {isSimulating ? 'Đang thực hiện quay số...' : 'Quay Số Thử Nghiệm'}
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Ticket of the Day */}
      {topAiTicket && (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-2xl -z-10" />
          
          <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-5">
            <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              Bộ Số AI Đề Xuất Kỳ Quay Tiếp Theo
            </h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              Độ tin cậy: {topAiTicket.confidence_score}%
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-wrap gap-2">
              {topAiTicket.numbers.map((num, idx) => (
                <div
                  key={idx}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-indigo-950/40 border border-indigo-500/50 text-indigo-300 font-mono font-bold text-sm md:text-base shadow-inner"
                >
                  {String(num).padStart(2, '0')}
                </div>
              ))}
            </div>

            <div className="flex-1 md:max-w-md bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-3 text-xs text-indigo-200">
              <strong className="block text-indigo-400 font-display mb-1">Cơ sở đề xuất:</strong>
              {topAiTicket.ensemble_reason || 'Bộ số tổng hợp có phân bổ chẵn lẻ, khoảng trống tần suất tối ưu, đã được tối thiểu hóa độ lệch chuẩn chu kỳ quay.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
