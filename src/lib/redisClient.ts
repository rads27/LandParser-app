let enabled = false;
let pub: any = null;
let sub: any = null;

try {
  // Only initialize Redis if an explicit URL is provided. Avoid auto-connecting to localhost
  // when the developer doesn't have Redis running.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const IORedis = require('ioredis');
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_URI || '';

  if (redisUrl) {
    pub = new IORedis(redisUrl);
    sub = new IORedis(redisUrl);

    const disableRedis = (why: any) => {
      try {
        console.warn('[redisClient] Disabling Redis due to error:', why && why.message ? why.message : why);
        enabled = false;
        if (pub) {
          try { pub.disconnect(); } catch (_) {}
          pub = null;
        }
        if (sub) {
          try { sub.disconnect(); } catch (_) {}
          sub = null;
        }
      } catch (_) {}
    };

    // Attach safe error handlers so unhandled errors don't crash the process
    pub.on('error', (err: any) => disableRedis(err));
    sub.on('error', (err: any) => disableRedis(err));

    // If both clients are created, mark enabled
    enabled = true;
    console.log('[redisClient] Redis client initialized (URL provided)');
  } else {
    // No explicit URL: do not attempt to connect to Redis. Stay disabled.
    enabled = false;
    // console.log('[redisClient] REDIS_URL not set; skipping Redis initialization');
  }
} catch (err) {
  // ioredis not installed or other init error: remain disabled
  enabled = false;
  console.warn('[redisClient] ioredis not available or failed to initialize');
}

export { enabled, pub, sub };
