import { blue, cyan, green, magenta, red, yellow } from 'chalk';

export interface ILogger {
  log(message: string, ...meta: unknown[]): void;
  error(message: string, trace?: unknown, ...meta: unknown[]): void;
  warn(message: string, ...meta: unknown[]): void;
  debug(message: string, ...meta: unknown[]): void;
}
export class Logger implements ILogger {
  private _enable: boolean;

  public static createLogger(ctx?: string) {
    return new Logger(ctx);
  }

  public constructor(private context?: string) {}

  public enable(enable: boolean) {
    this._enable = enable;
  }

  protected logFormat(type, color, ...msg: any[]) {
    if (!this.context) {
      return color(`${type}: ${msg}`);
    }
    return color(`${type} - [${this.context}]: ${msg}`);
  }

  public trace(...msg: any[]) {
    if (!this._enable) {
      return;
    }
    // eslint-disable-next-line no-console
    console.trace(this.logFormat('TRACE', magenta, msg));
  }

  public debug(...msg: any[]) {
    if (!this._enable) {
      return;
    }
    // eslint-disable-next-line no-console
    console.debug(this.logFormat('DEBUG', cyan, msg));
  }

  public log(...msg: any[]) {
    if (!this._enable) {
      return;
    }
    // eslint-disable-next-line no-console
    console.log(this.logFormat('LOG', blue, msg, msg));
  }

  public info(...msg: any[]) {
    if (!this._enable) {
      return;
    }
    // eslint-disable-next-line no-console
    console.info(this.logFormat('INFO', green, msg));
  }

  public warn(...msg: any[]) {
    if (!this._enable) {
      return;
    }
    // eslint-disable-next-line no-console
    console.warn(this.logFormat('WARN', yellow, msg));
  }

  public error(...msg: any[]) {
    if (!this._enable) {
      return;
    }
    // eslint-disable-next-line no-console
    console.error(this.logFormat('ERROR', red, msg));
  }
}
