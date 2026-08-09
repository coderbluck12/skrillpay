import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';
import { CreateSubaccountParams, InitializeTransactionParams } from '../types';

dotenv.config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE_URL = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';

const getPaystackClient = (): AxiosInstance => {
  return axios.create({
    baseURL: PAYSTACK_BASE_URL,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY || PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
};

export class PaystackService {
  public static async createSubaccount(params: CreateSubaccountParams): Promise<any> {
    const { business_name, settlement_bank, account_number, percentage_charge = 1.5 } = params;

    try {
      const client = getPaystackClient();
      const response = await client.post('/subaccount', {
        business_name,
        settlement_bank,
        account_number,
        percentage_charge,
      });

      if (!response.data || !response.data.status) {
        throw new Error(response.data?.message || 'Paystack subaccount creation failed');
      }

      return response.data.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      throw new Error(`Paystack Subaccount Error: ${errorMsg}`);
    }
  }

  public static async initializeTransaction(params: InitializeTransactionParams): Promise<any> {
    const { email, amount, reference, subaccount, transaction_charge, callback_url, metadata = {} } = params;

    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error('Invalid amount: Amount must be an integer representing value in kobo (subunits).');
    }

    if (transaction_charge !== undefined && (!Number.isInteger(transaction_charge) || transaction_charge < 0)) {
      throw new Error('Invalid transaction_charge: Fee must be an integer representing value in kobo.');
    }

    try {
      const payload: Record<string, any> = {
        email,
        amount,
        reference,
        subaccount,
        ...(transaction_charge !== undefined ? { transaction_charge } : {}),
        ...(callback_url ? { callback_url } : {}),
        metadata,
      };

      const client = getPaystackClient();
      const response = await client.post('/transaction/initialize', payload);

      if (!response.data || !response.data.status) {
        throw new Error(response.data?.message || 'Paystack transaction initialization failed');
      }

      return response.data.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      throw new Error(`Paystack Initialize Error: ${errorMsg}`);
    }
  }

  public static async verifyTransaction(reference: string): Promise<any> {
    if (!reference) {
      throw new Error('Transaction reference is required for verification.');
    }

    try {
      const client = getPaystackClient();
      const response = await client.get(`/transaction/verify/${encodeURIComponent(reference)}`);

      if (!response.data || !response.data.status) {
        throw new Error(response.data?.message || 'Paystack transaction verification failed');
      }

      return response.data.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      throw new Error(`Paystack Verification Error: ${errorMsg}`);
    }
  }

  public static verifyWebhookSignature(rawPayload: string | Buffer, signature: string): boolean {
    if (!signature || !rawPayload) {
      return false;
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      console.error('PAYSTACK_SECRET_KEY missing for webhook signature verification');
      return false;
    }

    const hash = crypto
      .createHmac('sha512', secret)
      .update(rawPayload)
      .digest('hex');

    return hash === signature;
  }
}
