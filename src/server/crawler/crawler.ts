/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fetch from 'node-fetch';
import { withRetry } from './retry.js';
import { Logger } from './logger.js';

export class Crawler {
  /**
   * Fetch raw HTML from a given URL with headers to avoid blocking
   */
  public async fetchHtml(url: string): Promise<string> {
    return withRetry(async () => {
      Logger.info(`Crawling raw HTML from: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8'
        },
        timeout: 10000 // 10s timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const html = await response.text();
      if (!html || html.trim().length === 0) {
        throw new Error('Received empty HTML content');
      }

      return html;
    });
  }
}
