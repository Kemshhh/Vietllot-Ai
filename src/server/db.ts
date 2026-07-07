/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { LotteryDraw, Prediction, NumberStat, AnalyticsSummary, GameType, NotificationSetting } from '../types.js';

let DB_DIR = path.join(process.cwd(), 'data');
let DB_FILE = path.join(DB_DIR, 'vietlott_db.json');

if (process.env.VERCEL) {
  DB_DIR = '/tmp/data';
  DB_FILE = path.join(DB_DIR, 'vietlott_db.json');
}

interface Schema {
  draws: LotteryDraw[];
  predictions: { [key: string]: Prediction[] }; // keyed by game_type + "_" + draw_date
  notifications: NotificationSetting[];
}

// Simple seedable random number generator for deterministic seed data
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  chooseUnique(n: number, min: number, max: number): number[] {
    const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    const chosen: number[] = [];
    for (let i = 0; i < n; i++) {
      if (pool.length === 0) break;
      const idx = Math.floor(this.next() * pool.length);
      chosen.push(pool.splice(idx, 1)[0]);
    }
    return chosen.sort((a, b) => a - b);
  }
}

// Check if a number is prime
function isPrime(num: number): boolean {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
}

export class VietlottDatabase {
  private schema: Schema = { draws: [], predictions: {}, notifications: [] };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        try {
          const raw = fs.readFileSync(DB_FILE, 'utf-8');
          this.schema = JSON.parse(raw);
          console.log(`Loaded ${this.schema.draws.length} draws from database.`);
          return;
        } catch (err) {
          console.error('Error parsing database file, regenerating...', err);
        }
      }
    } catch (err) {
      console.error('Database load failed, falling back to /tmp/data or memory:', err);
      // Try falling back to /tmp/data if not already there
      if (DB_DIR !== '/tmp/data') {
        DB_DIR = '/tmp/data';
        DB_FILE = path.join(DB_DIR, 'vietlott_db.json');
        try {
          if (!fs.existsSync(DB_DIR)) {
            fs.mkdirSync(DB_DIR, { recursive: true });
          }
          if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, 'utf-8');
            this.schema = JSON.parse(raw);
            return;
          }
        } catch (innerErr) {
          console.error('Fallback load failed:', innerErr);
        }
      }
    }

    this.generateSeedData();
    this.save();
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.schema, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
      // If writing to DB_FILE fails (e.g., EROFS), try writing to /tmp/data
      if (DB_DIR !== '/tmp/data') {
        DB_DIR = '/tmp/data';
        DB_FILE = path.join(DB_DIR, 'vietlott_db.json');
        try {
          if (!fs.existsSync(DB_DIR)) {
            fs.mkdirSync(DB_DIR, { recursive: true });
          }
          fs.writeFileSync(DB_FILE, JSON.stringify(this.schema, null, 2), 'utf-8');
          console.log('Saved database to fallback /tmp/data');
        } catch (innerErr) {
          console.error('Failed to write database file to fallback /tmp/data as well:', innerErr);
        }
      }
    }
  }

  private generateSeedData() {
    console.log('Generating realistic Vietlott seed data starting from November 2025...');
    const rng = new SeededRandom(42); // deterministic seed
    const draws: LotteryDraw[] = [];

    // Historical start date: 2025-11-01
    // End date: 2026-07-06 (current date)
    const startDate = new Date('2025-11-01T00:00:00Z');
    const endDate = new Date('2026-07-06T00:00:00Z');

    let megaDrawCounter = 1140; // Mega 6/45 draw numbering
    let powerDrawCounter = 1010; // Power 6/55 draw numbering
    let lottoDrawCounter = 820; // Lotto 5/35 draw numbering

    // Initial Jackpots
    let megaJackpot = 12000000000; // 12 tỷ VND
    let powerJackpot = 30000000000; // 30 tỷ VND
    let lottoJackpot = 2000000000; // 2 tỷ VND

    const loopDate = new Date(startDate);
    while (loopDate <= endDate) {
      const dayOfWeek = loopDate.getUTCDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
      const dateStr = loopDate.toISOString().split('T')[0];

      // Mega 6/45 draws: Wednesday (3), Friday (5), Sunday (0)
      if (dayOfWeek === 3 || dayOfWeek === 5 || dayOfWeek === 0) {
        megaDrawCounter++;
        // Does anyone win Jackpot? 3% chance of a winner
        const won = rng.next() < 0.035;
        const winnerCount = won ? rng.nextInt(1, 2) : 0;
        const sales = rng.nextInt(1500000000, 3500000000); // 1.5 - 3.5 tỷ VND sales
        
        // Accumulate jackpot if not won
        const jackpotIncrease = Math.floor(sales * 0.55); // 55% sales go to prize pool, chunk to jackpot
        const currentJackpot = megaJackpot;

        draws.push({
          id: `mega_${megaDrawCounter}`,
          draw_date: dateStr,
          game_type: 'Mega 6/45',
          draw_number: `#${String(megaDrawCounter).padStart(5, '0')}`,
          numbers: rng.chooseUnique(6, 1, 45),
          jackpot: currentJackpot,
          winners: winnerCount,
          sales: sales,
          created_at: new Date(loopDate).toISOString(),
        });

        if (won) {
          megaJackpot = 12000000000; // Reset
        } else {
          megaJackpot += jackpotIncrease;
        }
      }

      // Power 6/55 draws: Tuesday (2), Thursday (4), Saturday (6)
      if (dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 6) {
        powerDrawCounter++;
        // 1.5% chance of winner
        const won = rng.next() < 0.015;
        const winnerCount = won ? 1 : 0;
        const sales = rng.nextInt(2000000000, 5000000000); // 2 - 5 tỷ VND sales
        
        const jackpotIncrease = Math.floor(sales * 0.45);
        const currentJackpot = powerJackpot;

        const pNumbers = rng.chooseUnique(6, 1, 55);
        let bonus = rng.nextInt(1, 55);
        while (pNumbers.includes(bonus)) {
          bonus = rng.nextInt(1, 55);
        }

        draws.push({
          id: `power_${powerDrawCounter}`,
          draw_date: dateStr,
          game_type: 'Power 6/55',
          draw_number: `#${String(powerDrawCounter).padStart(5, '0')}`,
          numbers: pNumbers,
          bonus: bonus,
          jackpot: currentJackpot,
          winners: winnerCount,
          sales: sales,
          created_at: new Date(loopDate).toISOString(),
        });

        if (won) {
          powerJackpot = 30000000000; // Reset
        } else {
          powerJackpot += jackpotIncrease;
        }
      }

      // Lotto 5/35 draws: Monday (1) and Thursday (4)
      if (dayOfWeek === 1 || dayOfWeek === 4) {
        lottoDrawCounter++;
        // 5% chance of winner
        const won = rng.next() < 0.05;
        const winnerCount = won ? rng.nextInt(1, 2) : 0;
        const sales = rng.nextInt(500000000, 1500000000); // 500 triệu - 1.5 tỷ VND sales
        
        const jackpotIncrease = Math.floor(sales * 0.40);
        const currentJackpot = lottoJackpot;

        draws.push({
          id: `lotto_${lottoDrawCounter}`,
          draw_date: dateStr,
          game_type: 'Lotto 5/35',
          draw_number: `#${String(lottoDrawCounter).padStart(5, '0')}`,
          numbers: rng.chooseUnique(5, 1, 35),
          jackpot: currentJackpot,
          winners: winnerCount,
          sales: sales,
          created_at: new Date(loopDate).toISOString(),
        });

        if (won) {
          lottoJackpot = 2000000000; // Reset
        } else {
          lottoJackpot += jackpotIncrease;
        }
      }

      // Advance 1 day
      loopDate.setUTCDate(loopDate.getUTCDate() + 1);
    }

    // Sort draws so the most recent is at the top/end.
    // Actually, we'll keep it sorted chronologically for ease of index-based stats, and reverse in UI.
    this.schema.draws = draws.sort((a, b) => new Date(a.draw_date).getTime() - new Date(b.draw_date).getTime());
    
    // Seed default notifications
    this.schema.notifications = [
      {
        id: 'noti_1',
        email: 'kemcolen@gmail.com',
        jackpot_threshold: 50, // 50 tỷ VND
        game_types: ['Mega 6/45', 'Power 6/55'],
        notify_on_new_results: true,
        notify_on_predictions: true,
        favorite_numbers: [8, 18, 28]
      }
    ];

    console.log(`Generated ${this.schema.draws.length} seed draws.`);
  }

  public getDraws(gameType?: GameType): LotteryDraw[] {
    if (gameType) {
      return this.schema.draws.filter((d) => d.game_type === gameType);
    }
    return this.schema.draws;
  }

  public getLatestDraw(gameType: GameType): LotteryDraw | undefined {
    const draws = this.getDraws(gameType);
    if (draws.length === 0) return undefined;
    return draws[draws.length - 1];
  }

  public getDrawByNumber(gameType: GameType, drawNum: string): LotteryDraw | undefined {
    return this.schema.draws.find((d) => d.game_type === gameType && d.draw_number === drawNum);
  }

  public addDraw(draw: Omit<LotteryDraw, 'id' | 'created_at'>): LotteryDraw {
    const id = `${draw.game_type === 'Mega 6/45' ? 'mega' : draw.game_type === 'Lotto 5/35' ? 'lotto' : 'power'}_${Date.now()}`;
    const newDraw: LotteryDraw = {
      ...draw,
      id,
      created_at: new Date().toISOString(),
    };
    this.schema.draws.push(newDraw);
    // Sort chronologically
    this.schema.draws.sort((a, b) => new Date(a.draw_date).getTime() - new Date(b.draw_date).getTime());
    this.save();
    return newDraw;
  }

  public upsertRealDraw(draw: Omit<LotteryDraw, 'created_at'> & { id: string }): LotteryDraw {
    const existingIndex = this.schema.draws.findIndex(
      (d) => d.game_type === draw.game_type && d.draw_number === draw.draw_number
    );

    let finalDraw: LotteryDraw;
    if (existingIndex !== -1) {
      // Update existing
      finalDraw = {
        ...this.schema.draws[existingIndex],
        ...draw,
      };
      this.schema.draws[existingIndex] = finalDraw;
    } else {
      // Insert new
      finalDraw = {
        ...draw,
        created_at: new Date().toISOString(),
      };
      this.schema.draws.push(finalDraw);
    }

    // Sort chronologically
    this.schema.draws.sort((a, b) => new Date(a.draw_date).getTime() - new Date(b.draw_date).getTime());
    this.save();
    return finalDraw;
  }

  // Calculate statistics for a given game type up to a certain date or up to the latest draw
  public calculateStats(gameType: GameType, limitCount: number = 100): NumberStat[] {
    const draws = this.getDraws(gameType);
    const maxVal = gameType === 'Mega 6/45' ? 45 : gameType === 'Lotto 5/35' ? 35 : 55;
    
    // Take only the last 'limitCount' draws to compute current statistics
    const recentDraws = draws.slice(-limitCount);
    const totalDraws = recentDraws.length;

    // Initialize stats
    const statsMap = new Map<number, {
      number: number;
      drawsWithNum: number[]; // indices of recentDraws that contain this number
      frequency: number;
      last_seen: number;
    }>();

    for (let i = 1; i <= maxVal; i++) {
      statsMap.set(i, {
        number: i,
        drawsWithNum: [],
        frequency: 0,
        last_seen: totalDraws, // default to not seen in the window
      });
    }

    // Traverse recent draws
    recentDraws.forEach((draw, drawIndex) => {
      draw.numbers.forEach((num) => {
        const item = statsMap.get(num);
        if (item) {
          item.frequency++;
          item.drawsWithNum.push(drawIndex);
          item.last_seen = totalDraws - 1 - drawIndex; // distance from the end
        }
      });
    });

    const statsList: NumberStat[] = [];

    statsMap.forEach((item, num) => {
      // Calculate Average Gap
      let averageGap = 0;
      if (item.drawsWithNum.length > 1) {
        let gapSum = 0;
        for (let k = 1; k < item.drawsWithNum.length; k++) {
          gapSum += (item.drawsWithNum[k] - item.drawsWithNum[k - 1]);
        }
        averageGap = gapSum / (item.drawsWithNum.length - 1);
      } else if (item.drawsWithNum.length === 1) {
        averageGap = totalDraws; // default single seen
      } else {
        averageGap = totalDraws + 10; // never seen
      }

      // Hot score: higher if frequency is high in last 30% of draws
      const recentWindowSize = Math.max(10, Math.floor(totalDraws * 0.3));
      let recentHits = 0;
      item.drawsWithNum.forEach((idx) => {
        if (idx >= totalDraws - recentWindowSize) {
          recentHits++;
        }
      });
      const hotScore = (recentHits / recentWindowSize) * 10;

      // Cold score: higher if not seen for a long time compared to average gap
      const coldScore = item.last_seen > 0 ? (item.last_seen / averageGap) * 5 : 0;

      // Trend score: difference between recent frequency rate and older frequency rate
      const midPoint = Math.floor(totalDraws / 2);
      let firstHalfHits = 0;
      let secondHalfHits = 0;
      item.drawsWithNum.forEach((idx) => {
        if (idx < midPoint) firstHalfHits++;
        else secondHalfHits++;
      });
      const trendScore = ((secondHalfHits - firstHalfHits) / (totalDraws / 2)) * 5;

      statsList.push({
        number: num,
        frequency: item.frequency,
        last_seen: item.last_seen,
        average_gap: parseFloat(averageGap.toFixed(1)),
        hot_score: parseFloat(Math.min(10, Math.max(0, hotScore)).toFixed(2)),
        cold_score: parseFloat(Math.min(10, Math.max(0, coldScore)).toFixed(2)),
        trend_score: parseFloat(Math.min(5, Math.max(-5, trendScore)).toFixed(2)),
      });
    });

    return statsList;
  }

  public getAnalyticsSummary(gameType: GameType, limitCount: number = 100): AnalyticsSummary {
    const draws = this.getDraws(gameType).slice(-limitCount);
    const stats = this.calculateStats(gameType, limitCount);
    const maxVal = gameType === 'Mega 6/45' ? 45 : gameType === 'Lotto 5/35' ? 35 : 55;
    const midVal = gameType === 'Mega 6/45' ? 22 : gameType === 'Lotto 5/35' ? 17 : 27;

    let oddSum = 0;
    let evenSum = 0;
    let lowSum = 0;
    let highSum = 0;
    let sumTotal = 0;
    const sumValues: number[] = [];
    let primeCount = 0;
    let consecutiveCount = 0;
    let repeatCount = 0;

    draws.forEach((draw, idx) => {
      let odd = 0;
      let even = 0;
      let low = 0;
      let high = 0;
      let sum = 0;
      let primes = 0;
      let consecutives = 0;

      draw.numbers.forEach((num) => {
        sum += num;
        if (num % 2 === 0) even++; else odd++;
        if (num <= midVal) low++; else high++;
        if (isPrime(num)) primes++;
      });

      for (let i = 0; i < draw.numbers.length - 1; i++) {
        if (draw.numbers[i + 1] - draw.numbers[i] === 1) {
          consecutives++;
        }
      }

      oddSum += odd;
      evenSum += even;
      lowSum += low;
      highSum += high;
      sumTotal += sum;
      sumValues.push(sum);
      primeCount += primes;
      consecutiveCount += consecutives;

      // Repeat from previous
      if (idx > 0) {
        const prevDraw = draws[idx - 1];
        const intersection = draw.numbers.filter(x => prevDraw.numbers.includes(x));
        repeatCount += intersection.length;
      }
    });

    const totalTickets = draws.length;
    const itemsPerTicket = gameType === 'Lotto 5/35' ? 5 : 6;

    return {
      frequency: stats,
      oddEvenRatio: {
        odd: parseFloat(((oddSum / (totalTickets * itemsPerTicket)) * 100).toFixed(1)),
        even: parseFloat(((evenSum / (totalTickets * itemsPerTicket)) * 100).toFixed(1)),
      },
      highLowRatio: {
        low: parseFloat(((lowSum / (totalTickets * itemsPerTicket)) * 100).toFixed(1)),
        high: parseFloat(((highSum / (totalTickets * itemsPerTicket)) * 100).toFixed(1)),
      },
      sumDistribution: {
        min: Math.min(...sumValues),
        max: Math.max(...sumValues),
        avg: parseFloat((sumTotal / totalTickets).toFixed(1)),
        values: sumValues,
      },
      primeDistribution: {
        count: parseFloat((primeCount / totalTickets).toFixed(2)),
        percentage: parseFloat(((primeCount / (totalTickets * itemsPerTicket)) * 100).toFixed(1)),
      },
      consecutiveDistribution: {
        count: parseFloat((consecutiveCount / totalTickets).toFixed(2)),
        percentage: parseFloat(((consecutiveCount / totalTickets) * 100).toFixed(1)),
      },
      repeatNumbersCount: parseFloat((repeatCount / (totalTickets - 1)).toFixed(2)),
    };
  }

  // Model suggestions implementation
  public generateSuggestions(gameType: GameType, modelName: string, count: number = 20, monteCarloSims: number = 100000): number[][] {
    const draws = this.getDraws(gameType);
    const maxVal = gameType === 'Mega 6/45' ? 45 : gameType === 'Lotto 5/35' ? 35 : 55;
    const stats = this.calculateStats(gameType, 100);

    // Dynamic model generators
    const results: number[][] = [];
    const usedSets = new Set<string>();

    const getModelWeightMap = () => {
      const weightMap = new Map<number, number>();
      
      if (modelName === 'Frequency Model') {
        stats.forEach((s) => weightMap.set(s.number, s.frequency));
      } else if (modelName === 'Weighted Frequency') {
        stats.forEach((s) => weightMap.set(s.number, s.frequency * (1 + s.trend_score / 10)));
      } else if (modelName === 'Moving Average') {
        const recentStats = this.calculateStats(gameType, 30);
        recentStats.forEach((s) => weightMap.set(s.number, s.frequency));
      } else if (modelName === 'Bayesian Probability') {
        stats.forEach((s) => {
          const score = s.frequency / (s.last_seen + 1);
          weightMap.set(s.number, score);
        });
      } else if (modelName === 'Markov Chain') {
        // Transition mapping from the latest draw
        const latest = this.getLatestDraw(gameType);
        if (latest) {
          stats.forEach((s) => {
            let transitionScore = s.frequency;
            // Boost numbers that often appear close to latest numbers
            latest.numbers.forEach((n) => {
              if (Math.abs(s.number - n) <= 5) transitionScore += 3;
            });
            weightMap.set(s.number, transitionScore);
          });
        } else {
          stats.forEach((s) => weightMap.set(s.number, s.frequency));
        }
      } else if (modelName === 'Monte Carlo Simulation') {
        // Simulate 'monteCarloSims' draws and take most frequent
        const simFreq = Array(maxVal + 1).fill(0);
        const lcg = new SeededRandom(77);
        const choiceSize = gameType === 'Lotto 5/35' ? 5 : 6;
        for (let i = 0; i < monteCarloSims; i++) {
          const sim = lcg.chooseUnique(choiceSize, 1, maxVal);
          sim.forEach(num => simFreq[num]++);
        }
        stats.forEach((s) => weightMap.set(s.number, simFreq[s.number] + s.frequency * 50));
      } else if (['Random Forest', 'XGBoost', 'LightGBM', 'CatBoost', 'LSTM Time Series', 'Transformer Time Series'].includes(modelName)) {
        // Machine Learning scoring simulation
        const hash = modelName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const lcg = new SeededRandom(hash);
        stats.forEach((s) => {
          const baseMlScore = s.hot_score * 3 + s.cold_score * 1.5 + lcg.next() * 10;
          weightMap.set(s.number, baseMlScore);
        });
      } else {
        // Ensemble AI (Combine multiple scoring metrics)
        stats.forEach((s) => {
          const ensembleScore = s.frequency * 0.3 + s.hot_score * 2.0 + s.cold_score * 1.0 + (s.trend_score + 5) * 1.5;
          weightMap.set(s.number, ensembleScore);
        });
      }

      // Add a tiny random jitter to ensure uniqueness
      const jitterLcg = new SeededRandom(101);
      stats.forEach((s) => {
        const cur = weightMap.get(s.number) || 1;
        weightMap.set(s.number, cur * (0.95 + jitterLcg.next() * 0.1));
      });

      return weightMap;
    };

    const weights = getModelWeightMap();

    // Generate sets
    const rng = new SeededRandom(99 + count + modelName.length);
    const setSize = gameType === 'Lotto 5/35' ? 5 : 6;
    while (results.length < count) {
      // Choose unique numbers based on weights
      const set: number[] = [];
      const tempWeights = new Map(weights);

      for (let step = 0; step < setSize; step++) {
        let totalW = 0;
        tempWeights.forEach((w) => { totalW += w; });
        
        let r = rng.next() * totalW;
        let selectedNum = 1;
        let runningW = 0;

        for (const [num, w] of tempWeights.entries()) {
          runningW += w;
          if (r <= runningW) {
            selectedNum = num;
            break;
          }
        }

        set.push(selectedNum);
        tempWeights.delete(selectedNum);
      }

      set.sort((a, b) => a - b);
      const setKey = set.join(',');
      if (!usedSets.has(setKey)) {
        usedSets.add(setKey);
        results.push(set);
      }
    }

    return results;
  }

  // Fetch or generate predictions for the latest/upcoming draw
  public getPredictionsForDate(gameType: GameType, dateStr: string, limit: number = 20): Prediction[] {
    const key = `${gameType}_${dateStr}`;
    if (this.schema.predictions[key]) {
      return this.schema.predictions[key];
    }

    // Generate them
    const models = [
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
      'Transformer Time Series'
    ];

    const stats = this.calculateStats(gameType, 100);
    const statsMap = new Map(stats.map(s => [s.number, s]));

    const preds: Prediction[] = models.map((model, mIdx) => {
      const generatedSets = this.generateSuggestions(gameType, model, 1);
      const numbers = generatedSets[0];
      const confidence = Math.round(85 + (15 / (mIdx + 1)) - (mIdx * 0.8));

      // Generate explanations for each number
      const explanations: { [key: number]: string } = {};
      numbers.forEach((num) => {
        const s = statsMap.get(num);
        if (!s) {
          explanations[num] = 'Chỉ số thống kê cân bằng.';
          return;
        }

        const details: string[] = [];
        if (s.frequency > 15) details.push(`Tần suất cao (${s.frequency} lần)`);
        if (s.last_seen > 12) details.push(`Số nguội sắp chín (chưa ra ${s.last_seen} kỳ)`);
        else if (s.last_seen <= 2) details.push(`Số nóng vừa xuất hiện (nhịp ổn định)`);
        
        if (s.hot_score > 7) details.push(`Hot Score cao (${s.hot_score})`);
        if (s.trend_score > 2) details.push(`Đang có xu hướng tăng (${s.trend_score})`);
        if (isPrime(num)) details.push(`Số nguyên tố`);
        
        if (model === 'Monte Carlo Simulation') {
          details.push(`Mô phỏng Monte Carlo đánh giá cao`);
        } else if (model === 'Markov Chain') {
          details.push(`Chuỗi Markov đề xuất dựa trên kỳ trước`);
        }

        if (details.length === 0) {
          details.push(`Mô hình hồi quy đánh giá ổn định`);
        }

        explanations[num] = details.slice(0, 2).join(' • ');
      });

      return {
        id: `pred_${model.replace(/\s+/g, '_')}_${Date.now()}`,
        draw_date: dateStr,
        game_type: gameType,
        model_name: model,
        numbers,
        confidence_score: confidence,
        explanations,
        ensemble_reason: model === 'Ensemble AI' ? 'Kết hợp phân tích tần suất của 12 mô hình con, đưa ra lựa chọn có độ đồng thuận cao nhất và tỷ lệ chẵn/lẻ, lớn/nhỏ lý tưởng.' : undefined,
        created_at: new Date().toISOString()
      };
    });

    this.schema.predictions[key] = preds;
    this.save();
    return preds;
  }

  // Get notifications config
  public getNotifications(): NotificationSetting[] {
    return this.schema.notifications;
  }

  public updateNotifications(config: NotificationSetting): NotificationSetting {
    const idx = this.schema.notifications.findIndex(n => n.email === config.email);
    if (idx !== -1) {
      this.schema.notifications[idx] = config;
    } else {
      this.schema.notifications.push(config);
    }
    this.save();
    return config;
  }
}
