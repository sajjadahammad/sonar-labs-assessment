interface Config {
    env: 'development' | 'staging' | 'production';
    database: {
      url: string;
    };
    redis: {
      url: string;
    };
    api: {
      secretKey: string;
      baseUrl: string;
    };
    monitoring: {
      sentryDsn?: string;
      datadogApiKey?: string;
    };
    logging: {
      level: 'debug' | 'info' | 'warn' | 'error';
    };
  }
  
  const config: Config = {
    env: (process.env.NEXT_PUBLIC_APP_ENV as Config['env']) || 'development',
    database: {
      url: process.env.DATABASE_URL!,
    },
    redis: {
      url: process.env.REDIS_URL!,
    },
    api: {
      secretKey: process.env.API_SECRET_KEY!,
      baseUrl: process.env.NEXT_PUBLIC_API_URL!,
    },
    monitoring: {
      sentryDsn: process.env.SENTRY_DSN,
      datadogApiKey: process.env.DATADOG_API_KEY,
    },
    logging: {
      level: (process.env.LOG_LEVEL as Config['logging']['level']) || 'info',
    },
  };
  
  // Validate required environment variables
  const requiredEnvVars = ['DATABASE_URL', 'API_SECRET_KEY'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
  
  export default config;