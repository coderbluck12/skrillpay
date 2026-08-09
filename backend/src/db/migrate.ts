import db from './index';

export const schemaSql = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  password_hash TEXT,
  api_key_hash TEXT,
  paystack_subaccount_code TEXT,
  bank_account_number TEXT,
  bank_code TEXT,
  account_name TEXT,
  fee_type TEXT CHECK (fee_type IN ('flat', 'percentage')) DEFAULT 'percentage',
  fee_value NUMERIC NOT NULL DEFAULT 1.5,
  kyc_status TEXT CHECK (kyc_status IN (
    'pending_kyc', 'kyc_submitted', 'kyc_approved', 'active', 'suspended'
  )) DEFAULT 'pending_kyc',
  kyc_data JSONB,
  kyc_provider TEXT DEFAULT 'internal',
  kyc_provider_reference TEXT,
  kyc_submitted_at TIMESTAMPTZ,
  kyc_approved_at TIMESTAMPTZ,
  webhook_url TEXT,
  callback_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  api_key_generated_at TIMESTAMPTZ,
  -- Legacy status kept for backwards compat with api key middleware
  status TEXT CHECK (status IN ('pending_kyc', 'active', 'suspended')) DEFAULT 'pending_kyc',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Idempotent column additions for existing deployments
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ALTER COLUMN api_key_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending_kyc';
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_data JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_provider TEXT DEFAULT 'internal';
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_provider_reference TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_approved_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS callback_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key_generated_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  reference TEXT UNIQUE NOT NULL,
  paystack_reference TEXT,
  amount NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  merchant_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status TEXT CHECK (status IN ('pending', 'success', 'failed')) DEFAULT 'pending',
  customer_email TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paystack_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  raw_payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  -- Merchant webhook forwarding tracking
  merchant_webhook_url TEXT,
  merchant_webhook_status TEXT CHECK (merchant_webhook_status IN ('pending', 'delivered', 'failed')) DEFAULT 'pending',
  merchant_webhook_attempts INT DEFAULT 0,
  merchant_webhook_delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Idempotent column additions
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS merchant_webhook_url TEXT;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS merchant_webhook_status TEXT DEFAULT 'pending';
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS merchant_webhook_attempts INT DEFAULT 0;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS merchant_webhook_delivered_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  paystack_transfer_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  document_type TEXT NOT NULL,
  document_number TEXT,
  document_url TEXT,
  verification_status TEXT DEFAULT 'pending',
  provider_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
`;

export async function runMigrations() {
  console.log('Running database migrations...');
  try {
    await db.query(schemaSql);
    console.log('✅ Database migration completed successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
