/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LotteryDraw, GameType } from '../types.js';
import { formatVND, checkWinningTicket } from '../lib/utils.js';
import { Search, Filter, Download, ChevronLeft, ChevronRight, Calculator, Award, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryViewProps {
  draws: LotteryDraw[];
  gameType: GameType;
  setGameType: (type: GameType) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
}

export default function HistoryView({
  draws,
  gameType,
  setGameType,
  onSearch,
  searchQuery,
}: HistoryViewProps) {
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  
  // Ticket checker state
  const [checkerNumbers, setCheckerNumbers] = useState<number[]>([1, 8, 18, 28, 38, 45]);
  const [checkResult, setCheckResult] = useState<any[]>([]);
  const [hasChecked, setHasChecked] = useState<boolean>(false);
  const [totalPrizeValue, setTotalPrizeValue] = useState<number>(0);

  // Sync checker numbers length and values to current gameType
  React.useEffect(() => {
    if (gameType === 'Lotto 5/35') {
      setCheckerNumbers([5, 12, 18, 24, 30]);
    } else if (gameType === 'Mega 6/45') {
      setCheckerNumbers([1, 8, 18, 28, 38, 45]);
    } else {
      setCheckerNumbers([5, 15, 25, 35, 45, 55]);
    }
    setHasChecked(false);
    setCheckResult([]);
    setTotalPrizeValue(0);
  }, [gameType]);

  // Filter draws matching current gameType
  const filteredDraws = draws.filter((d) => d.game_type === gameType);
  const totalPages = Math.ceil(filteredDraws.length / itemsPerPage) || 1;
  const paginatedDraws = filteredDraws.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Ticket Checker Execution
  const handleCheckTicket = () => {
    const results: any[] = [];
    let prizeSum = 0;
    const minMatch = gameType === 'Lotto 5/35' ? 2 : 3;

    // Check against all draws of this gameType
    filteredDraws.forEach((draw) => {
      const res = checkWinningTicket(checkerNumbers, draw.numbers, gameType, draw.bonus);
      if (res.matchCount >= minMatch) {
        let earned = res.prizeValue;
        if (earned === -1) earned = draw.jackpot; // Jackpot win!
        if (earned === -2 && draw.bonus) earned = Math.floor(draw.jackpot * 0.1); // Jackpot 2 estimate
        
        prizeSum += earned;
        results.push({
          draw,
          matchResult: res,
          earned,
        });
      }
    });

    setCheckResult(results);
    setTotalPrizeValue(prizeSum);
    setHasChecked(true);
  };

  const handleUpdateCheckerNumber = (index: number, value: number) => {
    const nextNums = [...checkerNumbers];
    const maxVal = gameType === 'Mega 6/45' ? 45 : gameType === 'Lotto 5/35' ? 35 : 55;
    const clampedVal = Math.max(1, Math.min(maxVal, value));
    nextNums[index] = clampedVal;
    setCheckerNumbers(nextNums);
    setHasChecked(false);
  };

  // Export File trigger
  const handleExport = (format: 'csv' | 'json') => {
    window.open(`/api/export?game_type=${encodeURIComponent(gameType)}&format=${format}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Header */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row justify-between gap-4">
        {/* Search Input */}
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-history-search"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo kỳ quay, ngày hoặc bộ số..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 font-medium"
          />
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-850 hover:border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Tải CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-850 hover:border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Tải JSON
          </button>
        </div>
      </div>

      {/* Ticket Checker Segment */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-3xl shadow-xl">
        <h3 className="text-white text-sm font-display font-bold mb-4 flex items-center gap-1.5 border-b border-slate-800/60 pb-3">
          <Calculator className="w-4 h-4 text-amber-500" />
          Công Cụ So Vé Số Tự Động (Lottery Ticket Checker)
        </h3>
        <p className="text-slate-400 text-xs mb-5">
          Nhập bộ số {gameType === 'Lotto 5/35' ? '5' : '6'} con số yêu thích của bạn để kiểm tra xem trong toàn bộ lịch sử kỳ quay, bộ số này đã từng trúng những giải nào và tổng mức tiền thưởng đạt được là bao nhiêu.
        </p>

        {/* Input grid */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2">
            {checkerNumbers.map((num, idx) => (
              <input
                key={idx}
                type="number"
                value={num || ''}
                onChange={(e) => handleUpdateCheckerNumber(idx, parseInt(e.target.value))}
                min="1"
                max={gameType === 'Mega 6/45' ? 45 : 55}
                className="w-10 h-10 md:w-12 md:h-12 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-amber-500 text-amber-400 font-mono font-bold text-center text-sm md:text-base rounded-xl transition-all focus:outline-none"
              />
            ))}
          </div>

          <button
            id="btn-check-ticket"
            onClick={handleCheckTicket}
            className="px-5 py-3 bg-amber-500 text-slate-950 font-display font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/5 active:scale-97"
          >
            Bắt đầu so vé
          </button>
        </div>

        {/* Results of Checker */}
        {hasChecked && (
          <div className="mt-6 bg-slate-950/60 border border-slate-850 rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <span className="text-xs text-slate-400 font-semibold uppercase">Kết quả kiểm tra lịch sử</span>
              <span className="text-xs text-slate-500 font-mono">
                Số lần khớp: {checkResult.length} kỳ quay
              </span>
            </div>

            {checkResult.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs flex flex-col items-center justify-center gap-1.5">
                <AlertCircle className="w-6 h-6 text-slate-600" />
                <span>Bộ số này chưa từng khớp giải nào lớn hơn 3 số trong lịch sử quay.</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <span className="text-xs text-slate-300 font-medium">Tổng tiền thưởng tích lũy giả lập:</span>
                  <span className="text-base font-mono font-bold text-emerald-400">{formatVND(totalPrizeValue)}</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {checkResult.map((res, i) => (
                    <div key={i} className="flex justify-between items-center p-2.5 bg-slate-900 border border-slate-850 rounded-lg text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-mono">{res.draw.draw_date}</span>
                        <span className="text-slate-500 font-mono">Kỳ {res.draw.draw_number}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-amber-400 font-semibold">{res.matchResult.prizeName} ({res.matchResult.matchCount} số)</span>
                        <span className="text-slate-400 font-mono">{formatVND(res.earned)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Draw History Table/List */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-3xl shadow-xl flex flex-col justify-between min-h-[500px]">
        <div>
          <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-4">
            <h3 className="text-white text-sm font-display font-bold">
              Danh Sách Lịch Sử Quay Số {gameType}
            </h3>
            <span className="text-slate-500 text-xs font-mono">
              Tổng {filteredDraws.length} bản ghi
            </span>
          </div>

          <div className="space-y-3">
            {paginatedDraws.map((draw, idx) => (
              <div
                key={draw.id}
                className="p-4 bg-slate-950/40 hover:bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-300">{draw.draw_number}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    <span className="text-xs text-slate-500 font-mono">{draw.draw_date}</span>
                  </div>

                  {/* Balls */}
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {draw.numbers.map((num, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-900 border border-slate-850 text-slate-300 font-mono font-bold text-xs"
                      >
                        {String(num).padStart(2, '0')}
                      </div>
                    ))}
                    {draw.game_type === 'Power 6/55' && draw.bonus && (
                      <>
                        <span className="text-slate-600 font-bold text-xs self-center">+</span>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-rose-950/30 border border-rose-500/30 text-rose-400 font-mono font-bold text-xs">
                          {String(draw.bonus).padStart(2, '0')}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-between sm:flex-col sm:items-end gap-1 sm:gap-0.5 border-t sm:border-t-0 border-slate-900 pt-2 sm:pt-0">
                  <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider block">
                    Giá trị Jackpot
                  </span>
                  <span className="text-sm font-mono font-black text-amber-500">
                    {formatVND(draw.jackpot, true)} VND
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {draw.winners > 0 ? `Trúng: ${draw.winners} người` : 'Chưa trúng'}
                  </span>
                </div>
              </div>
            ))}

            {paginatedDraws.length === 0 && (
              <div className="text-center py-24 text-slate-500 text-xs">
                Không tìm thấy kết quả phù hợp.
              </div>
            )}
          </div>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center border-t border-slate-850 pt-4 mt-6 text-xs text-slate-400">
            <span>
              Trang {currentPage} / {totalPages}
            </span>
            
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-1.5 bg-slate-950 border border-slate-850 rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  if (pageNum < 1 || pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold border transition-colors ${
                        currentPage === pageNum
                          ? 'bg-amber-500 border-amber-500 text-slate-950'
                          : 'bg-slate-950 border-slate-850 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-1.5 bg-slate-950 border border-slate-850 rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
