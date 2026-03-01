const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
type LogLevel = typeof LOG_LEVELS[number];

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(currentLevel);
}

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()} ${message}${metaStr}`;
}

export const logger = {
    debug: (msg: string, meta?: Record<string, unknown>) => {
        if (shouldLog('debug')) console.debug(formatMessage('debug', msg, meta));
    },
    info: (msg: string, meta?: Record<string, unknown>) => {
        if (shouldLog('info')) console.info(formatMessage('info', msg, meta));
    },
    warn: (msg: string, meta?: Record<string, unknown>) => {
        if (shouldLog('warn')) console.warn(formatMessage('warn', msg, meta));
    },
    error: (msg: string, meta?: Record<string, unknown>) => {
        if (shouldLog('error')) console.error(formatMessage('error', msg, meta));
    },
};
