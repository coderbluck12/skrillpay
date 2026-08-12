import rateLimit from 'express-rate-limit';

/**
 * Rate limiter specifically for authentication endpoints (/auth/login, /auth/register, etc.)
 * Prevents credential stuffing, brute-forcing, and email spamming.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 50 : 10, // 10 requests per 15 minutes per IP (50 during testing)
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  statusCode: 429,
  message: {
    status: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  skip: (req) => {
    // Skip rate limiting if header explicitly sets bypass in test environments
    return process.env.NODE_ENV === 'test' && req.headers['x-skip-rate-limit'] === 'true';
  },
});

/**
 * Rate limiter for general API endpoints (/v1/*)
 * Protects against resource exhaustion and denial of service.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 200 : 100, // 100 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    status: false,
    message: 'Too many API requests. Please slow down and try again later.',
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'test' && req.headers['x-skip-rate-limit'] === 'true';
  },
});
