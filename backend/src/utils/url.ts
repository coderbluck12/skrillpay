import { Request } from 'express';

/**
 * Dynamically resolves the API platform base URL.
 * Prefers process.env.API_BASE_URL (if non-localhost), or reconstructs from request headers (x-forwarded-proto/host).
 */
export function getPlatformBaseUrl(req?: Request): string {
  if (process.env.API_BASE_URL && !process.env.API_BASE_URL.includes('localhost')) {
    return process.env.API_BASE_URL.replace(/\/$/, '');
  }
  if (req) {
    const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const host = (req.headers['x-forwarded-host'] as string) || req.get('host');
    if (host && !host.includes('localhost')) {
      return `${protocol}://${host}`;
    }
  }
  return (process.env.API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

/**
 * Dynamically resolves the Frontend application base URL for checkout links.
 * Prefers process.env.FRONTEND_BASE_URL / FRONTEND_URL / APP_URL, or inspects request origin/referer.
 */
export function getFrontendBaseUrl(req?: Request): string {
  if (process.env.FRONTEND_BASE_URL) return process.env.FRONTEND_BASE_URL.replace(/\/$/, '');
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/$/, '');
  if (process.env.APP_URL && !process.env.APP_URL.includes('localhost')) return process.env.APP_URL.replace(/\/$/, '');

  if (req) {
    const origin = req.headers.origin;
    if (origin && origin !== 'null' && !origin.includes('localhost')) {
      return origin.replace(/\/$/, '');
    }
    const referer = req.headers.referer;
    if (referer) {
      try {
        const refUrl = new URL(referer);
        if (!refUrl.host.includes('localhost')) {
          return refUrl.origin;
        }
      } catch (e) {
        // ignore invalid URL
      }
    }
    const host = (req.headers['x-forwarded-host'] as string) || req.get('host');
    if (host && !host.includes('localhost')) {
      const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
      return `${protocol}://${host}`;
    }
  }
  return (process.env.FRONTEND_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
}
