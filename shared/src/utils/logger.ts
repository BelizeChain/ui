/**
 * BelizeChain Shared Logger Utility
 * 
 * Provides environment-aware logging for all UI applications
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;
  private appName: string;

  constructor(appName: string = 'BelizeChain') {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.appName = appName;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${this.appName}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  /**
   * Log error messages (always logged)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      ...context,
    } : context;

    console.error(this.formatMessage('error', message, errorDetails));

    // In production, you would send this to a monitoring service
    // Example: Sentry, Datadog, etc.
    if (!this.isDevelopment) {
      this.sendToMonitoring(message, error, errorDetails);
    }
  }

  /**
   * Send errors to monitoring service (production)
   */
  private sendToMonitoring(
    _message: string,
    _error?: Error | unknown,
    _context?: LogContext
  ): void {
        // Future: Integrate with monitoring service (Grafana/Prometheus)
    // For production: Send to centralized logging backend
  }

  /**
   * Create a child logger with a specific context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.appName);
    const originalError = childLogger.error.bind(childLogger);
    const originalWarn = childLogger.warn.bind(childLogger);
    const originalInfo = childLogger.info.bind(childLogger);
    const originalDebug = childLogger.debug.bind(childLogger);

    childLogger.error = (msg, err?, ctx?) => originalError(msg, err, { ...context, ...ctx });
    childLogger.warn = (msg, ctx?) => originalWarn(msg, { ...context, ...ctx });
    childLogger.info = (msg, ctx?) => originalInfo(msg, { ...context, ...ctx });
    childLogger.debug = (msg, ctx?) => originalDebug(msg, { ...context, ...ctx });

    return childLogger;
  }
}

// Export singleton instances for each app
export const explorerLogger = new Logger('KijkaExplorer');
export const walletLogger = new Logger('MayaWallet');
export const businessLogger = new Logger('PekBusiness');
export const portalLogger = new Logger('BlueHolePortal');
export const validatorLogger = new Logger('GubidaValidator');
export const governanceLogger = new Logger('WinikGovernance');

// Default logger
export const logger = new Logger('BelizeChain');

export default logger;
