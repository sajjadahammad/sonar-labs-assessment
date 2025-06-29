import * as Sentry from '@sentry/nextjs';
import { StatsD } from 'node-statsd';
import config from './config';
import logger from './logger';

// Initialize Sentry
if (config.monitoring.sentryDsn) {
  Sentry.init({
    dsn: config.monitoring.sentryDsn,
    environment: config.env,
    tracesSampleRate: config.env === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Filter out sensitive data
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    },
  });
}

// Initialize StatsD for DataDog
const statsD = new StatsD({
  host: 'localhost',
  port: 8125,
  prefix: 'nextjs_app.',
});

export class MonitoringService {
  static captureException(error: Error, context?: Record<string, any>) {
    logger.error('Exception captured', { error: error.message, stack: error.stack, ...context });
    
    if (config.monitoring.sentryDsn) {
      Sentry.captureException(error, { extra: context });
    }
  }
  
  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
    logger[level](message, context);
    
    if (config.monitoring.sentryDsn) {
      Sentry.captureMessage(message, level as any);
    }
  }
  
  static timing(metric: string, duration: number, tags?: string[]) {
    statsD.timing(metric, duration, tags);
    logger.debug(`Timing metric: ${metric}`, { duration, tags });
  }
  
  static increment(metric: string, count: number = 1, tags?: string[]) {
    statsD.increment(metric, count, tags);
    logger.debug(`Counter metric: ${metric}`, { count, tags });
  }
  
  static gauge(metric: string, value: number, tags?: string[]) {
    statsD.gauge(metric, value, tags);
    logger.debug(`Gauge metric: ${metric}`, { value, tags });
  }
}