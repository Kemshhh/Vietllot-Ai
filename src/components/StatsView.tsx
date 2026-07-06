/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnalyticsSummary, GameType, NumberStat } from '../types.js';
import { Flame, Snowflake, BarChart3, Grid, Layers, ArrowUpDown, RefreshCw, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface StatsViewProps {
  analytics: AnalyticsSummary | null;
  gameType: GameType;
  limitCount: number;
  setLimitCount: (cnt: number) => void;
  isLoading: boolean;
}

export default function StatsView({
  analytics,
  gameType,
  limitCount,
  setLimitCount,
  isLoading,
}: StatsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'freq' | 'gaps' | 'dist'>('freq');
  const [sortField, setSortField] = useState<'number' | 'frequency' | 'last_seen' | 'average_gap'>('number');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  if (isLoading || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-12 h-12 mb-4 animate-spin text-amber-500" />
        <p>Đang biên dịch số liệu thống kê Vietlott...</p>
      </div>
    );
  }

  // Sort numbers for the gaps table
  const sortedStats = [...analytics.frequency].sort((a, b) => {
    let fieldA = a[sortField];
    let fieldB = b[sortField];
    if (sortAsc) return fieldA > fieldB ? 1 : -1;
    return fieldA < fieldB ? 1 : -1;
  });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Get extreme Hot and Cold numbers
  const hotNumbers = [...analytics.frequency]
    .sort((a, b) => b.hot_score - a.hot_score)
    .slice(0, 6);

  const coldNumbers = [...analytics.frequency]
    .sort((a, b) => b.cold_score - a.cold_score)
    .slice(0, 6);

  const maxFrequency = Math.max(...analytics.frequency.map((s) => s.frequency), 1);

  return (
    <div className="space-y-6">
      {/* Top filter and sub navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
        <div className="flex gap-2 flex-wrap">
          <button
            id="tab-sub-freq"
            onClick={() => setActiveSubTab('freq')}
            className={`px-4 py-2 rounded-xl text-xs font-display font-semibold transition-all duration-300 flex items-center gap-1.5 ${
              activeSubTab === 'freq'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Tần suất & Heatmap
          </button>
          <button
            id="tab-sub-gaps"
            onClick={() => setActiveSubTab('gaps')}
            className={`px-4 py-2 rounded-xl text-xs font-display font-semibold transition-all duration-300 flex items-center gap-1.5 ${
              activeSubTab === 'gaps'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Hot/Cold & Khoảng cách
          </button>
          <button
            id="tab-sub-dist"
            onClick={() => setActiveSubTab('dist')}
            className={`px-4 py-2 rounded-xl text-xs font-display font-semibold transition-all duration-300 flex items-center gap-1.5 ${
              activeSubTab === 'dist'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Phân phối Số Học
          </button>
        </div>

        {/* Rolling Window selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Khoảng phân tích:</span>
          <div className="flex bg-slate-950 border border-slate-850 p-1 rounded-xl">
            {[20, 50, 100].map((count) => (
              <button
                key={count}
                onClick={() => setLimitCount(count)}
                className={`px-3 py-1 text-[11px] font-mono font-bold rounded-lg transition-all duration-200 ${
                  limitCount === count
                    ? 'bg-slate-800 text-amber-400 border border-slate-700/50 shadow-inner'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {count} kỳ
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SUB TAB 1: Frequency & Heatmap */}
      {activeSubTab === 'freq' && (
        <div className="space-y-6">
          {/* Custom SVG Bar Chart */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl shadow-xl">
            <h3 className="text-white text-sm font-display font-bold mb-6 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              Biểu Đồ Tần Suất Xuất Hiện Gần Nhất ({limitCount} kỳ vừa qua)
            </h3>
            
            {/* Elegant Horizontal Scrolling bar chart for responsiveness */}
            <div className="overflow-x-auto pb-4">
              <div className="min-w-[800px] h-64 relative flex items-end justify-between px-2">
                {analytics.frequency.map((stat, idx) => {
                  const heightPercent = `${(stat.frequency / maxFrequency) * 80}%`;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-pointer mx-0.5">
                      {/* Tooltip on Hover */}
                      <div className="absolute bottom-full mb-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-300 font-mono hidden group-hover:block shadow-xl z-20 whitespace-nowrap text-center">
                        <span className="text-amber-400 font-bold">Số {stat.number}</span> <br />
                        Tần suất: {stat.frequency} lần <br />
                        Nhịp lặp: {stat.average_gap} kỳ <br />
                        Chưa ra: {stat.last_seen} kỳ
                      </div>

                      {/* Bar Column */}
                      <div className="w-full flex items-end justify-center h-48">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: heightPercent }}
                          transition={{ duration: 0.5, delay: idx * 0.01 }}
                          className={`w-4/5 rounded-t bg-gradient-to-t group-hover:from-amber-500 group-hover:to-amber-300 transition-all duration-300 ${
                            stat.hot_score > 7
                              ? 'from-rose-600/80 to-rose-400/80'
                              : stat.cold_score > 7
                              ? 'from-sky-600/80 to-sky-400/80'
                              : 'from-slate-700/80 to-slate-500/80'
                          }`}
                        />
                      </div>
                      
                      {/* Label */}
                      <span className="text-[10px] font-mono font-bold text-slate-500 group-hover:text-amber-400 mt-2">
                        {String(stat.number).padStart(2, '0')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Color Heatmap */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl shadow-xl">
            <h3 className="text-white text-sm font-display font-bold mb-4 flex items-center gap-1.5">
              <Grid className="w-4 h-4 text-amber-500" />
              Bản Đồ Nhiệt Số Học (Color Heatmap Matrix)
            </h3>
            <p className="text-slate-400 text-xs mb-5">
              Màu sắc biểu thị độ đậm đặc xuất hiện. Càng nghiêng về đỏ/cam biểu thị số càng "Hot", càng nghiêng về xanh lam biểu thị số đang "Cold" hoặc tích tụ khoảng cách dài chưa ra.
            </p>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-15 gap-2">
              {analytics.frequency.map((stat, idx) => {
                // Calculate opacity or color based on hotness and coldness
                let bgClass = 'bg-slate-800 border-slate-700/50 text-slate-300';
                if (stat.hot_score > 7) {
                  bgClass = 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-md shadow-rose-500/5';
                } else if (stat.hot_score > 4) {
                  bgClass = 'bg-amber-500/20 border-amber-500/50 text-amber-300';
                } else if (stat.cold_score > 6) {
                  bgClass = 'bg-sky-500/20 border-sky-500/50 text-sky-300 shadow-md shadow-sky-500/5';
                }

                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.08 }}
                    className={`aspect-square flex flex-col items-center justify-center border rounded-xl p-1 relative cursor-pointer group ${bgClass}`}
                  >
                    <span className="text-xs font-mono font-extrabold">{String(stat.number).padStart(2, '0')}</span>
                    <span className="text-[8px] font-mono text-slate-500 group-hover:text-inherit block mt-0.5">
                      {stat.frequency} lần
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: Hot / Cold & Gap Lists */}
      {activeSubTab === 'gaps' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Hot/Cold cards */}
          <div className="lg:col-span-4 space-y-6">
            {/* Hot List */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl shadow-xl">
              <h3 className="text-rose-400 text-sm font-display font-bold mb-4 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                Cầu Nóng (Hot Numbers)
              </h3>
              <div className="space-y-3">
                {hotNumbers.map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-rose-500/5 border border-rose-500/10 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-rose-500 text-slate-950 font-mono font-bold flex items-center justify-center text-sm shadow">
                        {String(stat.number).padStart(2, '0')}
                      </div>
                      <span className="text-xs text-slate-300 font-semibold">Hot Score</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-rose-400 block">{stat.hot_score} / 10</span>
                      <span className="text-[10px] text-slate-500 block">Xuất hiện: {stat.frequency} lần</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cold List */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl shadow-xl">
              <h3 className="text-sky-400 text-sm font-display font-bold mb-4 flex items-center gap-1.5">
                <Snowflake className="w-4 h-4 text-sky-500" />
                Cầu Nguội (Cold Numbers)
              </h3>
              <div className="space-y-3">
                {coldNumbers.map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-sky-500/5 border border-sky-500/10 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-sky-500 text-slate-950 font-mono font-bold flex items-center justify-center text-sm shadow">
                        {String(stat.number).padStart(2, '0')}
                      </div>
                      <span className="text-xs text-slate-300 font-semibold">Chưa ra</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-sky-400 block">{stat.last_seen} kỳ liên tục</span>
                      <span className="text-[10px] text-slate-500 block">Mức độ nguội: {stat.cold_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Gap Table */}
          <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between">
            <div>
              <h3 className="text-white text-sm font-display font-bold mb-4 flex items-center gap-1.5">
                <ArrowUpDown className="w-4 h-4 text-amber-500" />
                Phân Tích Nhịp Lặp & Khoảng Cách Nhảy Số
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500">
                      <th className="py-2.5 cursor-pointer hover:text-white" onClick={() => toggleSort('number')}>Con Số</th>
                      <th className="py-2.5 cursor-pointer hover:text-white" onClick={() => toggleSort('frequency')}>Tần Suất</th>
                      <th className="py-2.5 cursor-pointer hover:text-white" onClick={() => toggleSort('last_seen')}>Chưa Ra (Kỳ)</th>
                      <th className="py-2.5 cursor-pointer hover:text-white" onClick={() => toggleSort('average_gap')}>Trung Bình Nhịp</th>
                      <th className="py-2.5 text-right">Xu hướng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStats.map((stat, idx) => (
                      <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                        <td className="py-3 font-mono font-bold text-slate-300">{String(stat.number).padStart(2, '0')}</td>
                        <td className="py-3 font-mono text-slate-400">{stat.frequency} lần</td>
                        <td className="py-3 font-mono text-slate-400">{stat.last_seen} kỳ trước</td>
                        <td className="py-3 font-mono text-slate-400">{stat.average_gap} kỳ quay</td>
                        <td className="py-3 text-right">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                            stat.trend_score > 1
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : stat.trend_score < -1
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-slate-800 text-slate-500'
                          }`}>
                            {stat.trend_score > 0 ? `+${stat.trend_score}` : stat.trend_score}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 3: Arithmetic Distributions */}
      {activeSubTab === 'dist' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Odd / Even Ratio Card */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="text-white text-xs uppercase tracking-wider font-semibold text-slate-400">
                Tỉ lệ Chẵn / Lẻ (Odd & Even)
              </h4>
              <p className="text-slate-500 text-[11px] mt-1">
                Tỉ lệ vàng lý tưởng trong toán học xác suất thường xoay quanh 3 chẵn : 3 lẻ.
              </p>
            </div>

            <div className="my-6 flex items-center justify-center gap-6">
              {/* Left Even circle */}
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-amber-400">{analytics.oddEvenRatio.even}%</div>
                <div className="text-[10px] text-slate-500">Chẵn</div>
              </div>
              
              {/* Circular distribution indicator */}
              <div className="w-20 h-20 relative flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="30" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    stroke="#f59e0b"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 30}`}
                    strokeDashoffset={`${2 * Math.PI * 30 * (1 - analytics.oddEvenRatio.even / 100)}`}
                  />
                </svg>
                <span className="absolute text-[10px] font-mono text-slate-400">E/O</span>
              </div>

              {/* Right Odd circle */}
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-indigo-400">{analytics.oddEvenRatio.odd}%</div>
                <div className="text-[10px] text-slate-500">Lẻ</div>
              </div>
            </div>
            
            <div className="bg-slate-950 p-2.5 rounded-xl text-center text-slate-400 text-[10px]">
              Tỉ lệ trung bình thực tế: <strong className="text-white">3.1 chẵn / 2.9 lẻ</strong>
            </div>
          </div>

          {/* High / Low Ratio Card */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="text-white text-xs uppercase tracking-wider font-semibold text-slate-400">
                Tỉ lệ Lớn / Nhỏ (High & Low)
              </h4>
              <p className="text-slate-500 text-[11px] mt-1">
                Lớp số nhỏ: {gameType === 'Mega 6/45' ? '1-22' : '1-27'}, lớp số lớn: {gameType === 'Mega 6/45' ? '23-45' : '28-55'}.
              </p>
            </div>

            <div className="my-6 flex items-center justify-center gap-6">
              {/* Left Low circle */}
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-emerald-400">{analytics.highLowRatio.low}%</div>
                <div className="text-[10px] text-slate-500">Nhỏ</div>
              </div>
              
              {/* Circular indicator */}
              <div className="w-20 h-20 relative flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="30" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    stroke="#10b981"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 30}`}
                    strokeDashoffset={`${2 * Math.PI * 30 * (1 - analytics.highLowRatio.low / 100)}`}
                  />
                </svg>
                <span className="absolute text-[10px] font-mono text-slate-400">L/H</span>
              </div>

              {/* Right High circle */}
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-rose-400">{analytics.highLowRatio.high}%</div>
                <div className="text-[10px] text-slate-500">Lớn</div>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl text-center text-slate-400 text-[10px]">
              Tỉ lệ phân bổ đều giúp tránh rủi ro lệch cầu.
            </div>
          </div>

          {/* Sum Analysis Card */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="text-white text-xs uppercase tracking-wider font-semibold text-slate-400">
                Tổng Giá Trị Bộ Số (Sum Distribution)
              </h4>
              <p className="text-slate-500 text-[11px] mt-1">
                Tổng của 6 con số đo lường mật độ phân tán số học.
              </p>
            </div>

            <div className="my-5 space-y-4">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Tổng nhỏ nhất:</span>
                <span className="text-white font-bold">{analytics.sumDistribution.min}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Tổng trung bình:</span>
                <span className="text-amber-400 font-bold">{analytics.sumDistribution.avg}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Tổng lớn nhất:</span>
                <span className="text-white font-bold">{analytics.sumDistribution.max}</span>
              </div>
            </div>

            <div className="bg-indigo-950/20 border border-indigo-500/10 p-3 rounded-xl text-slate-300 text-[10px]">
              <strong className="text-indigo-400 block font-display mb-0.5">Vùng tối ưu: 90 - 150</strong>
              Hơn 70% các kỳ quay thưởng Vietlott có tổng số trúng thuộc phạm vi này.
            </div>
          </div>

          {/* Prime Numbers density */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 font-display font-black">
              P
            </div>
            <div>
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">
                Số nguyên tố trung bình
              </span>
              <span className="text-2xl font-mono font-bold text-white mt-1 block">
                {analytics.primeDistribution.count} số / kỳ ({analytics.primeDistribution.percentage}%)
              </span>
            </div>
          </div>

          {/* Consecutive numbers count */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 font-mono font-bold">
              C
            </div>
            <div>
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">
                Cặp số liền kề (Consecutive)
              </span>
              <span className="text-2xl font-mono font-bold text-white mt-1 block">
                {analytics.consecutiveDistribution.count} cặp / kỳ ({analytics.consecutiveDistribution.percentage}%)
              </span>
            </div>
          </div>

          {/* Repeat Numbers count */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400 border border-yellow-500/20 font-mono font-bold">
              R
            </div>
            <div>
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">
                Số lặp lại từ kỳ trước
              </span>
              <span className="text-2xl font-mono font-bold text-white mt-1 block">
                {analytics.repeatNumbersCount} số lặp / kỳ
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
