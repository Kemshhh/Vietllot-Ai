/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Crawler } from './crawler.js';
import { Parser } from './parser.js';
import { Logger } from './logger.js';
import { VietlottDatabase } from '../db.js';
import { GameType } from '../../types.js';

export interface SyncResult {
  success: boolean;
  game_type: GameType;
  total_scraped: number;
  upserted: number;
  error?: string;
}

export class SyncService {
  private crawler: Crawler;
  private parser: Parser;

  constructor() {
    this.crawler = new Crawler();
    this.parser = new Parser();
  }

  /**
   * Run sync process for Mega and Power
   */
  public async syncAll(db: VietlottDatabase): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    // Sync Mega 6/45
    try {
      const megaResult = await this.syncMega(db);
      results.push(megaResult);
    } catch (e: any) {
      Logger.error('Failed to sync Mega 6/45', e);
      results.push({
        success: false,
        game_type: 'Mega 6/45',
        total_scraped: 0,
        upserted: 0,
        error: e.message || String(e),
      });
    }

    // Sync Power 6/55
    try {
      const powerResult = await this.syncPower(db);
      results.push(powerResult);
    } catch (e: any) {
      Logger.error('Failed to sync Power 6/55', e);
      results.push({
        success: false,
        game_type: 'Power 6/55',
        total_scraped: 0,
        upserted: 0,
        error: e.message || String(e),
      });
    }

    return results;
  }

  private async syncMega(db: VietlottDatabase): Promise<SyncResult> {
    Logger.info('Starting sync process for Mega 6/45...');
    const url = 'https://xskt.com.vn/xsmega645';
    const html = await this.crawler.fetchHtml(url);
    const parsedDraws = this.parser.parseMega(html);

    Logger.info(`Scraped ${parsedDraws.length} Mega 6/45 draws from web.`);
    let upsertedCount = 0;

    for (const draw of parsedDraws) {
      const numericPart = draw.draw_number.replace('#', '').trim();
      const id = `mega_${numericPart}`;
      
      db.upsertRealDraw({
        ...draw,
        id,
      });
      upsertedCount++;
    }

    Logger.info(`Successfully synchronized ${upsertedCount} Mega 6/45 draws.`);
    return {
      success: true,
      game_type: 'Mega 6/45',
      total_scraped: parsedDraws.length,
      upserted: upsertedCount,
    };
  }

  private async syncPower(db: VietlottDatabase): Promise<SyncResult> {
    Logger.info('Starting sync process for Power 6/55...');
    const url = 'https://xskt.com.vn/xspower';
    const html = await this.crawler.fetchHtml(url);
    const parsedDraws = this.parser.parsePower(html);

    Logger.info(`Scraped ${parsedDraws.length} Power 6/55 draws from web.`);
    let upsertedCount = 0;

    for (const draw of parsedDraws) {
      const numericPart = draw.draw_number.replace('#', '').trim();
      const id = `power_${numericPart}`;
      
      db.upsertRealDraw({
        ...draw,
        id,
      });
      upsertedCount++;
    }

    Logger.info(`Successfully synchronized ${upsertedCount} Power 6/55 draws.`);
    return {
      success: true,
      game_type: 'Power 6/55',
      total_scraped: parsedDraws.length,
      upserted: upsertedCount,
    };
  }
}
