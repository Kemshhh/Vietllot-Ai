/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameType } from '../types.js';
import { Sparkles, BrainCircuit, RefreshCw, Send, CheckCircle2, AlertCircle, HelpCircle, FileJson } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RecommendedSet {
  numbers: number[];
  confidence: number;
  explanations: string[];
}

interface AIViewProps {
  gameType: GameType;
  predictions: any; // backend prediction response
  isLoadingPredictions: boolean;
}

export default function AIView({
  gameType,
  predictions,
  isLoadingPredictions,
}: AIViewProps) {
  const [selectedModel, setSelectedModel] = useState<string>('Ensemble AI');
  const [ticketCount, setTicketCount] = useState<number>(20);
  const [customSets, setCustomSets] = useState<RecommendedSet[]>([]);
  const [isGeneratingCustom, setIsGeneratingCustom] = useState<boolean>(false);
  
  // Explainable AI state
  const [explainingSet, setExplainingSet] = useState<number[] | null>(null);
  const [geminiExplanation, setGeminiExplanation] = useState<string>('');
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [errorExplain, setErrorExplain] = useState<string>('');

  const modelList = [
    'Ensemble AI',
    'Frequency Model',
    'Weighted Frequency',
    'Moving Average',
    'Bayesian Probability',
    'Markov Chain',
    'Monte Carlo Simulation',
    'Random Forest',
    'XGBoost',
    'LightGBM',
    'CatBoost',
    'LSTM Time Series',
    'Transformer Time Series',
  ];

  // Fetch or generate the suggestions on model/count change
  const handleGenerateCustom = async (model = selectedModel, count = ticketCount) => {
    setIsGeneratingCustom(true);
    setCustomSets([]);
    try {
      const response = await fetch('/api/predictions/generate-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type: gameType,
          model_name: model,
          count: count,
          monteCarloSims: 100000,
        }),
      });
      const data = await response.json();
      if (data.sets) {
        setCustomSets(data.sets);
      }
    } catch (err) {
      console.error('Error generating custom suggestions:', err);
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  useEffect(() => {
    handleGenerateCustom(selectedModel, ticketCount);
  }, [gameType, selectedModel, ticketCount]);

  // Request Gemini Explanation
  const handleExplainSet = async (numbers: number[]) => {
    setExplainingSet(numbers);
    setIsExplaining(true);
    setGeminiExplanation('');
    setErrorExplain('');
    try {
      const response = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numbers,
          game_type: gameType,
        }),
      });
      const data = await response.json();
      if (data.explanation) {
        setGeminiExplanation(data.explanation);
      } else if (data.error) {
        setErrorExplain(data.error);
      }
    } catch (err: any) {
      setErrorExplain(err.message || 'Lỗi kết nối API. Vui lòng thử lại.');
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left panel: Control settings and parameters */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl shadow-xl space-y-5">
          <h3 className="text-white text-sm font-display font-bold flex items-center gap-1.5 border-b border-slate-800 pb-3">
            <BrainCircuit className="w-4 h-4 text-amber-500" />
            Cấu Hình Mô Hình AI & Thuật Toán
          </h3>

          {/* Model selection */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold">Chọn thuật toán đề xuất:</label>
            <select
              id="select-ai-model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
            >
              {modelList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Bulk set count */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold">Quy mô bộ đề xuất:</label>
            <div className="flex bg-slate-950 border border-slate-850 p-1 rounded-xl">
              {[20, 50, 100].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setTicketCount(cnt)}
                  className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all duration-200 ${
                    ticketCount === cnt
                      ? 'bg-slate-800 text-amber-400 border border-slate-700/50 shadow-inner'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {cnt} bộ số
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/50 text-[10.5px] text-slate-400 space-y-1.5">
            <strong className="text-amber-500 font-display block">Mẹo Phân Tích:</strong>
            <p>
              • <strong className="text-white">Ensemble AI</strong> tổng hợp ý kiến biểu quyết từ tất cả các mô hình con.
            </p>
            <p>
              • <strong className="text-white">Monte Carlo</strong> phù hợp mô phỏng nhịp nhảy ngẫu nhiên quy mô lớn (100.000 lượt).
            </p>
          </div>
          
          <button
            onClick={() => handleGenerateCustom(selectedModel, ticketCount)}
            disabled={isGeneratingCustom}
            className="w-full py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 font-display text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingCustom ? 'animate-spin' : ''}`} />
            Tính Toán Lại Bộ Số
          </button>
        </div>

        {/* Informative description banner */}
        <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/10 p-5 rounded-2xl shadow-md">
          <h4 className="text-indigo-400 text-xs font-display font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Explainable AI (XAI) là gì?
          </h4>
          <p className="text-slate-400 text-[11px] mt-2 leading-relaxed">
            Mỗi tấm vé số được sinh ra đều có lý do số học ẩn sâu. Nhấp chọn bất kỳ bộ số nào ở bảng danh sách bên phải để kích hoạt hệ thống **Trí tuệ nhân tạo giải thích (XAI)**.
          </p>
          <p className="text-slate-500 text-[10px] mt-2">
            Mô hình Gemini sẽ phân tích cấu trúc nhịp lặp chẵn lẻ, kiểm thử tổng số và phản hồi báo cáo toán học trực tiếp cho bạn.
          </p>
        </div>
      </div>

      {/* Right panel: Suggested sets List and Explain Drawer */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Real-time Explain View Panel */}
        <AnimatePresence mode="wait">
          {explainingSet && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-900/80 border border-amber-500/20 p-5 rounded-2xl shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full filter blur-3xl -z-10" />
              
              <div className="flex justify-between items-start border-b border-slate-800 pb-3 mb-4">
                <div>
                  <h3 className="text-amber-500 text-sm font-display font-bold flex items-center gap-1.5">
                    <BrainCircuit className="w-4 h-4 animate-pulse" />
                    Báo Cáo Phân Tích XAI (AI Explain)
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    {explainingSet.map((num, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-950 text-amber-400 border border-slate-800 rounded font-mono text-xs font-bold">
                        {String(num).padStart(2, '0')}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setExplainingSet(null)}
                  className="text-slate-500 hover:text-slate-300 text-xs font-semibold px-2.5 py-1 bg-slate-950 border border-slate-850 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Đóng phân tích
                </button>
              </div>

              {/* Gemini Markdown Output */}
              <div className="text-slate-300 text-xs leading-relaxed space-y-2 max-h-72 overflow-y-auto pr-2">
                {isExplaining ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                    <span className="text-slate-400 font-mono animate-pulse">Gemini AI đang chấm điểm toán học...</span>
                  </div>
                ) : errorExplain ? (
                  <div className="flex items-center gap-2 text-rose-400 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorExplain}</span>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-xs max-w-none">
                    {geminiExplanation.split('\n').map((line, index) => {
                      if (line.startsWith('### ')) {
                        return <h4 key={index} className="text-white font-display font-bold text-xs mt-3 border-l-2 border-amber-500 pl-2">{line.replace('### ', '')}</h4>;
                      }
                      if (line.startsWith('#### ')) {
                        return <h5 key={index} className="text-amber-400 font-display font-semibold text-[11px] mt-2">{line.replace('#### ', '')}</h5>;
                      }
                      if (line.startsWith('**') || line.startsWith('- **')) {
                        return <p key={index} className="text-slate-200 mt-1 pl-2 font-medium">{line.replace(/[\*\-]/g, '')}</p>;
                      }
                      return <p key={index} className="text-slate-400 mt-0.5">{line}</p>;
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestion list header */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex flex-col h-full min-h-[400px]">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="text-white text-sm font-display font-bold">
                Bộ Số Gợi Ý Bằng Mô Hình: <span className="text-amber-500">{selectedModel}</span>
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Hiển thị {ticketCount} bộ đề xuất cho kỳ quay tiếp theo, được xếp hạng theo chỉ số tin cậy.
              </p>
            </div>
            
            <span className="text-slate-400 text-xs font-mono">
              Tổng số bộ: {customSets.length}
            </span>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto max-h-[500px] space-y-2 pr-1">
            {isGeneratingCustom ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <RefreshCw className="w-10 h-10 mb-3 animate-spin text-amber-500" />
                <p className="text-xs font-mono animate-pulse">Đang huấn luyện mô hình và tái cấu trúc dữ liệu xổ số...</p>
              </div>
            ) : customSets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <HelpCircle className="w-10 h-10 mb-2" />
                <p className="text-xs">Chưa có bộ số nào được sinh ra.</p>
              </div>
            ) : (
              customSets.map((set, idx) => (
                <div
                  key={idx}
                  onClick={() => handleExplainSet(set.numbers)}
                  className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950/40 hover:bg-slate-950 border border-slate-850 hover:border-amber-500/40 rounded-xl cursor-pointer transition-all duration-200 ${
                    explainingSet && explainingSet.join(',') === set.numbers.join(',')
                      ? 'border-amber-500 bg-slate-950'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-amber-500">
                      #{String(idx + 1).padStart(3, '0')}
                    </span>
                    
                    {/* Balls */}
                    <div className="flex gap-1.5 flex-wrap">
                      {set.numbers.map((num, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-300 font-mono font-bold text-xs"
                        >
                          {String(num).padStart(2, '0')}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-slate-850 pt-2 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-500 block">Độ tin cậy</span>
                      <span className="text-xs font-mono font-bold text-indigo-400">{set.confidence}%</span>
                    </div>
                    
                    <button className="px-3 py-1 bg-slate-900 hover:bg-amber-500 text-slate-300 hover:text-slate-950 text-[10px] font-display font-semibold rounded-lg border border-slate-800 group-hover:border-amber-500/30 transition-all flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Giải thích AI
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
