# 🚀 Skrillpay — Reseller Payment Gateway (Layman & Architecture Guide)

Welcome to **Skrillpay**! This document explains what Skrillpay is, how it works in plain, simple English, and how developers or business owners use its API to accept payments and automatically split revenues.

---

## 💡 What is Skrillpay in Plain English?

Imagine you own a business management platform (like Shopify or a food delivery app) where hundreds of merchants sign up to sell their products.

Normally, if a customer buys a ₦10,000 product:
1. The ₦10,000 goes to your bank account.
2. At the end of the week, you have to manually calculate how much goes to the merchant (e.g., ₦9,850) and transfer it to them manually.
3. This creates **massive manual accounting work, delays, and human error**.

### 🌟 Skrillpay Solves This!
Skrillpay is a **reseller payment platform**. It acts as the smart bridge between your platform, your merchants, and the underlying payment processor (Korapay).

With Skrillpay:
- Every merchant gets their own automated **settlement account**.
- When a customer pays ₦10,000, **Skrillpay instantly splits the money**:
  - ₦9,850 goes directly into the merchant’s bank account.
  - ₦150 (your 1.5% platform commission) goes straight into your platform wallet.
- **Zero manual work, zero delay!**

---

## 🛠️ The 3 Pillars of Skrillpay

```
  +-------------------+       +-------------------+       +-----------------------+
  |    1. MERCHANTS   |       |   2. SKRILLPAY    |       |   3. END CUSTOMERS    |
  |  Sign up, verify  | <---> | Automatic Split   | <---> | Pay via branded link  |
  |  BVN/NIN & bank   |       | & Fee Deduction   |       | or custom checkout    |
  +-------------------+       +-------------------+       +-----------------------+
```

---

## 🔄 Step-by-Step: How the System Works

### Step 1: Merchant Registration & Instant Verification (KYC)
1. A merchant visits your Skrillpay web portal and creates an account with their email & password.
2. They fill out a **quick 3-step verification form**:
   - **Bank Account**: Where they want their money deposited (e.g. Zenith Bank `0123456789`).
   - **Identity**: BVN or NIN (for instant automated identity lookup).
3. **No CAC paperwork or document upload needed!** Verification completes instantly.
4. Once approved, the merchant receives a secret **API Key** (e.g. `sk_live_abc123...`).

---

### Step 2: Accepting Payments (API or Quick Payment Link)

Merchants can collect payments in two ways:

#### Option A: Direct API Integration (For Websites & Mobile Apps)
The merchant's website sends a simple HTTP request to your Skrillpay API:
```http
POST /v1/charge
Authorization: Bearer sk_live_abc123...

{
  "amount": 1000000,              // ₦10,000 in subunits (kobo)
  "email": "customer@gmail.com",
  "reference": "ORDER_99182"
}
```

Skrillpay responds with a branded checkout link on **your domain**:
```json
{
  "status": true,
  "data": {
    "checkout_url": "https://skrillpay.com/pay/ORDER_99182",
    "receipt_url": "https://skrillpay.com/v1/receipt/ORDER_99182"
  }
}
```

#### Option B: Quick Payment Link (No Code Required)
Inside the merchant's Skrillpay dashboard, they click **"🔗 Create Payment Link"**, enter `₦10,000`, and get a link to send directly to their customer over WhatsApp, Instagram, or email!

---

### Step 3: Branded Customer Checkout Experience

1. The customer opens `https://skrillpay.com/pay/ORDER_99182`.
2. They see your clean, branded checkout page showing the business name and amount (₦10,000).
3. When they click **"Pay Now"**, a secure overlay modal opens on the page to collect card, USSD, or bank transfer details.
4. **Visually, the customer never leaves your domain!**
5. Raw credit card numbers are handled securely by Korapay's PCI-DSS compliant infrastructure inside the overlay — meaning **you have zero PCI compliance risk**.

---

### Step 4: Automated Split & Instant Receipt

1. As soon as the customer pays:
   - **Platform Fee (1.5%)**: ₦150 is deducted and credited to your platform account.
   - **Merchant Net (98.5%)**: ₦9,850 is settled into the merchant's bank account.
2. The customer screen updates to **"Payment Successful!"** and gives them a link to their official **Digital Receipt**.
3. If the merchant set up a Webhook URL, Skrillpay sends a signed notification (`x-skrillpay-signature`) to their server in real-time.

---

## 📖 Key Terms Glossary

| Term | What It Means |
|---|---|
| **Reseller Gateway** | A gateway built on top of an existing provider (Korapay) to issue custom API keys & sub-settlements. |
| **Subaccount** | A sub-wallet connected to a merchant's bank account for automatic payout splitting. |
| **API Key (`sk_live_...`)** | A secret code given to active merchants so their apps can securely request payment links. |
| **JWT Token** | A temporary login session key used when navigating the Skrillpay web portal. |
| **Webhook** | An automated alert sent to a merchant's server when a customer completes a payment. |
| **Kobo / Subunits** | Amounts in Nigerian Naira are sent as subunits (`₦10,000 = 1,000,000 kobo`). |
| **Receipt URL** | A public link (`/v1/receipt/:reference`) showing transaction details and a **Print/PDF** button. |

---

## 🎨 Features Built Into Skrillpay

- ☀️ / 🌙 **Light & Dark Theme Toggle**: Easily switch visual modes across all pages.
- 🪪 **Paperless KYC**: Fast BVN/NIN verification via automated identity API.
- 🔗 **Dashboard Link Generator**: Generate shareable payment links without coding.
- 🛡️ **Admin Panel (`/admin`)**: Approve, reject, or suspend merchant accounts.
- 🧾 **Digital Receipts**: Beautiful HTML receipts formatted for web viewing and PDF downloading.
- 🧪 **Interactive API Playground**: Test charges, verifications, and receipts directly from the web browser (`/docs`).
