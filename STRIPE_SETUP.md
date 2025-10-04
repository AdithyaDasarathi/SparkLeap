# Stripe Integration Setup Guide

This guide will help you integrate Stripe with your SparkLeap application to automatically sync payment and subscription data.

## Prerequisites

1. A Stripe account (sign up at [stripe.com](https://stripe.com))
2. Your SparkLeap application running
3. Node.js and npm installed

## Step 1: Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **API keys**
3. Copy your **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for live mode)
4. Copy your **Publishable key** (starts with `pk_test_` for test mode or `pk_live_` for live mode)

⚠️ **Important**: Keep your secret key secure and never expose it in client-side code.

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Update the Stripe configuration in `.env.local`:
   ```env
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_actual_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

## Step 3: Install Dependencies

The Stripe dependencies should already be installed. If not, run:
```bash
cd sparkleap-tasks
npm install stripe @stripe/stripe-js
```

## Step 4: Connect Stripe in the Application

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to your SparkLeap dashboard
3. Look for the **Stripe Integration** section
4. Enter your Stripe Secret API Key (the one starting with `sk_test_` or `sk_live_`)
5. Click **Connect Stripe**

## Step 5: Sync Your Data

Once connected, you can:
- Click **Sync Data** to manually pull your Stripe data
- View synced metrics in your KPI dashboard

## Available Metrics

Stripe integration provides the following KPI metrics:

| Metric | Description | Calculation |
|--------|-------------|-------------|
| **MRR** | Monthly Recurring Revenue | Sum of all active subscription amounts |
| **User Signups** | Total Customers | Count of customers in Stripe |
| **Active Users** | Active Customers | Count of customers with active subscriptions |
| **Net Profit** | Estimated Profit | Total revenue × 70% (configurable) |

## Troubleshooting

### Common Issues

1. **"Invalid Stripe API key" error**
   - Verify you're using the correct API key from your Stripe dashboard
   - Ensure you're using the secret key (not publishable key)
   - Check that the key is for the correct environment (test vs live)

2. **"Failed to connect" error**
   - Check your internet connection
   - Verify the API key has necessary permissions
   - Check the browser console for detailed error messages

3. **No data showing after sync**
   - Ensure you have customers and subscriptions in your Stripe account
   - Check that subscriptions are in "active" status
   - Try the sync again after a few minutes

### Test Mode vs Live Mode

- **Test Mode**: Use test API keys (`sk_test_` and `pk_test_`) for development
- **Live Mode**: Use live API keys (`sk_live_` and `pk_live_`) for production

### API Rate Limits

Stripe has rate limits on API calls. The integration is designed to respect these limits by:
- Limiting requests to 100 items per call
- Implementing proper error handling
- Using efficient API endpoints

## Advanced Configuration

### Custom Profit Margins

The Net Profit calculation assumes a 70% profit margin. To customize this:

1. Edit `src/utils/dataSourceIntegrations.ts`
2. Find the StripeIntegration class
3. Modify the line: `NetProfit: totalRevenue * 0.7` to use your desired margin

### Webhook Setup (Optional)

For real-time updates, you can set up webhooks:

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `invoice.payment_succeeded`
4. Copy the webhook secret to your environment variables

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Use test keys** during development
4. **Rotate keys regularly** in production
5. **Monitor API usage** in Stripe Dashboard

## Support

If you encounter issues:

1. Check the [Stripe Documentation](https://stripe.com/docs)
2. Review the browser console for error messages
3. Verify your API keys and permissions
4. Contact support with specific error messages

## Data Privacy

The Stripe integration only accesses:
- Customer count (no personal information)
- Subscription data (amounts and status)
- Payment intent status and amounts

No sensitive customer data (like names, addresses, or payment methods) is stored or accessed.
