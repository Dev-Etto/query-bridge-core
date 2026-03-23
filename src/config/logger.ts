import { DateTime } from 'luxon';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

class Logger {
  private level: LogLevel = LogLevel.DEBUG;

  private format(level: string, message: string, ...args: unknown[]) {
    const timestamp = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss');
    const formattedArgs = args.length ? ` | ${JSON.stringify(args)}` : '';
    return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
  }

  public debug(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.DEBUG) console.debug(this.format('DEBUG', message, ...args));
  }

  public info(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.INFO) console.info(this.format('INFO', message, ...args));
  }

  public warn(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.WARN) console.warn(this.format('WARN', message, ...args));
  }

  public error(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.ERROR) console.error(this.format('ERROR', message, ...args));
  }

  public fatal(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.FATAL) console.error(this.format('FATAL', message, ...args));
  }

  public trace(message: string, ...args: unknown[]) {
    this.debug(message, ...args);
  }

  public child() {
    return this;
  }
}

export const logger = new Logger();
