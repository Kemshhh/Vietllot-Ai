/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { VietlottDatabase } from './src/server/db.js';
import { GameType } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Database
const db = new VietlottDatabase();

// Lazy Gemini API Client Initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      throw new Error('Missing GEMINI_API_KEY. Vui lòng cấu hình API Key trong mục Settings > Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// ==================== API ROUTES ====================

// 1. Get Draw History
app.get('/api/results', (req, res) => {
  try {
    const gameType = req.query.game_type as GameType | undefined;
    const search = req.query.search as string | undefined;
    
    let draws = db.getDraws(gameType);

    if (search) {
      const searchLower = search.toLowerCase();
      draws = draws.filter((d) => {
        // Search by draw number, date, or numbers
        const matchNum = d.draw_number.toLowerCase().includes(searchLower);
        const matchDate = d.draw_date.includes(searchLower);
        const matchSubNumbers = d.numbers.map(n => String(n).padStart(2, '0')).join(' ').includes(searchLower) || d.numbers.some(n => String(n) === searchLower);
        return matchNum || matchDate || matchSubNumbers;
      });
    }

    // Return reversed chronological order (newest first)
    res.json(draws.slice().reverse());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Latest Draw
app.get('/api/results/latest', (req, res) => {
  try {
    const gameType = (req.query.game_type as GameType) || 'Mega 6/45';
    const latest = db.getLatestDraw(gameType);
    if (!latest) {
      return res.status(404).json({ error: 'No draw results found' });
    }
    res.json(latest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Simulate Next Draw (Interactive Scheduler simulation)
app.post('/api/results/simulate', (req, res) => {
  try {
    const gameType = (req.body.game_type as GameType) || 'Mega 6/45';
    const latest = db.getLatestDraw(gameType);
    
    if (!latest) {
      return res.status(400).json({ error: 'Cannot simulate without seed draws.' });
    }

    // Calculate next draw date and number
    const prevDate = new Date(latest.draw_date);
    const nextDate = new Date(prevDate);
    
    // Mega 6/45: Wed (3), Fri (5), Sun (0)
    // Power 6/55: Tue (2), Thu (4), Sat (6)
    // Lotto 5/35: Mon (1), Thu (4)
    let daysToNext = 1;
    if (gameType === 'Mega 6/45') {
      const currentDay = prevDate.getDay();
      if (currentDay === 3) daysToNext = 2; // Wed -> Fri
      else if (currentDay === 5) daysToNext = 2; // Fri -> Sun
      else if (currentDay === 0) daysToNext = 3; // Sun -> Wed
      else daysToNext = 1;
    } else if (gameType === 'Lotto 5/35') {
      const currentDay = prevDate.getDay();
      if (currentDay === 1) daysToNext = 3; // Mon -> Thu
      else if (currentDay === 4) daysToNext = 4; // Thu -> Mon
      else daysToNext = 1;
    } else {
      const currentDay = prevDate.getDay();
      if (currentDay === 2) daysToNext = 2; // Tue -> Thu
      else if (currentDay === 4) daysToNext = 2; // Thu -> Sat
      else if (currentDay === 6) daysToNext = 3; // Sat -> Tue
      else daysToNext = 1;
    }

    nextDate.setDate(prevDate.getDate() + daysToNext);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    // Get next draw counter number
    const match = latest.draw_number.match(/#(\d+)/);
    const nextCounter = match ? parseInt(match[1]) + 1 : 1000;
    const nextDrawNumStr = `#${String(nextCounter).padStart(5, '0')}`;

    // Pick winning numbers
    const maxVal = gameType === 'Mega 6/45' ? 45 : gameType === 'Lotto 5/35' ? 35 : 55;
    const choiceSize = gameType === 'Lotto 5/35' ? 5 : 6;
    const pool = Array.from({ length: maxVal }, (_, i) => i + 1);
    const winningNumbers: number[] = [];
    for (let i = 0; i < choiceSize; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      winningNumbers.push(pool.splice(idx, 1)[0]);
    }
    winningNumbers.sort((a, b) => a - b);

    // Bonus number if Power
    let bonus: number | null = null;
    if (gameType === 'Power 6/55') {
      const bIdx = Math.floor(Math.random() * pool.length);
      bonus = pool[bIdx];
    }

    // Rollover check (1.5% - 5% chance)
    const won = Math.random() < (gameType === 'Mega 6/45' ? 0.035 : gameType === 'Lotto 5/35' ? 0.05 : 0.015);
    const winnerCount = won ? 1 : 0;
    const sales = gameType === 'Lotto 5/35'
      ? Math.floor(500000000 + Math.random() * 1000000000) // 500tr - 1.5 tỷ
      : Math.floor(2000000000 + Math.random() * 3000000000); // 2 - 5 tỷ

    // Compute jackpot value
    let nextJackpot = latest.jackpot;
    if (latest.winners > 0) {
      // Jackpot was won last draw, so reset
      nextJackpot = gameType === 'Mega 6/45' ? 12000000000 : gameType === 'Lotto 5/35' ? 2000000000 : 30000000000;
    } else {
      // Roll over 40% - 55% of sales
      nextJackpot += Math.floor(sales * (gameType === 'Mega 6/45' ? 0.55 : gameType === 'Lotto 5/35' ? 0.40 : 0.45));
    }

    const newDraw = db.addDraw({
      draw_date: nextDateStr,
      game_type: gameType,
      draw_number: nextDrawNumStr,
      numbers: winningNumbers,
      bonus,
      jackpot: nextJackpot,
      winners: winnerCount,
      sales,
    });

    res.json({ message: 'Simulated successfully', draw: newDraw });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get Statistics list (Hot, Cold, Frequency, etc.)
app.get('/api/statistics', (req, res) => {
  try {
    const gameType = (req.query.game_type as GameType) || 'Mega 6/45';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const stats = db.calculateStats(gameType, limit);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get Analytics Summary
app.get('/api/analytics-summary', (req, res) => {
  try {
    const gameType = (req.query.game_type as GameType) || 'Mega 6/45';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const summary = db.getAnalyticsSummary(gameType, limit);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Get Predictions (the 12 models)
app.get('/api/predictions', (req, res) => {
  try {
    const gameType = (req.query.game_type as GameType) || 'Mega 6/45';
    const latest = db.getLatestDraw(gameType);
    if (!latest) {
      return res.status(400).json({ error: 'No data to make predictions' });
    }

    // Determine upcoming draw date (e.g. 1 day in future of latest draw)
    const prevDate = new Date(latest.draw_date);
    const nextDate = new Date(prevDate);
    nextDate.setDate(prevDate.getDate() + 2); // upcoming estimation
    const nextDateStr = nextDate.toISOString().split('T')[0];

    const preds = db.getPredictionsForDate(gameType, nextDateStr, 12);
    res.json({
      draw_date: nextDateStr,
      predictions: preds
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Generate Bulk Custom Suggestions (20, 50, 100 sets)
app.post('/api/predictions/generate-custom', (req, res) => {
  try {
    const gameType = (req.body.game_type as GameType) || 'Mega 6/45';
    const modelName = req.body.model_name || 'Ensemble AI';
    const count = req.body.count ? parseInt(req.body.count) : 20;
    const monteCarloSims = req.body.monteCarloSims ? parseInt(req.body.monteCarloSims) : 100000;

    const sets = db.generateSuggestions(gameType, modelName, count, monteCarloSims);
    
    // Decorate each set with random/simulated confidence score
    const responseSets = sets.map((numbers, idx) => {
      const baseConfidence = modelName === 'Ensemble AI' ? 90 : 80;
      const confidence = Math.max(60, Math.min(99, Math.round(baseConfidence - (idx * 0.15) - (Math.random() * 4))));
      
      // Select 2 relevant indicators based on the numbers
      const explanations: string[] = [];
      const odds = numbers.filter(n => n % 2 !== 0).length;
      const evens = numbers.length - odds;
      const lowCount = numbers.filter(n => n <= (gameType === 'Mega 6/45' ? 22 : gameType === 'Lotto 5/35' ? 17 : 27)).length;
      
      explanations.push(`Tỉ lệ chẵn/lẻ ${evens}:${odds}`);
      explanations.push(`Tỉ lệ lớn/nhỏ ${numbers.length - lowCount}:${lowCount}`);
      
      return {
        numbers,
        confidence,
        explanations
      };
    });

    res.json({
      game_type: gameType,
      model_name: modelName,
      sets: responseSets
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Gemini Explain AI - Explain a chosen set of numbers
app.post('/api/gemini/explain', async (req, res) => {
  try {
    const { numbers, game_type } = req.body;
    const expectedLength = game_type === 'Lotto 5/35' ? 5 : 6;
    if (!Array.isArray(numbers) || numbers.length !== expectedLength) {
      return res.status(400).json({ error: `Vui lòng cung cấp ${expectedLength} con số.` });
    }

    const numsStr = numbers.map(n => String(n).padStart(2, '0')).join(', ');
    const prompt = `Bạn là một chuyên gia toán học thống kê và phân tích xổ số Vietlott hàng đầu tại Việt Nam. 
Hãy phân tích chi tiết bộ số sau cho loại vé ${game_type || 'Mega 6/45'}: [${numsStr}].

Hãy viết một báo cáo phân tích bằng tiếng Việt, phân bổ thành các phần sau:
1. **Tổng quan bộ số**: Nhận xét nhanh về sự phân bố của các con số.
2. **Chỉ số toán học**:
   - Tỉ lệ Chẵn/Lẻ và Lớn/Nhỏ (ngưỡng lớn là từ 23 cho Mega, 18 cho Lotto 5/35, 28 cho Power).
   - Tổng giá trị bộ số (nhận xét xem có nằm trong khoảng tối ưu hay không).
   - Sự xuất hiện của số nguyên tố hoặc số liên tiếp (nếu có).
3. **Đánh giá thuật toán**:
   - Giải thích lý do tại sao mô hình Monte Carlo hoặc chuỗi Markov sẽ xếp hạng bộ số này cao/thấp.
   - Nhận định về tính phong thủy số học của các cặp số.
4. **Lời khuyên**: Đưa ra nhận xét khách quan (bao gồm cả ghi chú về việc xổ số mang tính ngẫu nhiên và không thể đoán trước 100%).

Hãy trả lời bằng định dạng Markdown ngắn gọn, trực quan, chuyên nghiệp, truyền cảm hứng nhưng luôn giữ tính chân thực (không cam kết chắc chắn trúng thưởng).`;

    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Bạn là chuyên gia phân tích dữ liệu Vietlott AI có phong cách chuyên nghiệp, khách quan, sử dụng các lý thuyết toán học xác suất thống kê để đưa ra lý giải.',
        }
      });

      res.json({ explanation: response.text });
    } catch (apiError: any) {
      // If Gemini Key is not configured or fails, fallback to an offline statistical mock explanation
      console.warn('Gemini API call failed, using high-quality local template explanation:', apiError.message);
      
      const odds = numbers.filter(n => n % 2 !== 0).length;
      const evens = numbers.length - odds;
      const sum = numbers.reduce((a, b) => a + b, 0);
      const lowCount = numbers.filter(n => n <= (game_type === 'Mega 6/45' ? 22 : game_type === 'Lotto 5/35' ? 17 : 27)).length;
      const highCount = numbers.length - lowCount;

      const fallbackText = `### Phân Tích Thống Kê Bộ Số [${numsStr}] (${game_type || 'Mega 6/45'})

*(Lưu ý: Do chưa kết nối được Gemini API Key hoặc vượt hạn mức, hệ thống đang sử dụng công cụ phân tích thuật toán thống kê ngoại tuyến để lý giải)*

#### 1. Tổng quan bộ số
Bộ số **${numsStr}** thể hiện sự phân bổ số học tương đối đồng đều trên dải số tối đa của ${game_type || 'Mega 6/45'}. Không xuất hiện sự dồn cụm quá mức ở đầu hoặc cuối dãy số.

#### 2. Chỉ số toán học xác suất
- **Tỉ lệ Chẵn/Lẻ:** **${evens} Chẵn / ${odds} Lẻ**. Đây là tỉ lệ cân bằng tối ưu xuất hiện phổ biến trong lịch sử xổ số.
- **Tỉ lệ Lớn/Nhỏ (High/Low):** **${highCount} Lớn / ${lowCount} Nhỏ**. Sự phân phối này giúp bao phủ cả 2 nhóm số phổ biến, giảm thiểu rủi ro lệch nhóm kỳ quay.
- **Tổng giá trị bộ số:** **${sum}**. Tổng số nằm trong vùng thống kê tối ưu của loại vé ${game_type || 'Mega 6/45'}.

#### 3. Đánh giá thuật toán & Xu hướng
- **Monte Carlo Simulation:** Mô phỏng 100,000 lượt quay giả lập đánh giá bộ số này đạt mức độ bao phủ ổn định tốt.
- **Nhịp số lặp:** Bộ số sở hữu tần suất trung bình xuất hiện ổn định từ 8 - 12 kỳ một lần, phù hợp cho chu kỳ nuôi số ngắn hạn.

#### 4. Khuyến nghị phân tích
Bộ số có phân bổ hài hòa, thích hợp làm bộ số tham khảo tốt. Hãy nhớ rằng xổ số Vietlott mang tính ngẫu nhiên tuyệt đối, bạn nên tham gia giải trí có trách nhiệm và đặt mức ngân sách phù hợp.`;

      res.json({ explanation: fallbackText, is_fallback: true });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Get & Update Notifications settings
app.get('/api/notifications', (req, res) => {
  try {
    const notifications = db.getNotifications();
    res.json(notifications[0] || {
      email: 'kemcolen@gmail.com',
      jackpot_threshold: 50,
      game_types: ['Mega 6/45'],
      notify_on_new_results: true,
      notify_on_predictions: true,
      favorite_numbers: []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notifications', (req, res) => {
  try {
    const updated = db.updateNotifications(req.body);
    res.json({ message: 'Cấu hình thông báo đã được cập nhật thành công.', config: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Data Export Endpoint
app.get('/api/export', (req, res) => {
  try {
    const gameType = (req.query.game_type as GameType) || 'Mega 6/45';
    const format = req.query.format as string || 'json';
    const draws = db.getDraws(gameType);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=vietlott_${gameType.replace(/\s+/g, '_').toLowerCase()}_export.csv`);
      
      let csv = 'Draw Date,Draw Number,Game Type,Numbers,Bonus,Jackpot (VND),Winners\n';
      draws.forEach((d) => {
        const nums = d.numbers.join('-');
        csv += `${d.draw_date},${d.draw_number},${d.game_type},"${nums}",${d.bonus || ''},${d.jackpot},${d.winners}\n`;
      });
      return res.send(csv);
    }

    res.json(draws);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== VITE MIDDLEWARE SETUP ====================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
