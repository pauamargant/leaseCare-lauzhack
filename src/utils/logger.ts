export class Logger {
  private static instance: Logger;
  private logs: Array<{ timestamp: Date; level: string; message: string; data?: any }> = [];

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: string, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date(),
      level,
      message,
      data
    };
    this.logs.push(logEntry);
    
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      api: '🔌'
    }[level] || '📝';

    console.log(`${emoji} [${level.toUpperCase()}] ${message}`, data || '');
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  success(message: string, data?: any) {
    this.log('success', message, data);
  }

  warning(message: string, data?: any) {
    this.log('warning', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  api(message: string, data?: any) {
    this.log('api', message, data);
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export default Logger.getInstance();
