import crypto from 'crypto';

export interface GeneratedApiKey {
  rawKey: string;
  keyHash: string;
}

export class AuthUtils {
  public static generateApiKey(isTest: boolean = true): GeneratedApiKey {
    const prefix = isTest ? 'sk_test_' : 'sk_live_';
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const rawKey = `${prefix}${randomBytes}`;
    const keyHash = this.hashApiKey(rawKey);
    return { rawKey, keyHash };
  }

  public static hashApiKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }
}
