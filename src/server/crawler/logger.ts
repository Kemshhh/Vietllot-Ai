/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class Logger {
  public static info(message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] [${timestamp}] ${message}`, ...args);
  }

  public static error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] [${timestamp}] ${message}`, error || '');
  }

  public static warn(message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] [${timestamp}] ${message}`, ...args);
  }
}
