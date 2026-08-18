# Layman Testing Guide

A simple step-by-step guide for non-technical testers to exercise the Skrillpay web app. Give this file to a tester (copy/paste or print). Ask them to follow each step in order, take screenshots, and fill the bug report template if anything goes wrong.

Live site
- Open this URL in a browser: https://skrillpay-mu.vercel.app

Before you start
- Use a desktop, laptop, or phone with a recent browser (Chrome, Edge, Safari, Firefox).
- Open a private/incognito browser window if possible to avoid signed‑in accounts being reused.
- Have a screenshot tool ready (phone camera, OS screenshot, or browser screenshot).

Tester account
- If the site allows signup, testers can create their own account:
  - Email: tester+1@example.com
  - Password: Test@1234
- If the project owner gives you a demo/test account, use that instead.

Part A — First impressions (what a new visitor sees)
1. Open the home page
   - URL: https://skrillpay-mu.vercel.app
   - Wait for the page to load.
   - Expected: The home page loads and shows the app name, a short description, and links like Sign up, Login, Docs, or Admin.
   - Action: Take a screenshot of the full page (include the address bar if possible).

2. Open the Docs or Playground
   - Click any link labeled "Docs", "Playground", or "API" in the top or bottom navigation. If you don't see a link, try: https://skrillpay-mu.vercel.app/docs
   - Expected: A page that explains the product or shows a playground.
   - Action: Screenshot the docs or playground page.

Part B — Create an account and login
1. Sign up
   - Click "Sign up" or "Create account" on the site.
   - Use the tester email and password above, or your own email.
   - Expected: A success message like "Account created" or an email confirmation prompt.
   - If the site requests identity (BVN/NIN) or bank details during signup, stop and take a screenshot — do not enter real personal information.
   - Action: Screenshot the signup success message or any KYC step.

2. Log in
   - Click "Login" and enter the same credentials.
   - Expected: You land on a dashboard or welcome page after login.
   - Action: Screenshot the dashboard/home after login.

Part C — Create a payment link (merchant flow)
1. Find the button or menu item labeled "Create Payment Link", "New Payment", or "Quick Link" in the dashboard.
   - If you can't find it, look for "Payments" or "Links".
   - Expected: A small form appears to enter an amount and an optional description.
   - Action: Screenshot the form.

2. Fill out the simple form
   - Example values to use:
     - Amount: 1000 (or ₦1,000)
     - Description: Test payment
     - Customer email (optional): buyer+1@example.com
   - Click "Create" or "Generate Link".
   - Expected: The app shows a shareable link (a URL) and a button like "Copy link" or "Open link".
   - Action: Screenshot the generated payment link page.

Part D — Checkout (acting as the customer)
Option 1 — Open the generated link
1. Open the link in a new tab (click it or paste it into the address bar).
   - Example pattern: https://skrillpay-mu.vercel.app/pay/ORDER_12345 (your link will vary)
   - Expected: A checkout page appears showing the merchant name, amount, and a button "Pay Now".
   - Action: Screenshot the checkout page.

2. Start payment
   - Click "Pay Now".
   - Expected: A payment widget/modal or payment page appears.
   - Important: If the page does NOT clearly say "Test" or "Sandbox", DO NOT enter real card details — stop and report.
   - Action: Screenshot the payment input screen.

3. Use test card details (only in sandbox/test mode)
   - If the page clearly says "Test mode" or "Sandbox" and provides test card numbers, use those.
   - If no test mode is visible, stop and report to the owner.
   - After submitting the test payment, you should see a success confirmation.
   - Action: Screenshot the success/confirmation screen.

4. View receipt
   - Click "View receipt" or follow the receipt link shown after payment.
   - Example receipt route: /v1/receipt/ORDER_12345 (the actual URL will vary)
   - Expected: Receipt shows transaction reference, amount, merchant name, and date/time.
   - Action: Screenshot the receipt.

Option 2 — Preview from dashboard
- If the dashboard provides a "Preview" button for the payment link, click it and follow the same steps above.

Part E — Error handling test (optional, if sandbox supports)
1. Try entering an invalid card number (only in sandbox/test mode)
   - Expected: The app shows a clear error message like "Card declined" or "Invalid card number".
   - Action: Screenshot the error message.

Part F — Email receipt (if the app sends emails)
1. Check the inbox of the buyer email (buyer+1@example.com or your real email)
   - Expected: A receipt email arrives with transaction details.
   - Action: Screenshot the email subject and the email body (or forwarding preview).

Part G — Admin panel (if available and you have access)
1. Visit the admin area: https://skrillpay-mu.vercel.app/admin
   - Expected: Admin login page; after logging in you should see lists of merchants or transactions.
   - Action: Screenshot the admin dashboard or transaction list.

What to record for every test
- Tester name
- Device used (PC / Mac / iPhone / Android)
- Browser and version (e.g., Chrome 115)
- Time & date of the test
- Exact URLs used (copy from the address bar)
- Each step you performed (copy from this checklist)
- Expected vs. actual results
- Screenshots for each step (especially failures)
- Any error message texts

Bug report template (copy & paste)
- Title: Short summary, e.g. "Payment failed at checkout"
- Device / Browser: Windows 10 - Chrome 115
- Steps to reproduce:
  1. Open https://skrillpay-mu.vercel.app
  2. Sign up -> create account
  3. Create a payment link for ₦1,000
  4. Click the payment link -> See error
- Expected: Payment should succeed and show receipt
- Actual: Payment failed with message "..."
- Screenshots: attach images
- Time of test: 2026-08-18 09:35 GMT
- Notes: any additional info (network slow, unexpected popup, etc.)

One‑page quick checklist (printable)
- [ ] Open https://skrillpay-mu.vercel.app
- [ ] Sign up and login (or use demo account)
- [ ] Create a payment link (amount + description)
- [ ] Open payment link and complete checkout (in sandbox)
- [ ] View & download receipt
- [ ] Try invalid payment and verify error message
- [ ] Take screenshots and fill bug report if needed

Notes for the project owner (technical)
- If you want me to include exact sandbox card numbers and pre-filled test data, provide the Korapay sandbox test cards or confirm I should add standard Korapay test numbers.
- If signup requires BVN/NIN or bank credentials, tell me what fields appear so I can update this guide to instruct testers what to do.

---

If you want this file committed somewhere else (e.g., docs/ or the README), tell me and I will move it. Otherwise I will commit this as `LAYMAN_TESTING.md` in the repo root.