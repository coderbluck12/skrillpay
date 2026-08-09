export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Skrillpay Merchant API',
    version: '1.0.0',
    description: 'Paystack-Backed Payment Platform MVP API Documentation',
  },
  servers: [
    {
      url: 'http://localhost:3000/v1',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API Key',
        description: 'Enter your merchant API key (e.g. sk_test_xxxxxx)',
      },
    },
  },
  paths: {
    '/merchants/onboard': {
      post: {
        summary: 'Onboard a new merchant & create Paystack subaccount',
        tags: ['Merchants'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'business_name', 'bank_account_number', 'bank_code'],
                properties: {
                  email: { type: 'string', example: 'merchant@techmart.com' },
                  business_name: { type: 'string', example: 'TechMart Ltd' },
                  bank_account_number: { type: 'string', example: '0123456789' },
                  bank_code: { type: 'string', example: '057' },
                  fee_type: { type: 'string', enum: ['percentage', 'flat'], example: 'percentage' },
                  fee_value: { type: 'number', example: 1.5 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Merchant onboarded successfully, returns raw API key once' },
          400: { description: 'Missing required parameters' },
          409: { description: 'Merchant already exists' },
        },
      },
    },
    '/charge': {
      post: {
        summary: 'Initialize a transaction with Paystack subaccount split',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount', 'email', 'reference'],
                properties: {
                  amount: { type: 'integer', description: 'Amount in KOBO', example: 500000 },
                  email: { type: 'string', example: 'customer@domain.com' },
                  reference: { type: 'string', example: 'REF_981273918' },
                  callback_url: { type: 'string', example: 'https://merchant.com/callback' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Returns authorization_url and access_code' },
          401: { description: 'Unauthorized API key' },
        },
      },
    },
    '/transactions/verify/{reference}': {
      get: {
        summary: 'Verify transaction status by reference',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'reference',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'REF_981273918',
          },
        ],
        responses: {
          200: { description: 'Returns verified transaction status' },
        },
      },
    },
    '/webhooks/paystack': {
      post: {
        summary: 'Paystack HMAC SHA512 Webhook handler (Idempotent)',
        tags: ['Webhooks'],
        parameters: [
          {
            name: 'x-paystack-signature',
            in: 'header',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Webhook event processed or skipped idempotently' },
          400: { description: 'Invalid HMAC signature' },
        },
      },
    },
    '/dashboard/balance': {
      get: {
        summary: 'Get merchant balance summary and fees earned',
        tags: ['Dashboard'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Returns total volume, merchant earned, and platform fees' },
        },
      },
    },
    '/dashboard/transactions': {
      get: {
        summary: 'Get paginated merchant transaction history',
        tags: ['Dashboard'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Returns array of merchant transactions' },
        },
      },
    },
  },
};
