import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, userId } = body;

    if (!apiKey || !userId) {
      return NextResponse.json(
        { error: 'API key and userId are required' },
        { status: 400 }
      );
    }

    // Test the Stripe API key
    try {
      const stripe = new Stripe(apiKey, {
        apiVersion: '2023-10-16',
      });
      
      const account = await stripe.accounts.retrieve();
      
      return NextResponse.json({
        success: true,
        account: {
          id: account.id,
          email: account.email,
          country: account.country,
          type: account.type
        }
      });
    } catch (error) {
      console.error('Stripe API test failed:', error);
      return NextResponse.json(
        { error: 'Invalid Stripe API key' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Stripe auth error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate with Stripe' },
      { status: 500 }
    );
  }
}
