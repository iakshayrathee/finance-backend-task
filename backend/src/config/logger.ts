import winston from 'winston';
import { env } from './env';

const { combine, timestamp, json, colorize, simple } = winston.format;

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format:
    env.NODE_ENV === 'production'
      ? combine(timestamp(), json())
      : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), simple()),
  transports:
    env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
          }),
        ]
      : [new winston.transports.Console()],
  silent: env.NODE_ENV === 'test',
});

// Morgan stream writes HTTP logs into Winston at 'http' level
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;
