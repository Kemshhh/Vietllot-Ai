/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as cheerio from 'cheerio';
import { LotteryDraw, GameType } from '../../types.js';
import { Logger } from './logger.js';

export class Parser {
  /**
   * Parse Mega 6/45 HTML into LotteryDraw objects
   */
  public parseMega(html: string): Omit<LotteryDraw, 'id' | 'created_at'>[] {
    const draws: Omit<LotteryDraw, 'id' | 'created_at'>[] = [];
    try {
      const $ = cheerio.load(html);
      const boxes = $('div.box-ketqua');

      boxes.each((_, el) => {
        const titleText = $(el).find('h2').text().trim();
        // Check if this box is really for Mega 6/45
        if (!titleText.toLowerCase().includes('mega')) return;

        // Extract draw number
        const drawNumText = $(el).find('td.kmt').text().trim();
        const drawNumMatch = drawNumText.match(/#(\d+)/);
        const drawNum = drawNumMatch ? `#${drawNumMatch[1]}` : '';
        if (!drawNum) return;

        // Extract date from the KMT anchor link
        const kmtLink = $(el).find('td.kmt a').attr('href') || '';
        const dateMatch = kmtLink.match(/ngay-([\d-]+)/);
        let dateStr = '';
        if (dateMatch) {
          const dParts = dateMatch[1].split('-');
          if (dParts.length === 3) {
            dateStr = `${dParts[2]}-${dParts[1].padStart(2, '0')}-${dParts[0].padStart(2, '0')}`;
          }
        }

        // Fallback date from title if link doesn't match
        if (!dateStr) {
          const fallbackDateMatch = titleText.match(/ngày\s+([\d/]+)/i);
          if (fallbackDateMatch) {
            const dParts = fallbackDateMatch[1].split('/');
            if (dParts.length === 2) {
              const currentYear = new Date().getUTCFullYear();
              dateStr = `${currentYear}-${dParts[1].padStart(2, '0')}-${dParts[0].padStart(2, '0')}`;
            }
          }
        }

        if (!dateStr) {
          Logger.warn(`Could not extract date for Mega draw ${drawNum}`);
          return;
        }

        // Extract numbers
        const numbersText = $(el).find('td.megaresult em').text().trim();
        const numbers = numbersText
          .split(/\s+/)
          .map(Number)
          .filter((n) => !isNaN(n) && n > 0)
          .sort((a, b) => a - b);

        if (numbers.length !== 6) {
          Logger.warn(`Invalid number count for Mega draw ${drawNum}: ${numbers.length}`);
          return;
        }

        // Extract jackpot and winners from table.trunggiai
        let jackpot = 12000000000; // Default min 12 Billion VND
        let winners = 0;
        const tablePrize = $(el).find('table.trunggiai');
        if (tablePrize.length > 0) {
          const jackpotRow = tablePrize.find('tr').eq(2);
          if (jackpotRow.length > 0) {
            const cells = jackpotRow.find('td');
            if (cells.length >= 4) {
              const winnersText = $(cells[2]).text().trim();
              const prizeText = $(cells[3]).text().trim().replace(/[^0-9]/g, '');
              winners = parseInt(winnersText, 10) || 0;
              jackpot = parseInt(prizeText, 10) || jackpot;
            }
          }
        }

        // Generate sales revenue (estimated or mock if not available, usually ~45% of jackpot change)
        const sales = Math.floor(jackpot * 2.2);

        draws.push({
          draw_date: dateStr,
          game_type: 'Mega 6/45',
          draw_number: drawNum,
          numbers,
          jackpot,
          winners,
          sales,
        });
      });
    } catch (error) {
      Logger.error('Error parsing Mega HTML', error);
    }
    return draws;
  }

  /**
   * Parse Power 6/55 HTML into LotteryDraw objects
   */
  public parsePower(html: string): Omit<LotteryDraw, 'id' | 'created_at'>[] {
    const draws: Omit<LotteryDraw, 'id' | 'created_at'>[] = [];
    try {
      const $ = cheerio.load(html);
      const boxes = $('div.box-ketqua');

      boxes.each((_, el) => {
        const titleText = $(el).find('h2').text().trim();
        // Check if this box is really for Power 6/55
        if (!titleText.toLowerCase().includes('power')) return;

        // Extract draw number
        const drawNumText = $(el).find('td.kmt').text().trim();
        const drawNumMatch = drawNumText.match(/#(\d+)/);
        const drawNum = drawNumMatch ? `#${drawNumMatch[1]}` : '';
        if (!drawNum) return;

        // Extract date from the KMT anchor link
        const kmtLink = $(el).find('td.kmt a').attr('href') || '';
        const dateMatch = kmtLink.match(/ngay-([\d-]+)/);
        let dateStr = '';
        if (dateMatch) {
          const dParts = dateMatch[1].split('-');
          if (dParts.length === 3) {
            dateStr = `${dParts[2]}-${dParts[1].padStart(2, '0')}-${dParts[0].padStart(2, '0')}`;
          }
        }

        // Fallback date from title if link doesn't match
        if (!dateStr) {
          const fallbackDateMatch = titleText.match(/ngày\s+([\d/]+)/i);
          if (fallbackDateMatch) {
            const dParts = fallbackDateMatch[1].split('/');
            if (dParts.length === 2) {
              const currentYear = new Date().getUTCFullYear();
              dateStr = `${currentYear}-${dParts[1].padStart(2, '0')}-${dParts[0].padStart(2, '0')}`;
            }
          }
        }

        if (!dateStr) {
          Logger.warn(`Could not extract date for Power draw ${drawNum}`);
          return;
        }

        // Extract main numbers
        const numbersText = $(el).find('td.megaresult em').text().trim();
        const numbers = numbersText
          .split(/\s+/)
          .map(Number)
          .filter((n) => !isNaN(n) && n > 0)
          .sort((a, b) => a - b);

        if (numbers.length !== 6) {
          Logger.warn(`Invalid number count for Power draw ${drawNum}: ${numbers.length}`);
          return;
        }

        // Extract JP2 (bonus ball)
        const jp2Text = $(el).find('tr.jp2 td.megaresult').text().trim();
        const bonus = parseInt(jp2Text, 10) || null;

        // Extract jackpot and winners from table.trunggiai
        let jackpot = 30000000000; // Default min 30 Billion VND
        let winners = 0;
        const tablePrize = $(el).find('table.trunggiai');
        if (tablePrize.length > 0) {
          const jackpotRow = tablePrize.find('tr').eq(2);
          if (jackpotRow.length > 0) {
            const cells = jackpotRow.find('td');
            if (cells.length >= 4) {
              const winnersText = $(cells[2]).text().trim();
              const prizeText = $(cells[3]).text().trim().replace(/[^0-9]/g, '');
              winners = parseInt(winnersText, 10) || 0;
              jackpot = parseInt(prizeText, 10) || jackpot;
            }
          }
        }

        // Generate sales revenue (estimated)
        const sales = Math.floor(jackpot * 2.2);

        draws.push({
          draw_date: dateStr,
          game_type: 'Power 6/55',
          draw_number: drawNum,
          numbers,
          bonus,
          jackpot,
          winners,
          sales,
        });
      });
    } catch (error) {
      Logger.error('Error parsing Power HTML', error);
    }
    return draws;
  }
}
