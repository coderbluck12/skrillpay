/// <reference types="@types/jest" />
import { ApiClient } from '../src/lib/api';

describe('ApiClient Frontend Unit Tests', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('onboardMerchant should call /merchants/onboard endpoint with POST', async () => {
    const mockData = { status: true, data: { api_key: 'sk_test_mock' } };
    // @ts-ignore
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockData),
    });

    const result = await ApiClient.onboardMerchant({
      business_name: 'TechMart',
      email: 'tech@mart.com',
      bank_account_number: '0123456789',
      bank_code: '057',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/v1/merchants/onboard',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(result).toEqual(mockData);
  });

  it('initializeCharge should include Bearer token in headers', async () => {
    const mockData = { status: true, data: { authorization_url: 'https://checkout.paystack.com' } };
    // @ts-ignore
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockData),
    });

    const result = await ApiClient.initializeCharge('sk_test_key123', {
      amount: 500000,
      email: 'user@domain.com',
      reference: 'REF_9999',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/v1/charge',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sk_test_key123',
        },
      })
    );
    expect(result).toEqual(mockData);
  });
});
