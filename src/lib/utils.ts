/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameType } from '../types.js';

export function formatVND(value: number, short = false): string {
  if (short) {
    if (value >= 1e12) {
      return `${(value / 1e12).toFixed(1)} nghìn tỷ`;
    }
    if (value >= 1e9) {
      return `${(value / 1e9).toFixed(1).replace('.0', '')} tỷ`;
    }
    if (value >= 1e6) {
      return `${(value / 1e6).toFixed(1).replace('.0', '')} triệu`;
    }
  }
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

export interface WinCheckResult {
  matchCount: number;
  matchedNumbers: number[];
  hasBonus: boolean;
  prizeName: string;
  prizeValue: number;
}

export function checkWinningTicket(
  userNumbers: number[],
  winningNumbers: number[],
  gameType: GameType,
  bonusNumber?: number | null
): WinCheckResult {
  const matchedNumbers = userNumbers.filter((n) => winningNumbers.includes(n));
  const matchCount = matchedNumbers.length;
  
  let hasBonus = false;
  if (gameType === 'Power 6/55' && bonusNumber) {
    hasBonus = userNumbers.includes(bonusNumber);
  }

  let prizeName = 'Không trúng giải';
  let prizeValue = 0;

  if (gameType === 'Mega 6/45') {
    if (matchCount === 6) {
      prizeName = 'Giải Jackpot';
      prizeValue = -1; // -1 denotes Jackpot (which is dynamic)
    } else if (matchCount === 5) {
      prizeName = 'Giải Nhất';
      prizeValue = 10000000; // 10.000.000 VND
    } else if (matchCount === 4) {
      prizeName = 'Giải Nhì';
      prizeValue = 300000; // 300.000 VND
    } else if (matchCount === 3) {
      prizeName = 'Giải Ba';
      prizeValue = 30000; // 30.000 VND
    }
  } else if (gameType === 'Lotto 5/35') {
    if (matchCount === 5) {
      prizeName = 'Giải Jackpot';
      prizeValue = -1;
    } else if (matchCount === 4) {
      prizeName = 'Giải Nhất';
      prizeValue = 2000000; // 2.000.000 VND
    } else if (matchCount === 3) {
      prizeName = 'Giải Nhì';
      prizeValue = 150000; // 150.000 VND
    } else if (matchCount === 2) {
      prizeName = 'Giải Ba';
      prizeValue = 20000; // 20.000 VND
    }
  } else {
    // Power 6/55
    if (matchCount === 6) {
      prizeName = 'Giải Jackpot 1';
      prizeValue = -1; // Jackpot 1
    } else if (matchCount === 5 && hasBonus) {
      prizeName = 'Giải Jackpot 2';
      prizeValue = -2; // Jackpot 2
    } else if (matchCount === 5) {
      prizeName = 'Giải Nhất';
      prizeValue = 40000000; // 40.000.000 VND
    } else if (matchCount === 4) {
      prizeName = 'Giải Nhì';
      prizeValue = 500000; // 500.000 VND
    } else if (matchCount === 3) {
      prizeName = 'Giải Ba';
      prizeValue = 50000; // 50.000 VND
    }
  }

  return {
    matchCount,
    matchedNumbers,
    hasBonus,
    prizeName,
    prizeValue,
  };
}
