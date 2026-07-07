/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LotteryDraw, GameType, AnalyticsSummary, NotificationSetting, Prediction } from './types.js';
import HomeView from './components/HomeView.js';
import StatsView from './components/StatsView.js';
import AIView from './components/AIView.js';
import HistoryView from './components/HistoryView.js';
import SettingsView from './components/SettingsView.js';
import SyncStatusWidget from './components/SyncStatusWidget.js';
import { Home, BarChart2, Brain, History, Settings, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'home' | 'stats' | 'ai' | 'history' | 'settings';

export default function App() {
  // Navigation & Game Config
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [gameType, setGameType] = useState<GameType>('Mega 6/45');

  // Backend Data States
  const [draws, setDraws] = useState<LotteryDraw[]>([]);
  const [latestDraw, setLatestDraw] = useState<LotteryDraw | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [notificationConfig, setNotificationConfig] = useState<NotificationSetting | null>(null);
  const [topAiTicket, setTopAiTicket] = useState<Prediction | null>(null);

  // Loading / Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [limitCount, setLimitCount] = useState<number>(100);

  // Sync / Fetch function
  const fetchAllData = async (syncingType = gameType) => {
    setIsLoading(true);
    try {
      // 1. Fetch draws list (handles query strings if active search)
      const drawsUrl = searchQuery
        ? `/api/results?game_type=${encodeURIComponent(syncingType)}&search=${encodeURIComponent(searchQuery)}`
        : `/api/results?game_type=${encodeURIComponent(syncingType)}`;
      const drawsRes = await fetch(drawsUrl);
      const drawsData = await drawsRes.json();
      setDraws(drawsData);

      // 2. Fetch latest draw
      const latestRes = await fetch(`/api/results/latest?game_type=${encodeURIComponent(syncingType)}`);
      const latestData = await latestRes.json();
      if (!latestData.error) {
        setLatestDraw(latestData);
      }

      // 3. Fetch analytics summary
      const analyticsRes = await fetch(`/api/analytics-summary?game_type=${encodeURIComponent(syncingType)}&limit=${limitCount}`);
      const analyticsData = await analyticsRes.json();
      if (!analyticsData.error) {
        setAnalytics(analyticsData);
      }

      // 4. Fetch predictions
      const predictionsRes = await fetch(`/api/predictions?game_type=${encodeURIComponent(syncingType)}`);
      const predictionsData = await predictionsRes.json();
      if (!predictionsData.error) {
        setPredictions(predictionsData);
        // Find Ensemble AI or top prediction for Home card
        const ensemble = predictionsData.predictions?.find((p: any) => p.model_name === 'Ensemble AI');
        setTopAiTicket(ensemble || predictionsData.predictions?.[0] || null);
      }

      // 5. Fetch notification settings config
      const notiRes = await fetch('/api/notifications');
      const notiData = await notiRes.json();
      if (!notiData.error) {
        setNotificationConfig(notiData);
      }

    } catch (err) {
      console.error('Error fetching data from server:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Mount effect
  useEffect(() => {
    fetchAllData(gameType);
  }, [gameType, limitCount, searchQuery]);

  // Handle live next draw simulation
  const handleSimulateNextDraw = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/results/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_type: gameType }),
      });
      const data = await res.json();
      if (data.draw) {
        // Play simulation transition, then sync
        setTimeout(() => {
          fetchAllData(gameType);
          setIsSimulating(false);
        }, 800);
      } else {
        setIsSimulating(false);
      }
    } catch (err) {
      console.error('Error simulating draw:', err);
      setIsSimulating(false);
    }
  };

  // Save notification config
  const handleSaveNotificationConfig = async (newConfig: NotificationSetting) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      const data = await res.json();
      if (data.config) {
        setNotificationConfig(data.config);
      }
    } catch (err) {
      console.error('Error saving notification config:', err);
    }
  };

  return (
    <div id="root-app-shell" className="min-h-screen bg-transparent flex flex-col lg:flex-row text-slate-100 selection:bg-amber-500 selection:text-slate-950 pb-24 lg:pb-0">
      
      {/* Sidebar - Desktop Layout */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-slate-950/80 border-r border-slate-900/50 p-5 shrink-0 h-screen sticky top-0">
        <div className="space-y-8">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 border-b border-slate-900 pb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Sparkles className="w-6 h-6 text-slate-950 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-display font-black tracking-wider text-white">VIETLOTT AI</h1>
              <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Analytics Platform</span>
            </div>
          </div>

          {/* Nav list */}
          <nav className="space-y-1.5">
            {[
              { id: 'home', label: 'Trang chủ', icon: Home },
              { id: 'stats', label: 'Thống kê cầu', icon: BarChart2 },
              { id: 'ai', label: 'Gợi ý AI', icon: Brain },
              { id: 'history', label: 'Lịch sử & So vé', icon: History },
              { id: 'settings', label: 'Cấu hình thông báo', icon: Settings },
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`desktop-sidebar-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-display font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile segment */}
        <div className="flex items-center gap-3 border-t border-slate-900 pt-5">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/50 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-white font-semibold truncate block">kemcolen@gmail.com</span>
            <span className="text-[9px] text-amber-500 font-mono tracking-wider font-bold block">Hội viên Thử nghiệm</span>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between px-5 py-4 bg-slate-950/80 border-b border-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-slate-950" />
          </div>
          <h1 className="text-xs font-display font-black text-white uppercase tracking-wider">Vietlott AI</h1>
        </div>

        <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-slate-700/30">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full">
        {/* Sync Status Widget */}
        <SyncStatusWidget onSyncSuccess={() => fetchAllData(gameType)} />

        {/* Sync Indicator/Loader overlay */}
        {isLoading && draws.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-slate-400">
            <RefreshCw className="w-12 h-12 mb-4 animate-spin text-amber-500" />
            <p className="font-mono text-sm">Đang tải và đồng bộ hóa kết quả xổ số...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === 'home' && (
                <HomeView
                  latestDraw={latestDraw}
                  gameType={gameType}
                  setGameType={setGameType}
                  onSimulateDraw={handleSimulateNextDraw}
                  isSimulating={isSimulating}
                  topAiTicket={topAiTicket}
                />
              )}
              {activeTab === 'stats' && (
                <StatsView
                  analytics={analytics}
                  gameType={gameType}
                  limitCount={limitCount}
                  setLimitCount={setLimitCount}
                  isLoading={isLoading}
                />
              )}
              {activeTab === 'ai' && (
                <AIView
                  gameType={gameType}
                  predictions={predictions}
                  isLoadingPredictions={isLoading}
                />
              )}
              {activeTab === 'history' && (
                <HistoryView
                  draws={draws}
                  gameType={gameType}
                  setGameType={setGameType}
                  onSearch={setSearchQuery}
                  searchQuery={searchQuery}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsView
                  onSaveConfig={handleSaveNotificationConfig}
                  initialConfig={notificationConfig}
                  isSaving={isLoading}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Bottom Sticky Tab Navigation Bar - Mobile Layout */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-950/95 border-t border-slate-900/60 backdrop-blur-lg flex justify-around py-3 z-40 shadow-2xl">
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'stats', label: 'Stats', icon: BarChart2 },
          { id: 'ai', label: 'AI', icon: Brain },
          { id: 'history', label: 'History', icon: History },
          { id: 'settings', label: 'Profile', icon: Settings },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`mobile-bottom-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as TabType)}
              className="flex flex-col items-center justify-center text-center py-1 flex-1 relative"
            >
              <div
                className={`p-1 rounded-xl transition-all duration-300 ${
                  isSelected ? 'text-amber-500 scale-110' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <IconComp className="w-5 h-5 shrink-0" />
              </div>
              <span
                className={`text-[9px] font-display font-semibold mt-0.5 transition-all duration-300 ${
                  isSelected ? 'text-white font-bold' : 'text-slate-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
