/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameType = 'Mega 6/45' | 'Power 6/55' | 'Lotto 5/35';

export interface LotteryDraw {
  id: string;
  draw_date: string; // YYYY-MM-DD
  game_type: GameType;
  draw_number: string; // e.g., "#01149"
  numbers: number[]; // Sorted numbers
  bonus?: number | null; // For Power 6/55 bonus number
  jackpot: number; // in VND
  winners: number; // number of jackpot winners
  sales: number; // sales revenue in VND
  created_at: string;
}

export interface Prediction {
  id: string;
  draw_date: string;
  game_type: GameType;
  model_name: string;
  numbers: number[];
  confidence_score: number; // percentage (e.g. 91)
  explanations: { [key: number]: string }; // individual number explanations
  ensemble_reason?: string; // ensemble general explanation
  created_at: string;
}

export interface NumberStat {
  number: number;
  frequency: number;
  last_seen: number; // how many draws ago
  average_gap: number;
  hot_score: number;
  cold_score: number;
  trend_score: number;
}

export interface AnalyticsSummary {
  frequency: NumberStat[];
  oddEvenRatio: { odd: number; even: number };
  highLowRatio: { low: number; high: number }; // low = 1-22, high = 23-45 for Mega; low = 1-27, high = 28-55 for Power
  sumDistribution: { min: number; max: number; avg: number; values: number[] };
  primeDistribution: { count: number; percentage: number };
  consecutiveDistribution: { count: number; percentage: number };
  repeatNumbersCount: number; // average repeat numbers from previous draw
}

export interface NotificationSetting {
  id: string;
  email: string;
  jackpot_threshold: number; // in billion VND
  game_types: GameType[];
  notify_on_new_results: boolean;
  notify_on_predictions: boolean;
  favorite_numbers: number[];
}
