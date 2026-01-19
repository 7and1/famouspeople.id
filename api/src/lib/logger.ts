import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: 'famouspeople-api',
    version: process.env.npm_package_version,
  },
});

export default logger;
