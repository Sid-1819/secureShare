/** Rate limiting */
export const RATE_LIMIT_WINDOW_SEC = 60;
export const RATE_LIMIT_MAX_REQUESTS = 30;
export const RATE_LIMIT_KEY_PREFIX = 'ratelimit:ip:';

/** Note cache */
export const CACHE_KEY_PREFIX = 'note:';
export const CACHE_MAX_TTL_SEC = 3600; // 1 hour
