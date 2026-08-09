export interface User {
  id: string;
  email: string;
  business_name: string;
  password_hash?: string;
  api_key_hash?: string;
  paystack_subaccount_code?: string;
  bank_account_number?: string;
  bank_code?: string;
  account_name?: string;
  fee_type: 'flat' | 'percentage';
  fee_value: number;
  // KYC status is the source of truth; status mirrors it for API key middleware compat
  status: 'pending_kyc' | 'active' | 'suspended';
  kyc_status: 'pending_kyc' | 'kyc_submitted' | 'kyc_approved' | 'active' | 'suspended';
  kyc_data?: Record<string, any>;
  kyc_provider: string;
  kyc_provider_reference?: string;
  kyc_submitted_at?: Date;
  kyc_approved_at?: Date;
  webhook_url?: string;
  callback_url?: string;
  is_admin: boolean;
  api_key_generated_at?: Date;
  created_at: Date;
}

export interface Transaction {
  id: string;
  user_id: string;
  reference: string;
  paystack_reference?: string;
  amount: number;
  platform_fee: number;
  merchant_amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  customer_email: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface WebhookEvent {
  id: string;
  paystack_event_id: string;
  event_type: string;
  raw_payload: Record<string, any>;
  processed: boolean;
  processed_at?: Date;
  merchant_webhook_url?: string;
  merchant_webhook_status: 'pending' | 'delivered' | 'failed';
  merchant_webhook_attempts: number;
  merchant_webhook_delivered_at?: Date;
  created_at: Date;
}

export interface CreateSubaccountParams {
  business_name: string;
  settlement_bank: string;
  account_number: string;
  percentage_charge?: number;
}

export interface InitializeTransactionParams {
  email: string;
  amount: number;
  reference: string;
  subaccount: string;
  transaction_charge?: number;
  callback_url?: string;
  metadata?: Record<string, any>;
}

export interface OnboardMerchantDTO {
  email: string;
  business_name: string;
  bank_account_number: string;
  bank_code: string;
  account_name?: string;
  fee_type?: 'flat' | 'percentage';
  fee_value?: number;
}

export interface ChargeDTO {
  amount: number;
  email: string;
  reference: string;
  callback_url?: string;
}

// JWT payload shape
export interface JwtPayload {
  userId: string;
  email: string;
  businessName: string;
  kycStatus: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

// Auth DTOs
export interface RegisterDTO {
  email: string;
  password: string;
  business_name: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

// KYC DTOs
export interface KycSubmitDTO {
  // Business identity
  registration_number?: string; // CAC number
  tax_id?: string;
  // Personal identity of director
  bvn?: string;
  nin?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  // Bank settlement details
  bank_account_number?: string;
  bank_code?: string;
  // Fee preferences
  fee_type?: 'flat' | 'percentage';
  fee_value?: number;
  // Merchant webhook/callback
  webhook_url?: string;
  callback_url?: string;
}
