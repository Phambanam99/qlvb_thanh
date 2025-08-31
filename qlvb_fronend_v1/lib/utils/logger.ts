export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LoggerConfig {
  level: LogLevel;
  enableTimestamp: boolean;
  enableColors: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level:
        process.env.NODE_ENV === "production" ? LogLevel.ERROR : LogLevel.DEBUG,
      enableTimestamp: true,
      enableColors: process.env.NODE_ENV !== "production",
      ...config,
    };
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = this.config.enableTimestamp
      ? `[${new Date().toISOString()}] `
      : "";

    const dataStr = data ? ` ${JSON.stringify(data)}` : "";
    return `${timestamp}[${level}] ${message}${dataStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage("DEBUG", message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage("INFO", message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage("WARN", message, data));
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage("ERROR", message, error));
    }
  }

  api(method: string, url: string, data?: any): void {
    this.debug(`API ${method.toUpperCase()} ${url}`, data);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for creating custom loggers
export { Logger };
